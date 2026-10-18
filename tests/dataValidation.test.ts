import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';
import {
  parseNumericInput, validatePositiveQuantity,
  type ProductInput, type PurchaseInput, type ValidationResult,
} from '../src/utils/validation';
import type { Product, Supplier, ReturnDirection, POStatus, PurchaseOrder } from '../src/types';
import { applyInventoryMovement, nextTransactionId, type InventoryState } from '../src/utils/inventoryMovement';
import { canTransitionPO, transitionPurchaseOrder, type ProcurementState } from '../src/utils/purchaseOrder';
import { calculateInventoryStatus, summarizeInventory, selectInventoryAlerts, withInventoryStatus, coverage, formatCoverage, formatNumber, formatGrossMargin, sortTransactions, summarizeMovements } from '../src/utils/inventoryCalculations';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_PURCHASE_ORDERS, INITIAL_AI_INSIGHTS, INITIAL_NOTIFICATIONS } from '../src/data/mockData';
import * as localData from '../src/utils/localData';
import type { StorageLike, CoreData } from '../src/utils/localData';

const product: Product = {
  id: 'p1', name: '測試商品', sku: 'SKU-1', spec: '1 瓶', category: '洗髮淨化',
  brandId: 'b1', brandName: '測試品牌', supplierId: 's1', supplierName: '測試供應商',
  stock: 10, reorderPoint: 2, moq: 3, leadTime: 2, weeklyDemand: 1.5,
  monthlyDemand: 6.45, unitCost: 10.25, sellingPrice: 0, status: 'Critical', lastMovementDate: '2026-10-17',
};
const supplier: Supplier = {
  id: 's1', name: '測試供應商', contactPerson: '測試人員', phone: '不限制格式', email: '',
  moq: 3, defaultLeadTime: 2, paymentTerms: '', suppliedBrandIds: ['b1'], status: 'Active', promotions: [],
};
const newProduct = (): ProductInput => ({ ...product, name: ' 新商品 ', sku: ' NEW-1 ' });
const purchase = (): PurchaseInput => ({
  supplierId: 's1', items: [{ productId: 'p1', quantity: 2, unitCost: 0 }], expectedDeliveryDate: '2026-10-18',
});

// Run production component bodies with isolated React state and fixture imports.
// This is a mock state/handler test, not a browser or real React lifecycle test.
function runtime(relativePath: string, overrides: Record<string, any> = {}, deferWrites = false, globals: Record<string, any> = {}) {
  const path = fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
  const require = createRequire(path);
  const slots: any[] = [];
  const writes: number[] = [];
  const timers: unknown[] = [];
  const pending: (() => void)[] = [];
  let cursor = 0;
  const react = {
    createContext: () => ({ Provider: 'MockProvider' }),
    useContext: () => { throw new Error('Unexpected useContext in handler test'); },
    useState(initial: any) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value: any) => {
        writes.push(index);
        const apply = () => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; };
        if (deferWrites) pending.push(apply); else apply();
      }];
    },
    useRef(initial: any) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useMemo: (factory: () => unknown) => factory(),
    createElement: (type: any, props: any, ...children: any[]) => ({
      type, props: { ...props, children: children.length === 1 ? children[0] : children },
    }),
  };
  const module = { exports: {} as Record<string, any> };
  const code = transformSync(readFileSync(path, 'utf8'), { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  runInNewContext(code, {
    module, exports: module.exports,
    require: (name: string) => name === 'react' ? react
      : name === 'lucide-react' ? new Proxy({}, { get: (_target, key) => key })
      : name in overrides ? overrides[name] : require(name),
    setTimeout: (callback: unknown) => { timers.push(callback); return timers.length; },
    ...globals,
  }, { filename: path });
  return {
    slots, writes, timers,
    flush() { while (pending.length) pending.shift()!(); },
    render(name: string | ((props: any) => any), props: any = {}) {
      cursor = 0;
      return (typeof name === 'function' ? name : module.exports[name])(props);
    },
  };
}

function context(change?: (fixtures: any) => void, deferWrites = false, storage: StorageLike | null = null, globals: Record<string, any> = {}) {
  const fixtures = {
    INITIAL_USERS: [{ id: 'u1', name: '測試使用者', role: 'Owner', title: '測試', avatar: 'T', status: 'Active' }],
    INITIAL_BRANDS: [{ id: 'b1', name: '測試品牌', origin: '台灣', category: '測試', status: 'Active' }],
    INITIAL_SUPPLIERS: [{ ...supplier }, { ...supplier, id: 's2', name: '另一供應商' }],
    INITIAL_PRODUCTS: [{ ...product }, { ...product, id: 'p2', sku: 'SKU-2' }],
    INITIAL_TRANSACTIONS: [], INITIAL_PURCHASE_ORDERS: [], INITIAL_NOTIFICATIONS: [],
    INITIAL_AI_INSIGHTS: [{
      id: 'i1', productId: 'p1', productName: '測試商品', severity: 'Critical', type: 'Stockout',
      suggestedQty: 3, unitCost: 0, status: 'Pending', evidenceMetrics: [], title: '測試建議',
      explanation: '測試原因', forecast: '測試預測', recommendation: '測試', potentialImpact: '測試',
    }],
  };
  change?.(fixtures);
  const app = runtime('src/context/AppContext.tsx', {
    '../data/mockData': fixtures,
    '../utils/localData': { ...localData, getBrowserStorage: () => storage },
  }, deferWrites, globals);
  const read = () => app.render('AppProvider', { children: null }).props.value;
  read();
  return { ...app, read, snapshot: () => JSON.stringify(app.slots) };
}

function rejected(ctx: ReturnType<typeof context>, action: (app: any) => ValidationResult<any>) {
  const before = ctx.snapshot();
  const writes = ctx.writes.length;
  const result = action(ctx.read());
  assert.equal(result.ok, false);
  if (result.ok === false) assert.ok(result.errors.every(error => error.field && error.message));
  assert.equal(ctx.snapshot(), before, 'Invalid writes must preserve every state slice');
  assert.equal(ctx.writes.length, writes, 'No state setter may run on invalid input');
  return result;
}

for (const name of ['', '   ', '\t']) {
  test(`Context rejects blank product and supplier names: ${JSON.stringify(name)}`, () => {
    const ctx = context();
    rejected(ctx, app => app.addProduct({ ...newProduct(), name }));
    rejected(ctx, app => app.addSupplier({ ...supplier, name }));
    rejected(ctx, app => app.updateProduct('p1', { name }));
    rejected(ctx, app => app.updateSupplier('s1', { name }));
  });
}

for (const sku of ['SKU-1', ' sku-1 ', 'SkU-1']) {
  test(`Context rejects duplicate SKU on add and update: ${sku}`, () => {
    const ctx = context();
    rejected(ctx, app => app.addProduct({ ...newProduct(), sku }));
    rejected(ctx, app => app.updateProduct('p2', { sku }));
  });
}

test('Context permits an unchanged own SKU and trims names/SKUs', () => {
  const ctx = context();
  const result = ctx.read().updateProduct('p1', { sku: ' sku-1 ', name: ' 測試修改 ' });
  assert.equal(result.ok, true);
  assert.equal(ctx.read().products[0].sku, 'sku-1');
  assert.equal(ctx.read().products[0].name, '測試修改');
});

for (const field of ['stock', 'reorderPoint', 'moq', 'leadTime'] as const) {
  for (const value of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '']) {
    test(`Context rejects invalid product ${field}=${String(value)}`, () => {
      const ctx = context();
      rejected(ctx, app => app.addProduct({ ...newProduct(), [field]: value }));
      rejected(ctx, app => app.updateProduct('p1', { [field]: value }));
    });
  }
}

for (const field of ['weeklyDemand', 'monthlyDemand', 'unitCost', 'sellingPrice'] as const) {
  for (const value of [-1, NaN, Infinity, '']) {
    test(`Context rejects invalid product ${field}=${String(value)}`, () => {
      const ctx = context();
      rejected(ctx, app => app.addProduct({ ...newProduct(), [field]: value }));
      rejected(ctx, app => app.updateProduct('p1', { [field]: value }));
    });
  }
}

for (const field of ['moq', 'leadTime'] as const) {
  test(`Context rejects zero product ${field}`, () => {
    rejected(context(), app => app.addProduct({ ...newProduct(), [field]: 0 }));
  });
}

for (const field of ['moq', 'defaultLeadTime'] as const) {
  for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '']) {
    test(`Context rejects invalid supplier ${field}=${String(value)}`, () => {
      const ctx = context();
      rejected(ctx, app => app.addSupplier({ ...supplier, [field]: value }));
      rejected(ctx, app => app.updateSupplier('s1', { [field]: value }));
    });
  }
}

test('Context permits zero stock/reorder/cost/price and fractional demand', () => {
  const ctx = context();
  const result = ctx.read().addProduct({ ...newProduct(), stock: 0, reorderPoint: 0, unitCost: 0, sellingPrice: 0, weeklyDemand: 0.25, monthlyDemand: 1.075 });
  assert.equal(result.ok, true);
  assert.equal(ctx.read().products[0].weeklyDemand, 0.25);
  assert.equal(ctx.read().products[0].monthlyDemand, 1.075);
  assert.equal(ctx.read().products[0].name, '新商品');
  assert.equal(ctx.read().products[0].sku, 'NEW-1');
});

test('Context rejects missing entity IDs, empty items and required supplier fields', () => {
  const ctx = context();
  rejected(ctx, app => app.addProduct({ ...newProduct(), brandId: 'missing' }));
  rejected(ctx, app => app.addProduct({ ...newProduct(), supplierId: 'missing' }));
  rejected(ctx, app => app.updateProduct('missing', {}));
  rejected(ctx, app => app.updateSupplier('missing', {}));
  rejected(ctx, app => app.addSupplier({ ...supplier, contactPerson: ' ' }));
  rejected(ctx, app => app.updateSupplier('s1', { phone: ' ' }));
  rejected(ctx, app => app.createPurchaseOrder({ ...purchase(), supplierId: 'missing' }));
  rejected(ctx, app => app.createPurchaseOrder({ ...purchase(), items: [] }));
  rejected(ctx, app => app.createPurchaseOrder({ ...purchase(), items: [{ productId: 'missing', quantity: 1, unitCost: 0 }] }));
  rejected(ctx, app => app.recordTransaction({ productId: 'missing', quantity: -1, type: 'Service Usage' }));
});

for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '']) {
  test(`Context rejects invalid purchase quantity ${String(value)}`, () => {
    rejected(context(), app => app.createPurchaseOrder({ ...purchase(), items: [{ productId: 'p1', quantity: value, unitCost: 0 }] }));
  });
}

for (const value of [-1, NaN, Infinity, '']) {
  test(`Context rejects invalid purchase amount ${String(value)}`, () => {
    rejected(context(), app => app.createPurchaseOrder({ ...purchase(), items: [{ productId: 'p1', quantity: 1, unitCost: value }] }));
  });
}

test('Context rejects overflowing subtotals and total amounts without partial writes', () => {
  const ctx = context();
  rejected(ctx, app => app.createPurchaseOrder({ ...purchase(), items: [{ productId: 'p1', quantity: 2, unitCost: Number.MAX_VALUE }] }));
  rejected(ctx, app => app.createPurchaseOrder({ ...purchase(), items: [
    { productId: 'p1', quantity: 1, unitCost: Number.MAX_VALUE }, { productId: 'p2', quantity: 1, unitCost: Number.MAX_VALUE },
  ] }));
});

test('Context accepts positive integer purchase quantities, zero and decimal amounts without a new MOQ threshold', () => {
  const ctx = context();
  const result = ctx.read().createPurchaseOrder({ ...purchase(), items: [
    { productId: 'p1', quantity: 1, unitCost: 0 }, { productId: 'p2', quantity: 1, unitCost: 0.25 },
  ] });
  assert.equal(result.ok, true);
  assert.equal(ctx.read().purchaseOrders[0].totalAmount, 0.25);
  assert.equal(ctx.read().notifications.length, 1);
});

for (const quantity of [0, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '']) {
  test(`Context rejects invalid signed movement ${String(quantity)}`, () => {
    rejected(context(), app => app.recordTransaction({ productId: 'p1', quantity, type: 'Inventory Adjustment' }));
  });
}

test('Context accepts positive and negative nonzero integer movements', () => {
  for (const quantity of [1, -1]) {
    const ctx = context();
    assert.equal(ctx.read().recordTransaction({ productId: 'p1', quantity, type: 'Inventory Adjustment' }).ok, true);
    assert.equal(ctx.read().transactions[0].quantity, quantity);
  }
});

test('Numeric input conversion preserves invalid blanks and decimals; positive form quantities reject bad values', () => {
  for (const value of ['', ' ', 'not a number']) assert.ok(Number.isNaN(parseNumericInput(value)));
  assert.equal(parseNumericInput('1.5'), 1.5);
  assert.equal(parseNumericInput('0'), 0);
  for (const value of ['', '0', '-1', '1.5', 'NaN', 'Infinity']) assert.equal(validatePositiveQuantity(parseNumericInput(value)).ok, false);
  assert.equal(validatePositiveQuantity(parseNumericInput('2')).ok, true);
});

type Element = { type: any; props: any };
function elements(node: any): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object') return [];
  return [node, ...elements(node.props?.children)];
}
function text(node: any): string {
  if (Array.isArray(node)) return node.map(text).join('');
  return node && typeof node === 'object' ? text(node.props?.children) : node == null || typeof node === 'boolean' ? '' : String(node);
}
function component(file: string, name: string, ctx: ReturnType<typeof context>, props: any = {}) {
  const ui = runtime(file, { '../../context/AppContext': { useApp: ctx.read } });
  const render = () => ui.render(name, props);
  const find = (predicate: (element: Element) => boolean) => {
    const found = elements(render()).find(predicate);
    assert.ok(found, `Missing test control in ${name}`);
    return found;
  };
  return { ...ui, render, find };
}
const event = { preventDefault() {}, stopPropagation() {} };

test('New product form preserves blank and decimal input, displays errors and does not close', () => {
  const ctx = context(); let closed = 0;
  const ui = component('src/components/modals/NewProductModal.tsx', 'NewProductModal', ctx, { onClose: () => closed++ });
  ui.render();
  const before = ctx.snapshot();
  const inputs = elements(ui.render()).filter(n => n.type === 'input' && n.props.type === 'number');
  inputs[0].props.onChange({ target: { value: '1.5' } });
  ui.find(n => n.type === 'form').props.onSubmit(event);
  assert.equal(closed, 0); assert.equal(ctx.snapshot(), before);
  assert.ok(text(ui.find(n => n.props.role === 'alert')));
  assert.equal(elements(ui.render()).filter(n => n.type === 'input' && n.props.type === 'number')[0].props.value, '1.5');
});

test('Purchase form preserves zero and fractional quantity and rejects empty item lists without closing', () => {
  for (const value of ['0', '1.5', '']) {
    const ctx = context(); let closed = 0;
    const ui = component('src/components/modals/NewPOModal.tsx', 'NewPOModal', ctx, { onClose: () => closed++ });
    ui.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value } });
    const before = ctx.snapshot();
    ui.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(ctx.snapshot(), before); assert.equal(closed, 0);
    assert.equal(ui.find(n => n.type === 'input' && n.props.type === 'number').props.value, value);
    assert.ok(text(ui.find(n => n.props.role === 'alert')));
  }
  const ctx = context(); let closed = 0;
  const ui = component('src/components/modals/NewPOModal.tsx', 'NewPOModal', ctx, { onClose: () => closed++ });
  ui.find(n => n.type === 'button' && n.props.className?.includes('hover:text-rose-600')).props.onClick();
  const before = ctx.snapshot();
  ui.find(n => n.type === 'form').props.onSubmit(event);
  assert.equal(ctx.snapshot(), before); assert.equal(closed, 0);
  assert.ok(text(ui.find(n => n.props.role === 'alert')));
});

test('Service form rejects blank/zero/negative/fractional input without success, timers or writes', () => {
  for (const value of ['', '0', '-1', '1.5']) {
    const ctx = context(); ctx.read().setIsServiceUsageModalOpen(true);
    const ui = component('src/components/modals/ServiceUsageModal.tsx', 'ServiceUsageModal', ctx);
    ui.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value } });
    const before = ctx.snapshot();
    ui.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(ctx.snapshot(), before); assert.equal(ui.timers.length, 0);
    assert.equal(ui.find(n => n.type === 'input' && n.props.type === 'number').props.value, value);
    assert.ok(text(ui.find(n => n.props.role === 'alert')));
  }
});

