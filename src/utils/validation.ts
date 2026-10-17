import type { Brand, Product, Supplier, TransactionType, ReturnDirection } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

export type ProductInput = Omit<Product, 'id' | 'lastMovementDate'> & { lastMovementDate?: string };
export interface PurchaseInput {
  supplierId: string;
  items: { productId: string; quantity: number; unitCost: number }[];
  expectedDeliveryDate: string;
  notes?: string;
  isAiAssisted?: boolean;
  aiRationale?: string;
}
export interface MovementInput {
  productId: string;
  type: TransactionType;
  returnDirection?: ReturnDirection;
  quantity: number;
  serviceType?: string;
  note?: string;
  userId?: string;
}

export const validationFailure = (field: string, message: string): ValidationResult<never> => ({
  ok: false, errors: [{ field, message }],
});

export const formatValidationErrors = (errors: ValidationError[]): string =>
  errors.map(error => error.message).join('；');

// Empty input stays invalid rather than becoming zero; decimals are never truncated.
export const parseNumericInput = (value: string | number): number =>
  typeof value === 'string' && value.trim() === '' ? NaN : Number(value);

const trimmed = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

function required(errors: ValidationError[], field: string, label: string, value: unknown) {
  if (!trimmed(value)) errors.push({ field, message: `${label}不可空白。` });
}

function numeric(
  errors: ValidationError[], field: string, label: string, value: unknown,
  rule: 'nonnegative' | 'nonnegativeInteger' | 'positiveInteger' | 'signedInteger',
) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    errors.push({ field, message: `${label}必須為有限數字，不可空白。` });
  } else if (rule !== 'nonnegative' && !Number.isSafeInteger(value)) {
    errors.push({ field, message: `${label}必須為安全整數，不可含小數。` });
  } else if (rule === 'positiveInteger' && value <= 0) {
    errors.push({ field, message: `${label}必須大於 0。` });
  } else if (rule === 'signedInteger' && value === 0) {
    errors.push({ field, message: `${label}不可為 0。` });
  } else if ((rule === 'nonnegative' || rule === 'nonnegativeInteger') && value < 0) {
    errors.push({ field, message: `${label}不可為負數。` });
  }
}

