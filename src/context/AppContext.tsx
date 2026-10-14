import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { 
  User, Brand, Supplier, Product, InventoryTransaction, 
  PurchaseOrder, PurchaseOrderItem, AIInsight, NotificationAlert, 
  POStatus, TransactionType, InventoryStatus 
} from '../types';
import { 
  INITIAL_USERS, INITIAL_BRANDS, INITIAL_SUPPLIERS, 
  INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_PURCHASE_ORDERS, 
  INITIAL_AI_INSIGHTS, INITIAL_NOTIFICATIONS 
} from '../data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  brands: Brand[];
  suppliers: Supplier[];
  products: Product[];
  transactions: InventoryTransaction[];
  purchaseOrders: PurchaseOrder[];
  insights: AIInsight[];
  notifications: NotificationAlert[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  
  // Modals & Panels
  isServiceUsageModalOpen: boolean;
  setIsServiceUsageModalOpen: (open: boolean) => void;
  isNotificationSettingsOpen: boolean;
  setIsNotificationSettingsOpen: (open: boolean) => void;
  
  // Actions
  recordTransaction: (params: {
    productId: string;
    type: TransactionType;
    quantity: number; // positive for inbound, negative for outbound
    serviceType?: string;
    note?: string;
    userId?: string;
  }) => void;
  
  createPurchaseOrder: (params: {
    supplierId: string;
    items: { productId: string; quantity: number; unitCost: number }[];
    expectedDeliveryDate: string;
    notes?: string;
    isAiAssisted?: boolean;
    aiRationale?: string;
  }) => PurchaseOrder;

  updatePOStatus: (poId: string, newStatus: POStatus) => void;

  respondToInsight: (params: {
    insightId: string;
    action: 'Accept' | 'Modify' | 'Dismiss';
    adjustedQty?: number;
  }) => void;

  submitInsightFeedback: (params: {
    insightId: string;
    isHelpful: boolean;
    reason?: 'Too conservative' | 'Too aggressive' | 'Missing info' | 'Inaccurate data' | 'Other';
    comment?: string;
  }) => void;

  // CRUD
  addProduct: (product: Omit<Product, 'id' | 'lastMovementDate'> & { lastMovementDate?: string }) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  
  addBrand: (brand: Omit<Brand, 'id'>) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;

  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendMockNotification: (channel: 'LINE' | 'Email', title: string, message: string) => void;
  
  // Stats
  inventorySummary: {
    totalSkus: number;
    healthyCount: number;
    lowCount: number;
    criticalCount: number;
    overstockCount: number;
    incomingCount: number;
    totalStockUnits: number;
    totalInventoryCost: number;
    totalRetailValue: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(INITIAL_TRANSACTIONS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [insights, setInsights] = useState<AIInsight[]>(INITIAL_AI_INSIGHTS);
  const [notifications, setNotifications] = useState<NotificationAlert[]>(INITIAL_NOTIFICATIONS);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isServiceUsageModalOpen, setIsServiceUsageModalOpen] = useState<boolean>(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState<boolean>(false);

  // Helper to recompute a product's inventory status
  const calculateStatus = (stock: number, reorderPoint: number, weeklyDemand: number): InventoryStatus => {
    const coverageWeeks = weeklyDemand > 0 ? stock / weeklyDemand : 99;
    if (stock <= 0 || (stock < reorderPoint && coverageWeeks < 1.5)) {
      return 'Critical';
    }
    if (stock <= reorderPoint || coverageWeeks < 3) {
      return 'Low';
    }
    if (coverageWeeks > 16) {
      return 'Overstock';
    }
    return 'Healthy';
  };

  // Record an inventory movement (Service Usage, Staff Usage, Purchase, Adjustment, etc.)
  const recordTransaction = ({
    productId,
    type,
    quantity,
    serviceType,
    note,
    userId
  }: {
    productId: string;
    type: TransactionType;
    quantity: number;
    serviceType?: string;
    note?: string;
    userId?: string;
  }) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const actingUser = users.find(u => u.id === (userId || currentUser.id)) || currentUser;
    const newStock = Math.max(0, product.stock + quantity);
    const newStatus = calculateStatus(newStock, product.reorderPoint, product.weeklyDemand);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTx: InventoryTransaction = {
      id: `tx-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type,
      quantity,
      userId: actingUser.id,
      userName: actingUser.name,
      timestamp: dateStr,
      resultingStock: newStock,
      serviceType,
      note
    };

    // Update transactions ledger
    setTransactions(prev => [newTx, ...prev]);

    // Update product stock and status
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          stock: newStock,
          status: newStatus,
          lastMovementDate: dateStr.split(' ')[0],
          statusReason: newStock < p.reorderPoint ? `現有庫存 ${newStock} 低於補貨點 ${p.reorderPoint}` : undefined
        };
      }
      return p;
    }));

    // Trigger notification if critical or low
    if (newStatus === 'Critical' || (newStatus === 'Low' && product.status !== 'Low')) {
      const notif: NotificationAlert = {
        id: `notif-${Date.now()}`,
        timestamp: dateStr,
        level: newStatus === 'Critical' ? 'urgent' : 'warning',
        title: `【庫存預警】${product.name} 剩餘 ${newStock} ${product.spec}`,
        message: `經手人：${actingUser.name}（${type}：${quantity > 0 ? '+' : ''}${quantity}）。目前庫存低於安全水位，請注意補貨。`,
        productId: product.id,
        isRead: false,
        channel: 'LINE'
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Create a Purchase Order
  const createPurchaseOrder = ({
    supplierId,
    items,
    expectedDeliveryDate,
    notes,
    isAiAssisted,
    aiRationale
  }: {
    supplierId: string;
    items: { productId: string; quantity: number; unitCost: number }[];
    expectedDeliveryDate: string;
    notes?: string;
    isAiAssisted?: boolean;
    aiRationale?: string;
  }) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    const orderItems: PurchaseOrderItem[] = items.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return {
        productId: item.productId,
        productName: p ? p.name : '未知商品',
        sku: p ? p.sku : '',
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.quantity * item.unitCost,
        currentStock: p ? p.stock : 0
      };
    });

    const totalAmount = orderItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const poNum = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: poNum,
      supplierId,
      supplierName: supplier ? supplier.name : '供應商',
      status: 'Draft',
      items: orderItems,
      totalAmount,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString().split('T')[0],
      expectedDeliveryDate,
      notes,
      isAiAssisted,
      aiRationale
    };

    setPurchaseOrders(prev => [newPO, ...prev]);

    // Send notification
    const notif: NotificationAlert = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleString('zh-TW'),
      level: 'info',
      title: `【採購單建立】${poNum} 草稿已建立`,
      message: `供應商：${newPO.supplierName}，採購 ${orderItems.length} 項商品，總金額 NT$ ${totalAmount.toLocaleString()}。`,
      isRead: false,
      channel: 'System'
    };
    setNotifications(prev => [notif, ...prev]);

    return newPO;
  };

  // Update PO Status (Draft -> Approved -> Ordered -> Received)
  const updatePOStatus = (poId: string, newStatus: POStatus) => {
    const po = purchaseOrders.find(p => p.id === poId);
    if (!po) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // If marked as 'Received', automatically update stock for all items and create transactions!
    if (newStatus === 'Received' && po.status !== 'Received') {
      po.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const newStock = product.stock + item.quantity;
          const newStatus = calculateStatus(newStock, product.reorderPoint, product.weeklyDemand);

          // Update product stock
          setProducts(prev => prev.map(p => {
            if (p.id === item.productId) {
              return {
                ...p,
                stock: newStock,
                status: newStatus,
                incomingQty: Math.max(0, (p.incomingQty || 0) - item.quantity),
                lastMovementDate: dateStr.split(' ')[0]
              };
            }
            return p;
          }));

          // Add to inventory ledger
          const newTx: InventoryTransaction = {
            id: `tx-${Date.now()}-${item.productId}`,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            type: 'Purchase',
            quantity: item.quantity,
            userId: currentUser.id,
            userName: currentUser.name,
            timestamp: dateStr,
            resultingStock: newStock,
            note: `採購單 ${po.poNumber} 驗收入庫`
          };
          setTransactions(prev => [newTx, ...prev]);
        }
      });

      // Notification
      const notif: NotificationAlert = {
        id: `notif-${Date.now()}`,
        timestamp: dateStr,
        level: 'info',
        title: `【到貨入庫完成】${po.poNumber} 已點收增加庫存`,
        message: `已自動將 ${po.items.length} 項商品入庫，並於庫存帳本更新紀錄。`,
        isRead: false,
        channel: 'System'
      };
      setNotifications(prev => [notif, ...prev]);
    } else if (newStatus === 'Ordered' && po.status !== 'Ordered') {
      // Mark products incomingQty
      po.items.forEach(item => {
        setProducts(prev => prev.map(p => {
          if (p.id === item.productId) {
            return {
              ...p,
              incomingQty: (p.incomingQty || 0) + item.quantity
            };
          }
          return p;
        }));
      });

      // LINE alert simulation
      const notif: NotificationAlert = {
        id: `notif-${Date.now()}`,
        timestamp: dateStr,
        level: 'info',
        title: `【採購單已下單】${po.poNumber} 已向供應商發出`,
        message: `供應商 ${po.supplierName} 預計到貨日：${po.expectedDeliveryDate}。`,
        isRead: false,
        channel: 'LINE'
      };
      setNotifications(prev => [notif, ...prev]);
    }

    setPurchaseOrders(prev => prev.map(p => {
      if (p.id === poId) {
        return {
          ...p,
          status: newStatus,
          receivedAt: newStatus === 'Received' ? dateStr : p.receivedAt
        };
      }
      return p;
    }));
  };

  // Respond to AI insight (Human-in-the-loop: Accept, Modify, Dismiss)
  const respondToInsight = ({
    insightId,
    action,
    adjustedQty
  }: {
    insightId: string;
    action: 'Accept' | 'Modify' | 'Dismiss';
    adjustedQty?: number;
  }) => {
    setInsights(prev => prev.map(ins => {
      if (ins.id === insightId) {
        return {
          ...ins,
          status: action === 'Accept' ? 'Accepted' : action === 'Modify' ? 'Modified' : 'Dismissed',
          suggestedQty: adjustedQty !== undefined ? adjustedQty : ins.suggestedQty
        };
      }
      return ins;
    }));
  };

  // Submit human feedback for AI insight
  const submitInsightFeedback = ({
    insightId,
    isHelpful,
    reason,
    comment
  }: {
    insightId: string;
    isHelpful: boolean;
    reason?: 'Too conservative' | 'Too aggressive' | 'Missing info' | 'Inaccurate data' | 'Other';
    comment?: string;
  }) => {
    setInsights(prev => prev.map(ins => {
      if (ins.id === insightId) {
        return {
          ...ins,
          feedback: {
            isHelpful,
            reason,
            comment,
            timestamp: new Date().toLocaleString('zh-TW')
          }
        };
      }
      return ins;
    }));
  };

  // CRUD for Products
  const addProduct = (newProd: Omit<Product, 'id' | 'lastMovementDate'> & { lastMovementDate?: string }) => {
    const id = `prod-${Date.now()}`;
    const product: Product = {
      lastMovementDate: new Date().toISOString().split('T')[0],
      ...newProd,
      id
    };
    setProducts(prev => [product, ...prev]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // CRUD for Brands
  const addBrand = (newBrand: Omit<Brand, 'id'>) => {
    const id = `b-${Date.now()}`;
    setBrands(prev => [...prev, { ...newBrand, id }]);
  };

  const updateBrand = (id: string, updates: Partial<Brand>) => {
    setBrands(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // CRUD for Suppliers
  const addSupplier = (newSup: Omit<Supplier, 'id'>) => {
    const id = `sup-${Date.now()}`;
    setSuppliers(prev => [...prev, { ...newSup, id }]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // CRUD for Users
  const addUser = (newUser: Omit<User, 'id'>) => {
    const id = `user-${Date.now()}`;
    setUsers(prev => [...prev, { ...newUser, id }]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const sendMockNotification = (channel: 'LINE' | 'Email', title: string, message: string) => {
    const newNotif: NotificationAlert = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
      level: 'urgent',
      title,
      message,
      isRead: false,
      channel
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Inventory Summary Metrics
  const inventorySummary = useMemo(() => {
    let healthyCount = 0;
    let lowCount = 0;
    let criticalCount = 0;
    let overstockCount = 0;
    let incomingCount = 0;
    let totalStockUnits = 0;
    let totalInventoryCost = 0;
    let totalRetailValue = 0;

    products.forEach(p => {
      totalStockUnits += p.stock;
      totalInventoryCost += p.stock * p.unitCost;
      totalRetailValue += p.stock * p.sellingPrice;

      if (p.incomingQty && p.incomingQty > 0) {
        incomingCount += p.incomingQty;
      }

      switch (p.status) {
        case 'Critical':
          criticalCount++;
          break;
        case 'Low':
          lowCount++;
          break;
        case 'Overstock':
          overstockCount++;
          break;
        case 'Healthy':
        default:
          healthyCount++;
          break;
      }
    });

    return {
      totalSkus: products.length,
      healthyCount,
      lowCount,
      criticalCount,
      overstockCount,
      incomingCount,
      totalStockUnits,
      totalInventoryCost,
      totalRetailValue
    };
  }, [products]);

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      users,
      brands,
      suppliers,
      products,
      transactions,
      purchaseOrders,
      insights,
      notifications,
      activeTab,
      setActiveTab,
      selectedProductId,
      setSelectedProductId,
      isServiceUsageModalOpen,
      setIsServiceUsageModalOpen,
      isNotificationSettingsOpen,
      setIsNotificationSettingsOpen,
      recordTransaction,
      createPurchaseOrder,
      updatePOStatus,
      respondToInsight,
      submitInsightFeedback,
      addProduct,
      updateProduct,
      addBrand,
      updateBrand,
      addSupplier,
      updateSupplier,
      addUser,
      updateUser,
      markNotificationRead,
      markAllNotificationsRead,
      sendMockNotification,
      inventorySummary
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