test('Supplier form preserves invalid input, keeps the dialog open and leaves Context unchanged', () => {
  const ctx = context();
  const ui = component('src/components/suppliers/SuppliersView.tsx', 'SuppliersView', ctx);
  ui.find(n => n.type === 'button' && text(n).includes('新增供應商檔案')).props.onClick();
  const before = ctx.snapshot();
  ui.find(n => n.type === 'form').props.onSubmit(event);
  assert.equal(ctx.snapshot(), before);
  assert.ok(ui.find(n => n.type === 'form'));
  assert.ok(text(ui.find(n => n.props.role === 'alert')));
});

test('Product detail form rejects fractional quantity without switching to the ledger', () => {
  const ctx = context();
  const ui = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', ctx, { product, onClose() { throw new Error('Must not close'); } });
  ui.find(n => n.type === 'button' && text(n).includes('登記領料')).props.onClick();
  ui.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '1.5' } });
  const before = ctx.snapshot();
  ui.find(n => n.type === 'form').props.onSubmit(event);
  assert.equal(ctx.snapshot(), before);
  assert.ok(ui.find(n => n.type === 'form'));
  assert.equal(ui.find(n => n.type === 'input' && n.props.type === 'number').props.value, '1.5');
});

test('AI invalid adjusted quantity does not accept insight, close editing or navigate', () => {
  const ctx = context();
  const ui = component('src/components/insights/AIInsightsView.tsx', 'AIInsightsView', ctx);
  ui.render(); ui.slots[1] = 'i1'; ui.slots[2] = '0';
  const before = ctx.snapshot();
  ui.find(n => n.type === 'button' && text(n).includes('以微調數量建立採購草稿')).props.onClick();
  assert.equal(ctx.snapshot(), before);
  assert.equal(ui.slots[1], 'i1'); assert.equal(ui.slots[2], '0');
  assert.ok(text(ui.find(n => n.props.role === 'alert')));
});

test('Dashboard, supplier and product-detail shortcuts preserve state and page on failed writes', () => {
  const cases = [
    ['src/components/dashboard/DashboardView.tsx', 'DashboardView', '建立採購草稿（', {}],
    ['src/components/suppliers/SuppliersView.tsx', 'SuppliersView', '建立採購草稿', {}],
    ['src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', '建立採購', { product: { ...product, unitCost: -1 }, onClose() { throw new Error('Must not close'); } }],
  ] as const;
  for (const [file, name, label, props] of cases) {
    const ctx = context(fixtures => { fixtures.INITIAL_PRODUCTS.forEach((p: Product) => { p.unitCost = -1; }); });
    const ui = component(file, name, ctx, props);
    const before = ctx.snapshot();
    ui.find(n => n.type === 'button' && text(n).includes(label)).props.onClick(event);
    assert.equal(ctx.snapshot(), before, name);
    assert.ok(text(ui.find(n => n.props.role === 'alert')));
  }
});

// Step 12: actual production transition + mock Context/handlers.
// Deliberately deferred setters below model queued writes, not real React mounting.
const metadata = { id: 'step12-tx', timestamp: '2026-10-17 12:00', userId: 'u1', userName: '測試人員' };
function inventory(stock = 10): InventoryState {
  return { products: [{ ...product, stock }, { ...product, id: 'p2', sku: 'SKU-2', stock: 8 }], transactions: [] };
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

for (const [type, quantity, remaining] of [
  ['Service Usage', -3, 7], ['Service Usage', -10, 0],
  ['Purchase', 5, 15], ['Inventory Adjustment', 2, 12], ['Inventory Adjustment', -2, 8],
] as const) {
  test(`Transition: 10 / ${type} ${quantity} -> ${remaining}, one matching transaction`, () => {
    const initial = freeze(inventory());
    const before = JSON.stringify(initial);
    const result = applyInventoryMovement(initial, { productId: 'p1', type, quantity }, freeze({ ...metadata }));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    const { state, transaction } = result.value;
    assert.equal(state.products[0].stock, remaining);
    assert.equal(state.transactions.length, 1);
    assert.equal(state.transactions[0], transaction);
    assert.equal(transaction.resultingStock, remaining);
    assert.equal(transaction.productId, 'p1');
    assert.equal(transaction.sku, product.sku);
    assert.equal(transaction.type, type);
    assert.equal(transaction.quantity, quantity);
    assert.equal(state.products[1], initial.products[1]);
    assert.equal(JSON.stringify(initial), before, 'Transition must not mutate its inputs');
    assert.deepEqual(applyInventoryMovement(initial, { productId: 'p1', type, quantity }, metadata), result, 'Replay is pure');
  });
}

for (const [stock, quantity] of [[10, -11], [0, -1]] as const) {
  test(`Transition: insufficient stock ${stock} / ${quantity} changes nothing`, () => {
    const initial = freeze(inventory(stock));
    const before = JSON.stringify(initial);
    const result = applyInventoryMovement(initial, { productId: 'p1', type: 'Service Usage', quantity }, metadata);
    assert.equal(result.ok, false);
    if (result.ok === false) {
      assert.match(result.errors[0].message, new RegExp(`現有 ${stock}，申請出庫 ${-quantity}`));
    }
    assert.equal(JSON.stringify(initial), before);
  });
}

test('Transition: 10 -> use 7 -> use 4 rejects second with exactly one transaction', () => {
  const first = applyInventoryMovement(inventory(), { productId: 'p1', type: 'Service Usage', quantity: -7 }, metadata);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const before = JSON.stringify(first.value.state);
  const second = applyInventoryMovement(freeze(first.value.state), { productId: 'p1', type: 'Service Usage', quantity: -4 }, { ...metadata, id: 'second' });
  assert.equal(second.ok, false);
  assert.equal(first.value.state.products[0].stock, 3);
  assert.equal(first.value.state.transactions.length, 1);
  assert.equal(JSON.stringify(first.value.state), before);
});

test('Transition: wrong direction, missing Return direction and unknown type are rejected', () => {
  for (const [type, quantity] of [
    ['Service Usage', 1], ['Staff Usage', 1], ['Sale', 1], ['Damage / Loss', 1],
    ['Purchase', -1], ['Return', 1], ['Return', -1], ['Unknown', 1],
  ] as const) {
    const ctx = context();
    rejected(ctx, app => app.recordTransaction({ productId: 'p1', type, quantity }));
  }
  for (const type of ['Staff Usage', 'Sale', 'Damage / Loss'] as const) {
    const result = applyInventoryMovement(inventory(), { productId: 'p1', type, quantity: -1 }, metadata);
    assert.equal(result.ok, true);
  }
});

// Return direction clarified by the user: supplier returns go out, customer returns come in.
for (const [returnDirection, quantity, stock] of [
  ['To Supplier', -3, 7], ['From Customer', 3, 13],
] as const) {
  test(`Return: ${returnDirection} updates stock and one direction-labelled transaction`, () => {
    const initial = freeze(inventory());
    const input = { productId: 'p1', type: 'Return' as const, returnDirection, quantity };
    const result = applyInventoryMovement(initial, input, metadata);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.state.products[0].stock, stock);
    assert.equal(result.value.state.transactions.length, 1);
    assert.equal(result.value.transaction.returnDirection, returnDirection);
    assert.equal(result.value.transaction.quantity, quantity);
    assert.equal(result.value.transaction.resultingStock, stock);
    assert.equal(result.value.state.products[1], initial.products[1]);
    const ctx = context();
    const applied = ctx.read().recordTransaction(input);
    assert.equal(applied.ok, true);
    assert.equal(ctx.read().products[0].stock, stock);
    assert.equal(ctx.read().transactions[0].returnDirection, returnDirection);
  });
}

test('Return: missing/unknown direction, reversed signs and insufficient supplier return change no state', () => {
  for (const input of [
    { returnDirection: 'invalid', quantity: 1 },
    { quantity: -1 },
    { returnDirection: 'To Supplier', quantity: 1 },
    { returnDirection: 'From Customer', quantity: -1 },
    { returnDirection: 'To Supplier', quantity: -11 },
  ]) {
    rejected(context(), app => app.recordTransaction({ productId: 'p1', type: 'Return', ...input }));
  }
});

test('Return: supplier return can empty stock; customer return replenishes latest zero stock', () => {
  const ctx = context(undefined, true);
  const action = ctx.read().recordTransaction;
  const outbound = action({ productId: 'p1', type: 'Return', returnDirection: 'To Supplier', quantity: -10 });
  const inbound = action({ productId: 'p1', type: 'Return', returnDirection: 'From Customer', quantity: 4 });
  assert.equal(outbound.ok && outbound.value.resultingStock, 0);
  assert.equal(inbound.ok && inbound.value.resultingStock, 4);
  ctx.flush();
  const applied = ctx.read();
  assert.equal(applied.products[0].stock, 4);
  assert.equal(applied.transactions.length, 2);
  assert.equal(applied.transactions[0].returnDirection, 'From Customer');
  assert.equal(applied.transactions[1].returnDirection, 'To Supplier');
  assert.notEqual(applied.transactions[0].id, applied.transactions[1].id);
});

for (const [direction, quantity, stock, label] of [
  ['To Supplier', -3, 7, '退回供應商'], ['From Customer', 3, 13, '顧客退回商品'],
] as const) {
  test(`Return handler: positive input 3 becomes ${quantity} for ${direction}`, () => {
    const ctx = context();
    const ui = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', ctx, { product, onClose() {} });
    ui.find(n => n.type === 'button' && text(n).includes('登記領料')).props.onClick();
    ui.find(n => n.type === 'select' && elements(n).some(e => e.type === 'option' && e.props.value === 'Return')).props.onChange({ target: { value: 'Return' } });
    ui.find(n => n.props.id === 'return-direction').props.onChange({ target: { value: direction satisfies ReturnDirection } });
    ui.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '3' } });
    ui.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(ctx.read().products[0].stock, stock);
    assert.equal(ctx.read().transactions[0].quantity, quantity);
    assert.equal(ctx.read().transactions[0].returnDirection, direction);
    assert.ok(text(ui.render()).includes(label), 'Ledger must distinguish both return directions');
  });
}

test('Return handler: missing direction preserves input and form without writes', () => {
  const ctx = context();
  const ui = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', ctx, { product, onClose() { throw new Error('Must stay open'); } });
  ui.find(n => n.type === 'button' && text(n).includes('登記領料')).props.onClick();
  ui.find(n => n.type === 'select' && elements(n).some(e => e.type === 'option' && e.props.value === 'Return')).props.onChange({ target: { value: 'Return' } });
  ui.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '3' } });
  const before = ctx.snapshot();
  ui.find(n => n.type === 'form').props.onSubmit(event);
  assert.equal(ctx.snapshot(), before);
  assert.equal(ui.find(n => n.type === 'input' && n.props.type === 'number').props.value, '3');
  assert.match(text(ui.find(n => n.props.role === 'alert')), /退貨方向/);
  assert.equal(ui.find(n => n.props.id === 'return-direction').props.value, '');
});

test('Transition: stock overflow and invalid existing stock are rejected without mutation', () => {
  for (const stock of [Number.MAX_SAFE_INTEGER, -1, NaN, Infinity, 1.5]) {
    const initial = freeze(inventory(stock));
    const result = applyInventoryMovement(initial, { productId: 'p1', type: 'Purchase', quantity: 1 }, metadata);
    assert.equal(result.ok, false);
    const ctx = context(f => { f.INITIAL_PRODUCTS[0].stock = stock; });
    rejected(ctx, app => app.recordTransaction({ productId: 'p1', type: 'Purchase', quantity: 1 }));
  }
});

test('Context: one inventory setter publishes both stock and ledger', () => {
  const ctx = context();
  const result = ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 });
  assert.equal(result.ok, true);
  assert.equal(ctx.writes.length, 1, 'No notification is triggered for this healthy result');
  const snapshot = ctx.slots[ctx.writes[0]];
  assert.equal(snapshot.products[0].stock, 7);
  assert.equal(snapshot.transactions.length, 1);
  assert.equal(snapshot.transactions[0].quantity, -3);
  assert.equal(result.ok && result.value.resultingStock, 7);
});

test('Context: same callback before queued setters flush rejects 7 + 4, preserves unrelated state', () => {
  const ctx = context(undefined, true);
  const original = ctx.read();
  const action = original.recordTransaction;
  const first = action({ productId: 'p1', type: 'Service Usage', quantity: -7 });
  assert.equal(first.ok, true);
  const before = ctx.snapshot();
  const count = ctx.writes.length;
  const second = action({ productId: 'p1', type: 'Service Usage', quantity: -4 });
  assert.equal(second.ok, false);
  assert.equal(ctx.snapshot(), before);
  assert.equal(ctx.writes.length, count, 'Rejected command must not queue stock, ledger or notification setters');
  ctx.flush();
  const applied = ctx.read();
  assert.equal(applied.products[0].stock, 3);
  assert.equal(applied.transactions.length, 1);
  assert.equal(applied.transactions[0].quantity, -7);
  assert.equal(applied.products[1], original.products[1]);
  for (const key of ['purchaseOrders', 'insights', 'users', 'suppliers', 'brands', 'currentUser', 'activeTab']) {
    assert.equal(applied[key], original[key], key);
  }
});

test('Context: accepted consecutive commands use latest inventory before renders', () => {
  const ctx = context(undefined, true);
  const action = ctx.read().recordTransaction;
  for (const quantity of [-3, -2, -5]) {
    assert.equal(action({ productId: 'p1', type: 'Inventory Adjustment', quantity }).ok, true);
  }
  ctx.flush();
  const app = ctx.read();
  assert.equal(app.products[0].stock, 0);
  assert.deepEqual(Array.from(app.transactions, (tx: any) => tx.resultingStock), [0, 5, 7]);
  assert.equal(new Set(app.transactions.map((tx: any) => tx.id)).size, 3);
});

test('Transaction IDs: fixed millisecond and pre-existing ID remain unique; duplicate metadata rejected', () => {
  let state = inventory();
  for (let index = 0; index < 3; index++) {
    const id = nextTransactionId(state.transactions, 123);
    const result = applyInventoryMovement(state, { productId: 'p1', type: 'Inventory Adjustment', quantity: 1 }, { ...metadata, id });
    assert.equal(result.ok, true);
    if (result.ok) state = result.value.state;
  }
  assert.deepEqual(state.transactions.map(tx => tx.id), ['tx-123-2', 'tx-123-1', 'tx-123']);
  const before = JSON.stringify(state);
  assert.equal(applyInventoryMovement(freeze(state), { productId: 'p1', type: 'Purchase', quantity: 1 }, { ...metadata, id: 'tx-123' }).ok, false);
  assert.equal(JSON.stringify(state), before);
});

test('Context: valid direct stock edits are rejected; unchanged stock metadata edits remain supported', () => {
  const ctx = context();
  rejected(ctx, app => app.updateProduct('p1', { stock: 0 }));
  const cached = ctx.read().updateProduct;
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 }).ok, true);
  assert.equal(cached('p1', { name: '修改名稱' }).ok, true);
  assert.equal(ctx.read().products[0].stock, 7);
  assert.equal(ctx.read().transactions.length, 1);
  assert.equal(ctx.read().updateProduct('p1', { stock: 7, unitCost: 1 }).ok, true);
});

test('Service handler: actual result shows 7 or 0 without subtracting twice', () => {
  for (const [quantity, stock] of [['3', 7], ['10', 0]] as const) {
    const ctx = context(); ctx.read().setIsServiceUsageModalOpen(true);
    const ui = component('src/components/modals/ServiceUsageModal.tsx', 'ServiceUsageModal', ctx);
    ui.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: quantity } });
    ui.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(ctx.read().products[0].stock, stock);
    assert.equal(ctx.read().transactions.length, 1);
    assert.equal(ctx.read().transactions[0].quantity, -Number(quantity));
    assert.ok(text(ui.render()).includes(`目前剩餘：${stock}`));
    assert.equal(ui.timers.length, 0, 'Success stays visible until explicitly closed');
  }
});

