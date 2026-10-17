import type { Brand, Supplier, User, Product, InventoryTransaction, PurchaseOrder } from '../types';
import type { ProcurementState } from './purchaseOrder';
import { withInventoryStatus } from './inventoryCalculations';
import { validateMovementInput } from './validation';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_PURCHASE_ORDERS, INITIAL_BRANDS, INITIAL_SUPPLIERS, INITIAL_USERS } from '../data/mockData';

export const STORAGE_KEY = 'henry-yan.salon-inventory.core';
export const STORAGE_VERSION = 1;
export interface CoreData extends ProcurementState { brands: Brand[]; suppliers: Supplier[]; users: User[] }
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface StorageStatus { kind: 'new' | 'saved' | 'blocked' | 'error'; message: string }
export const SAVE_FAILURE = '本機保存失敗，重新整理可能遺失。';

const initialData: CoreData = {
  products: INITIAL_PRODUCTS, transactions: INITIAL_TRANSACTIONS, purchaseOrders: INITIAL_PURCHASE_ORDERS,
  brands: INITIAL_BRANDS, suppliers: INITIAL_SUPPLIERS, users: INITIAL_USERS,
};

export function createDemoData(seed: CoreData = initialData): CoreData {
  const data: CoreData = JSON.parse(JSON.stringify(seed));
  data.products = data.products.map(withInventoryStatus);
  return data;
}

export function getBrowserStorage(): StorageLike | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

function invalid(): never { throw new Error('快照結構、數字或資料關聯無效。'); }
function row(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function string(value: unknown, required = false): string {
  if (typeof value !== 'string' || (required && !value.trim())) return invalid();
  return value;
}
function optionalString(value: unknown): string | undefined { return value === undefined ? undefined : string(value); }
function number(value: unknown, integer = false, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || (integer && !Number.isSafeInteger(value))) return invalid();
  return value;
}
function oneOf<T extends string>(value: unknown, options: readonly T[]): T {
  if (!options.includes(value as T)) return invalid();
  return value as T;
}
function boolean(value: unknown): boolean { if (typeof value !== 'boolean') return invalid(); return value; }
function list<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) return invalid();
  return value.map(parse);
}
function ids(items: { id: string }[]): Set<string> {
  const result = new Set(items.map(item => item.id));
  if (result.size !== items.length) return invalid();
  return result;
}
function ref(id: string, allowed: Set<string>) { if (!allowed.has(id)) invalid(); }

