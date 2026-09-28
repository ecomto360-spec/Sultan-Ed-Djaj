import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Product,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  StoreSettings,
  UserRole,
  Language,
  BackOfficeTab,
  StockItem,
  ProductComposition,
  StockMovement,
  StockMovementType,
  Expense,
  CashClosing,
  InventoryDiscrepancy,
  SupplierPurchaseGroup,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
  INITIAL_STOCK_ITEMS,
  INITIAL_COMPOSITIONS,
  generateHistoricalData,
} from '../data/seedData';
import { soundService } from '../services/sound';
import { getActiveStockAlerts, getAvailablePortions } from '../services/stockService';

interface AppContextType {
  view: 'client' | 'commercial';
  setView: (v: 'client' | 'commercial') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Data
  products: Product[];
  customers: Customer[];
  orders: Order[];
  settings: StoreSettings;
  isStoreActuallyOpen: boolean;

  // Stock Data & Actions
  stockItems: StockItem[];
  compositions: ProductComposition[];
  stockMovements: StockMovement[];
  activeStockAlertsCount: number;
  addStockItem: (item: Omit<StockItem, 'id'>) => void;
  updateStockItem: (id: string, updates: Partial<StockItem>) => void;
  deleteStockItem: (id: string) => void;
  updateComposition: (productId: string, ingredients: { stockItemId: string; quantity: number }[]) => void;
  addStockMovement: (params: {
    stockItemId: string;
    type: StockMovementType;
    quantity: number;
    reason: string;
    authorRole: UserRole;
    authorName?: string;
    orderId?: string;
  }) => void;
  quickRestock: (stockItemId: string, quantity: number, reason?: string) => void;
  declareWasteLoss: (stockItemId: string, quantity: number, reason: string) => void;
  reportLowStock: (stockItemId: string) => void;
  applyInventoryDiscrepancies: (discrepancies: InventoryDiscrepancy[], authorRole: UserRole) => void;
  receivePurchaseGroup: (group: SupplierPurchaseGroup) => void;