test('Service and detail handlers: overdraw preserves quantity/dialog and cannot trigger success', () => {
  for (const name of ['ServiceUsageModal', 'ProductDetailModal']) {
    const ctx = context(); ctx.read().setIsServiceUsageModalOpen(true);
    const path = name === 'ServiceUsageModal' ? 'src/components/modals/ServiceUsageModal.tsx' : 'src/components/products/ProductDetailModal.tsx';
    const ui = component(path, name, ctx, { product, onClose() { throw new Error('Must stay open'); } });
    if (name === 'ProductDetailModal') ui.find(n => n.type === 'button' && text(n).includes('登記領料')).props.onClick();
    ui.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '11' } });
    const before = ctx.snapshot();
    ui.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(ctx.snapshot(), before);
    assert.equal(ui.find(n => n.type === 'input' && n.props.type === 'number').props.value, '11');
    assert.match(text(ui.find(n => n.props.role === 'alert')), /現有 10，申請出庫 11/);
    assert.equal(ui.timers.length, 0);
    assert.ok(ui.find(n => n.type === 'form'));
  }
});

test('Detail handler: signed adjustment decreases stock, keeps ledger sign and allows negative input', () => {
  const ctx = context();
  const ui = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', ctx, { product, onClose() {} });
  ui.find(n => n.type === 'button' && text(n).includes('登記領料')).props.onClick();
  ui.find(n => n.type === 'select' && elements(n).some(e => e.type === 'option' && e.props.value === 'Inventory Adjustment')).props.onChange({ target: { value: 'Inventory Adjustment' } });
  const input = ui.find(n => n.type === 'input' && n.props.type === 'number');
  assert.equal(input.props.min, undefined);
  input.props.onChange({ target: { value: '-2' } });
  ui.find(n => n.type === 'form').props.onSubmit(event);
  assert.equal(ctx.read().products[0].stock, 8);
  assert.equal(ctx.read().transactions[0].quantity, -2);
  assert.equal(ctx.read().transactions[0].type, 'Inventory Adjustment');
});

test('PO compatibility: receipt shares transition, retains prior movement and decrements incoming only', () => {
  const ctx = context();
  const created = ctx.read().createPurchaseOrder(purchase());
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(ctx.read().updatePOStatus(created.value.id, 'Approved').ok, true);
  assert.equal(ctx.read().updatePOStatus(created.value.id, 'Ordered').ok, true);
  const app = ctx.read(); // Same captured callback for movement then receipt.
  assert.equal(app.recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 }).ok, true);
  assert.equal(app.updatePOStatus(created.value.id, 'Received').ok, true);
  const applied = ctx.read();
  assert.equal(applied.products[0].stock, 9);
  assert.equal(applied.products[0].incomingQty, 0);
  assert.equal(applied.transactions.length, 2);
  assert.equal(applied.transactions[0].quantity, 2);
  assert.equal(applied.transactions[0].resultingStock, 9);
  assert.equal(applied.purchaseOrders[0].status, 'Received');
});

test('PO compatibility: invalid later receipt item leaves stock, ledger, PO and notifications unchanged', () => {
  const ctx = context();
  const created = ctx.read().createPurchaseOrder({ ...purchase(), items: [
    { productId: 'p1', quantity: 1, unitCost: 0 }, { productId: 'p2', quantity: 1, unitCost: 0 },
  ] });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  // Independent fault fixture, not production seed edits.
  assert.equal(ctx.read().updatePOStatus(created.value.id, 'Approved').ok, true);
  assert.equal(ctx.read().updatePOStatus(created.value.id, 'Ordered').ok, true);
  const po = ctx.read().purchaseOrders[0];
  po.items[1].productId = 'missing';
  rejected(ctx, app => app.updatePOStatus(po.id, 'Received'));
  const ui = component('src/components/purchase/PurchaseOrdersView.tsx', 'PurchaseOrdersView', ctx);
  ui.find(n => n.type === 'button' && text(n).includes('到貨點收！')).props.onClick(event);
  assert.match(text(ui.find(n => n.props.role === 'alert')), /商品不存在/);
  assert.equal(ctx.read().purchaseOrders[0].status, 'Ordered');
  // The right-hand details panel has a separate set of three status buttons.
  ui.find(n => n.type === 'div' && n.props.onClick && n.props.className?.includes('rounded-2xl p-5')).props.onClick();
  const before = ctx.snapshot();
  ui.find(n => n.type === 'button' && text(n).includes('貨到點收！立即入庫更新')).props.onClick();
  assert.equal(ctx.snapshot(), before);
  assert.ok(elements(ui.render()).filter(n => n.props.role === 'alert').length >= 2);
});

// Step 13: the production whole-order transition plus the actual Context/handlers.
const poMetadata = { ...metadata, time: 123 };
function procurement(status: POStatus = 'Draft'): ProcurementState {
  const items = [{ productId: 'p1', productName: product.name, sku: product.sku, quantity: 3, unitCost: 0.25, subtotal: 0.75, currentStock: 999 }];
  const po: PurchaseOrder = {
    id: 'test-po', poNumber: 'PO-TEST', supplierId: 's1', supplierName: supplier.name,
    status, items, totalAmount: 0.75, createdBy: 'u1', createdByName: '測試人員',
    createdAt: '2026-10-17', expectedDeliveryDate: '2026-10-18',
  };
  return { ...inventory(), purchaseOrders: [po] };
}
function poContext(status: POStatus = 'Draft', change?: (state: ProcurementState) => void, deferred = false) {
  const state = procurement(status);
  change?.(state);
  return context(f => {
    f.INITIAL_PRODUCTS = state.products;
    f.INITIAL_TRANSACTIONS = state.transactions;
    f.INITIAL_PURCHASE_ORDERS = state.purchaseOrders;
  }, deferred);
}

test('PO core: Draft -> Approved -> Ordered -> Received, stock changes only at receipt', () => {
  let state = procurement();
  for (const target of ['Approved', 'Ordered', 'Received'] as const) {
    const previous = JSON.stringify(state);
    const result = transitionPurchaseOrder(freeze(state), 'test-po', target, [supplier], poMetadata);
    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(state), previous, 'Every transition must be pure');
    if (!result.ok) return;
    state = result.value.state;
    assert.equal(state.purchaseOrders[0].status, target);
    assert.equal(state.products[0].stock, target === 'Received' ? 13 : 10);
    assert.equal(state.transactions.length, target === 'Received' ? 1 : 0);
    assert.equal(state.products[0].incomingQty ?? 0, target === 'Ordered' ? 3 : 0);
  }
  assert.equal(state.transactions[0].quantity, 3);
  assert.equal(state.transactions[0].resultingStock, 13);
  assert.equal(state.transactions[0].purchaseOrderId, 'test-po');
});

for (const [from, to] of [
  ['Draft', 'Received'], ['Draft', 'Ordered'], ['Approved', 'Received'],
  ['Ordered', 'Draft'], ['Received', 'Draft'], ['Received', 'Approved'],
  ['Received', 'Ordered'], ['Received', 'Cancelled'], ['Cancelled', 'Received'],
] as const) {
  test(`PO illegal transition ${from} -> ${to} changes nothing`, () => {
    const ctx = poContext(from);
    assert.equal(canTransitionPO(from, to), false);
    rejected(ctx, app => app.updatePOStatus('test-po', to));
  });
}

test('PO repeated statuses and missing IDs do not repeat effects or emit notifications', () => {
  for (const status of ['Draft', 'Approved', 'Ordered', 'Received', 'Cancelled'] as const) {
    const ctx = poContext(status);
    rejected(ctx, app => app.updatePOStatus('test-po', status));
    rejected(ctx, app => app.updatePOStatus('missing', 'Approved'));
    rejected(ctx, app => app.updatePOStatus('test-po', 'Unknown'));
  }
});

test('PO core: distinct items receive once each with source order, canonical product data and latest stock', () => {
  const initial = procurement('Ordered');
  initial.purchaseOrders[0].items.push({
    productId: 'p2', productName: '舊商品名稱', sku: 'OLD-SKU', quantity: 4, unitCost: 0, subtotal: 0, currentStock: 500,
  });
  const result = transitionPurchaseOrder(freeze(initial), 'test-po', 'Received', [supplier], poMetadata);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const { state } = result.value;
  assert.equal(state.products[0].stock, 13);
  assert.equal(state.products[1].stock, 12);
  assert.equal(state.transactions.length, 2);
  assert.equal(new Set(state.transactions.map(tx => tx.id)).size, 2);
  assert.ok(state.transactions.every(tx => tx.purchaseOrderId === 'test-po' && tx.type === 'Purchase'));
  assert.equal(state.transactions.find(tx => tx.productId === 'p2')?.sku, 'SKU-2');
  assert.equal(state.transactions.find(tx => tx.productId === 'p2')?.quantity, 4);
});

test('PO Context: deferred setters, same callback repeats receipt only once and publishes one combined snapshot', () => {
  const ctx = poContext('Ordered', undefined, true);
  const command = ctx.read().updatePOStatus;
  const first = command('test-po', 'Received');
  assert.equal(first.ok, true);
  const firstWrite = ctx.slots.find(slot => slot?.current?.purchaseOrders)?.current;
  assert.equal(firstWrite.purchaseOrders[0].status, 'Received');
  assert.equal(firstWrite.products[0].stock, 13);
  assert.equal(firstWrite.transactions.length, 1);
  const before = ctx.snapshot();
  const writes = ctx.writes.length;
  const second = command('test-po', 'Received');
  assert.equal(second.ok, false);
  if (second.ok === false) assert.match(second.errors[0].message, /已驗收/);
  assert.equal(ctx.snapshot(), before);
  assert.equal(ctx.writes.length, writes);
  ctx.flush();
  const app = ctx.read();
  assert.equal(app.products[0].stock, 13);
  assert.equal(app.transactions.length, 1);
  assert.equal(app.purchaseOrders[0].status, 'Received');
  const published = ctx.slots[ctx.writes[0]];
  assert.equal(published.purchaseOrders[0].status, 'Received');
  assert.equal(published.products[0].stock, 13);
  assert.equal(published.transactions.length, 1);
  assert.equal(ctx.writes.length, 2, 'One common state setter and one success notification only');
});

test('PO Context: creation, approval, order and receipt before any rerender use latest common state', () => {
  const ctx = context(undefined, true);
  const app = ctx.read();
  const created = app.createPurchaseOrder({ ...purchase(), items: [{ productId: 'p1', quantity: 3, unitCost: 0 }] });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  for (const target of ['Approved', 'Ordered', 'Received'] as const) {
    assert.equal(app.updatePOStatus(created.value.id, target).ok, true);
  }
  const before = ctx.snapshot(); const writes = ctx.writes.length;
  assert.equal(app.updatePOStatus(created.value.id, 'Received').ok, false);
  assert.equal(ctx.snapshot(), before);
  assert.equal(ctx.writes.length, writes);
  ctx.flush();
  assert.equal(ctx.read().products[0].stock, 13);
  assert.equal(ctx.read().transactions.length, 1);
  assert.equal(ctx.read().purchaseOrders[0].status, 'Received');
});

test('PO create and receipt reject duplicate products rather than partially receiving', () => {
  const ctx = context();
  rejected(ctx, app => app.createPurchaseOrder({ ...purchase(), items: [purchase().items[0], purchase().items[0]] }));
  const historic = poContext('Ordered', state => state.purchaseOrders[0].items.push({ ...state.purchaseOrders[0].items[0] }));
  const result = rejected(historic, app => app.updatePOStatus('test-po', 'Received'));
  if (!result.ok) assert.match(result.errors[0].message, /重複商品/);
});

test('PO create and receipt reject supplier mismatch using current product ownership', () => {
  rejected(context(), app => app.createPurchaseOrder({ ...purchase(), supplierId: 's2' }));
  const ctx = poContext('Ordered', state => { state.products[0].supplierId = 's2'; });
  const result = rejected(ctx, app => app.updatePOStatus('test-po', 'Received'));
  if (!result.ok) assert.match(result.errors[0].message, /不屬於/);
});

test('PO whole-order failures reject bad later item without changing first product, ledger, status or notifications', () => {
  for (const fault of ['missing', 'quantity', 'price', 'supplier', 'overflow'] as const) {
    const ctx = poContext('Ordered', state => {
      state.purchaseOrders[0].items.push({
        productId: 'p2', productName: '第二項', sku: 'SKU-2', quantity: 1, unitCost: 0, subtotal: 0, currentStock: 8,
      });
      const item = state.purchaseOrders[0].items[1];
      if (fault === 'missing') item.productId = 'missing';
      if (fault === 'quantity') item.quantity = 0;
      if (fault === 'price') item.unitCost = Infinity;
      if (fault === 'supplier') state.products[1].supplierId = 's2';
      if (fault === 'overflow') state.products[1].stock = Number.MAX_SAFE_INTEGER;
    });
    rejected(ctx, app => app.updatePOStatus('test-po', 'Received'));
  }
});

test('PO approval checks malformed historical orders without rewriting or hiding them', () => {
  for (const fault of ['supplier', 'empty', 'duplicate'] as const) {
    const ctx = poContext('Draft', state => {
      const po = state.purchaseOrders[0];
      if (fault === 'supplier') po.supplierId = 'missing';
      if (fault === 'empty') po.items = [];
      if (fault === 'duplicate') po.items.push({ ...po.items[0] });
    });
    rejected(ctx, app => app.updatePOStatus('test-po', 'Approved'));
    const ui = component('src/components/purchase/PurchaseOrdersView.tsx', 'PurchaseOrdersView', ctx);
    assert.ok(text(ui.render()).includes('PO-TEST'));
  }
});

test('PO cancellation is terminal and releases only incoming units for an ordered purchase', () => {
  for (const from of ['Draft', 'Approved', 'Ordered'] as const) {
    const ctx = poContext(from, state => { state.products[0].incomingQty = from === 'Ordered' ? 5 : 2; });
    assert.equal(ctx.read().updatePOStatus('test-po', 'Cancelled').ok, true);
    assert.equal(ctx.read().products[0].stock, 10);
    assert.equal(ctx.read().transactions.length, 0);
    assert.equal(ctx.read().products[0].incomingQty, 2);
    rejected(ctx, app => app.updatePOStatus('test-po', 'Received'));
  }
});

test('PO incoming quantity overflow rejects an order before status or notifications change', () => {
  const ctx = poContext('Approved', state => { state.products[0].incomingQty = Number.MAX_SAFE_INTEGER; });
  rejected(ctx, app => app.updatePOStatus('test-po', 'Ordered'));
});

test('PO creations from one captured callback keep both drafts with unique identifiers', () => {
  const ctx = context(undefined, true);
  const create = ctx.read().createPurchaseOrder;
  const first = create(purchase()); const second = create(purchase());
  assert.equal(first.ok && second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.notEqual(first.value.id, second.value.id);
  assert.notEqual(first.value.poNumber, second.value.poNumber);
  ctx.flush();
  assert.equal(ctx.read().purchaseOrders.length, 2);
  assert.equal(ctx.read().transactions.length, 0);
  assert.equal(ctx.read().products[0].stock, 10);
});

test('PO modal retains incompatible items after supplier change and supports explicit correction', () => {
  const ctx = context(f => { f.INITIAL_PRODUCTS[1].supplierId = 's2'; });
  let closed = 0;
  const ui = component('src/components/modals/NewPOModal.tsx', 'NewPOModal', ctx, { onClose: () => closed++ });
  ui.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '2' } });
  ui.find(n => n.type === 'select' && n.props.value === 's1').props.onChange({ target: { value: 's2' } });
  assert.equal(ui.find(n => n.type === 'input' && n.props.type === 'number').props.value, '2');
  assert.match(text(ui.find(n => n.props.role === 'alert')), /不屬於/);
  const before = ctx.snapshot();
  ui.find(n => n.type === 'form').props.onSubmit(event);
  assert.equal(ctx.snapshot(), before); assert.equal(closed, 0);
  ui.find(n => n.type === 'select' && n.props.value === 'p1').props.onChange({ target: { value: 'p2' } });
  const submit = ui.find(n => n.type === 'form').props.onSubmit;
  submit(event); submit(event);
  assert.equal(closed, 1, 'Repeated successful submit must not create a second order');
  assert.equal(ctx.read().purchaseOrders.length, 1);
  assert.equal(ctx.read().purchaseOrders[0].supplierId, 's2');
  assert.equal(ctx.read().purchaseOrders[0].items[0].productId, 'p2');
});

