import type { InventoryTransaction, Product } from '../types';
import { validateMovementInput, validationFailure, type MovementInput, type ValidationResult } from './validation';

import { withInventoryStatus } from './inventoryCalculations';
export { calculateInventoryStatus } from './inventoryCalculations';

export interface InventoryState {
  products: Product[];
  transactions: InventoryTransaction[];
}

export interface MovementMetadata {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  purchaseOrderId?: string;
  unitCost?: number;
}

// Called outside the state transition; even calls within the same millisecond get distinct IDs.
export function nextTransactionId(transactions: InventoryTransaction[], time: number): string {
  const prefix = `tx-${time}`;
  let id = prefix;
  for (let sequence = 1; transactions.some(tx => tx.id === id); sequence++) id = `${prefix}-${sequence}`;
  return id;
}

// Pure transition: no clock, random IDs, setters or notifications.
export function applyInventoryMovement<T extends InventoryState>(
  state: T, input: MovementInput, metadata: MovementMetadata,
): ValidationResult<{ state: T; transaction: InventoryTransaction }> {
  const validation = validateMovementInput(input, state.products);
  if (validation.ok === false) return validation;
  const product = state.products.find(p => p.id === input.productId)!;
  if (!Number.isSafeInteger(product.stock) || product.stock < 0) {
    return validationFailure('stock', '現有庫存不是有效的非負安全整數，請先確認資料。');
  }
  const stock = product.stock + input.quantity;
  if (stock < 0) {
    return validationFailure('quantity', `庫存不足：現有 ${product.stock}，申請出庫 ${-input.quantity}。`);
  }
  if (!Number.isSafeInteger(stock)) {
    return validationFailure('quantity', '異動後庫存超出安全整數範圍，無法寫入。');
  }
  if (state.transactions.some(tx => tx.id === metadata.id)) {
    return validationFailure('id', '交易 ID 已存在，未寫入異動。');
  }
  const transaction: InventoryTransaction = {
    ...metadata,
    productId: product.id, productName: product.name, sku: product.sku,
    type: input.type, quantity: input.quantity, resultingStock: stock,
    unitCost: metadata.unitCost ?? product.unitCost,
    returnDirection: input.type === 'Return' ? input.returnDirection : undefined,
    serviceType: input.serviceType, note: input.note,
  };
  const updated: Product = withInventoryStatus({
    ...product, stock,
    lastMovementDate: metadata.timestamp.split(' ')[0],
  });
  return {
    ok: true,
    value: {
      state: { ...state, products: state.products.map(p => p.id === product.id ? updated : p), transactions: [transaction, ...state.transactions] },
      transaction,
    },
  };
}