  // Recettes & Financial Data
  expenses: Expense[];
  cashClosings: CashClosing[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  closeCashRegister: (data: { date: string; countedCash: number; note?: string }) => CashClosing;

  // Manager PIN Security for Recettes
  isRevenueUnlocked: boolean;
  unlockRevenue: (pin: string) => boolean;
  lockRevenue: () => void;

  // Client Session & Cart
  currentCustomer: Customer | null;
  setCurrentCustomer: (c: Customer | null) => void;
  cart: OrderItem[];
  addToCart: (product: Product, quantity: number, notes?: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemsCount: number;

  // Active Order & Navigation
  clientTab: 'menu' | 'cart' | 'tracking' | 'profile';
  setClientTab: (tab: 'menu' | 'cart' | 'tracking' | 'profile') => void;
  clientActiveOrder: Order | null;
  setClientActiveOrder: (ord: Order | null) => void;
  clientSimulatorMode: 'frame' | 'fluid';
  setClientSimulatorMode: (mode: 'frame' | 'fluid') => void;

  // Commercial state & Navigation
  backOfficeTab: BackOfficeTab;
  setBackOfficeTab: (tab: BackOfficeTab) => void;
  backOfficeOrdersView: 'kanban' | 'table';
  setBackOfficeOrdersView: (v: 'kanban' | 'table') => void;
  unreadAlertCount: number;
  clearNewOrderAlert: (orderId: string) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;

  // Cancellation modal prompt state
  cancelModalOrder: Order | null;
  setCancelModalOrder: (order: Order | null) => void;

  // Daily Chicken Quota & Live Countdown
  dailyChickenQuota: number;
  dailyChickenInitial: number;
  dailyChickenRemaining: number;
  dailyChickenSold: number;
  setDailyChickenQuota: (quota: number) => void;
  setTodayChickenCount: (count: number, mode: 'set_initial' | 'set_remaining' | 'add') => void;
  resetTodayChickenBatch: (newTotal?: number) => void;

  // Actions
  placeOrder: (params: {
    type: OrderType;
    deliveryAddress?: {
      wilaya: string;
      commune: string;
      address: string;
      landmark?: string;
      mapUrl?: string;
      latitude?: number;
      longitude?: number;
    };
    pickupTimeSlot?: string;
    kitchenNotes?: string;
  }) => Order | null;
  addManualOrder: (params: {
    customerName: string;
    customerPhone: string;
    type: OrderType;
    items: OrderItem[];
    deliveryAddress?: {
      wilaya: string;
      commune: string;
      address: string;
      landmark?: string;
      mapUrl?: string;
      latitude?: number;
      longitude?: number;
    };
    pickupTimeSlot?: string;
    kitchenNotes?: string;
  }) => Order;
  advanceOrderStatus: (orderId: string, nextStatus: OrderStatus, note?: string) => void;
  updateOrderStatus: (orderId: string, nextStatus: OrderStatus, note?: string) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  cancelOrderWithStockChoice: (
    orderId: string,
    reason: string,
    stockAction: 'return' | 'loss' | 'none'
  ) => void;

  // Catalog actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;

  // Settings & Storage actions
  updateSettings: (updates: Partial<StoreSettings>) => void;
  resetAllSeedData: () => void;
  resetToSeedData: () => void;
  reorderPastOrder: (order: Order) => void;
  registerOrLoginCustomer: (data: {
    name: string;
    phone: string;
    commune: string;
    address: string;
    landmark?: string;
    mapUrl?: string;
    latitude?: number;
    longitude?: number;
  }) => Customer;
  logoutCustomer: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SCHEMA_VERSION = 2;
const SCHEMA_KEY = 'sultan_schema_version';

const STORAGE_KEYS = {
  PRODUCTS: 'sultan_products_v2',
  CUSTOMERS: 'sultan_customers_v2',
  ORDERS: 'sultan_orders_v2',
  SETTINGS: 'sultan_settings_v2',
  CURRENT_CUSTOMER: 'sultan_customer_session_v2',
  CART: 'sultan_cart_v2',
  LANG: 'sultan_lang_v2',
  VIEW: 'sultan_view_v2',
  ROLE: 'sultan_role_v2',
  STOCK_ITEMS: 'sultan_stock_items_v2',
  COMPOSITIONS: 'sultan_compositions_v2',
  STOCK_MOVEMENTS: 'sultan_stock_movements_v2',
  EXPENSES: 'sultan_expenses_v2',
  CASH_CLOSINGS: 'sultan_cash_closings_v2',
};

// Initial run migration from v1 -> v2
function migrateStorageIfNeeded() {
  try {
    const currentVersion = parseInt(localStorage.getItem(SCHEMA_KEY) || '0', 10);
    if (currentVersion < SCHEMA_VERSION) {
      // Migrate Products
      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        const v1Products = localStorage.getItem('sultan_products_v1');
        localStorage.setItem(
          STORAGE_KEYS.PRODUCTS,
          v1Products || JSON.stringify(INITIAL_PRODUCTS)
        );
      }

      // Migrate Customers
      if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
        const v1Cust = localStorage.getItem('sultan_customers_v1');
        localStorage.setItem(
          STORAGE_KEYS.CUSTOMERS,
          v1Cust || JSON.stringify(INITIAL_CUSTOMERS)
        );
      }

      // Migrate Orders: keep v1 and merge with deterministic 60-day history if orders count is low
      const generated = generateHistoricalData();
      if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        const v1OrdersRaw = localStorage.getItem('sultan_orders_v1');
        if (v1OrdersRaw) {
          try {
            const v1Parsed: Order[] = JSON.parse(v1OrdersRaw);
            // Append generated historical orders that aren't already present
            const v1Ids = new Set(v1Parsed.map(o => o.id));
            const combined = [
              ...v1Parsed,
              ...generated.orders.filter(o => !v1Ids.has(o.id)),
            ];
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(combined));
          } catch {
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(generated.orders));
          }
        } else {
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(generated.orders));
        }
      }

      // Migrate Settings
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        const v1SettingsRaw = localStorage.getItem('sultan_settings_v1');
        if (v1SettingsRaw) {
          try {
            const v1Parsed = JSON.parse(v1SettingsRaw);
            localStorage.setItem(
              STORAGE_KEYS.SETTINGS,
              JSON.stringify({ ...INITIAL_SETTINGS, ...v1Parsed })
            );
          } catch {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
          }
        } else {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
        }
      }

      // Seed Stock items
      if (!localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS)) {
        localStorage.setItem(
          STORAGE_KEYS.STOCK_ITEMS,
          JSON.stringify(INITIAL_STOCK_ITEMS)
        );
      }

      // Seed Compositions
      if (!localStorage.getItem(STORAGE_KEYS.COMPOSITIONS)) {
        localStorage.setItem(
          STORAGE_KEYS.COMPOSITIONS,
          JSON.stringify(INITIAL_COMPOSITIONS)
        );
      }

      // Seed Stock movements
      if (!localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS)) {
        localStorage.setItem(
          STORAGE_KEYS.STOCK_MOVEMENTS,
          JSON.stringify(generated.stockMovements)
        );
      }

      // Seed Expenses
      if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
        localStorage.setItem(
          STORAGE_KEYS.EXPENSES,
          JSON.stringify(generated.expenses)
        );
      }

      // Seed Cash closings
      if (!localStorage.getItem(STORAGE_KEYS.CASH_CLOSINGS)) {
        localStorage.setItem(
          STORAGE_KEYS.CASH_CLOSINGS,
          JSON.stringify(generated.cashClosings)
        );
      }

      localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
    }
  } catch (err) {
    console.warn('Storage migration notice:', err);
  }
}