test('PO modal selects default product supplier and cannot add the same fallback row repeatedly', () => {
  const ctx = context(f => { f.INITIAL_PRODUCTS[1].supplierId = 's2'; });
  const ui = component('src/components/modals/NewPOModal.tsx', 'NewPOModal', ctx, { defaultProductId: 'p2', onClose() {} });
  assert.ok(ui.find(n => n.type === 'select' && n.props.value === 's2'));
  ui.find(n => n.type === 'button' && text(n).includes('增加品項')).props.onClick();
  assert.equal(elements(ui.render()).filter(n => n.type === 'input' && n.props.type === 'number').length, 1);
  assert.match(text(ui.find(n => n.props.role === 'alert')), /皆已加入/);
});

test('PO details follow selected ID through each actual result, not a captured order object', () => {
  const ctx = poContext();
  const ui = component('src/components/purchase/PurchaseOrdersView.tsx', 'PurchaseOrdersView', ctx);
  ui.find(n => n.type === 'div' && n.props.onClick && n.props.className?.includes('rounded-2xl p-5')).props.onClick();
  const approve = ui.find(n => n.type === 'button' && text(n) === '核准採購草稿').props.onClick;
  approve();
  assert.ok(text(ui.find(n => n.props.role === 'status')).includes('已核准'));
  const before = ctx.snapshot();
  approve();
  assert.equal(ctx.snapshot(), before);
  ui.find(n => n.type === 'button' && text(n) === '標記已下單（示範）').props.onClick();
  assert.ok(text(ui.find(n => n.props.role === 'status')).includes('已下單'));
  ui.find(n => n.type === 'button' && text(n) === '貨到點收！立即入庫更新').props.onClick();
  assert.ok(text(ui.find(n => n.props.role === 'status')).includes('已驗收'));
  assert.equal(ctx.read().products[0].stock, 13);
  assert.equal(ctx.read().transactions.length, 1);
  assert.equal(elements(ui.render()).filter(n => n.type === 'button' && text(n).includes('點收')).length, 0);
});

test('PO product shortcut receives supplier mismatch failure without closing or navigating', () => {
  const ctx = context();
  let closed = 0;
  const ui = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', ctx, { product, onClose: () => closed++ });
  const submit = ui.find(n => n.type === 'button' && text(n).includes('建立採購')).props.onClick;
  assert.equal(ctx.read().updateProduct('p1', { supplierId: 's2' }).ok, true);
  const before = ctx.snapshot();
  submit();
  assert.equal(ctx.snapshot(), before); assert.equal(closed, 0);
  assert.match(text(ui.find(n => n.props.role === 'alert')), /不屬於/);
});

// Step 14: one production operation drives all read-only projections.
function projectionContext() {
  return context(f => {
    Object.assign(f.INITIAL_PRODUCTS[0], { name: '商品 A', stock: 10, unitCost: 100, weeklyDemand: 2, monthlyDemand: 8.6, reorderPoint: 8 });
    Object.assign(f.INITIAL_PRODUCTS[1], { name: '商品 B', stock: 5, unitCost: 200, weeklyDemand: 1, monthlyDemand: 4.3, reorderPoint: 2 });
  });
}
function projections(ctx: ReturnType<typeof context>) {
  const app = ctx.read();
  return JSON.stringify({ products: app.products, transactions: app.transactions, summary: app.inventorySummary, alerts: app.inventoryAlerts, movements: app.movementSummary });
}

test('Projection: usage then whole-order receipt update stock, ledger, cost, alerts and shared summary', () => {
  const ctx = projectionContext();
  assert.equal(ctx.read().products[0].status, 'Healthy', 'Ignore stale fixture status');
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 }).ok, true);
  let app = ctx.read();
  assert.equal(app.products[0].stock, 7);
  assert.equal(app.transactions[0].quantity, -3);
  assert.equal(app.inventorySummary.totalStockUnits, 12);
  assert.equal(app.inventorySummary.totalInventoryCost, 1700);
  assert.equal(app.inventorySummary.totalSkus, 2);
  assert.equal(app.products[0].status, 'Low');
  assert.deepEqual(app.inventoryAlerts.map((p: Product) => p.id), ['p1']);
  const created = app.createPurchaseOrder({ ...purchase(), items: [{ productId: 'p1', quantity: 5, unitCost: 125 }] });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  for (const target of ['Approved', 'Ordered', 'Received'] as const) assert.equal(ctx.read().updatePOStatus(created.value.id, target).ok, true);
  app = ctx.read();
  assert.equal(app.products[0].stock, 12);
  assert.equal(app.transactions[0].quantity, 5);
  assert.equal(app.transactions[0].unitCost, 125, 'Receipt preserves order cost, not current product cost');
  assert.equal(app.inventorySummary.totalStockUnits, 17);
  assert.equal(app.inventorySummary.totalInventoryCost, 2200);
  assert.equal(app.inventorySummary.totalSkus, 2);
  assert.equal(app.products[0].status, 'Healthy');
  assert.equal(app.inventoryAlerts.length, 0);
  const before = projections(ctx);
  rejected(ctx, current => current.recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -13 }));
  rejected(ctx, current => current.updatePOStatus(created.value.id, 'Received'));
  assert.equal(projections(ctx), before, 'Rejected writes must preserve all projections too');
  const writes = ctx.writes.length;
  ctx.read(); ctx.read();
  assert.equal(ctx.writes.length, writes, 'Projection reads never write stock or transactions');
});

for (const [stock, reorder, demand, expected] of [
  [9, 10, 1, 'Low'], [10, 10, 1, 'Low'], [11, 10, 1, 'Healthy'],
  [2, 10, 2, 'Critical'], [3, 10, 2, 'Low'], [4, 10, 2, 'Low'],
  [5, 1, 2, 'Low'], [6, 1, 2, 'Healthy'], [7, 1, 2, 'Healthy'],
  [31, 1, 2, 'Healthy'], [32, 1, 2, 'Healthy'], [33, 1, 2, 'Overstock'],
] as const) {
  test(`Status boundary: stock=${stock}, reorder=${reorder}, demand=${demand} => ${expected}`, () => {
    const p = { ...product, stock, reorderPoint: reorder, weeklyDemand: demand };
    assert.equal(calculateInventoryStatus(stock, reorder, demand), expected);
    assert.equal(withInventoryStatus(p).status, expected);
    const summary = summarizeInventory([p]);
    assert.equal(summary.criticalCount + summary.lowCount > 0, expected === 'Critical' || expected === 'Low');
    assert.equal(selectInventoryAlerts([p]).length, expected === 'Critical' || expected === 'Low' ? 1 : 0);
  });
}

test('Projection: changing reorder point and demand recalculates status without stock writes or transactions', () => {
  const ctx = projectionContext();
  assert.equal(ctx.read().updateProduct('p1', { reorderPoint: 12 }).ok, true);
  assert.equal(ctx.read().products[0].status, 'Low');
  assert.equal(ctx.read().inventorySummary.lowCount, 1);
  assert.equal(ctx.read().updateProduct('p1', { weeklyDemand: 20 }).ok, true);
  assert.equal(ctx.read().products[0].status, 'Critical');
  assert.equal(ctx.read().inventorySummary.criticalCount, 1);
  assert.equal(ctx.read().products[0].stock, 10);
  assert.equal(ctx.read().transactions.length, 0);
});

test('Projection: exact zero, empty inventory and zero demand stay readable and keep legitimate zeros', () => {
  const ctx = projectionContext();
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -10 }).ok, true);
  assert.equal(ctx.read().products[0].stock, 0);
  assert.equal(ctx.read().products[0].status, 'Critical');
  assert.equal(ctx.read().inventorySummary.totalStockUnits, 5);
  const dashboard = component('src/components/dashboard/DashboardView.tsx', 'DashboardView', ctx);
  assert.ok(text(dashboard.render()).includes('0 瓶'));
  assert.equal(coverage(0, 1), 0);
  assert.equal(coverage(10, 0), null);
  assert.equal(formatCoverage(10, 0, '週'), '無需求，無法估算');
  assert.equal(formatCoverage(0, 1, '週'), '0.0 週');
  assert.equal(formatCoverage(10, Number.MIN_VALUE, '週'), '無法估算');
  assert.equal(formatNumber(Infinity), '無法計算');
  assert.equal(formatGrossMargin(100, 0), '無法計算');
  assert.equal(formatGrossMargin(0, 0), '無法計算');
  assert.equal(formatGrossMargin(100, 200), '50%');
  const empty = summarizeInventory([]);
  assert.ok(Object.values(empty).every(value => value === 0));
  assert.equal(selectInventoryAlerts([]).length, 0);
  assert.equal(calculateInventoryStatus(0, 0, 0), 'Critical');
  assert.equal(calculateInventoryStatus(1, 0, 0), 'Overstock', 'Preserve the existing zero-demand status convention');
});

test('Projection: new product increments SKU count without rebuilding stock from old ledger', () => {
  const ctx = projectionContext();
  const result = ctx.read().addProduct({ ...newProduct(), stock: 0, unitCost: 0, sellingPrice: 0, weeklyDemand: 0, monthlyDemand: 0, reorderPoint: 0 });
  assert.equal(result.ok, true);
  assert.equal(ctx.read().inventorySummary.totalSkus, 3);
  assert.equal(ctx.read().inventorySummary.totalStockUnits, 15);
  assert.equal(ctx.read().inventorySummary.totalInventoryCost, 2000);
  assert.equal(ctx.read().transactions.length, 0);
  for (const [file, name] of [
    ['src/components/layout/Header.tsx', 'Header'],
    ['src/components/products/ProductsView.tsx', 'ProductsView'],
  ]) {
    const ui = component(file, name, ctx);
    assert.ok(text(ui.render()).includes('3 SKUs'));
  }
});

test('Projection: valid timestamps sort newest first, ties remain stable and source array stays frozen', () => {
  const tx = (id: string, timestamp: string) => ({ ...metadata, id, timestamp, productId: 'p1', productName: 'A', sku: 'SKU-1', type: 'Purchase' as const, quantity: 1, resultingStock: 1 });
  const source = freeze([
    tx('invalid', 'not a date'), tx('tie1', '2026-10-17 10:00'),
    tx('epoch', '1970-01-01T00:00:00Z'), tx('new', '2026-10-18 10:00'),
    tx('tie2', '2026-10-17 10:00'), tx('badcalendar', '2026-02-30 10:00'),
  ]);
  const before = JSON.stringify(source);
  assert.deepEqual(sortTransactions(source).map(t => t.id), ['new', 'tie1', 'tie2', 'epoch', 'invalid', 'badcalendar']);
  assert.equal(JSON.stringify(source), before);
});

test('Projection: positive returns and adjustments are not classified as purchase receipts', () => {
  const ctx = context(f => { f.INITIAL_PRODUCTS[0].stock = 100; });
  const app = ctx.read();
  for (const input of [
    { type: 'Purchase', quantity: 5 },
    { type: 'Return', returnDirection: 'From Customer', quantity: 2 },
    { type: 'Return', returnDirection: 'To Supplier', quantity: -1 },
    { type: 'Inventory Adjustment', quantity: 4 }, { type: 'Inventory Adjustment', quantity: -3 },
    { type: 'Service Usage', quantity: -2 }, { type: 'Staff Usage', quantity: -1 },
    { type: 'Sale', quantity: -2 }, { type: 'Damage / Loss', quantity: -1 },
  ]) assert.equal(app.recordTransaction({ productId: 'p1', ...input }).ok, true);
  const expected = { purchaseIn: 5, customerReturnIn: 2, supplierReturnOut: 1, usageOut: 3, saleOut: 2, lossOut: 1, adjustmentIn: 4, adjustmentOut: 3 };
  assert.deepEqual(ctx.read().movementSummary, expected);
  assert.deepEqual(summarizeMovements(ctx.read().transactions), expected);
});

test('Projection: historical quantities and unit costs do not change when current product cost changes', () => {
  const ctx = projectionContext();
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Inventory Adjustment', quantity: -1 }).ok, true);
  const old = { ...ctx.read().transactions[0] };
  assert.equal(old.unitCost, 100);
  assert.equal(ctx.read().updateProduct('p1', { unitCost: 0, name: '新商品名稱' }).ok, true);
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Inventory Adjustment', quantity: 1 }).ok, true);
  assert.deepEqual(ctx.read().transactions[1], old);
  assert.equal(ctx.read().transactions[0].unitCost, 0);
  assert.equal(ctx.read().transactions[0].productName, '新商品名稱');
});

test('Mock wiring: open detail, dashboard, analytics and PO detail consume latest products without changing their historical fields', () => {
  const ctx = projectionContext();
  const fixedProps = { ...product, stock: 999 };
  const detail = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', ctx, { product: fixedProps, onClose() {} });
  const draft = ctx.read().createPurchaseOrder(purchase());
  assert.equal(draft.ok, true);
  const poView = component('src/components/purchase/PurchaseOrdersView.tsx', 'PurchaseOrdersView', ctx);
  poView.find(n => n.type === 'div' && n.props.onClick && n.props.className?.includes('rounded-2xl p-5')).props.onClick();
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 }).ok, true);
  const dashboard = component('src/components/dashboard/DashboardView.tsx', 'DashboardView', ctx);
  const analytics = component('src/components/analytics/AnalyticsView.tsx', 'AnalyticsView', ctx);
  assert.ok(text(detail.render()).includes('商品 A'));
  assert.ok(!text(detail.render()).includes('999'));
  assert.ok(text(dashboard.render()).includes('1,700'));
  assert.ok(text(analytics.render()).includes('1,700'));
  assert.ok(text(poView.render()).includes('目前庫存：7'));
  assert.equal(ctx.read().purchaseOrders[0].items[0].currentStock, 10, 'Preserve the order creation snapshot');
});

test('Mock wiring: live warnings clear after replenishment while historical notifications retain event meaning', () => {
  const ctx = projectionContext();
  ctx.read().setIsNotificationSettingsOpen(true);
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 }).ok, true);
  const event = { ...ctx.read().notifications[0] };
  const ui = component('src/components/modals/NotificationModal.tsx', 'NotificationModal', ctx);
  assert.ok(text(ui.render()).includes('目前庫存警示：1'));
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Return', returnDirection: 'From Customer', quantity: 5 }).ok, true);
  assert.ok(text(ui.render()).includes('目前庫存警示：0'));
  assert.deepEqual({ ...ctx.read().notifications.find((n: any) => n.id === event.id) }, event);
  ctx.read().markAllNotificationsRead();
  assert.equal(ctx.read().inventoryAlerts.length, 0);
  assert.equal(ctx.read().notifications.filter((n: any) => !n.isRead).length, 0);
});

test('Mock wiring: empty product data and zero-demand detail render without NaN, Infinity or fake stock', () => {
  const empty = context(f => { f.INITIAL_PRODUCTS = []; });
  empty.read().setIsNotificationSettingsOpen(true);
  for (const [file, name, props] of [
    ['src/components/dashboard/DashboardView.tsx', 'DashboardView', {}],
    ['src/components/modals/NotificationModal.tsx', 'NotificationModal', {}],
    ['src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', { product, onClose() {} }],
  ] as const) {
    const ui = component(file, name, empty, props);
    assert.doesNotMatch(text(ui.render()), /NaN|Infinity/);
    if (name === 'DashboardView') {
      const before = empty.snapshot();
      const button = ui.find(n => n.type === 'button' && text(n).includes('查看商品與異動帳本'));
      assert.equal(button.props.disabled, true);
      button.props.onClick();
      assert.equal(empty.snapshot(), before);
    }
  }
  const noDemand = context(f => { f.INITIAL_PRODUCTS[0].weeklyDemand = 0; f.INITIAL_PRODUCTS[0].monthlyDemand = 0; });
  const detail = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', noDemand, { product, onClose() {} });
  assert.ok(text(detail.render()).includes('無需求，無法估算'));
  assert.doesNotMatch(text(detail.render()), /NaN|Infinity/);
});

test('Seed references: MLB-001 is uniquely prod-54 and all four explicit links agree', () => {
  const matches = INITIAL_PRODUCTS.filter(p => p.sku === 'MLB-001');
  assert.equal(INITIAL_PRODUCTS.length, 111);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].id, 'prod-54');
  assert.equal(INITIAL_PRODUCTS.find(p => p.id === 'prod-43')?.sku, 'ORT-002');
  assert.equal(INITIAL_TRANSACTIONS.find(t => t.sku === 'MLB-001')?.productId, 'prod-54');
  assert.equal(INITIAL_PURCHASE_ORDERS.find(po => po.id === 'po-3')?.items[0].productId, 'prod-54');
  assert.equal(INITIAL_AI_INSIGHTS.find(i => i.id === 'ins-4')?.productId, 'prod-54');
  assert.equal(INITIAL_NOTIFICATIONS.find(n => n.message.includes('MLB-001'))?.productId, 'prod-54');
});

