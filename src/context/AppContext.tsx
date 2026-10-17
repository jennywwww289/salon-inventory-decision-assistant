import React, { createContext, useContext, useState, useMemo, useRef, ReactNode } from 'react';
import { 
  User, Brand, Supplier, Product, InventoryTransaction, 
  PurchaseOrder, PurchaseOrderItem, AIInsight, NotificationAlert, 
  POStatus
} from '../types';
import { 
  INITIAL_USERS, INITIAL_BRANDS, INITIAL_SUPPLIERS, 
  INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_PURCHASE_ORDERS, 
  INITIAL_AI_INSIGHTS, INITIAL_NOTIFICATIONS 
} from '../data/mockData';
import {
  validateProduct, validateSupplier, validatePurchaseInput, validationFailure,
  type ProductInput, type PurchaseInput, type MovementInput, type ValidationResult,
} from '../utils/validation';

import { applyInventoryMovement, nextTransactionId, type InventoryState } from '../utils/inventoryMovement';
import { summarizeInventory, selectInventoryAlerts, withInventoryStatus, summarizeMovements, calculateInventoryStatus } from '../utils/inventoryCalculations';
import { transitionPurchaseOrder, PO_STATUS_LABELS } from '../utils/purchaseOrder';
import { createDemoData, getBrowserStorage, loadCoreData, saveCoreData, nextEntityId, SAVE_FAILURE, type CoreData, type StorageStatus } from '../utils/localData';

interface AppContextType {
  storageStatus: StorageStatus;
  resetDemoData: () => void;
  dataRevision: number;
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
  recordTransaction: (params: MovementInput) => ValidationResult<InventoryTransaction>;
  
  createPurchaseOrder: (params: PurchaseInput) => ValidationResult<PurchaseOrder>;

  updatePOStatus: (poId: string, newStatus: POStatus) => ValidationResult<PurchaseOrder>;

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
  addProduct: (product: ProductInput) => ValidationResult<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => ValidationResult<Product>;
  
  addBrand: (brand: Omit<Brand, 'id'>) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;

  addSupplier: (supplier: Omit<Supplier, 'id'>) => ValidationResult<Supplier>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => ValidationResult<Supplier>;

  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendMockNotification: (channel: 'LINE' | 'Email', title: string, message: string) => void;
  
