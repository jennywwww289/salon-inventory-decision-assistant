import type { POStatus, PurchaseOrder, PurchaseOrderItem, Supplier } from '../types';
import { applyInventoryMovement, nextTransactionId, type InventoryState } from './inventoryMovement';
import { validatePurchaseInput, validationFailure, type ValidationResult } from './validation';

export interface ProcurementState extends InventoryState {
  purchaseOrders: PurchaseOrder[];
}

export const PO_STATUS_LABELS: Record<POStatus, string> = {
  Draft: '草稿', Approved: '已核准', Ordered: '已下單', Received: '已驗收', Cancelled: '已取消',
};

const PO_TRANSITIONS: Record<POStatus, readonly POStatus[]> = {
  Draft: ['Approved', 'Cancelled'],
  Approved: ['Ordered', 'Cancelled'],
  Ordered: ['Received', 'Cancelled'],
  Received: [],
  Cancelled: [],
};

export const canTransitionPO = (from: POStatus, to: POStatus): boolean =>
  PO_TRANSITIONS[from]?.includes(to) ?? false;

// Incoming units are bookkeeping only; actual stock is changed by applyInventoryMovement.
function adjustIncoming(
  state: ProcurementState, items: PurchaseOrderItem[], direction: 1 | -1,
): ValidationResult<ProcurementState> {
  let products = state.products;
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)!;
    const incoming = product.incomingQty ?? 0;
    if (!Number.isSafeInteger(incoming) || incoming < 0) {
      return validationFailure('incomingQty', `商品「${product.name}」的在途量不是非負安全整數。`);
    }
    const amount = direction === 1 ? incoming + item.quantity : Math.max(0, incoming - item.quantity);
    if (!Number.isSafeInteger(amount)) return validationFailure('incomingQty', '下單後在途量超出安全整數範圍。');
    products = products.map(p => p.id === product.id ? { ...p, incomingQty: amount } : p);
  }
  return { ok: true, value: { ...state, products } };
}

// Pure whole-order transition. All IDs/time inputs come from the command handler.
export function transitionPurchaseOrder(
  state: ProcurementState, poId: string, target: POStatus, suppliers: Supplier[],
  metadata: { timestamp: string; time: number; userId: string; userName: string },
): ValidationResult<{ state: ProcurementState; purchaseOrder: PurchaseOrder }> {
  const po = state.purchaseOrders.find(order => order.id === poId);
  if (!po) return validationFailure('poId', '採購單不存在。');
  if (po.status === target) {
    return validationFailure('status', po.status === 'Received'
      ? '此採購單已驗收，本次不重複入庫。'
      : `採購單已是「${PO_STATUS_LABELS[po.status]}」，本次不重複操作。`);
  }
  if (!canTransitionPO(po.status, target)) {
    return validationFailure('status', `採購單不能從「${PO_STATUS_LABELS[po.status] ?? po.status}」轉為「${PO_STATUS_LABELS[target] ?? target}」。`);
  }
  const validation = validatePurchaseInput(po, state.products, suppliers);
  if (validation.ok === false) return validation;
  const items = validation.value.items.map((item, index) => ({
    ...po.items[index], quantity: item.quantity, unitCost: item.unitCost,
    subtotal: item.quantity * item.unitCost,
  }));
  let next = state;
  if (target === 'Received') {
    for (const item of items) {
      const result = applyInventoryMovement(next, {
        productId: item.productId, type: 'Purchase', quantity: item.quantity,
        note: `採購單 ${po.poNumber} 驗收入庫`,
      }, {
        id: nextTransactionId(next.transactions, metadata.time),
        timestamp: metadata.timestamp, userId: metadata.userId, userName: metadata.userName,
        purchaseOrderId: po.id, unitCost: item.unitCost,
      });
      if (result.ok === false) return result;
      next = result.value.state;
    }
  }
  if (target === 'Ordered' || target === 'Received' || (target === 'Cancelled' && po.status === 'Ordered')) {
    const incoming = adjustIncoming(next, items, target === 'Ordered' ? 1 : -1);
    if (incoming.ok === false) return incoming;
    next = incoming.value;
  }
  const purchaseOrder: PurchaseOrder = {
    ...po, items, status: target,
    totalAmount: items.reduce((total, item) => total + item.subtotal, 0),
    receivedAt: target === 'Received' ? metadata.timestamp : po.receivedAt,
  };
  return {
    ok: true,
    value: {
      state: { ...next, purchaseOrders: next.purchaseOrders.map(order => order.id === poId ? purchaseOrder : order) },
      purchaseOrder,
    },
  };
}