// Step 15: production handlers with isolated Context, no browser or external services.
const businessSnapshot = (app: any) => JSON.stringify({
  products: app.products, transactions: app.transactions, purchaseOrders: app.purchaseOrders,
  suppliers: app.suppliers, brands: app.brands, users: app.users, currentUser: app.currentUser,
});

for (const channel of ['LINE', 'Email']) {
  test(`Demo notification handler: ${channel} adds only a local record and preserves read actions`, () => {
    const ctx = context();
    ctx.read().setIsNotificationSettingsOpen(true);
    const ui = component('src/components/modals/NotificationModal.tsx', 'NotificationModal', ctx);
    ui.find(n => n.type === 'button' && text(n) === channel).props.onClick();
    const before = businessSnapshot(ctx.read());
    const insightsBefore = JSON.stringify(ctx.read().insights);
    const count = ctx.read().notifications.length;
    ui.find(n => n.type === 'button' && text(n).includes(`新增 ${channel} 示範紀錄`)).props.onClick();
    const after = ctx.read();
    assert.equal(after.notifications.length, count + 1);
    const notification = { ...after.notifications[0] };
    assert.equal(notification.channel, channel);
    assert.equal(notification.isRead, false);
    assert.match(notification.message, /未實際發送/);
    assert.match(text(ui.find(n => n.props.role === 'status')), /已新增.*站內示範紀錄，未實際發送/);
    assert.equal(businessSnapshot(after), before);
    assert.equal(JSON.stringify(after.insights), insightsBefore);
    assert.equal(ui.timers.length, 0, 'No fake delivery timer');
    after.markNotificationRead(notification.id);
    assert.deepEqual({ ...ctx.read().notifications[0] }, { ...notification, isRead: true });
    ctx.read().markAllNotificationsRead();
    assert.ok(ctx.read().notifications.every((n: any) => n.isRead));
    assert.equal(businessSnapshot(ctx.read()), before);
  });
}

test('Demo notification handler: empty products report no record, without success or business writes', () => {
  const ctx = context(f => { f.INITIAL_PRODUCTS = []; });
  ctx.read().setIsNotificationSettingsOpen(true);
  const ui = component('src/components/modals/NotificationModal.tsx', 'NotificationModal', ctx);
  const button = ui.find(n => n.type === 'button' && text(n).includes('新增 LINE 示範紀錄'));
  assert.equal(button.props.disabled, true);
  const before = ctx.snapshot();
  button.props.onClick(); // Exercise the guard even if UI disabling is bypassed.
  assert.equal(ctx.snapshot(), before);
  assert.match(text(ui.find(n => n.props.role === 'status')), /沒有商品，未新增/);
  assert.equal(ui.timers.length, 0);
});

test('Stock and ordered-stage events remain system records, not external delivery', () => {
  const ctx = poContext();
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -9 }).ok, true);
  assert.equal(ctx.read().updatePOStatus('test-po', 'Approved').ok, true);
  assert.equal(ctx.read().updatePOStatus('test-po', 'Ordered').ok, true);
  assert.ok(ctx.read().notifications.length >= 3);
  assert.ok(ctx.read().notifications.every((n: any) => n.channel === 'System'));
  assert.equal(ctx.read().products[0].stock, 1, 'Ordering does not receive stock');
  assert.equal(ctx.read().transactions.length, 1);
});

test('AI demo action creates exactly a draft and local response; it does not receive or order stock', () => {
  const ctx = context();
  const before = JSON.stringify({ products: ctx.read().products, transactions: ctx.read().transactions });
  const ui = component('src/components/insights/AIInsightsView.tsx', 'AIInsightsView', ctx);
  ui.find(n => n.type === 'button' && text(n).includes('建立採購草稿 (')).props.onClick();
  const after = ctx.read();
  assert.equal(after.purchaseOrders.length, 1);
  assert.equal(after.purchaseOrders[0].status, 'Draft');
  assert.equal(after.purchaseOrders[0].items[0].quantity, 3);
  assert.equal(after.purchaseOrders[0].items[0].unitCost, 0);
  assert.equal(after.insights[0].status, 'Accepted');
  assert.equal(after.activeTab, 'purchase');
  assert.equal(JSON.stringify({ products: after.products, transactions: after.transactions }), before);
  assert.equal(after.notifications.length, 1);
  assert.equal(after.notifications[0].channel, 'System');
});

test('AI demo action with a missing product preserves data and response and reports an error', () => {
  const ctx = context(f => { f.INITIAL_PRODUCTS = []; });
  const ui = component('src/components/insights/AIInsightsView.tsx', 'AIInsightsView', ctx);
  const before = ctx.snapshot();
  ui.find(n => n.type === 'button' && text(n).includes('建立採購草稿 (')).props.onClick();
  assert.equal(ctx.snapshot(), before);
  assert.match(text(ui.find(n => n.props.role === 'alert')), /商品不存在/);
});

test('AI demo feedback handler changes only local feedback and does not create business records', () => {
  const ctx = context();
  const before = businessSnapshot(ctx.read());
  const notificationsBefore = JSON.stringify(ctx.read().notifications);
  const insightBefore = { ...ctx.read().insights[0] };
  const ui = component('src/components/insights/AIInsightsView.tsx', 'AIInsightsView', ctx);
  ui.find(n => n.type === 'button' && n.props.title === '有幫助').props.onClick();
  const after = ctx.read();
  const { feedback, ...insightAfter } = after.insights[0];
  assert.deepEqual(insightAfter, insightBefore);
  assert.equal(feedback.isHelpful, true);
  assert.equal(typeof feedback.timestamp, 'string');
  assert.equal(businessSnapshot(after), before);
  assert.equal(JSON.stringify(after.notifications), notificationsBefore);
});

test('Demo role switch changes acting user without adding authentication or restricting legal operations', () => {
  const ctx = context(f => {
    f.INITIAL_USERS.push({ ...f.INITIAL_USERS[0], id: 'staff', name: '測試員工', role: 'Staff' });
  });
  const ui = component('src/components/users/UsersView.tsx', 'UsersView', ctx);
  const before = businessSnapshot(ctx.read());
  ui.find(n => n.type === 'button' && text(n) === '切換至此視角').props.onClick();
  const app = ctx.read();
  assert.equal(app.currentUser.id, 'staff');
  const previous = JSON.parse(before);
  previous.currentUser = app.currentUser;
  assert.equal(businessSnapshot(app), JSON.stringify(previous), 'Switching does not write business data');
  assert.equal(app.recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -1 }).ok, true);
  assert.equal(ctx.read().transactions[0].userId, 'staff');
  const created = ctx.read().createPurchaseOrder(purchase());
  assert.equal(created.ok, true);
  if (created.ok === true) {
    assert.equal(created.value.createdBy, 'staff');
    assert.equal(ctx.read().updatePOStatus(created.value.id, 'Approved').ok, true);
  }
});

// Step 16: isolated storage, real serializer/validator and production Context commands.
// Reinitializing this mock Context is not a real browser refresh or React mount.
class MockStorage implements StorageLike {
  values = new Map<string, string>([['unrelated-site-key', 'keep']]);
  reads: string[] = [];
  writes: string[] = [];
  failRead = false;
  failWrite = false;
  getItem(key: string) {
    this.reads.push(key);
    if (this.failRead) throw new Error('mock read denied');
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrite) throw new Error('mock quota exceeded');
    this.writes.push(key);
    this.values.set(key, value);
  }
}
const core = (app: any): CoreData => ({ products: app.products, transactions: app.transactions,
  purchaseOrders: app.purchaseOrders, brands: app.brands, suppliers: app.suppliers, users: app.users });
const plain = (value: unknown) => JSON.parse(JSON.stringify(value));
const stored = (storage: MockStorage) => JSON.parse(storage.values.get(localData.STORAGE_KEY)!);