export function validateSignedQuantity(value: number, label = '帶正負號異動數量'): ValidationResult<number> {
  const errors: ValidationError[] = [];
  numeric(errors, 'quantity', label, value, 'signedInteger');
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

export const OUTBOUND_TRANSACTION_TYPES: readonly TransactionType[] = ['Service Usage', 'Staff Usage', 'Sale', 'Damage / Loss'];

export function validatePositiveQuantity(value: number, label = '領料數量'): ValidationResult<number> {
  const errors: ValidationError[] = [];
  numeric(errors, 'quantity', label, value, 'positiveInteger');
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

export function validateProduct<T extends ProductInput>(
  input: T, products: Product[], brands: Brand[], suppliers: Supplier[], excludeId?: string,
): ValidationResult<T> {
  const errors: ValidationError[] = [];
  const name = trimmed(input.name);
  const sku = trimmed(input.sku);
  required(errors, 'name', '商品名稱', name);
  required(errors, 'sku', 'SKU', sku);
  if (sku && products.some(p => p.id !== excludeId && trimmed(p.sku).toLowerCase() === sku.toLowerCase())) {
    errors.push({ field: 'sku', message: 'SKU 已存在，前後空白及大小寫視為相同。' });
  }
  if (!brands.some(b => b.id === input.brandId)) errors.push({ field: 'brandId', message: '請選擇存在的品牌。' });
  if (!suppliers.some(s => s.id === input.supplierId)) errors.push({ field: 'supplierId', message: '請選擇存在的供應商。' });
  numeric(errors, 'stock', '庫存', input.stock, 'nonnegativeInteger');
  numeric(errors, 'reorderPoint', '補貨點', input.reorderPoint, 'nonnegativeInteger');
  numeric(errors, 'moq', '商品 MOQ', input.moq, 'positiveInteger');
  numeric(errors, 'leadTime', '商品交期', input.leadTime, 'positiveInteger');
  numeric(errors, 'weeklyDemand', '週需求量', input.weeklyDemand, 'nonnegative');
  numeric(errors, 'monthlyDemand', '月需求量', input.monthlyDemand, 'nonnegative');
  numeric(errors, 'unitCost', '成本', input.unitCost, 'nonnegative');
  numeric(errors, 'sellingPrice', '售價', input.sellingPrice, 'nonnegative');
  return errors.length ? { ok: false, errors } : { ok: true, value: { ...input, name, sku } };
}

export function validateSupplier<T extends Omit<Supplier, 'id'>>(input: T): ValidationResult<T> {
  const errors: ValidationError[] = [];
  required(errors, 'name', '供應商公司名稱', input.name);
  required(errors, 'contactPerson', '聯絡人', input.contactPerson);
  required(errors, 'phone', '聯絡電話', input.phone);
  numeric(errors, 'moq', '供應商 MOQ', input.moq, 'positiveInteger');
  numeric(errors, 'defaultLeadTime', '供應商交期', input.defaultLeadTime, 'positiveInteger');
  return errors.length ? { ok: false, errors } : {
    ok: true, value: { ...input, name: trimmed(input.name), contactPerson: trimmed(input.contactPerson), phone: trimmed(input.phone) },
  };
}

export function validatePurchaseInput(input: PurchaseInput, products: Product[], suppliers: Supplier[]): ValidationResult<PurchaseInput> {
  const errors: ValidationError[] = [];
  if (!suppliers.some(s => s.id === input.supplierId)) errors.push({ field: 'supplierId', message: '請選擇存在的採購供應商。' });
  required(errors, 'expectedDeliveryDate', '預期到貨日', input.expectedDeliveryDate);
  if (!Array.isArray(input.items) || input.items.length === 0) {
    errors.push({ field: 'items', message: '採購品項不可為空。' });
  } else {
    let total = 0;
    const seenProducts = new Set<string>();
    input.items.forEach((item, index) => {
      const field = `items.${index}`;
      const label = `第 ${index + 1} 項`;
      if (!item || typeof item !== 'object') {
        errors.push({ field, message: `${label}採購資料無效。` });
        return;
      }
      const product = products.find(p => p.id === item.productId);
      if (!product) errors.push({ field: `${field}.productId`, message: `${label}商品不存在。` });
      else if (product.supplierId !== input.supplierId) {
        errors.push({ field: `${field}.productId`, message: `${label}商品「${product.name}」不屬於所選供應商。` });
      }
      if (seenProducts.has(item.productId)) {
        errors.push({ field: `${field}.productId`, message: `${label}重複商品「${product?.name ?? item.productId}」，請合併數量後只保留一列。` });
      }
      seenProducts.add(item.productId);
      numeric(errors, `${field}.quantity`, `${label}採購數量`, item.quantity, 'positiveInteger');
      numeric(errors, `${field}.unitCost`, `${label}單價`, item.unitCost, 'nonnegative');
      if (typeof item.quantity === 'number' && typeof item.unitCost === 'number') {
        const subtotal = item.quantity * item.unitCost;
        if (!Number.isFinite(subtotal)) errors.push({ field: `${field}.subtotal`, message: `${label}計算金額必須為有限數字。` });
        total += subtotal;
      }
    });
    if (!Number.isFinite(total)) errors.push({ field: 'totalAmount', message: '採購總金額必須為有限數字。' });
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: input };
}

export function validateMovementInput(input: MovementInput, products: Product[]): ValidationResult<MovementInput> {
  const errors: ValidationError[] = [];
  if (!products.some(p => p.id === input.productId)) errors.push({ field: 'productId', message: '異動商品不存在。' });
  numeric(errors, 'quantity', '帶正負號異動數量', input.quantity, 'signedInteger');
  if (OUTBOUND_TRANSACTION_TYPES.includes(input.type)) {
    if (input.quantity > 0) errors.push({ field: 'quantity', message: '領料、銷售與損耗出庫必須使用負數。' });
  } else if (input.type === 'Purchase') {
    if (input.quantity < 0) errors.push({ field: 'quantity', message: '採購入庫必須使用正數。' });
  } else if (input.type === 'Return') {
    if (input.returnDirection !== 'To Supplier' && input.returnDirection !== 'From Customer') {
      errors.push({ field: 'returnDirection', message: '請選擇退回供應商或顧客退回商品，不可省略退貨方向。' });
    } else if (input.returnDirection === 'To Supplier' && input.quantity > 0) {
      errors.push({ field: 'quantity', message: '退回供應商必須使用負數出庫。' });
    } else if (input.returnDirection === 'From Customer' && input.quantity < 0) {
      errors.push({ field: 'quantity', message: '顧客退回商品必須使用正數入庫。' });
    }
  } else if (input.type !== 'Inventory Adjustment') {
    errors.push({ field: 'type', message: '異動類型無效。' });
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: input };
}