// Execute migration
migrateStorageIfNeeded();

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & Preferences
  const [view, setView] = useState<'client' | 'commercial'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.VIEW) as 'client' | 'commercial') || 'client';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || 'fr';
  });

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || 'gerant';
  });

  // Client tabs & simulator mode
  const [clientTab, setClientTab] = useState<'menu' | 'cart' | 'tracking' | 'profile'>('menu');
  const [clientSimulatorMode, setClientSimulatorMode] = useState<'frame' | 'fluid'>('frame');
  const [backOfficeTab, setBackOfficeTabState] = useState<BackOfficeTab>('orders');
  const [backOfficeOrdersView, setBackOfficeOrdersView] = useState<'kanban' | 'table'>('kanban');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  // Cancel order with stock choice modal
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

  // Manager PIN unlock state (locked by default on session start / reload)
  const [isRevenueUnlocked, setIsRevenueUnlocked] = useState<boolean>(false);

  // Core Data
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
    } catch {
      return INITIAL_STOCK_ITEMS;
    }
  });

  const [compositions, setCompositions] = useState<ProductComposition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPOSITIONS);
      return saved ? JSON.parse(saved) : INITIAL_COMPOSITIONS;
    } catch {
      return INITIAL_COMPOSITIONS;
    }
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cashClosings, setCashClosings] = useState<CashClosing[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASH_CLOSINGS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_CUSTOMER);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS[0];
    } catch {
      return INITIAL_CUSTOMERS[0];
    }
  });

  const [cart, setCart] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [clientActiveOrderId, setClientActiveOrderId] = useState<string | null>(() => {
    const active = orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled');
    return active ? active.id : null;
  });

  // Calculate actual store openness: 24h / 24h (7j/7) or manual override
  const isStoreActuallyOpen = useMemo(() => {
    if (settings.manualOverride) {
      return settings.isOpen;
    }
    // Default 24h / 24h open
    return true;
  }, [settings.manualOverride, settings.isOpen]);

  // Active stock alerts count
  const activeStockAlertsCount = useMemo(() => {
    return getActiveStockAlerts(stockItems).length;
  }, [stockItems]);

  // ══════════════════════════════════════════════════
  // DAILY CHICKEN QUOTA & LIVE REMAINING COUNTDOWN
  // ══════════════════════════════════════════════════
  const dailyChickenQuota = settings.dailyChickenQuota || 100;
  const dailyChickenInitial = settings.dailyChickenInitial ?? dailyChickenQuota;

  // Calculate chickens ordered / sold today (from non-cancelled orders today)
  const dailyChickenSold = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(
      o => o.createdAt.startsWith(today) && o.status !== 'cancelled'
    );
    let count = 0;
    todayOrders.forEach(o => {
      o.items.forEach(it => {
        if (it.productId === 'prod-1' || it.productId === 'prod-2') {
          count += it.quantity;
        } else {
          const comp = compositions.find(c => c.productId === it.productId);
          const chickenIng = comp?.ingredients.find(ing => ing.stockItemId === 'stock-1');
          if (chickenIng) {
            count += chickenIng.quantity * it.quantity;
          }
        }
      });
    });
    return Math.round(count * 10) / 10;
  }, [orders, compositions]);

  // Total chicken waste declared today
  const dailyChickenWasted = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayWastes = stockMovements.filter(
      m => m.stockItemId === 'stock-1' && m.type === 'waste' && m.timestamp.startsWith(today)
    );
    return todayWastes.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
  }, [stockMovements]);

  // Live remaining chicken count
  const dailyChickenRemaining = Math.max(
    0,
    Math.round((dailyChickenInitial - dailyChickenSold - dailyChickenWasted) * 10) / 10
  );

  // Automatic Daily Reset: whenever the calendar day changes, reset quota to dailyChickenQuota
  useEffect(() => {
    const checkDateRollover = () => {
      const today = new Date().toISOString().split('T')[0];
      if (settings.dailyChickenDate && settings.dailyChickenDate !== today) {
        const defaultQuota = settings.dailyChickenQuota || 100;
        setSettings(prev => ({
          ...prev,
          dailyChickenDate: today,
          dailyChickenInitial: defaultQuota,
        }));
        setStockItems(prev =>
          prev.map(s =>
            s.id === 'stock-1'
              ? { ...s, currentStock: defaultQuota, lastRestockedAt: new Date().toISOString() }
              : s
          )
        );
      }
    };

    checkDateRollover();
    const timer = setInterval(checkDateRollover, 60000);
    return () => clearInterval(timer);
  }, [settings.dailyChickenDate, settings.dailyChickenQuota]);

  // Synchronize stock-1 (Poulet entier) currentStock with dailyChickenRemaining
  useEffect(() => {
    setStockItems(prev => {
      const chickenItem = prev.find(s => s.id === 'stock-1');
      if (chickenItem && Math.abs(chickenItem.currentStock - dailyChickenRemaining) > 0.01) {
        return prev.map(s => (s.id === 'stock-1' ? { ...s, currentStock: dailyChickenRemaining } : s));
      }
      return prev;
    });
  }, [dailyChickenRemaining]);

  // Helper actions for daily chicken quota
  const setDailyChickenQuota = (quota: number) => {
    const valid = Math.max(0, Math.round(quota));
    setSettings(prev => ({
      ...prev,
      dailyChickenQuota: valid,
    }));
  };

  const setTodayChickenCount = (
    count: number,
    mode: 'set_initial' | 'set_remaining' | 'add'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const val = Math.max(0, Math.round(count));

    if (mode === 'set_initial') {
      setSettings(prev => ({
        ...prev,
        dailyChickenDate: today,
        dailyChickenInitial: val,
      }));
    } else if (mode === 'set_remaining') {
      const newInitial = val + dailyChickenSold + dailyChickenWasted;
      setSettings(prev => ({
        ...prev,
        dailyChickenDate: today,
        dailyChickenInitial: newInitial,
      }));
    } else if (mode === 'add') {
      const currentInit = settings.dailyChickenInitial ?? (settings.dailyChickenQuota || 100);
      const newInitial = currentInit + val;
      setSettings(prev => ({
        ...prev,
        dailyChickenDate: today,
        dailyChickenInitial: newInitial,
      }));

      // Log stock movement
      const nowIso = new Date().toISOString();
      setStockMovements(prev => [
        {
          id: `mov-${Date.now()}`,
          timestamp: nowIso,
          stockItemId: 'stock-1',
          stockItemName: 'Poulet entier frais',
          type: 'in',
          quantity: val,
          balanceAfter: dailyChickenRemaining + val,
          authorRole: userRole,
          reason: `Arrivage complémentaire en cours de service (+${val} poulets)`,
          unitCostDA: 520,
        },
        ...prev,
      ]);
    }
  };

  const resetTodayChickenBatch = (newTotal?: number) => {
    const today = new Date().toISOString().split('T')[0];
    const target = newTotal !== undefined ? Math.max(0, Math.round(newTotal)) : settings.dailyChickenQuota || 100;
    setSettings(prev => ({
      ...prev,
      dailyChickenDate: today,
      dailyChickenInitial: target,
    }));
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPOSITIONS, JSON.stringify(compositions));
  }, [compositions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_CLOSINGS, JSON.stringify(cashClosings));
  }, [cashClosings]);

  useEffect(() => {
    if (currentCustomer) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CUSTOMER, JSON.stringify(currentCustomer));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CUSTOMER);
    }
  }, [currentCustomer]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW, view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, userRole);
  }, [userRole]);

  // Dynamic product availability based on stock & daily chicken count
  useEffect(() => {
    if (!settings.autoStockAvailability) return;

    setProducts(prevProducts => {
      let changed = false;
      const updated = prevProducts.map(prod => {
        const isChickenDish = prod.category === 'poulets' || prod.id === 'prod-1' || prod.id === 'prod-2';
        let shouldBeAvailable = true;
        if (isChickenDish) {
          shouldBeAvailable = dailyChickenRemaining > 0;
        } else {
          const availablePortions = getAvailablePortions(prod.id, stockItems, compositions);
          shouldBeAvailable = availablePortions > 0;
        }

        if (prod.isAvailable !== shouldBeAvailable) {
          changed = true;
          return { ...prod, isAvailable: shouldBeAvailable };
        }
        return prod;
      });
      return changed ? updated : prevProducts;
    });
  }, [stockItems, compositions, settings.autoStockAvailability, dailyChickenRemaining]);

  // Language & RTL sync
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEYS.LANG, lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language]);

  // Role Guarded Tab Navigation
  const setUserRole = (role: UserRole) => {
    setUserRoleState(role);
    // Guard routes on role change
    if (role === 'caissier' && (backOfficeTab === 'stock' || backOfficeTab === 'revenue')) {
      setBackOfficeTabState('orders');
    } else if (role === 'cuisinier' && backOfficeTab === 'revenue') {
      setBackOfficeTabState('orders');
    }
  };

  const setBackOfficeTab = (tab: BackOfficeTab) => {
    // Role guard check
    if (userRole === 'caissier' && (tab === 'stock' || tab === 'revenue')) {
      setBackOfficeTabState('orders');
      return;
    }
    if (userRole === 'cuisinier' && tab === 'revenue') {
      setBackOfficeTabState('orders');
      return;
    }
    setBackOfficeTabState(tab);
  };

  // Cart calculations
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: Product, quantity: number, notes?: string) => {
    if (quantity <= 0 || !product.isAvailable) return;
    const isChickenDish = product.category === 'poulets' || product.id === 'prod-1' || product.id === 'prod-2';
    if (isChickenDish && dailyChickenRemaining <= 0) {
      return;
    }

    setCart(prev => {
      const idx = prev.findIndex(item => item.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + quantity,
          notes: notes || next[idx].notes,
        };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          nameFr: product.nameFr,
          nameAr: product.nameAr,
          price: product.price,
          quantity,
          notes,
        },
      ];
    });
    soundService.playSuccess();
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => setCart([]);

  // Client active order object lookup
  const clientActiveOrder = orders.find(o => o.id === clientActiveOrderId) || null;

  const setClientActiveOrder = (ord: Order | null) => {
    setClientActiveOrderId(ord ? ord.id : null);
  };

  const unreadAlertCount = orders.filter(o => o.isNewAlert && o.status === 'pending').length;

  const clearNewOrderAlert = (orderId: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, isNewAlert: false } : o))
    );
  };

  // Place order from Client
  const placeOrder = ({
    type,
    deliveryAddress,
    pickupTimeSlot,
    kitchenNotes,
  }: {
    type: OrderType;
    deliveryAddress?: {
      wilaya: string;
      commune: string;
      address: string;
      landmark?: string;
      mapUrl?: string;
      latitude?: number;
      longitude?: number;
    };
    pickupTimeSlot?: string;
    kitchenNotes?: string;
  }): Order | null => {
    if (cart.length === 0) return null;
    if (!isStoreActuallyOpen) return null;

    // Check if any product is out of stock
    const unavailable = cart.some(item => {
      const prod = products.find(p => p.id === item.productId);
      return prod && !prod.isAvailable;
    });
    if (unavailable) return null;

    const subtotal = cartTotal;
    const fee = type === 'delivery' ? settings.deliveryFee : 0;
    const total = subtotal + fee;

    const orderSeq = orders.length + 1;
    const orderNumber = `#SD-${String(orderSeq).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    const customer = currentCustomer || {
      id: 'cust-guest',
      name: 'Client Invité',
      phone: '0771000000',
      wilaya: 'Alger',
      commune: 'Birkhadem',
      address: deliveryAddress?.address || 'Birkhadem',
      landmark: deliveryAddress?.landmark,
      mapUrl: deliveryAddress?.mapUrl,
      latitude: deliveryAddress?.latitude,
      longitude: deliveryAddress?.longitude,
      orderCount: 1,
      totalSpent: total,
      createdAt: nowIso,
    };

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      type,
      status: 'pending',
      items: [...cart],
      subtotal,
      deliveryFee: fee,
      total,
      deliveryAddress: type === 'delivery' ? deliveryAddress : undefined,
      pickupTimeSlot: type === 'pickup' ? pickupTimeSlot || 'Dès que possible' : undefined,
      kitchenNotes,
      createdAt: nowIso,
      updatedAt: nowIso,
      statusHistory: [
        {
          status: 'pending',
          timestamp: nowIso,
          note: language === 'ar' ? 'تم استلام الطلب من تطبيق الزبون' : 'Commande reçue depuis l\'application client',
        },
      ],
      isNewAlert: true,
      stockDeducted: false,
    };

    // Update customer stats
    setCustomers(prev =>
      prev.map(c =>
        c.id === customer.id
          ? {
              ...c,
              orderCount: c.orderCount + 1,
              totalSpent: c.totalSpent + total,
            }
          : c
      )
    );

    // Add to orders
    setOrders(prev => [newOrder, ...prev]);
    setClientActiveOrderId(newOrder.id);
    clearCart();

    // Trigger sound alert
    if (settings.soundEnabled) {
      soundService.playNewOrderBeep();
    }

    return newOrder;
  };

  // Add manual order from Back-Office
  const addManualOrder = ({
    customerName,
    customerPhone,
    type,
    items,
    deliveryAddress,
    pickupTimeSlot,
    kitchenNotes,
  }: {
    customerName: string;
    customerPhone: string;
    type: OrderType;
    items: OrderItem[];
    deliveryAddress?: {
      wilaya: string;
      commune: string;
      address: string;
      landmark?: string;
      mapUrl?: string;
      latitude?: number;
      longitude?: number;
    };
    pickupTimeSlot?: string;
    kitchenNotes?: string;
  }): Order => {
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const fee = type === 'delivery' ? settings.deliveryFee : 0;
    const total = subtotal + fee;
    const orderSeq = orders.length + 1;
    const orderNumber = `#SD-${String(orderSeq).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    let matchedCustomer = customers.find(c => c.phone === customerPhone);
    if (!matchedCustomer) {
      matchedCustomer = {
        id: `cust-${Date.now()}`,
        name: customerName,
        phone: customerPhone,
        wilaya: 'Alger',
        commune: deliveryAddress?.commune || 'Birkhadem',
        address: deliveryAddress?.address || 'Au comptoir',
        landmark: deliveryAddress?.landmark,
        mapUrl: deliveryAddress?.mapUrl,
        latitude: deliveryAddress?.latitude,
        longitude: deliveryAddress?.longitude,
        orderCount: 1,
        totalSpent: total,
        createdAt: nowIso,
      };
      setCustomers(prev => [matchedCustomer!, ...prev]);
    } else {
      setCustomers(prev =>
        prev.map(c =>
          c.id === matchedCustomer!.id
            ? {
                ...c,
                orderCount: c.orderCount + 1,
                totalSpent: c.totalSpent + total,
                mapUrl: deliveryAddress?.mapUrl || c.mapUrl,
                latitude: deliveryAddress?.latitude || c.latitude,
                longitude: deliveryAddress?.longitude || c.longitude,
              }
            : c
        )
      );
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      customerId: matchedCustomer.id,
      customerName,
      customerPhone,
      type,
      status: 'pending',
      items,
      subtotal,
      deliveryFee: fee,
      total,
      deliveryAddress: type === 'delivery' ? deliveryAddress : undefined,
      pickupTimeSlot: type === 'pickup' ? pickupTimeSlot : undefined,
      kitchenNotes,
      createdAt: nowIso,
      updatedAt: nowIso,
      statusHistory: [
        {
          status: 'pending',
          timestamp: nowIso,
          note: 'Commande manuelle saisie au back-office',
        },
      ],
      isNewAlert: false,
      stockDeducted: false,
    };

    setOrders(prev => [newOrder, ...prev]);
    soundService.playSuccess();
    return newOrder;
  };

  // Helper: Deduct stock when order enters 'preparing'
  const deductStockForOrder = (order: Order) => {
    if (order.stockDeducted) return;

    const deductionsMap: Record<string, number> = {};

    order.items.forEach(it => {
      const comp = compositions.find(c => c.productId === it.productId);
      if (comp) {
        comp.ingredients.forEach(ing => {
          const totalIngQty = ing.quantity * it.quantity;
          deductionsMap[ing.stockItemId] = (deductionsMap[ing.stockItemId] || 0) + totalIngQty;
        });
      }
    });

    const nowIso = new Date().toISOString();
    const newMovements: StockMovement[] = [];

    setStockItems(prevItems => {
      return prevItems.map(item => {
        const qtyToDeduct = deductionsMap[item.id];
        if (!qtyToDeduct) return item;

        const newBal = Math.round((item.currentStock - qtyToDeduct) * 100) / 100;

        newMovements.push({
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: nowIso,
          stockItemId: item.id,
          stockItemName: item.nameFr,
          type: 'out_auto',
          quantity: -qtyToDeduct,
          balanceAfter: newBal,
          authorRole: userRole,
          reason: `Commande ${order.orderNumber}`,
          orderId: order.id,
          unitCostDA: item.unitCostDA,
        });

        return { ...item, currentStock: newBal };
      });
    });

    if (newMovements.length > 0) {
      setStockMovements(prev => [...newMovements, ...prev]);
    }
  };

  // Advance order status
  const advanceOrderStatus = (orderId: string, nextStatus: OrderStatus, note?: string) => {
    const nowIso = new Date().toISOString();
    const targetOrder = orders.find(o => o.id === orderId);

    // Auto-deduct stock on preparing
    if (targetOrder && nextStatus === 'preparing' && !targetOrder.stockDeducted) {
      deductStockForOrder(targetOrder);
    }

    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: nextStatus,
          updatedAt: nowIso,
          isNewAlert: false,
          stockDeducted: nextStatus === 'preparing' ? true : o.stockDeducted,
          statusHistory: [
            ...o.statusHistory,
            {
              status: nextStatus,
              timestamp: nowIso,
              note:
                note ||
                (nextStatus === 'preparing'
                  ? 'Préparation lancée en cuisine'
                  : nextStatus === 'ready'
                  ? 'Commande prête'
                  : 'Livrée / Récupérée avec succès'),
            },
          ],
        };
      })
    );
    soundService.playSuccess();
  };

  // Regular cancel order (prompts modal if stock was deducted)
  const cancelOrder = (orderId: string, reason: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.stockDeducted) {
      // Prompt modal for stock choice
      setCancelModalOrder(order);
      return;
    }

    // Otherwise cancel directly
    cancelOrderWithStockChoice(orderId, reason, 'none');
  };

  // Cancel with stock action ('return' | 'loss' | 'none')
  const cancelOrderWithStockChoice = (
    orderId: string,
    reason: string,
    stockAction: 'return' | 'loss' | 'none'
  ) => {
    const nowIso = new Date().toISOString();
    const order = orders.find(o => o.id === orderId);

    if (order && order.stockDeducted && stockAction !== 'none') {
      const itemsMap: Record<string, number> = {};
      order.items.forEach(it => {
        const comp = compositions.find(c => c.productId === it.productId);
        if (comp) {
          comp.ingredients.forEach(ing => {
            const totalQty = ing.quantity * it.quantity;
            itemsMap[ing.stockItemId] = (itemsMap[ing.stockItemId] || 0) + totalQty;
          });
        }
      });

      const movementsToAdd: StockMovement[] = [];

      if (stockAction === 'return') {
        // Add back to stock
        setStockItems(prevItems =>
          prevItems.map(item => {
            const qtyToAdd = itemsMap[item.id];
            if (!qtyToAdd) return item;
            const newBal = Math.round((item.currentStock + qtyToAdd) * 100) / 100;
            movementsToAdd.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: nowIso,
              stockItemId: item.id,
              stockItemName: item.nameFr,
              type: 'in',
              quantity: qtyToAdd,
              balanceAfter: newBal,
              authorRole: userRole,
              reason: `Annulation ${order.orderNumber} (Remis en stock)`,
              orderId: order.id,
              unitCostDA: item.unitCostDA,
            });
            return { ...item, currentStock: newBal };
          })
        );
      } else if (stockAction === 'loss') {
        // Keep out of stock, declare as waste
        stockItems.forEach(item => {
          const qtyLost = itemsMap[item.id];
          if (qtyLost) {
            movementsToAdd.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: nowIso,
              stockItemId: item.id,
              stockItemName: item.nameFr,
              type: 'waste',
              quantity: -qtyLost,
              balanceAfter: item.currentStock,
              authorRole: userRole,
              reason: `Annulation ${order.orderNumber} (Déclaré en perte/gaspillé)`,
              orderId: order.id,
              unitCostDA: item.unitCostDA,
            });
          }
        });
      }

      if (movementsToAdd.length > 0) {
        setStockMovements(prev => [...movementsToAdd, ...prev]);
      }
    }

    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'cancelled',
          cancellationReason: reason,
          updatedAt: nowIso,
          isNewAlert: false,
          statusHistory: [
            ...o.statusHistory,
            {
              status: 'cancelled',
              timestamp: nowIso,
              note: `Annulée: ${reason}`,
            },
          ],
        };
      })
    );
    setCancelModalOrder(null);
  };

  // Stock Actions
  const addStockItem = (itemData: Omit<StockItem, 'id'>) => {
    const newItem: StockItem = {
      ...itemData,
      id: `stock-${Date.now()}`,
    };
    setStockItems(prev => [...prev, newItem]);
    soundService.playSuccess();
  };

  const updateStockItem = (id: string, updates: Partial<StockItem>) => {
    setStockItems(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    soundService.playSuccess();
  };

  const deleteStockItem = (id: string) => {
    setStockItems(prev => prev.filter(s => s.id !== id));
  };

  const updateComposition = (
    productId: string,
    ingredients: { stockItemId: string; quantity: number }[]
  ) => {
    setCompositions(prev => {
      const idx = prev.findIndex(c => c.productId === productId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { productId, ingredients };
        return next;
      }
      return [...prev, { productId, ingredients }];
    });
    soundService.playSuccess();
  };

  const addStockMovement = (params: {
    stockItemId: string;
    type: StockMovementType;
    quantity: number;
    reason: string;
    authorRole: UserRole;
    authorName?: string;
    orderId?: string;
  }) => {
    const targetItem = stockItems.find(s => s.id === params.stockItemId);
    if (!targetItem) return;

    const newBal = Math.round((targetItem.currentStock + params.quantity) * 100) / 100;

    const mov: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stockItemId: targetItem.id,
      stockItemName: targetItem.nameFr,
      type: params.type,
      quantity: params.quantity,
      balanceAfter: newBal,
      authorRole: params.authorRole,
      authorName: params.authorName,
      reason: params.reason,
      orderId: params.orderId,
      unitCostDA: targetItem.unitCostDA,
    };

    setStockItems(prev =>
      prev.map(s => (s.id === targetItem.id ? { ...s, currentStock: newBal } : s))
    );
    setStockMovements(prev => [mov, ...prev]);
    soundService.playSuccess();
  };

  const quickRestock = (stockItemId: string, quantity: number, reason?: string) => {
    addStockMovement({
      stockItemId,
      type: 'in',
      quantity: Math.abs(quantity),
      reason: reason || 'Réapprovisionnement rapide',
      authorRole: userRole,
    });
  };

  const declareWasteLoss = (stockItemId: string, quantity: number, reason: string) => {
    addStockMovement({
      stockItemId,
      type: 'waste',
      quantity: -Math.abs(quantity),
      reason,
      authorRole: userRole,
    });
  };

  const reportLowStock = (stockItemId: string) => {
    const item = stockItems.find(s => s.id === stockItemId);
    if (!item) return;

    // Log movement alert
    const mov: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: new Date().toISOString(),
      stockItemId: item.id,
      stockItemName: item.nameFr,
      type: 'adjustment',
      quantity: 0,
      balanceAfter: item.currentStock,
      authorRole: 'cuisinier',
      reason: 'Signalement stock bas transmis au Gérant',
      unitCostDA: item.unitCostDA,
    };
    setStockMovements(prev => [mov, ...prev]);
    soundService.playSuccess();
  };

  const applyInventoryDiscrepancies = (
    discrepancies: InventoryDiscrepancy[],
    authorRole: UserRole
  ) => {
    const nowIso = new Date().toISOString();
    const movements: StockMovement[] = [];

    setStockItems(prevItems => {
      return prevItems.map(item => {
        const disc = discrepancies.find(d => d.stockItemId === item.id);
        if (!disc || disc.difference === 0) return item;

        movements.push({
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: nowIso,
          stockItemId: item.id,
          stockItemName: item.nameFr,
          type: 'adjustment',
          quantity: disc.difference,
          balanceAfter: disc.countedStock,
          authorRole,
          reason: `Ajustement inventaire service (${disc.difference > 0 ? '+' : ''}${disc.difference} ${disc.unit})`,
          unitCostDA: item.unitCostDA,
        });

        return { ...item, currentStock: disc.countedStock };
      });
    });

    if (movements.length > 0) {
      setStockMovements(prev => [...movements, ...prev]);
    }
    soundService.playSuccess();
  };

  const receivePurchaseGroup = (group: SupplierPurchaseGroup) => {
    const nowIso = new Date().toISOString();
    const movements: StockMovement[] = [];

    setStockItems(prevItems => {
      return prevItems.map(item => {
        const pItem = group.items.find(pi => pi.stockItem.id === item.id);
        if (!pItem) return item;

        const newBal = Math.round((item.currentStock + pItem.neededQuantity) * 100) / 100;
        movements.push({
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: nowIso,
          stockItemId: item.id,
          stockItemName: item.nameFr,
          type: 'in',
          quantity: pItem.neededQuantity,
          balanceAfter: newBal,
          authorRole: userRole,
          reason: `Réception bon de commande (${group.supplierName})`,
          unitCostDA: item.unitCostDA,
        });

        return { ...item, currentStock: newBal, lastRestockedAt: nowIso };
      });
    });

    if (movements.length > 0) {
      setStockMovements(prev => [...movements, ...prev]);
    }

    // Auto record expense for this purchase
    addExpense({
      date: nowIso.split('T')[0],
      category: 'achats_matieres',
      amount: group.totalCost,
      note: `Achat réapprovisionnement ${group.supplierName}`,
      createdBy: userRole === 'gerant' ? 'Gérant' : 'Back-Office',
    });

    soundService.playSuccess();
  };

  // Expenses CRUD
  const addExpense = (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExp, ...prev]);
    soundService.playSuccess();
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    soundService.playSuccess();
  };

  // Cash Closing
  const closeCashRegister = (data: { date: string; countedCash: number; note?: string }): CashClosing => {
    // Calculate theoretical cash for this date: sum of delivered orders
    const dayDeliveredOrders = orders.filter(
      o => o.status === 'delivered' && o.createdAt.startsWith(data.date)
    );
    const theoreticalCash = dayDeliveredOrders.reduce((acc, o) => acc + o.total, 0);
    const diff = data.countedCash - theoreticalCash;

    const closing: CashClosing = {
      id: `closing-${data.date}`,
      date: data.date,
      theoreticalCash,
      countedCash: data.countedCash,
      difference: diff,
      note: data.note,
      closedBy: 'Gérant',
      closedAt: new Date().toISOString(),
      locked: true,
    };

    setCashClosings(prev => [closing, ...prev.filter(c => c.date !== data.date)]);
    soundService.playSuccess();
    return closing;
  };

  // Manager PIN Security for Recettes
  const unlockRevenue = (pin: string): boolean => {
    const cleanPin = pin.trim();
    const targetPin = (settings.managerPin || '0000').trim();
    if (cleanPin === targetPin) {
      setIsRevenueUnlocked(true);
      soundService.playSuccess();
      return true;
    }
    return false;
  };

  const lockRevenue = () => {
    setIsRevenueUnlocked(false);
  };

  // Catalog methods
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [...prev, newProd]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleProductAvailability = (id: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, isAvailable: !p.isAvailable } : p))
    );
    soundService.playSuccess();
  };

  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetAllSeedData = () => {
    localStorage.clear();
    const generated = generateHistoricalData();
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setOrders(generated.orders);
    setSettings(INITIAL_SETTINGS);
    setStockItems(INITIAL_STOCK_ITEMS);
    setCompositions(INITIAL_COMPOSITIONS);
    setStockMovements(generated.stockMovements);
    setExpenses(generated.expenses);
    setCashClosings(generated.cashClosings);
    setCurrentCustomer(INITIAL_CUSTOMERS[0]);
    setCart([]);
    setIsRevenueUnlocked(false);
    localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
    soundService.playSuccess();
  };

  const reorderPastOrder = (order: Order) => {
    clearCart();
    order.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId);
      if (prod) {
        addToCart(prod, it.quantity, it.notes);
      }
    });
    setClientTab('cart');
    soundService.playSuccess();
  };

  const registerOrLoginCustomer = (data: {
    name: string;
    phone: string;
    commune: string;
    address: string;
    landmark?: string;
    mapUrl?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    const existing = customers.find(c => c.phone === data.phone);
    if (existing) {
      const updated = {
        ...existing,
        name: data.name || existing.name,
        commune: data.commune || existing.commune,
        address: data.address || existing.address,
        landmark: data.landmark || existing.landmark,
        mapUrl: data.mapUrl !== undefined ? data.mapUrl : existing.mapUrl,
        latitude: data.latitude !== undefined ? data.latitude : existing.latitude,
        longitude: data.longitude !== undefined ? data.longitude : existing.longitude,
      };
      setCustomers(prev => prev.map(c => (c.id === existing.id ? updated : c)));
      setCurrentCustomer(updated);
      return updated;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      wilaya: 'Alger',
      commune: data.commune,
      address: data.address,
      landmark: data.landmark,
      mapUrl: data.mapUrl,
      latitude: data.latitude,
      longitude: data.longitude,
      orderCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [newCust, ...prev]);
    setCurrentCustomer(newCust);
    return newCust;
  };

  const logoutCustomer = () => {
    setCurrentCustomer(null);
  };

  return (
    <AppContext.Provider
      value={{
        view,
        setView,
        language,
        setLanguage,
        userRole,
        setUserRole,
        products,
        customers,
        orders,
        settings,
        isStoreActuallyOpen,
        stockItems,
        compositions,
        stockMovements,
        activeStockAlertsCount,
        addStockItem,
        updateStockItem,
        deleteStockItem,
        updateComposition,
        addStockMovement,
        quickRestock,
        declareWasteLoss,
        reportLowStock,
        applyInventoryDiscrepancies,
        receivePurchaseGroup,
        expenses,
        cashClosings,
        addExpense,
        deleteExpense,
        closeCashRegister,
        isRevenueUnlocked,
        unlockRevenue,
        lockRevenue,
        currentCustomer,
        setCurrentCustomer,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartItemsCount,
        clientTab,
        setClientTab,
        clientActiveOrder,
        setClientActiveOrder,
        clientSimulatorMode,
        setClientSimulatorMode,
        backOfficeTab,
        setBackOfficeTab,
        backOfficeOrdersView,
        setBackOfficeOrdersView,
        unreadAlertCount,
        clearNewOrderAlert,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
        cancelModalOrder,
        setCancelModalOrder,
        dailyChickenQuota,
        dailyChickenInitial,
        dailyChickenRemaining,
        dailyChickenSold,
        setDailyChickenQuota,
        setTodayChickenCount,
        resetTodayChickenBatch,
        placeOrder,
        addManualOrder,
        advanceOrderStatus,
        updateOrderStatus: advanceOrderStatus,
        cancelOrder,
        cancelOrderWithStockChoice,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        updateSettings,
        resetAllSeedData,
        resetToSeedData: resetAllSeedData,
        reorderPastOrder,
        registerOrLoginCustomer,
        logoutCustomer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