// Step 25: actual demo imports, actual component handlers and Context commands.
// Only React hooks and browser storage are mocked; no DOM or React lifecycle runs.
test('Step25 normal flow: production forms, Context and storage with independent demo data', async t => {
  const storage = new MockStorage();
  class NormalDate extends Date {
    constructor(value?: any) { super(value ?? Date.UTC(2026, 9, 18, 0, 0)); }
    static now() { return Date.UTC(2026, 9, 18, 0, 0); }
  }
  const initialize = () => {
    const app = runtime('src/context/AppContext.tsx', {
      '../utils/localData': { ...localData, getBrowserStorage: () => storage },
    }, false, { Date: NormalDate });
    const read = () => app.render('AppProvider', { children: null }).props.value;
    read();
    return { ...app, read, snapshot: () => JSON.stringify(app.slots) };
  };
  const ctx = initialize();
  const original: CoreData = plain(core(ctx.read()));
  const importedBefore = JSON.stringify({ INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_PURCHASE_ORDERS });
  const baseline = plain(ctx.read().inventorySummary);
  const summary = (state = ctx.read()) => ({
    skus: state.inventorySummary.totalSkus, units: state.inventorySummary.totalStockUnits,
    cost: state.inventorySummary.totalInventoryCost,
  });
  const checkpoints: Record<string, unknown> = { initial: summary() };
  const supplier = ctx.read().suppliers.find((s: Supplier) => s.status === 'Active'
    && s.suppliedBrandIds.some(id => ctx.read().brands.some((b: any) => b.id === id && b.status === 'Active')));
  assert.ok(supplier);
  const brand = ctx.read().brands.find((b: any) => b.status === 'Active' && supplier.suppliedBrandIds.includes(b.id));
  assert.ok(brand);
  let sku = 'STEP25-NORMAL-001';
  for (let n = 2; original.products.some(p => p.sku.trim().toUpperCase() === sku); n++) {
    sku = `STEP25-NORMAL-${String(n).padStart(3, '0')}`;
  }
  const input = {
    name: '正常流程測試商品', sku, spec: '250ml', brandId: brand.id, brandName: brand.name,
    supplierId: supplier.id, supplierName: supplier.name, category: '洗髮淨化',
    stock: 10, unitCost: 100, sellingPrice: 150, reorderPoint: 2, moq: 1,
    leadTime: 10, weeklyDemand: 1, monthlyDemand: 4,
  };
  let productId = '', poId = '', poNumber = '';
  let detail: ReturnType<typeof component>;
  let roundTrip: () => void;
  const target = () => ctx.read().products.find((p: Product) => p.id === productId);
  const inventory = component('src/components/inventory/InventoryView.tsx', 'InventoryView', ctx);
  const search = (value: string) => inventory.find(n => n.type === 'input' && n.props.placeholder?.includes('SKU'))
    .props.onChange({ target: { value } });
  const change = (ui: ReturnType<typeof component>, label: string, value: string) => {
    const container = elements(ui.render()).find(n => Array.isArray(n.props?.children)
      && n.props.children.some((child: any) => child?.type === 'label' && text(child) === label));
    assert.ok(container, `Missing field ${label}`);
    const field = elements(container).find(n => n.type === 'input' || n.type === 'select');
    assert.ok(field, `Missing input ${label}`);
    field.props.onChange({ target: { value } });
  };
  const assertOriginal = (state = ctx.read()) => {
    const data = core(state);
    for (const key of Object.keys(original) as (keyof CoreData)[]) {
      const ids = new Set(original[key].map(row => row.id));
      assert.deepEqual(plain(data[key].filter(row => ids.has(row.id))), original[key], `Original ${key} unchanged`);
    }
    assert.equal(JSON.stringify({ INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_PURCHASE_ORDERS }), importedBefore);
    assert.equal(storage.values.get('unrelated-site-key'), 'keep');
  };
  const assertDelta = (units: number) => {
    assert.deepEqual(summary(), {
      skus: baseline.totalSkus + 1, units: baseline.totalStockUnits + units,
      cost: baseline.totalInventoryCost + units * 100,
    });
    assertOriginal();
  };
  const assertStockViews = (stock: number) => {
    const row = inventory.find(n => n.type === 'tr' && n.props.onClick && text(n).includes(sku));
    const cells = elements(row).filter(n => n.type === 'td');
    assert.equal(text(elements(cells[2]).find(n => n.type === 'span')), String(stock));
    assert.ok(text(row).includes('成本 NT$ 100'));
    // The detail instance deliberately retains its original product prop from B.
    const metric = detail.find(n => Array.isArray(n.props?.children)
      && n.props.children[0]?.type === 'span' && text(n.props.children[0]) === '現有庫存 (件)');
    assert.equal(text(metric.props.children[1]), String(stock));
    assert.ok(text(detail.render()).includes('NT$ 100 / 150'));
  };

  await t.test('A: homepage anchors, all nine App branches and page bodies, bidirectional callbacks', () => {
    const pages = [
      ['dashboard', 'dashboard', 'DashboardView', '總覽儀表板'],
      ['inventory', 'inventory', 'InventoryView', '庫存管理動態'],
      ['products', 'products', 'ProductsView', '商品品項清單'],
      ['brands', 'brands', 'BrandsView', '品牌績效評估'],
      ['suppliers', 'suppliers', 'SuppliersView', '供應商與促銷'],
      ['purchase', 'purchase', 'PurchaseOrdersView', '採購訂單與入庫'],
      ['analytics', 'analytics', 'AnalyticsView', '商業決策分析'],
      ['insights', 'insights', 'AIInsightsView', 'AI 建議示範'],
      ['users', 'users', 'UsersView', '人員與角色示範'],
    ];
    const overrides: Record<string, any> = {
      './context/AppContext': { AppProvider: 'ProviderBoundary', useApp: ctx.read },
      './components/home/PersonalHome': { PersonalHome: 'HomeBoundary' },
    };
    for (const [, folder, name] of pages) overrides[`./components/${folder}/${name}`] = { [name]: name };
    const app = runtime('src/App.tsx', overrides);
    const root = app.render('default');
    assert.equal(root.type, 'ProviderBoundary');
    const render = () => app.render(root.props.children.type);
    const homeEntry = () => elements(render()).find(n => n.type === 'HomeBoundary');
    assert.ok(homeEntry(), 'Default area is home');
    const home = runtime('src/components/home/PersonalHome.tsx');
    const homeTree = home.render('PersonalHome', { onEnterSystem: homeEntry()!.props.onEnterSystem });
    const anchors = elements(homeTree).filter(n => n.type === 'a' && n.props.href?.startsWith('#'));
    assert.equal(anchors.length, 5);
    for (const a of anchors) assert.equal(elements(homeTree).filter(n => n.props?.id === a.props.href.slice(1)).length, 1);
    elements(homeTree).find(n => n.type === 'button' && text(n) === '進入庫存系統')!.props.onClick();
    assert.ok(!homeEntry());
    const sidebar = component('src/components/layout/Sidebar.tsx', 'Sidebar', ctx, { isOpen: false, onClose() {} });
    for (const [id, folder, name, label] of pages) {
      sidebar.find(n => n.type === 'button' && text(n).includes(label)).props.onClick();
      assert.equal(ctx.read().activeTab, id);
      assert.ok(elements(render()).some(n => n.type === name), `${id}: correct App branch`);
      const view = component(`src/components/${folder}/${name}.tsx`, name, ctx);
      assert.ok(text(view.render()).trim(), `${id}: production root component returns content`);
    }
    sidebar.find(n => n.type === 'button' && text(n).includes('庫存管理動態')).props.onClick();
    roundTrip = () => {
      const before = JSON.stringify(core(ctx.read())), tab = ctx.read().activeTab;
      elements(render()).find(n => n.type === 'button' && text(n) === '返回個人首頁')!.props.onClick();
      assert.ok(homeEntry());
      homeEntry()!.props.onEnterSystem();
      assert.ok(!homeEntry());
      assert.equal(ctx.read().activeTab, tab);
      assert.equal(JSON.stringify(core(ctx.read())), before);
      assert.ok(elements(render()).some(n => n.type === 'InventoryView'));
    };
    roundTrip();
    assert.deepEqual(plain(core(ctx.read())), original);
    assert.equal(storage.writes.length, 0);
    checkpoints.A = { tabs: pages.map(p => p[0]), anchors: anchors.map(a => a.props.href), summary: summary() };
  });

  await t.test('B: actual product form, exact SKU search, matching brand filter, clear and return', () => {
    let closed = 0;
    const form = component('src/components/modals/NewProductModal.tsx', 'NewProductModal', ctx, { onClose: () => closed++ });
    for (const [label, value] of [
      ['商品名稱', input.name], ['SKU 編號', sku], ['容量規格', input.spec], ['品牌', brand.id],
      ['品類', input.category], ['對應供應商', supplier.id], ['初始在手庫存 (瓶)', '10'],
      ['進貨成本 (NT$)', '100'], ['門市售價 (NT$)', '150'], ['安全補貨點', '2'],
      ['起訂量 (MOQ)', '1'], ['預估每週需求', '1'],
    ]) change(form, label, value);
    form.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(closed, 1);
    const created = ctx.read().products.filter((p: Product) => p.sku === sku);
    assert.equal(created.length, 1);
    productId = created[0].id;
    for (const [key, value] of Object.entries(input)) assert.equal(target()[key], value, key);
    assertDelta(10);
    search(sku);
    assert.ok(text(inventory.render()).includes('共顯示 1 項商品'));
    const brandFilter = inventory.find(n => n.type === 'select'
      && elements(n).some(o => o.type === 'option' && o.props.value === brand.id));
    brandFilter.props.onChange({ target: { value: brand.id } });
    assert.ok(text(inventory.render()).includes(sku));
    assert.ok(text(inventory.render()).includes('共顯示 1 項商品'));
    brandFilter.props.onChange({ target: { value: 'ALL' } });
    search('');
    assert.ok(text(inventory.render()).includes(`共顯示 ${baseline.totalSkus + 1} 項商品`));
    const row = inventory.find(n => n.type === 'tr' && n.props.onClick && text(n).includes(sku));
    row.props.onClick();
    assert.equal(ctx.read().selectedProductId, productId);
    const detailEntry = elements(inventory.render()).find(n => n.type?.name === 'ProductDetailModal');
    assert.equal(detailEntry!.props.product.id, productId);
    detail = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', ctx, detailEntry!.props);
    assertStockViews(10);
    const cards = component('src/components/products/ProductsView.tsx', 'ProductsView', ctx);
    cards.find(n => n.type === 'input' && n.props.placeholder?.includes('SKU')).props.onChange({ target: { value: sku } });
    assert.ok(text(cards.render()).includes(sku));
    roundTrip();
    assert.equal(target().stock, 10);
    checkpoints.B = summary();
  });

  await t.test('C: actual service form deducts three and displays seven with one cost snapshot', () => {
    ctx.read().setIsServiceUsageModalOpen(true);
    const usage = component('src/components/modals/ServiceUsageModal.tsx', 'ServiceUsageModal', ctx);
    change(usage, '選擇使用商品', productId);
    change(usage, '領取數量 (瓶/入/組)', '3');
    usage.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(target().stock, 7);
    const ledger = ctx.read().transactions.filter((tx: any) => tx.productId === productId);
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].type, 'Service Usage');
    assert.equal(ledger[0].quantity, -3);
    assert.equal(ledger[0].resultingStock, 7);
    assert.equal(ledger[0].unitCost, 100);
    assert.ok(text(usage.find(n => n.props.role === 'status')).includes('目前剩餘：7'));
    assertStockViews(7);
    assert.ok(text(detail.render()).includes('-3'));
    assertDelta(7);
    usage.find(n => n.type === 'button' && text(n) === '完成並關閉').props.onClick();
    assert.equal(ctx.read().isServiceUsageModalOpen, false);
    checkpoints.C = summary();
  });

  await t.test('D: actual purchase form and detail handlers progress Draft to Received once', () => {
    let closed = 0;
    const form = component('src/components/modals/NewPOModal.tsx', 'NewPOModal', ctx, { defaultProductId: productId, onClose: () => closed++ });
    change(form, '預期到貨日', '2026-10-20');
    form.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '5' } });
    form.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(closed, 1);
    assert.equal(ctx.read().purchaseOrders.length, original.purchaseOrders.length + 1);
    const order = ctx.read().purchaseOrders[0];
    poId = order.id; poNumber = order.poNumber;
    assert.equal(order.status, 'Draft');
    assert.equal(order.supplierId, supplier.id);
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].productId, productId);
    assert.equal(order.items[0].sku, sku);
    assert.equal(order.items[0].quantity, 5);
    assert.equal(order.items[0].unitCost, 100);
    assert.equal(order.items[0].subtotal, 500);
    assert.equal(order.totalAmount, 500);
    assert.equal(target().stock, 7);
    const view = component('src/components/purchase/PurchaseOrdersView.tsx', 'PurchaseOrdersView', ctx);
    view.find(n => n.type === 'div' && n.props.onClick && text(n).includes(poNumber)).props.onClick();
    const stages = [{ status: 'Draft', stock: target().stock }];
    for (const [label, status] of [['核准採購草稿', 'Approved'], ['標記已下單（示範）', 'Ordered'], ['貨到點收！立即入庫更新', 'Received']]) {
      view.find(n => n.type === 'button' && text(n) === label).props.onClick();
      const current = ctx.read().purchaseOrders.find((po: PurchaseOrder) => po.id === poId);
      assert.equal(current.status, status);
      assert.equal(target().stock, status === 'Received' ? 12 : 7);
      assert.ok(text(view.render()).includes(`目前庫存：${target().stock}`));
      assert.equal(ctx.read().transactions.filter((tx: any) => tx.productId === productId).length, status === 'Received' ? 2 : 1);
      stages.push({ status, stock: target().stock });
    }
    const ledger = ctx.read().transactions.filter((tx: any) => tx.productId === productId);
    assert.equal(ledger.length, 2);
    const receipt = ledger.find((tx: any) => tx.type === 'Purchase');
    assert.equal(receipt.quantity, 5);
    assert.equal(receipt.unitCost, 100);
    assert.equal(receipt.resultingStock, 12);
    assert.equal(receipt.purchaseOrderId, poId);
    assert.ok(receipt.note.includes(poNumber));
    assert.equal(new Set(ledger.map((tx: any) => tx.id)).size, 2);
    const currentDetail = view.find(n => Array.isArray(n.props?.children)
      && n.props.children.some((child: any) => child?.type === 'h2' && text(child).includes('採購單稽核與決策佐證')));
    assert.ok(text(currentDetail).includes(poNumber));
    assert.equal(elements(currentDetail).filter(n => n.type === 'button' && text(n).includes('點收')).length, 0);
    const currentCard = view.find(n => n.type === 'div' && n.props.onClick && text(n).includes(poNumber));
    assert.equal(elements(currentCard).filter(n => n.type === 'button' && text(n).includes('點收')).length, 0);
    assertStockViews(12);
    assert.ok(text(detail.render()).includes('出入庫異動帳本 (2)'));
    assertDelta(12);
    checkpoints.D = { ...summary(), stages };
  });

  await t.test('E: automatic formal save and fresh Context restore all six core tables without replay', () => {
    assert.equal(ctx.read().storageStatus.kind, 'saved');
    assert.equal(storage.writes.length, 6); // add, service, create PO, approve, order, receive
    assert.ok(storage.writes.every(key => key === localData.STORAGE_KEY));
    const published = plain(core(ctx.read())), writes = storage.writes.length;
    const restored = initialize(); // Calls production loadCoreData and its real validator.
    assert.equal(storage.writes.length, writes, 'Initialization does not overwrite saved data');
    assert.equal(restored.read().storageStatus.kind, 'saved');
    assert.deepEqual(plain(core(restored.read())), published);
    assertOriginal(restored.read());
    const product = restored.read().products.find((p: Product) => p.id === productId);
    assert.equal(product.stock, 12);
    assert.ok(restored.read().brands.some((b: any) => b.id === product.brandId));
    assert.ok(restored.read().suppliers.some((s: any) => s.id === product.supplierId));
    const ledger = restored.read().transactions.filter((tx: any) => tx.productId === productId);
    assert.equal(ledger.length, 2);
    assert.equal(ledger.filter((tx: any) => tx.quantity === -3 && tx.unitCost === 100).length, 1);
    assert.equal(ledger.filter((tx: any) => tx.quantity === 5 && tx.unitCost === 100 && tx.purchaseOrderId === poId).length, 1);
    assert.equal(restored.read().purchaseOrders.find((po: PurchaseOrder) => po.id === poId).status, 'Received');
    assert.deepEqual(summary(restored.read()), {
      skus: baseline.totalSkus + 1, units: baseline.totalStockUnits + 12, cost: baseline.totalInventoryCost + 1200,
    });
    checkpoints.E = { ...summary(restored.read()), storageKind: restored.read().storageStatus.kind,
      writes, transactionIds: ledger.map((tx: any) => tx.id) };
  });
  t.diagnostic(JSON.stringify({ sku, input, productId, poId, poNumber,
    purchaseInput: { supplierId: supplier.id, productId, quantity: 5, unitCost: 100, expectedDeliveryDate: '2026-10-20' },
    originalCounts: Object.fromEntries(Object.entries(original).map(([key, rows]) => [key, (rows as any[]).length])),
    checkpoints, scope: 'production Context/modules/component handlers with hook/storage mocks; no browser, real React mount or user data' }));
});

test('Storage: absent snapshot creates deep independent demo copies without startup writes', () => {
  const storage = new MockStorage();
  const before = JSON.stringify({ INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_PURCHASE_ORDERS });
  const first = localData.loadCoreData(storage);
  const second = localData.loadCoreData(storage);
  assert.equal(first.blocked, false);
  assert.equal(first.data.products.length, 111);
  assert.equal(storage.writes.length, 0);
  first.data.products[0].stock = 9999;
  first.data.suppliers[0].suppliedBrandIds.push('isolated');
  first.data.users[0].name = 'isolated';
  assert.notEqual(second.data.products[0].stock, 9999);
  assert.ok(!second.data.suppliers[0].suppliedBrandIds.includes('isolated'));
  assert.notEqual(second.data.users[0].name, 'isolated');
  assert.equal(JSON.stringify({ INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_PURCHASE_ORDERS }), before);
});

test('Storage/Context: all six core tables, signed movements and purchase receipt survive reinitialization', () => {
  const storage = new MockStorage();
  const ctx = context(undefined, false, storage);
  assert.equal(storage.writes.length, 0);
  ctx.read().addBrand({ name: '新品牌', origin: '台灣', category: '測試', status: 'Active' });
  const brand = ctx.read().brands.at(-1);
  assert.equal(ctx.read().addSupplier({ ...supplier, name: '新供應商', suppliedBrandIds: [brand.id] }).ok, true);
  const addedSupplier = ctx.read().suppliers.at(-1);
  ctx.read().addUser({ name: '新經手人', role: 'Staff', title: '測試', avatar: 'N', status: 'Active' });
  const user = ctx.read().users.at(-1);
  ctx.read().setCurrentUser(user);
  const added = ctx.read().addProduct({ ...newProduct(), brandId: brand.id, brandName: brand.name,
    supplierId: addedSupplier.id, supplierName: addedSupplier.name, unitCost: 100 });
  assert.equal(added.ok, true);
  if (!added.ok) return;
  assert.equal(ctx.read().updateProduct(added.value.id, { weeklyDemand: 2.5, sellingPrice: 150.5 }).ok, true);
  assert.equal(ctx.read().recordTransaction({ productId: added.value.id, type: 'Service Usage', quantity: -3 }).ok, true);
  const order = ctx.read().createPurchaseOrder({ supplierId: addedSupplier.id, expectedDeliveryDate: '2026-10-18',
    items: [{ productId: added.value.id, quantity: 5, unitCost: 12.5 }] });
  assert.equal(order.ok, true);
  if (!order.ok) return;
  for (const status of ['Approved', 'Ordered', 'Received']) assert.equal(ctx.read().updatePOStatus(order.value.id, status).ok, true);
  assert.equal(ctx.read().recordTransaction({ productId: added.value.id, type: 'Return', returnDirection: 'From Customer', quantity: 1 }).ok, true);
  assert.equal(ctx.read().recordTransaction({ productId: added.value.id, type: 'Return', returnDirection: 'To Supplier', quantity: -1 }).ok, true);
  ctx.read().submitInsightFeedback({ insightId: 'i1', isHelpful: true });
  ctx.read().setSelectedProductId(added.value.id);
  const saved = plain(core(ctx.read()));
  const count = storage.writes.length;
  const restored = context(undefined, false, storage);
  assert.deepEqual(plain(core(restored.read())), saved);
  assert.equal(storage.writes.length, count, 'Restore itself never writes');
  assert.equal(restored.read().products.find((p: any) => p.id === added.value.id).stock, 12);
  assert.equal(restored.read().transactions.filter((t: any) => t.purchaseOrderId === order.value.id).length, 1);
  assert.equal(restored.read().transactions.find((t: any) => t.purchaseOrderId === order.value.id).unitCost, 12.5);
  assert.ok(restored.read().transactions.every((t: any) => t.userId === user.id));
  assert.equal(restored.read().currentUser.id, 'u1', 'Current role is session-only');
  assert.equal(restored.read().selectedProductId, null);
  assert.equal(restored.read().notifications.length, 0);
  assert.equal(restored.read().insights[0].feedback, undefined);
  const snapshot = restored.snapshot();
  assert.equal(restored.read().updatePOStatus(order.value.id, 'Received').ok, false);
  assert.equal(restored.snapshot(), snapshot);
  assert.equal(storage.writes.length, count, 'Rejected repeat receipt does not write storage');
});

test('Storage: valid snapshot is not overwritten on initialization and the command ref uses restored zero stock', () => {
  const storage = new MockStorage();
  const ctx = context(undefined, false, storage);
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -10 }).ok, true);
  const original = storage.values.get(localData.STORAGE_KEY);
  const writes = storage.writes.length;
  const restored = context(undefined, false, storage);
  restored.read(); restored.read();
  assert.equal(restored.read().products[0].stock, 0);
  assert.equal(restored.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -1 }).ok, false);
  assert.equal(storage.writes.length, writes);
  assert.equal(storage.values.get(localData.STORAGE_KEY), original);
});

test('Storage: deferred render commands save complete latest snapshots without mixing old ledger or relationships', () => {
  const storage = new MockStorage();
  const ctx = context(undefined, true, storage);
  const old = ctx.read();
  assert.equal(old.recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -7 }).ok, true);
  assert.equal(old.recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -4 }).ok, false);
  old.addBrand({ name: '延後品牌', origin: '', category: '', status: 'Active' });
  const data = localData.loadCoreData(storage).data;
  assert.equal(data.products[0].stock, 3);
  assert.equal(data.transactions.length, 1);
  assert.equal(data.brands.length, 2);
  ctx.flush();
  assert.deepEqual(plain(core(ctx.read())), plain(data));
});

for (const [name, modify] of [
  ['missing table', (x: any) => { delete x.data.products; }],
  ['empty users', (x: any) => { x.data.users = []; }],
  ['fractional stock', (x: any) => { x.data.products[0].stock = 1.5; }],
  ['non-finite money encoded as null', (x: any) => { x.data.products[0].unitCost = Infinity; }],
  ['duplicate IDs', (x: any) => { x.data.products.push({ ...x.data.products[0], sku: 'different' }); }],
  ['missing brand relation', (x: any) => { x.data.products[0].brandId = 'missing'; }],
  ['missing historical user', (x: any) => { x.data.transactions[0].userId = 'missing'; }],
  ['wrong transaction direction', (x: any) => { x.data.transactions[0].type = 'Purchase'; x.data.transactions[0].quantity = -1; }],
  ['missing purchase source', (x: any) => { x.data.transactions[0].purchaseOrderId = 'missing'; }],
  ['unknown version', (x: any) => { x.version = 999; }],
] as const) {
  test(`Storage: ${name} uses fallback and blocks all automatic overwrites`, () => {
    const storage = new MockStorage();
    const envelope: any = { version: localData.STORAGE_VERSION, data: localData.createDemoData() };
    modify(envelope);
    const raw = JSON.stringify(envelope);
    storage.values.set(localData.STORAGE_KEY, raw);
    const ctx = context(undefined, false, storage);
    assert.equal(ctx.read().storageStatus.kind, 'blocked');
    assert.ok(ctx.read().storageStatus.message);
    assert.equal(ctx.read().products[0].stock, 10, 'Uses isolated fixture demo, not broken snapshot');
    assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -1 }).ok, true);
    assert.equal(storage.values.get(localData.STORAGE_KEY), raw);
    assert.equal(storage.writes.length, 0);
  });
}

