export type Role = 'Owner' | 'Manager' | 'Staff';

export type InventoryStatus = 'Healthy' | 'Low' | 'Critical' | 'Overstock';

export type TransactionType = 
  | 'Purchase'            // 採購入庫
  | 'Service Usage'       // 服務耗用 (沙龍療程使用)
  | 'Staff Usage'         // 員工使用 / 內部測試
  | 'Sale'                // 門市銷售
  | 'Inventory Adjustment'// 盤點調整
  | 'Damage / Loss'       // 損耗 / 瑕疵報廢
  | 'Return';             // 退貨處理

export type POStatus = 'Draft' | 'Approved' | 'Ordered' | 'Received' | 'Cancelled';

export type InsightType = 'Stockout' | 'Overstock' | 'DemandForecast' | 'Promotion';
export type InsightSeverity = 'Critical' | 'Watch' | 'Opportunity';

export interface User {
  id: string;
  name: string;
  role: Role;
  title: string;
  avatar: string;
  status: 'Active' | 'Inactive';
  phone?: string;
}

export interface Brand {
  id: string;
  name: string;
  origin: string;
  category: string;
  status: 'Active' | 'Inactive';
  description?: string;
}

export interface SupplierPromotion {
  id: string;
  title: string;
  brandName: string;
  discountRate: number; // e.g. 0.08 for 8% off
  minOrderQty: number;
  startDate: string;
  endDate: string;
  description: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  moq: number;               // 最小起訂量
  defaultLeadTime: number;   // 預設到貨前置天數
  paymentTerms: string;      // 付款條件 (e.g., 月結 Net 30, 貨到付款 COD)
  suppliedBrandIds: string[];
  status: 'Active' | 'Inactive';
  promotions?: SupplierPromotion[];
  notes?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  spec: string;              // 容量規格 e.g., 250ml, 1000ml, 100ml
  brandId: string;
  brandName: string;
  category: '洗髮淨化' | '頭皮理療' | '深層護髮' | '造型養護' | '沙龍專業安瓶' | '居家養護組';
  unitCost: number;          // 進貨成本 (NT$)
  sellingPrice: number;      // 門市建議售價 (NT$)
  stock: number;             // 目前庫存數量
  reorderPoint: number;      // 安全補貨點
  moq: number;               // 供應商最小起訂量
  leadTime: number;          // 供應商交期 (天)
  supplierId: string;
  supplierName: string;
  weeklyDemand: number;      // 平均每週需求量 (瓶/入)
  monthlyDemand: number;     // 平均每月需求量
  status: InventoryStatus;
  incomingQty?: number;      // 已下單在途中數量
  lastMovementDate: string;  // 最近異動日期
  statusReason?: string;     // 狀態診斷簡述
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: TransactionType;
  quantity: number;          // 正數入庫，負數出庫
  userId: string;
  userName: string;
  timestamp: string;
  resultingStock: number;
  serviceType?: string;      // 若為服務使用：填入療程名稱
  note?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  currentStock: number;
  suggestedQty?: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expectedDeliveryDate: string;
  receivedAt?: string;
  notes?: string;
  isAiAssisted?: boolean;
  aiRationale?: string;
}

export interface AIInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  productId?: string;
  productName?: string;
  brandName?: string;
  title: string;
  explanation: string;       // Why did it happen?
  evidenceMetrics: {
    label: string;
    value: string;
  }[];
  forecast: string;          // What might happen?
  recommendation: string;    // What can I do?
  suggestedQty?: number;
  unitCost?: number;
  potentialImpact: string;
  status: 'Pending' | 'Accepted' | 'Modified' | 'Dismissed';
  createdAt: string;
  feedback?: {
    isHelpful: boolean;
    reason?: 'Too conservative' | 'Too aggressive' | 'Missing info' | 'Inaccurate data' | 'Other';
    comment?: string;
    timestamp: string;
  };
}

export interface NotificationAlert {
  id: string;
  timestamp: string;
  level: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  productId?: string;
  isRead: boolean;
  channel: 'LINE' | 'Email' | 'System';
}