// Restore historical records structurally; new-order supplier pairing, duplicates and
// legal status transitions remain guarded by the existing business commands.
// Explicit field selection also prevents unknown properties/credentials being persisted.
export function validateCoreData(value: unknown): CoreData {
  const data = row(value);
  const brands = list(data.brands, value => {
    const b = row(value);
    return { id: string(b.id, true), name: string(b.name, true), origin: string(b.origin), category: string(b.category),
      status: oneOf(b.status, ['Active', 'Inactive']), description: optionalString(b.description) } satisfies Brand;
  });
  const brandIds = ids(brands);
  const suppliers = list(data.suppliers, value => {
    const s = row(value);
    return { id: string(s.id, true), name: string(s.name, true), contactPerson: string(s.contactPerson), phone: string(s.phone),
      email: string(s.email), moq: number(s.moq, true, 1), defaultLeadTime: number(s.defaultLeadTime, true, 1),
      paymentTerms: string(s.paymentTerms), suppliedBrandIds: list(s.suppliedBrandIds, id => string(id, true)),
      status: oneOf(s.status, ['Active', 'Inactive']), notes: optionalString(s.notes),
      promotions: s.promotions === undefined ? undefined : list(s.promotions, value => {
        const p = row(value);
        return { id: string(p.id, true), title: string(p.title), brandName: string(p.brandName), discountRate: number(p.discountRate),
          minOrderQty: number(p.minOrderQty, true, 1), startDate: string(p.startDate), endDate: string(p.endDate),
          description: string(p.description), isActive: boolean(p.isActive) };
      }),
    } satisfies Supplier;
  });
  const supplierIds = ids(suppliers);
  suppliers.forEach(s => s.suppliedBrandIds.forEach(id => ref(id, brandIds)));
  const users = list(data.users, value => {
    const u = row(value);
    return { id: string(u.id, true), name: string(u.name, true), title: string(u.title), avatar: string(u.avatar),
      role: oneOf(u.role, ['Owner', 'Manager', 'Staff']), status: oneOf(u.status, ['Active', 'Inactive']), phone: optionalString(u.phone) } satisfies User;
  });
  if (users.length === 0) return invalid();
  const userIds = ids(users);
  const products = list(data.products, value => {
    const p = row(value);
    const product: Product = {
      id: string(p.id, true), name: string(p.name, true), sku: string(p.sku, true), spec: string(p.spec),
      brandId: string(p.brandId, true), brandName: string(p.brandName), supplierId: string(p.supplierId, true), supplierName: string(p.supplierName),
      category: oneOf(p.category, ['洗髮淨化', '頭皮理療', '深層護髮', '造型養護', '沙龍專業安瓶', '居家養護組']),
      stock: number(p.stock, true), reorderPoint: number(p.reorderPoint, true), moq: number(p.moq, true, 1), leadTime: number(p.leadTime, true, 1),
      weeklyDemand: number(p.weeklyDemand), monthlyDemand: number(p.monthlyDemand), unitCost: number(p.unitCost), sellingPrice: number(p.sellingPrice),
      incomingQty: p.incomingQty === undefined ? undefined : number(p.incomingQty, true),
      status: oneOf(p.status, ['Healthy', 'Low', 'Critical', 'Overstock']),
      lastMovementDate: string(p.lastMovementDate, true), statusReason: optionalString(p.statusReason),
    };
    ref(product.brandId, brandIds); ref(product.supplierId, supplierIds);
    return withInventoryStatus(product);
  });
  const productIds = ids(products);
  if (new Set(products.map(p => p.sku.trim().toLowerCase())).size !== products.length) return invalid();
  const purchaseOrders = list(data.purchaseOrders, value => {
    const p = row(value);
    const order: PurchaseOrder = {
      id: string(p.id, true), poNumber: string(p.poNumber, true), supplierId: string(p.supplierId, true), supplierName: string(p.supplierName),
      status: oneOf(p.status, ['Draft', 'Approved', 'Ordered', 'Received', 'Cancelled']),
      createdBy: string(p.createdBy, true), createdByName: string(p.createdByName), createdAt: string(p.createdAt, true),
      expectedDeliveryDate: string(p.expectedDeliveryDate, true), receivedAt: optionalString(p.receivedAt),
      totalAmount: number(p.totalAmount), notes: optionalString(p.notes), aiRationale: optionalString(p.aiRationale),
      isAiAssisted: p.isAiAssisted === undefined ? undefined : boolean(p.isAiAssisted),
      items: list(p.items, value => {
        const i = row(value);
        const item = { productId: string(i.productId, true), productName: string(i.productName), sku: string(i.sku),
          quantity: number(i.quantity, true, 1), unitCost: number(i.unitCost), subtotal: number(i.subtotal), currentStock: number(i.currentStock, true),
          suggestedQty: i.suggestedQty === undefined ? undefined : number(i.suggestedQty, true) };
        ref(item.productId, productIds);
        if (!Number.isFinite(item.quantity * item.unitCost)) invalid();
        return item;
      }),
    };
    ref(order.supplierId, supplierIds); ref(order.createdBy, userIds);
    if (!Number.isFinite(order.items.reduce((total, item) => total + item.subtotal, 0))) invalid();
    return order;
  });
  const orderIds = ids(purchaseOrders);
  if (new Set(purchaseOrders.map(p => p.poNumber)).size !== purchaseOrders.length) return invalid();
  const transactions = list(data.transactions, value => {
    const t = row(value);
    const quantity = number(t.quantity, true, -Number.MAX_SAFE_INTEGER);
    if (quantity === 0) return invalid();
    const transaction: InventoryTransaction = {
      id: string(t.id, true), productId: string(t.productId, true), productName: string(t.productName), sku: string(t.sku),
      type: oneOf(t.type, ['Purchase', 'Service Usage', 'Staff Usage', 'Sale', 'Inventory Adjustment', 'Damage / Loss', 'Return']),
      quantity, resultingStock: number(t.resultingStock, true), userId: string(t.userId, true), userName: string(t.userName), timestamp: string(t.timestamp, true),
      purchaseOrderId: optionalString(t.purchaseOrderId), unitCost: t.unitCost === undefined ? undefined : number(t.unitCost),
      returnDirection: t.returnDirection === undefined ? undefined : oneOf(t.returnDirection, ['To Supplier', 'From Customer'] as const),
      serviceType: optionalString(t.serviceType), note: optionalString(t.note),
    };
    ref(transaction.productId, productIds); ref(transaction.userId, userIds);
    // Older returns may omit direction; keep their historical meaning unknown.
    if ((transaction.type !== 'Return' || transaction.returnDirection !== undefined)
      && !validateMovementInput(transaction, products).ok) invalid();
    if (transaction.purchaseOrderId !== undefined) {
      ref(transaction.purchaseOrderId, orderIds);
      if (!purchaseOrders.find(p => p.id === transaction.purchaseOrderId)!.items.some(i => i.productId === transaction.productId)) invalid();
    }
    return transaction;
  });
  ids(transactions);
  return { products, transactions, purchaseOrders, brands, suppliers, users };
}

export function loadCoreData(storage: StorageLike | null, demo = createDemoData): { data: CoreData; status: StorageStatus; blocked: boolean } {
  const fallback = (reason: string) => ({ data: demo(), blocked: true,
    status: { kind: 'blocked' as const, message: `${SAVE_FAILURE}${reason}已使用示範資料並暫停自動保存，未覆寫原內容；請進入系統明確重設後恢復保存。` } });
  let raw: string | null;
  try { if (!storage) return fallback('無法讀取本機儲存。'); raw = storage.getItem(STORAGE_KEY); }
  catch { return fallback('無法讀取本機儲存。'); }
  if (raw === null) return { data: demo(), blocked: false, status: { kind: 'new', message: '尚無本機快照；核心資料變動後會自動保存。' } };
  try {
    const snapshot = row(JSON.parse(raw));
    if (snapshot.version !== STORAGE_VERSION) return fallback('本機快照版本不符。');
    return { data: validateCoreData(snapshot.data), blocked: false, status: { kind: 'saved', message: '已還原本機保存的核心資料。' } };
  } catch { return fallback('本機快照無法還原（格式、數字或關聯無效）。'); }
}

export function saveCoreData(storage: StorageLike | null, data: CoreData): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data: validateCoreData(data) }));
    return true;
  } catch { return false; }
}

export function nextEntityId(prefix: string, items: { id: string }[], time: number): string {
  let id = `${prefix}-${time}`;
  for (let sequence = 1; items.some(item => item.id === id); sequence++) id = `${prefix}-${time}-${sequence}`;
  return id;
}