test('Storage: invalid JSON is preserved until explicit reset, then saving resumes', () => {
  const storage = new MockStorage();
  storage.values.set(localData.STORAGE_KEY, '{broken');
  const ctx = context(undefined, false, storage);
  assert.equal(ctx.read().storageStatus.kind, 'blocked');
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 }).ok, true);
  assert.equal(storage.values.get(localData.STORAGE_KEY), '{broken');
  assert.equal(storage.writes.length, 0);
  ctx.read().resetDemoData();
  assert.equal(ctx.read().storageStatus.kind, 'saved');
  assert.equal(localData.loadCoreData(storage).data.products[0].stock, 10);
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -1 }).ok, true);
  assert.equal(localData.loadCoreData(storage).data.products[0].stock, 9);
});

test('Storage: denied reads do not crash or overwrite unknown data; operations remain memory-only', () => {
  const storage = new MockStorage();
  storage.failRead = true;
  const ctx = context(undefined, false, storage);
  assert.equal(ctx.read().storageStatus.kind, 'blocked');
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 }).ok, true);
  assert.equal(ctx.read().products[0].stock, 7);
  assert.equal(storage.writes.length, 0);
  assert.match(ctx.read().storageStatus.message, /無法讀取/);
});

test('Storage: quota failure keeps successful memory results, reports failure and later retries latest data', () => {
  const storage = new MockStorage();
  const ctx = context(undefined, false, storage);
  assert.equal(ctx.read().updateProduct('p1', { sellingPrice: 20 }).ok, true);
  const previous = storage.values.get(localData.STORAGE_KEY);
  storage.failWrite = true;
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 }).ok, true);
  assert.equal(ctx.read().products[0].stock, 7);
  assert.equal(ctx.read().transactions.length, 1);
  assert.equal(ctx.read().storageStatus.kind, 'error');
  assert.match(ctx.read().storageStatus.message, /本機保存失敗，重新整理可能遺失/);
  assert.equal(storage.values.get(localData.STORAGE_KEY), previous);
  assert.equal(localData.loadCoreData(storage).data.products[0].stock, 10);
  storage.failWrite = false;
  assert.equal(ctx.read().recordTransaction({ productId: 'p1', type: 'Inventory Adjustment', quantity: -1 }).ok, true);
  assert.equal(ctx.read().storageStatus.kind, 'saved');
  assert.equal(localData.loadCoreData(storage).data.products[0].stock, 6);
  assert.equal(localData.loadCoreData(storage).data.transactions.length, 2);
});

test('Storage reset UI: cancel is unchanged; confirm resets core/ref/session and only the project key', () => {
  const storage = new MockStorage();
  const ctx = context(undefined, false, storage);
  const added = ctx.read().addProduct(newProduct());
  assert.equal(added.ok, true);
  if (!added.ok) return;
  ctx.read().setSelectedProductId(added.value.id);
  ctx.read().setActiveTab('products');
  ctx.read().setIsServiceUsageModalOpen(true);
  ctx.read().setIsNotificationSettingsOpen(true);
  ctx.read().submitInsightFeedback({ insightId: 'i1', isHelpful: true });
  let confirmed = false;
  const ui = runtime('src/components/layout/DataStorageStatus.tsx', { '../../context/AppContext': { useApp: ctx.read } }, false,
    { window: { confirm: () => confirmed } });
  const click = () => elements(ui.render('DataStorageStatus', { showReset: true })).find(n => n.type === 'button')!.props.onClick();
  const before = ctx.snapshot(), raw = storage.values.get(localData.STORAGE_KEY), count = storage.writes.length;
  click();
  assert.equal(ctx.snapshot(), before);
  assert.equal(storage.values.get(localData.STORAGE_KEY), raw);
  assert.equal(storage.writes.length, count);
  confirmed = true;
  click();
  assert.equal(ctx.read().products.length, 2);
  assert.equal(ctx.read().selectedProductId, null);
  assert.equal(ctx.read().activeTab, 'dashboard');
  assert.equal(ctx.read().isServiceUsageModalOpen, false);
  assert.equal(ctx.read().isNotificationSettingsOpen, false);
  assert.equal(ctx.read().insights[0].feedback, undefined);
  assert.equal(ctx.read().dataRevision, 1);
  assert.equal(ctx.read().recordTransaction({ productId: added.value.id, type: 'Sale', quantity: -1 }).ok, false, 'Ref also resets');
  assert.equal(storage.values.get('unrelated-site-key'), 'keep');
  assert.ok(storage.writes.every(key => key === localData.STORAGE_KEY));
  const restored = context(undefined, false, storage);
  assert.equal(restored.read().products.length, 2);
  assert.equal(restored.read().transactions.length, 0);
});

test('Storage reset failure: memory is fresh but previous local data survives and warning is explicit', () => {
  const storage = new MockStorage();
  const ctx = context(undefined, false, storage);
  ctx.read().recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -3 });
  const raw = storage.values.get(localData.STORAGE_KEY);
  storage.failWrite = true;
  ctx.read().resetDemoData();
  assert.equal(ctx.read().products[0].stock, 10);
  assert.equal(ctx.read().transactions.length, 0);
  assert.equal(storage.values.get(localData.STORAGE_KEY), raw);
  assert.equal(ctx.read().storageStatus.kind, 'error');
  assert.match(ctx.read().storageStatus.message, /本機快照未成功取代/);
  assert.equal(context(undefined, false, storage).read().products[0].stock, 7);
});

test('Storage: historical missing cost/direction and supplier-mismatched demo orders restore without repairing history', () => {
  const storage = new MockStorage();
  const data = localData.createDemoData();
  data.transactions.push({ ...data.transactions[0], id: 'legacy-return', type: 'Return', quantity: 1, unitCost: undefined, returnDirection: undefined });
  assert.equal(localData.saveCoreData(storage, data), true);
  const loaded = localData.loadCoreData(storage);
  assert.equal(loaded.blocked, false);
  assert.deepEqual(plain(loaded.data.transactions), plain(data.transactions));
  assert.deepEqual(plain(loaded.data.purchaseOrders), plain(data.purchaseOrders));
  const ctx = context(undefined, false, storage);
  const raw = storage.values.get(localData.STORAGE_KEY);
  assert.equal(ctx.read().updatePOStatus('po-2', 'Received').ok, false);
  assert.equal(storage.values.get(localData.STORAGE_KEY), raw);
});

test('Storage: same-time IDs do not collide across reinitialization for any core entity or order/transaction', () => {
  const storage = new MockStorage();
  class FixedDate extends Date {
    constructor(value?: any) { super(value ?? 1792200000000); }
    static now() { return 1792200000000; }
  }
  const addAll = (ctx: ReturnType<typeof context>, suffix: string) => {
    const app = ctx.read();
    assert.equal(app.addProduct({ ...newProduct(), sku: `NEW-${suffix}` }).ok, true);
    app.addBrand({ name: suffix, origin: '', category: '', status: 'Active' });
    assert.equal(app.addSupplier({ ...supplier, name: suffix }).ok, true);
    app.addUser({ name: suffix, title: '', avatar: '', role: 'Staff', status: 'Active' });
    assert.equal(app.createPurchaseOrder(purchase()).ok, true);
    assert.equal(app.recordTransaction({ productId: 'p1', type: 'Service Usage', quantity: -1 }).ok, true);
  };
  const first = context(undefined, false, storage, { Date: FixedDate });
  addAll(first, 'A'); addAll(first, 'B');
  const second = context(undefined, false, storage, { Date: FixedDate });
  assert.equal(second.read().storageStatus.kind, 'saved');
  addAll(second, 'C');
  const data = localData.loadCoreData(storage).data;
  for (const items of [data.products, data.brands, data.suppliers, data.users, data.purchaseOrders, data.transactions]) {
    assert.equal(new Set(items.map(i => i.id)).size, items.length);
  }
  assert.equal(data.products.length, 5); assert.equal(data.transactions.length, 3);
  assert.equal(data.purchaseOrders.length, 3);
  assert.equal(new Set(data.purchaseOrders.map(p => p.poNumber)).size, 3);
});

test('Storage: envelope whitelists core fields and refuses invalid numbers without replacing prior value', () => {
  const storage = new MockStorage();
  const data = localData.createDemoData();
  (data as any).notifications = ['session only'];
  (data.users[0] as any).token = 'synthetic-test-value';
  assert.equal(localData.saveCoreData(storage, data), true);
  assert.deepEqual(Object.keys(stored(storage)).sort(), ['data', 'version']);
  assert.deepEqual(Object.keys(stored(storage).data).sort(), ['brands', 'products', 'purchaseOrders', 'suppliers', 'transactions', 'users']);
  assert.ok(!storage.values.get(localData.STORAGE_KEY)!.includes('synthetic-test-value'));
  const original = storage.values.get(localData.STORAGE_KEY);
  data.products[0].stock = NaN;
  assert.equal(localData.saveCoreData(storage, data), false);
  assert.equal(storage.values.get(localData.STORAGE_KEY), original);
});

test('Step17 flow: five production component/Context flows with isolated storage', async t => {
  const storage = new MockStorage();
  class FlowDate extends Date {
    constructor(value?: any) { super(value ?? 1792200000000); }
    static now() { return 1792200000000; }
  }
  const fixtures = (f: any) => {
    f.INITIAL_BRANDS.push({ id: 'b2', name: '篩選測試品牌', origin: '', category: '', status: 'Active' });
  };
  const ctx = context(fixtures, false, storage, { Date: FlowDate });
  const baseline = { ...ctx.read().inventorySummary };
  let sku = 'TEST17-001';
  for (let n = 2; ctx.read().products.some((p: Product) => p.sku.toUpperCase() === sku); n++) sku = `TEST17-${String(n).padStart(3, '0')}`;
  let productId = '', poId = '', poNumber = '';
  const target = () => ctx.read().products.find((p: Product) => p.id === productId);
  const summary = () => ({
    skus: ctx.read().inventorySummary.totalSkus,
    units: ctx.read().inventorySummary.totalStockUnits,
    cost: ctx.read().inventorySummary.totalInventoryCost,
  });
  const baselineSummary = summary();
  const checkpoints: Record<string, unknown> = {};
  const change = (ui: ReturnType<typeof component>, label: string, value: string) => {
    const container = elements(ui.render()).find(n => Array.isArray(n.props?.children)
      && n.props.children.some((child: any) => child?.type === 'label' && text(child) === label));
    assert.ok(container, `Missing rendered field ${label}`);
    const field = elements(container).find(n => n.type === 'input' || n.type === 'select');
    assert.ok(field, `Missing rendered input ${label}`);
    field.props.onChange({ target: { value } });
  };
  const inventory = component('src/components/inventory/InventoryView.tsx', 'InventoryView', ctx);
  const search = (value: string) => inventory.find(n => n.type === 'input' && n.props.placeholder?.includes('SKU')).props.onChange({ target: { value } });
  const assertDelta = (units: number, cost: number) => {
    assert.equal(ctx.read().inventorySummary.totalSkus, baseline.totalSkus + 1);
    assert.equal(ctx.read().inventorySummary.totalStockUnits, baseline.totalStockUnits + units);
    assert.equal(ctx.read().inventorySummary.totalInventoryCost, baseline.totalInventoryCost + cost);
  };

  await t.test('Step17 flow A: homepage anchors and real App callbacks preserve selected system page and shared data', () => {
    const overrides: Record<string, any> = { './context/AppContext': { AppProvider: 'ProviderBoundary', useApp: ctx.read } };
    for (const [folder, name] of [['home', 'PersonalHome'], ['products', 'ProductsView'], ['inventory', 'InventoryView'], ['purchase', 'PurchaseOrdersView'], ['dashboard', 'DashboardView']]) {
      overrides[`./components/${folder}/${name}`] = { [name]: name };
    }
    const app = runtime('src/App.tsx', overrides);
    const root = app.render('default');
    assert.equal(root.type, 'ProviderBoundary');
    const AppContent = root.props.children.type;
    const render = () => app.render(AppContent);
    const homeEntry = () => elements(render()).find(n => n.type === 'PersonalHome')!;
    assert.ok(homeEntry());
    const home = runtime('src/components/home/PersonalHome.tsx');
    const homeTree = home.render('PersonalHome', { onEnterSystem: homeEntry().props.onEnterSystem });
    const anchors = elements(homeTree).filter(n => n.type === 'a' && n.props.href?.startsWith('#'));
    assert.equal(anchors.length, 5);
    for (const anchor of anchors) assert.equal(elements(homeTree).filter(n => n.props?.id === anchor.props.href.slice(1)).length, 1);
    elements(homeTree).find(n => n.type === 'button' && text(n) === '進入庫存系統')!.props.onClick();
    assert.ok(!homeEntry());
    const sidebar = component('src/components/layout/Sidebar.tsx', 'Sidebar', ctx, { isOpen: false, onClose() {} });
    sidebar.find(n => n.type === 'button' && text(n).includes('商品品項清單')).props.onClick();
    assert.ok(elements(render()).some(n => n.type === 'ProductsView'));
    const before = JSON.stringify(core(ctx.read()));
    elements(render()).find(n => n.type === 'button' && text(n) === '返回個人首頁')!.props.onClick();
    assert.ok(homeEntry());
    homeEntry().props.onEnterSystem();
    assert.ok(elements(render()).some(n => n.type === 'ProductsView'));
    assert.equal(ctx.read().activeTab, 'products');
    for (const [label, name] of [['庫存管理動態', 'InventoryView'], ['採購訂單與入庫', 'PurchaseOrdersView'], ['總覽儀表板', 'DashboardView']]) {
      sidebar.find(n => n.type === 'button' && text(n).includes(label)).props.onClick();
      assert.ok(elements(render()).some(n => n.type === name));
    }
    assert.equal(JSON.stringify(core(ctx.read())), before);
    assert.equal(storage.writes.length, 0);
  });

  await t.test('Step17 flow B: production product form, full SKU lookup, empty result, brand filter and clear', () => {
    let closed = 0;
    const ui = component('src/components/modals/NewProductModal.tsx', 'NewProductModal', ctx, { onClose: () => closed++ });
    for (const [label, value] of [
      ['商品名稱', `初版功能檢查 ${sku}`], ['SKU 編號', sku], ['容量規格', '250ml'],
      ['品牌', 'b1'], ['品類', '洗髮淨化'], ['對應供應商', 's1'], ['初始在手庫存 (瓶)', '10'],
      ['進貨成本 (NT$)', '100'], ['門市售價 (NT$)', '150'], ['安全補貨點', '2'], ['起訂量 (MOQ)', '1'], ['預估每週需求', '1'],
    ]) change(ui, label, value);
    ui.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(closed, 1);
    const product = ctx.read().products.find((p: Product) => p.sku === sku);
    assert.ok(product);
    productId = product.id;
    assert.equal(product.stock, 10); assert.equal(product.unitCost, 100);
    assertDelta(10, 1000);
    search(sku);
    assert.ok(text(inventory.render()).includes(sku));
    assert.ok(text(inventory.render()).includes('共顯示 1 項商品'));
    const cards = component('src/components/products/ProductsView.tsx', 'ProductsView', ctx);
    cards.find(n => n.type === 'input' && n.props.placeholder?.includes('SKU')).props.onChange({ target: { value: sku } });
    assert.ok(text(cards.render()).includes(sku));
    const detail = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', ctx, { product, onClose() {} });
    assert.ok(text(detail.render()).includes(`初版功能檢查 ${sku}`));
    search('NO-SUCH-TEST17');
    assert.ok(text(inventory.render()).includes('查無符合條件的商品'));
    search(sku);
    const brand = () => inventory.find(n => n.type === 'select' && elements(n.props.children).some(option => option.type === 'option' && option.props.value === 'b2'));
    brand().props.onChange({ target: { value: 'b2' } });
    assert.ok(text(inventory.render()).includes('查無符合條件的商品'));
    brand().props.onChange({ target: { value: 'ALL' } });
    assert.ok(text(inventory.render()).includes('共顯示 1 項商品'));
    search('');
    assert.ok(text(inventory.render()).includes(`共顯示 ${baseline.totalSkus + 1} 項商品`));
    checkpoints.B = summary();
  });

  await t.test('Step17 flow C: production service form shows 7, records -3 and rejects 8 with input/state preserved', () => {
    ctx.read().setIsServiceUsageModalOpen(true);
    const usage = component('src/components/modals/ServiceUsageModal.tsx', 'ServiceUsageModal', ctx);
    change(usage, '選擇使用商品', productId);
    change(usage, '領取數量 (瓶/入/組)', '3');
    usage.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(target().stock, 7);
    assert.ok(text(usage.render()).includes('目前剩餘：7'));
    let ledger = ctx.read().transactions.filter((tx: any) => tx.productId === productId);
    assert.equal(ledger.length, 1); assert.equal(ledger[0].quantity, -3);
    assert.equal(ledger[0].resultingStock, 7);
    assertDelta(7, 700);
    assert.equal(usage.timers.length, 0);
    usage.find(n => n.type === 'button' && text(n) === '完成並關閉').props.onClick();
    ctx.read().setIsServiceUsageModalOpen(true);
    change(usage, '領取數量 (瓶/入/組)', '8');
    const before = ctx.snapshot(), writes = storage.writes.length;
    usage.find(n => n.type === 'form').props.onSubmit(event); // Native HTML max is not simulated.
    assert.equal(ctx.snapshot(), before);
    assert.equal(storage.writes.length, writes);
    assert.match(text(usage.find(n => n.props.role === 'alert')), /庫存不足.*現有 7.*申請出庫 8/);
    const qty = elements(usage.render()).find(n => n.type === 'input' && n.props.type === 'number');
    assert.equal(qty!.props.value, '8');
    assert.equal(qty!.props.max, 7);
    search(sku);
    assert.ok(text(inventory.render()).includes(sku));
    const detail = component('src/components/products/ProductDetailModal.tsx', 'ProductDetailModal', ctx, { product: target(), onClose() {} });
    assert.ok(text(detail.render()).includes('-3'));
    ledger = ctx.read().transactions.filter((tx: any) => tx.productId === productId);
    assert.equal(ledger.length, 1);
    ctx.read().setIsServiceUsageModalOpen(false);
    checkpoints.C = summary();
  });

  await t.test('Step17 flow D: production PO form/details advance legally, receive +5 once and update summaries', () => {
    let closed = 0;
    const form = component('src/components/modals/NewPOModal.tsx', 'NewPOModal', ctx, { defaultProductId: productId, onClose: () => closed++ });
    change(form, '預期到貨日', '2026-10-18');
    form.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '5' } });
    form.find(n => n.type === 'form').props.onSubmit(event);
    assert.equal(closed, 1);
    assert.equal(ctx.read().purchaseOrders.length, 1);
    const order = ctx.read().purchaseOrders[0];
    poId = order.id; poNumber = order.poNumber;
    assert.equal(order.status, 'Draft');
    assert.equal(order.items[0].productId, productId);
    assert.equal(order.items[0].quantity, 5);
    assert.equal(order.totalAmount, 500);
    assert.equal(target().stock, 7);
    const view = component('src/components/purchase/PurchaseOrdersView.tsx', 'PurchaseOrdersView', ctx);
    view.find(n => n.type === 'div' && n.props.onClick && n.props.className?.includes('rounded-2xl p-5') && text(n).includes(poNumber)).props.onClick();
    for (const [label, status] of [['核准採購草稿', 'Approved'], ['標記已下單（示範）', 'Ordered'], ['貨到點收！立即入庫更新', 'Received']]) {
      view.find(n => n.type === 'button' && text(n) === label).props.onClick();
      assert.equal(ctx.read().purchaseOrders[0].status, status);
      assert.equal(target().stock, status === 'Received' ? 12 : 7);
      assert.ok(text(view.render()).includes(`目前庫存：${status === 'Received' ? 12 : 7}`));
    }
    const ledger = ctx.read().transactions.filter((tx: any) => tx.productId === productId);
    assert.equal(ledger.length, 2);
    assert.equal(ledger.filter((tx: any) => tx.quantity === -3).length, 1);
    const receipt = ledger.find((tx: any) => tx.quantity === 5);
    assert.equal(receipt.purchaseOrderId, poId);
    assert.ok(receipt.note.includes(poNumber));
    assert.equal(elements(view.render()).filter(n => n.type === 'button' && text(n).includes('點收')).length, 0);
    assertDelta(12, 1200);
    const before = ctx.snapshot(), writes = storage.writes.length;
    assert.equal(ctx.read().updatePOStatus(poId, 'Received').ok, false);
    assert.equal(ctx.snapshot(), before); assert.equal(storage.writes.length, writes);
    checkpoints.D = summary();
  });

  await t.test('Step17 flow E: real serializer and fresh mock Context restore all records without replay/initial overwrite', () => {
    assert.equal(ctx.read().storageStatus.kind, 'saved');
    const writes = storage.writes.length;
    const savedCore = plain(core(ctx.read()));
    const restored = context(fixtures, false, storage, { Date: FlowDate });
    assert.equal(storage.writes.length, writes);
    assert.deepEqual(plain(core(restored.read())), savedCore);
    const product = restored.read().products.find((p: Product) => p.sku === sku);
    assert.equal(product.stock, 12);
    assert.ok(restored.read().brands.some((b: any) => b.id === product.brandId));
    assert.ok(restored.read().suppliers.some((s: any) => s.id === product.supplierId));
    const ledger = restored.read().transactions.filter((tx: any) => tx.productId === productId);
    assert.equal(ledger.length, 2);
    assert.equal(ledger.filter((tx: any) => tx.quantity === -3).length, 1);
    assert.equal(ledger.filter((tx: any) => tx.quantity === 5 && tx.purchaseOrderId === poId).length, 1);
    assert.equal(restored.read().purchaseOrders.find((p: any) => p.id === poId).status, 'Received');
    const view = component('src/components/purchase/PurchaseOrdersView.tsx', 'PurchaseOrdersView', restored);
    assert.ok(text(view.render()).includes(poNumber));
    assert.equal(elements(view.render()).filter(n => n.type === 'button' && text(n).includes('點收')).length, 0);
    const before = restored.snapshot();
    assert.equal(restored.read().updatePOStatus(poId, 'Received').ok, false);
    assert.equal(restored.snapshot(), before); assert.equal(storage.writes.length, writes);
    assert.equal(restored.read().inventorySummary.totalSkus, baseline.totalSkus + 1);
    assert.equal(restored.read().inventorySummary.totalStockUnits, baseline.totalStockUnits + 12);
    assert.equal(restored.read().inventorySummary.totalInventoryCost, baseline.totalInventoryCost + 1200);
    checkpoints.E = { skus: restored.read().inventorySummary.totalSkus, units: restored.read().inventorySummary.totalStockUnits, cost: restored.read().inventorySummary.totalInventoryCost };
  });

  process.stdout.write(`# Step17 mock report ${JSON.stringify({ sku, productId, poNumber, poId, baseline: baselineSummary, checkpoints, scope: 'isolated hook/handler/storage mocks; no browser or real user data' })}\n`);
});