  inventoryAlerts: Product[];
  movementSummary: ReturnType<typeof summarizeMovements>;

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
  const demo = () => createDemoData({
    products: INITIAL_PRODUCTS, transactions: INITIAL_TRANSACTIONS, purchaseOrders: INITIAL_PURCHASE_ORDERS,
    brands: INITIAL_BRANDS, suppliers: INITIAL_SUPPLIERS, users: INITIAL_USERS,
  });
  // Read/validate once before either state or the synchronous command cursor exists.
  // Initialization never writes: a valid or damaged prior snapshot cannot be overwritten.
  const [initial] = useState(() => loadCoreData(getBrowserStorage(), demo));
  // One snapshot publishes stock and ledger together. The ref is the synchronous write
  // cursor: callbacks from an older render still validate against the last applied write.
  const [inventory, setInventory] = useState<CoreData>(initial.data);
  const inventoryRef = useRef(inventory);
  const { products, transactions, purchaseOrders, brands, suppliers, users } = inventory;
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(initial.status);
  const savingBlocked = useRef(initial.blocked);
  const [currentUser, setCurrentUserState] = useState<User>(initial.data.users[0]);
  const currentUserRef = useRef(currentUser);
  const setCurrentUser = (user: User) => {
    const selected = inventoryRef.current.users.find(u => u.id === user.id);
    if (!selected) return;
    currentUserRef.current = selected;
    setCurrentUserState(selected);
  };
  const commitInventory = (next: CoreData, resetting = false) => {
    inventoryRef.current = next;
    setInventory(next);
    // Automatic save is synchronous after a successful common-state publication.
    // It never combines separate render snapshots or runs inside a state updater.
    if (savingBlocked.current) return;
    if (saveCoreData(getBrowserStorage(), next)) {
      setStorageStatus({ kind: 'saved', message: resetting ? '已重設示範資料，並保存本機核心快照。' : '核心資料已保存於此瀏覽器。' });
    } else {
      setStorageStatus({ kind: 'error', message: resetting
        ? `${SAVE_FAILURE}目前頁面已重設為示範資料，但本機快照未成功取代，重新整理可能讀回舊資料。`
        : `${SAVE_FAILURE}本次操作已在目前頁面完成，本機快照未成功更新。` });
    }
  };
  const [insights, setInsights] = useState<AIInsight[]>(() => JSON.parse(JSON.stringify(INITIAL_AI_INSIGHTS)));
  const [notifications, setNotifications] = useState<NotificationAlert[]>(() => JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)));

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isServiceUsageModalOpen, setIsServiceUsageModalOpen] = useState<boolean>(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState<boolean>(false);
  const [dataRevision, setDataRevision] = useState(0);

  const resetDemoData = () => {
    const fresh = demo();
    savingBlocked.current = false; // Only explicit user reset can unlock damaged storage.
    commitInventory(fresh, true);
    currentUserRef.current = fresh.users[0];
    setCurrentUserState(fresh.users[0]);
    setInsights(JSON.parse(JSON.stringify(INITIAL_AI_INSIGHTS)));
    setNotifications(JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)));
    setActiveTab('dashboard');
    setSelectedProductId(null);
    setIsServiceUsageModalOpen(false);
    setIsNotificationSettingsOpen(false);
    setDataRevision(value => value + 1); // Remount only system UI; Provider remains mounted.
  };

  // Metadata is created in the command handler, never inside a state updater.
  const movementMetadata = (state: InventoryState, actingUser: User, now: Date) => ({
    id: nextTransactionId(state.transactions, now.getTime()),
    timestamp: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    userId: actingUser.id, userName: actingUser.name,
  });

  const recordTransaction = (input: MovementInput): ValidationResult<InventoryTransaction> => {
    const previous = inventoryRef.current;
    const actingUser = previous.users.find(u => u.id === (input.userId || currentUserRef.current.id)) || previous.users[0];
    const result = applyInventoryMovement(previous, input, movementMetadata(previous, actingUser, new Date()));
    if (result.ok === false) return result;

    commitInventory(result.value.state);
    const transaction = result.value.transaction;
    const product = result.value.state.products.find(p => p.id === input.productId)!;
    const previousProduct = previous.products.find(p => p.id === input.productId)!;
    const previousStatus = calculateInventoryStatus(previousProduct.stock, previousProduct.reorderPoint, previousProduct.weeklyDemand);
    // Notifications occur only after the successful stock/ledger transition.
    if (product.status === 'Critical' || (product.status === 'Low' && previousStatus !== 'Low')) {
      const notif: NotificationAlert = {
        id: `notif-${transaction.id}`,
        timestamp: transaction.timestamp,
        level: product.status === 'Critical' ? 'urgent' : 'warning',
        title: `庫存提醒：${product.name} 剩餘 ${product.stock} ${product.spec}`,
        message: `異動人：${actingUser.name}；${input.type} ${input.quantity > 0 ? '+' : ''}${input.quantity}。請留意補貨需求。`,
        productId: product.id, isRead: false, channel: 'System',
      };
      setNotifications(prev => [notif, ...prev]);
    }
    return { ok: true, value: transaction };
  };

  // Purchase creation shares the same latest snapshot as stock movements.
  const createPurchaseOrder = (input: PurchaseInput): ValidationResult<PurchaseOrder> => {
    const previous = inventoryRef.current;
    const validation = validatePurchaseInput(input, previous.products, previous.suppliers);
    if (validation.ok === false) return validation;
    const supplier = previous.suppliers.find(s => s.id === validation.value.supplierId)!;
    const orderItems: PurchaseOrderItem[] = validation.value.items.map(item => {
      const product = previous.products.find(p => p.id === item.productId)!;
      return {
        ...item, productName: product.name, sku: product.sku,
        subtotal: item.quantity * item.unitCost, currentStock: product.stock,
      };
    });
    const now = new Date();
    const prefix = `po-${now.getTime()}`;
    let id = prefix;
    let sequence = 1;
    while (previous.purchaseOrders.some(po => po.id === id || po.poNumber === `PO-${now.getFullYear()}-${id.slice(3)}`)) {
      id = `${prefix}-${sequence++}`;
    }
    const newPO: PurchaseOrder = {
      id, poNumber: `PO-${now.getFullYear()}-${id.slice(3)}`,
      supplierId: supplier.id, supplierName: supplier.name, status: 'Draft',
      items: orderItems, totalAmount: orderItems.reduce((total, item) => total + item.subtotal, 0),
      createdBy: currentUserRef.current.id, createdByName: currentUserRef.current.name,
      createdAt: now.toISOString().split('T')[0],
      expectedDeliveryDate: validation.value.expectedDeliveryDate,
      notes: input.notes, isAiAssisted: input.isAiAssisted, aiRationale: input.aiRationale,
    };
    commitInventory({ ...previous, purchaseOrders: [newPO, ...previous.purchaseOrders] });
    const notif: NotificationAlert = {
      id: `notif-${newPO.id}-Draft`, timestamp: now.toLocaleString('zh-TW'),
      level: 'info', title: `【採購草稿已建立】${newPO.poNumber}`,
      message: `供應商：${newPO.supplierName}，${orderItems.length} 項商品，總金額 NT$ ${newPO.totalAmount.toLocaleString()}。`,
      isRead: false, channel: 'System',
    };
    setNotifications(prev => [notif, ...prev]);
    return { ok: true, value: newPO };
  };

  const updatePOStatus = (poId: string, target: POStatus): ValidationResult<PurchaseOrder> => {
    const previous = inventoryRef.current;
    const now = new Date();
    const metadata = movementMetadata(previous, currentUserRef.current, now);
    const result = transitionPurchaseOrder(previous, poId, target, previous.suppliers, {
      timestamp: metadata.timestamp, time: now.getTime(),
      userId: currentUserRef.current.id, userName: currentUserRef.current.name,
    });
    if (result.ok === false) return result;
    // Status, every product and every transaction are published by one setter.
    commitInventory({ ...previous, ...result.value.state });
    const po = result.value.purchaseOrder;
    const notif: NotificationAlert = {
      id: `notif-${po.id}-${po.status}`, timestamp: metadata.timestamp, level: 'info',
      title: `【採購狀態更新】${po.poNumber} ${PO_STATUS_LABELS[po.status]}`,
      message: po.status === 'Received'
        ? `已將 ${po.items.length} 項商品入庫，並同步寫入採購狀態及帳本。`
        : `採購單目前階段：${PO_STATUS_LABELS[po.status]}。`,
      isRead: false, channel: 'System',
    };
    setNotifications(prev => [notif, ...prev]);
    return { ok: true, value: po };
  };

  // Update a fixed demo insight locally; no model inference or external action.
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

  // Record demo feedback in memory only; never submit it to model training.
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
  const addProduct = (newProd: ProductInput): ValidationResult<Product> => {
    const previous = inventoryRef.current;
    const validation = validateProduct(newProd, previous.products, previous.brands, previous.suppliers);
    if (validation.ok === false) return validation;
    const id = nextEntityId('prod', previous.products, Date.now());
    const product: Product = withInventoryStatus({
      lastMovementDate: new Date().toISOString().split('T')[0],
      ...validation.value,
      id
    });
    commitInventory({ ...previous, products: [product, ...previous.products] });
    return { ok: true, value: product };
  };

  const updateProduct = (id: string, updates: Partial<Product>): ValidationResult<Product> => {
    const previous = inventoryRef.current;
    const current = previous.products.find(p => p.id === id);
    if (!current) return validationFailure('id', '要更新的商品不存在。');
    const validation = validateProduct({ ...current, ...updates }, previous.products, previous.brands, previous.suppliers, id);
    if (validation.ok === false) return validation;
    if (validation.value.stock !== current.stock) {
      return validationFailure('stock', '請使用盤點調整登記庫存，系統才能同步寫入帳本。');
    }
    const product = withInventoryStatus(validation.value);
    commitInventory({ ...previous, products: previous.products.map(p => p.id === id ? product : p) });
    return { ok: true, value: product };
  };

  // CRUD for Brands
  const addBrand = (newBrand: Omit<Brand, 'id'>) => {
    const previous = inventoryRef.current;
    const id = nextEntityId('b', previous.brands, Date.now());
    commitInventory({ ...previous, brands: [...previous.brands, { ...newBrand, id }] });
  };

  const updateBrand = (id: string, updates: Partial<Brand>) => {
    const previous = inventoryRef.current;
    commitInventory({ ...previous, brands: previous.brands.map(b => b.id === id ? { ...b, ...updates } : b) });
  };

  // CRUD for Suppliers
  const addSupplier = (newSup: Omit<Supplier, 'id'>): ValidationResult<Supplier> => {
    const validation = validateSupplier(newSup);
    if (validation.ok === false) return validation;
    const previous = inventoryRef.current;
    const id = nextEntityId('sup', previous.suppliers, Date.now());
    const supplier = { ...validation.value, id };
    commitInventory({ ...previous, suppliers: [...previous.suppliers, supplier] });
    return { ok: true, value: supplier };
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>): ValidationResult<Supplier> => {
    const previous = inventoryRef.current;
    const current = previous.suppliers.find(s => s.id === id);
    if (!current) return validationFailure('id', '要更新的供應商不存在。');
    const validation = validateSupplier({ ...current, ...updates });
    if (validation.ok === false) return validation;
    commitInventory({ ...previous, suppliers: previous.suppliers.map(s => s.id === id ? validation.value : s) });
    return validation;
  };

  // CRUD for Users
  const addUser = (newUser: Omit<User, 'id'>) => {
    const previous = inventoryRef.current;
    const id = nextEntityId('user', previous.users, Date.now());
    commitInventory({ ...previous, users: [...previous.users, { ...newUser, id }] });
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    const previous = inventoryRef.current;
    const updated = previous.users.map(u => u.id === id ? { ...u, ...updates } : u);
    commitInventory({ ...previous, users: updated });
    if (currentUserRef.current.id === id) {
      setCurrentUser(updated.find(u => u.id === id)!);
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
      title: `【${channel} 示範】${title}`,
      message: `${message}（示範，未實際發送。）`,
      isRead: false,
      channel
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Read-only derived values: always based on the same current products/ledger.
  const inventorySummary = useMemo(() => summarizeInventory(products), [products]);
  const inventoryAlerts = useMemo(() => selectInventoryAlerts(products), [products]);
  const movementSummary = useMemo(() => summarizeMovements(transactions), [transactions]);

  return (
    <AppContext.Provider value={{
      storageStatus,
      resetDemoData,
      dataRevision,
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
      inventorySummary,
      inventoryAlerts,
      movementSummary
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
