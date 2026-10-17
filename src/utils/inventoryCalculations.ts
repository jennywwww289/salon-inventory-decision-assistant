import type { InventoryStatus, InventoryTransaction, Product } from '../types';

// Existing movement rules are authoritative; seed labels and display colors are not rules.
export function calculateInventoryStatus(stock: number, reorderPoint: number, weeklyDemand: number): InventoryStatus {
  const coverageWeeks = weeklyDemand > 0 ? stock / weeklyDemand : 99;
  if (stock <= 0 || (stock < reorderPoint && coverageWeeks < 1.5)) return 'Critical';
  if (stock <= reorderPoint || coverageWeeks < 3) return 'Low';
  if (coverageWeeks > 16) return 'Overstock';
  return 'Healthy';
}

export function withInventoryStatus(product: Product): Product {
  const status = calculateInventoryStatus(product.stock, product.reorderPoint, product.weeklyDemand);
  const statusReason = status === 'Critical' || status === 'Low'
    ? `現有庫存 ${product.stock}，補貨點 ${product.reorderPoint}，週需求 ${product.weeklyDemand}；依共用規則判定。`
    : undefined;
  return status === product.status && statusReason === product.statusReason
    ? product : { ...product, status, statusReason };
}

export function coverage(stock: number, demand: number): number | null {
  if (demand <= 0 || !Number.isFinite(demand)) return null;
  const value = stock / demand;
  return Number.isFinite(value) ? value : null;
}

export function formatCoverage(stock: number, demand: number, unit: string, multiplier = 1): string {
  if (demand === 0) return '無需求，無法估算';
  const value = coverage(stock, demand);
  return value !== null && Number.isFinite(value * multiplier)
    ? `${(value * multiplier).toFixed(1)} ${unit}` : '無法估算';
}

export const formatNumber = (value: number): string => Number.isFinite(value) ? value.toLocaleString() : '無法計算';

export function formatGrossMargin(unitCost: number, sellingPrice: number): string {
  if (sellingPrice <= 0) return '無法計算';
  const value = (sellingPrice - unitCost) / sellingPrice * 100;
  return Number.isFinite(value) ? `${Math.round(value)}%` : '無法計算';
}

export function summarizeInventory(products: Product[]) {
  const result = {
    totalSkus: products.length, healthyCount: 0, lowCount: 0, criticalCount: 0, overstockCount: 0,
    incomingCount: 0, totalStockUnits: 0, totalInventoryCost: 0, totalRetailValue: 0,
  };
  for (const p of products) {
    result.totalStockUnits += p.stock;
    result.totalInventoryCost += p.stock * p.unitCost;
    result.totalRetailValue += p.stock * p.sellingPrice;
    result.incomingCount += p.incomingQty ?? 0;
    const status = calculateInventoryStatus(p.stock, p.reorderPoint, p.weeklyDemand);
    if (status === 'Critical') result.criticalCount++;
    else if (status === 'Low') result.lowCount++;
    else if (status === 'Overstock') result.overstockCount++;
    else result.healthyCount++;
  }
  return result;
}

export function selectInventoryAlerts(products: Product[]): Product[] {
  return products.map(withInventoryStatus).filter(p => p.status === 'Critical' || p.status === 'Low');
}

function transactionTime(timestamp: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.exec(timestamp);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(value => Number(value ?? 0));
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day
    || hour > 23 || minute > 59 || second > 59) return null;
  const time = Date.parse(timestamp.replace(' ', 'T'));
  return Number.isFinite(time) ? time : null;
}

// Newest valid timestamps first; invalid dates last; ties retain original order.
export function sortTransactions(transactions: InventoryTransaction[]): InventoryTransaction[] {
  return transactions.map((transaction, index) => ({ transaction, index, time: transactionTime(transaction.timestamp) }))
    .sort((a, b) => a.time === null ? b.time === null ? a.index - b.index : 1
      : b.time === null ? -1 : b.time - a.time || a.index - b.index)
    .map(item => item.transaction);
}

export function summarizeMovements(transactions: InventoryTransaction[]) {
  const result = { purchaseIn: 0, customerReturnIn: 0, supplierReturnOut: 0, usageOut: 0, saleOut: 0, lossOut: 0, adjustmentIn: 0, adjustmentOut: 0 };
  for (const tx of transactions) {
    const q = tx.quantity;
    if (!Number.isFinite(q)) continue;
    if (tx.type === 'Purchase' && q > 0) result.purchaseIn += q;
    else if (tx.type === 'Return' && tx.returnDirection === 'From Customer' && q > 0) result.customerReturnIn += q;
    else if (tx.type === 'Return' && tx.returnDirection === 'To Supplier' && q < 0) result.supplierReturnOut -= q;
    else if ((tx.type === 'Service Usage' || tx.type === 'Staff Usage') && q < 0) result.usageOut -= q;
    else if (tx.type === 'Sale' && q < 0) result.saleOut -= q;
    else if (tx.type === 'Damage / Loss' && q < 0) result.lossOut -= q;
    else if (tx.type === 'Inventory Adjustment' && q > 0) result.adjustmentIn += q;
    else if (tx.type === 'Inventory Adjustment' && q < 0) result.adjustmentOut -= q;
  }
  return result;
}