test('Layout navigation: production App and Sidebar handlers close on selection and Escape without resetting core data', () => {
  const ctx = context();
  const before = JSON.stringify(core(ctx.read()));
  const app = runtime('src/App.tsx', {
    './context/AppContext': { AppProvider: 'ProviderBoundary', useApp: ctx.read },
    './components/home/PersonalHome': { PersonalHome: 'HomeBoundary' },
    './components/layout/Header': { Header: 'HeaderBoundary' },
    './components/layout/Sidebar': { Sidebar: 'SidebarBoundary' },
  });
  const root = app.render('default');
  assert.equal(root.type, 'ProviderBoundary');
  const render = () => app.render(root.props.children.type);
  const find = (type: string) => elements(render()).find(node => node.type === type)!;
  find('HomeBoundary').props.onEnterSystem();
  assert.equal(find('HeaderBoundary').props.isNavigationOpen, false);
  let focused = 0;
  find('HeaderBoundary').props.navigationButtonRef.current = { focus() { focused++; } };
  find('HeaderBoundary').props.onToggleNavigation();
  assert.equal(find('HeaderBoundary').props.isNavigationOpen, true);
  const sidebar = runtime('src/components/layout/Sidebar.tsx', { '../../context/AppContext': { useApp: ctx.read } });
  const sidebarTree = () => sidebar.render('Sidebar', find('SidebarBoundary').props);
  elements(sidebarTree()).find(node => node.type === 'button' && text(node).includes('商品品項清單'))!.props.onClick();
  assert.equal(ctx.read().activeTab, 'products');
  assert.equal(find('HeaderBoundary').props.isNavigationOpen, false);
  assert.equal(focused, 1);
  find('HeaderBoundary').props.onToggleNavigation();
  let prevented = 0;
  sidebarTree().props.onKeyDown({ key: 'Escape', preventDefault() { prevented++; } });
  assert.equal(prevented, 1);
  assert.equal(find('HeaderBoundary').props.isNavigationOpen, false);
  assert.equal(focused, 2);
  elements(render()).find(node => node.type === 'button' && text(node) === '返回個人首頁')!.props.onClick();
  assert.ok(find('HomeBoundary'));
  find('HomeBoundary').props.onEnterSystem();
  assert.equal(ctx.read().activeTab, 'products');
  assert.equal(find('HeaderBoundary').props.isNavigationOpen, false);
  assert.equal(JSON.stringify(core(ctx.read())), before);
});

test('Layout header: native navigation and role controls handle clicks, Escape and focus leaving the disclosure', () => {
  const ctx = context(fixtures => fixtures.INITIAL_USERS.push({
    ...fixtures.INITIAL_USERS[0], id: 'u2', name: '另一角色',
  }));
  let toggles = 0;
  let closes = 0;
  const props = {
    isNavigationOpen: false, onToggleNavigation() { toggles++; },
    onCloseNavigation() { closes++; }, navigationButtonRef: { current: null },
  };
  const ui = component('src/components/layout/Header.tsx', 'Header', ctx, props);
  const navigation = () => ui.find(node => node.type === 'button' && node.props['aria-controls'] === 'system-navigation');
  navigation().props.onClick();
  assert.equal(toggles, 1);
  props.isNavigationOpen = true;
  assert.equal(navigation().props['aria-expanded'], true);
  navigation().props.onKeyDown(eventForEscape());
  assert.equal(closes, 1);
  const role = () => ui.find(node => node.type === 'button' && node.props['aria-controls'] === 'role-selector');
  const panel = () => ui.find(node => node.props?.id === 'role-selector');
  assert.equal(panel().props.hidden, true);
  let focused = 0;
  role().props.ref.current = { focus() { focused++; } };
  role().props.onClick();
  assert.equal(role().props['aria-expanded'], true);
  assert.equal(panel().props.hidden, false);
  const disclosure = () => ui.find(node => node.props?.onBlur && node.props?.onKeyDown);
  disclosure().props.onKeyDown(eventForEscape());
  assert.equal(panel().props.hidden, true);
  assert.equal(focused, 1);
  role().props.onClick();
  ui.find(node => node.type === 'button' && text(node).includes('另一角色')).props.onClick();
  assert.equal(ctx.read().currentUser.id, 'u2');
  assert.equal(panel().props.hidden, true);
  assert.equal(focused, 2);
  role().props.onClick();
  disclosure().props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null });
  assert.equal(panel().props.hidden, true);

  function eventForEscape() {
    return { key: 'Escape', preventDefault() {} };
  }
});

// Production handlers with controlled promises; no real clipboard or browser DOM.
test('Feedback copy: pending write stays busy, blocks repeated calls and announces success only after resolution', async () => {
  let resolveWrite!: () => void;
  const pendingWrite = new Promise<void>(resolve => { resolveWrite = resolve; });
  const writes: string[] = [];
  const ui = runtime('src/components/home/PersonalHome.tsx', {}, false, {
    navigator: { clipboard: { writeText(value: string) { writes.push(value); return pendingWrite; } } },
  });
  const render = () => ui.render('PersonalHome', { onEnterSystem() {} });
  const copy = () => elements(render()).find(n => n.type === 'button' && n.props['aria-busy'] !== undefined)!;
  const status = () => elements(render()).find(n => n.props.role === 'status')!;

  const pending = copy().props.onClick();
  assert.deepEqual(writes, ['your-email@example.com']);
  assert.equal(copy().props.disabled, true);
  assert.equal(copy().props['aria-busy'], true);
  assert.match(text(copy()), /正在複製/);
  assert.equal(status().props['data-feedback'], 'copying');
  assert.match(text(status()), /正在複製 Email/);
  assert.equal(text(status()).includes('已複製'), false);
  await copy().props.onClick(); // Bypass the native disabled UI to check the existing ref guard.
  assert.equal(writes.length, 1);
  assert.equal(ui.timers.length, 0);

  resolveWrite();
  await pending;
  assert.equal(copy().props.disabled, false);
  assert.equal(copy().props['aria-busy'], false);
  assert.equal(text(status()), '已複製 Email');
  assert.equal(status().props['data-feedback'], 'success');
  assert.equal(elements(render()).filter(n => n.props.role === 'status').length, 1);
});

test('Feedback copy: rejected write restores the button and keeps failure and manual-copy guidance', async () => {
  let rejectWrite!: (reason: Error) => void;
  const pendingWrite = new Promise<void>((_resolve, reject) => { rejectWrite = reject; });
  const writes: string[] = [];
  const ui = runtime('src/components/home/PersonalHome.tsx', {}, false, {
    navigator: { clipboard: { writeText(value: string) { writes.push(value); return pendingWrite; } } },
  });
  const render = () => ui.render('PersonalHome', { onEnterSystem() {} });
  const copy = () => elements(render()).find(n => n.type === 'button' && n.props['aria-busy'] !== undefined)!;
  const pending = copy().props.onClick();
  assert.equal(copy().props.disabled, true);
  rejectWrite(new Error('Mock clipboard rejection'));
  await pending;
  const status = elements(render()).find(n => n.props.role === 'status')!;
  assert.deepEqual(writes, ['your-email@example.com']);
  assert.equal(copy().props.disabled, false);
  assert.equal(copy().props['aria-busy'], false);
  assert.equal(status.props['data-feedback'], 'error');
  assert.equal(text(status), '無法自動複製，請手動選取信箱文字複製。');
  assert.equal(text(status).includes('已複製'), false);
  assert.ok(elements(render()).some(n => n.type === 'a' && n.props.href === 'mailto:your-email@example.com'));
});

test('Feedback copy: unavailable API keeps selectable email and a single readable failure message', async () => {
  const ui = runtime('src/components/home/PersonalHome.tsx', {}, false, { navigator: {} });
  const render = () => ui.render('PersonalHome', { onEnterSystem() {} });
  const copy = () => elements(render()).find(n => n.type === 'button' && n.props['aria-busy'] !== undefined)!;
  await copy().props.onClick();
  const statuses = elements(render()).filter(n => n.props.role === 'status');
  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].props['aria-live'], 'polite');
  assert.equal(statuses[0].props['data-feedback'], 'error');
  assert.match(text(statuses[0]), /無法自動複製，請手動選取信箱文字複製/);
  assert.ok(text(render()).includes('your-email@example.com'));
  assert.equal(copy().props.disabled, false);
  assert.equal(ui.timers.length, 0);
});

test('Feedback service: success remains readable until explicit close, without extra inventory writes or timers', () => {
  const ctx = context();
  ctx.read().setIsServiceUsageModalOpen(true);
  const ui = component('src/components/modals/ServiceUsageModal.tsx', 'ServiceUsageModal', ctx);
  ui.find(n => n.type === 'input' && n.props.type === 'number').props.onChange({ target: { value: '3' } });
  ui.find(n => n.type === 'form').props.onSubmit(event);
  assert.equal(ctx.read().products[0].stock, 7);
  assert.equal(ctx.read().transactions.length, 1);
  assert.equal(ctx.read().transactions[0].quantity, -3);
  assert.equal(ui.timers.length, 0);
  const beforeClose = JSON.stringify(core(ctx.read()));
  for (let i = 0; i < 3; i++) {
    assert.equal(ctx.read().isServiceUsageModalOpen, true);
    const statuses = elements(ui.render()).filter(n => n.props.role === 'status');
    assert.equal(statuses.length, 1);
    assert.match(text(statuses[0]), /目前剩餘：7/);
    assert.equal(elements(ui.render()).some(n => n.type === 'form'), false);
  }
  ui.find(n => n.type === 'button' && text(n) === '完成並關閉').props.onClick();
  assert.equal(ctx.read().isServiceUsageModalOpen, false);
  assert.equal(JSON.stringify(core(ctx.read())), beforeClose);
  ctx.read().setIsServiceUsageModalOpen(true);
  assert.ok(ui.find(n => n.type === 'form'));
  assert.equal(elements(ui.render()).some(n => n.props.role === 'status'), false);
  assert.equal(JSON.stringify(core(ctx.read())), beforeClose);
});
