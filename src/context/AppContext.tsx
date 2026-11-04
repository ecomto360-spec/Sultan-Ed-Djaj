import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback, ReactNode } from 'react';
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
  Day,
  QuotaAdjustment,
  PaymentMethod,
  OrderSource,
  ProductCategoryItem,
  ClientPageContent,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
  INITIAL_STOCK_ITEMS,
  INITIAL_COMPOSITIONS,
  INITIAL_CATEGORIES,
  INITIAL_CLIENT_PAGE_CONTENT,
  generateHistoricalData,
} from '../data/seedData';
import { soundService } from '../services/sound';
import { getActiveStockAlerts, getAvailablePortions } from '../services/stockService';
import {
  getAlgiersDateString,
  computeDayStats,
  migrateOrdersAndDays,
} from '../services/dayService';
import {
  calculateSalesMetrics,
  isOrderInDay,
  computeDaySnapshot,
  calculateTheoreticalCash,
  migrateOrderDefaults,
} from '../services/salesService';
import { authFetch, getAdminToken, getStoredAdminRole, notifyAuthLogout, verifyManagerPinServer } from '../services/authService';
import {
  createOrderRemote,
  fetchOrderRemote,
  fetchOrdersRemote,
  isRemoteOrderId,
  subscribeToOrderChanges,
  updateOrderRemote,
} from '../services/orderService';
import {
  fetchCatalogRemote,
  publishCatalogRemote,
  type RemoteCatalogState,
} from '../services/catalogService';
import { sendToWhatsApp } from '../services/whatsappService';

interface AppContextType {
  view: 'client' | 'commercial';
  setView: (v: 'client' | 'commercial') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  authenticatedRole: UserRole;
  setAuthenticatedRole: (role: UserRole) => void;

  // Data
  products: Product[];
  customers: Customer[];
  orders: Order[];
  days: Day[];
  currentDay: Day | null;
  unclosedPastDay: Day | null;
  lastClosedDayQuota: number;
  openDay: (quotaInitial: number) => Day;
  closeDay: (options?: {
    dayId?: string;
    activeOrdersResolution?: 'delivered' | 'cancelled' | 'keep';
    countedCash?: number;
    cashClosingNote?: string;
  }) => void;
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
  unlockRevenue: (pin: string) => Promise<boolean>;
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
  clientTab: 'menu' | 'cart' | 'tracking' | 'profile' | 'store_locator';
  setClientTab: (tab: 'menu' | 'cart' | 'tracking' | 'profile' | 'store_locator') => void;
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
  refreshSync: () => Promise<void>;

  // Actions
  placeOrder: (params: {
    type: OrderType;
    items?: OrderItem[];
    clientRequestId: string;
    accessToken: string;
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
  }) => Promise<Order | null>;
  addManualOrder: (params: {
    clientRequestId: string;
    accessToken: string;
    customerName: string;
    customerPhone: string;
    type: OrderType;
    status?: OrderStatus;
    source?: OrderSource;
    paymentMethod?: PaymentMethod;
    driverName?: string;
    driverFee?: number;
    items: OrderItem[];
    deliveryFee?: number;
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
    sentToWhatsApp?: boolean;
    sentAt?: string;
  }) => Promise<Order | null>;
  advanceOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus,
    note?: string,
    paymentMethod?: PaymentMethod,
    driverName?: string,
    driverFee?: number
  ) => void;
  updateOrderStatus: (
    orderId: string,
    nextStatus: OrderStatus,
    note?: string,
    paymentMethod?: PaymentMethod,
    driverName?: string,
    driverFee?: number
  ) => void;
  cancelOrder: (orderId: string, reason: string) => void;
  cancelOrderWithStockChoice: (
    orderId: string,
    reason: string,
    stockAction: 'return' | 'loss' | 'none'
  ) => void;
  markOrderSentToWhatsApp: (orderId: string) => void;

  // Catalog actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;
  reorderProducts: (categoryId: string, orderedProductIds: string[]) => void;

  // Categories actions
  categories: ProductCategoryItem[];
  addCategory: (cat: Omit<ProductCategoryItem, 'id' | 'order'>) => void;
  updateCategory: (id: string, updates: Partial<ProductCategoryItem>) => void;
  deleteCategory: (id: string, moveProductsToCategoryId?: string) => void;
  reorderCategories: (orderedIds: string[]) => void;

  // Client Page Content actions
  clientPageContent: ClientPageContent;
  updateClientPageContent: (updates: Partial<ClientPageContent>) => void;
  publishClientPageContent: (content: ClientPageContent) => Promise<boolean>;

  // Backup & Restore
  exportCatalogJson: () => string;
  importCatalogJson: (jsonString: string) => { success: boolean; message: string; count?: number };

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
  ACTIVE_ORDER_ID: 'sultan_active_order_id_v2',
  DAYS: 'sultan_days_v2',
  BACKUP_PRE_DAYS: 'sultan_backup_pre_days_v2',
  CATEGORIES: 'sultan_categories_v2',
  CLIENT_PAGE: 'sultan_client_page_v2',
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

function safeLocalStorageSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Product photos used to be stored as large data URLs and could exceed the
    // browser quota. Never let that cache failure break the live application:
    // the shared Supabase catalog remains the source of truth.
    console.warn(`Local cache unavailable for ${key}:`, err);
  }
}

function makeCatalogSnapshot(products: Product[], categories: ProductCategoryItem[]) {
  return JSON.stringify({ products, categories });
}

// Execute migration
migrateStorageIfNeeded();

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & Preferences
  const [view, setViewState] = useState<'client' | 'commercial'>('commercial');

  const setView = (v: 'client' | 'commercial') => {
    setViewState(v);
    localStorage.setItem(STORAGE_KEYS.VIEW, v);
  };

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem(STORAGE_KEYS.LANG) as Language) || 'fr';
  });

  const [authenticatedRole, setAuthenticatedRoleState] = useState<UserRole>(() => {
    return getStoredAdminRole() || 'caissier';
  });

  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    const stored = getStoredAdminRole();
    if (stored) return stored;
    return 'caissier';
  });

  // Client tabs & simulator mode
  const [clientTab, setClientTab] = useState<'menu' | 'cart' | 'tracking' | 'profile' | 'store_locator'>('menu');
  const [clientSimulatorMode, setClientSimulatorMode] = useState<'frame' | 'fluid'>('frame');
  const [backOfficeTab, setBackOfficeTabState] = useState<BackOfficeTab>('orders');
  const [backOfficeOrdersView, setBackOfficeOrdersView] = useState<'kanban' | 'table'>('kanban');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  // Cancel order with stock choice modal
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);

  // Manager PIN unlock state (unlocked by default for authenticated gerant)
  const [isRevenueUnlocked, setIsRevenueUnlocked] = useState<boolean>(true);

  // Core Data
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const rawOrders = saved ? JSON.parse(saved) : INITIAL_ORDERS;
      const safe = Array.isArray(rawOrders) ? rawOrders : INITIAL_ORDERS;
      return safe.map(migrateOrderDefaults);
    } catch {
      return INITIAL_ORDERS.map(migrateOrderDefaults);
    }
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_SETTINGS;
      return (parsed && typeof parsed === 'object') ? { ...INITIAL_SETTINGS, ...parsed } : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
      return Array.isArray(parsed) ? parsed : INITIAL_STOCK_ITEMS;
    } catch {
      return INITIAL_STOCK_ITEMS;
    }
  });

  const [compositions, setCompositions] = useState<ProductComposition[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPOSITIONS);
      const parsed = saved ? JSON.parse(saved) : INITIAL_COMPOSITIONS;
      return Array.isArray(parsed) ? parsed : INITIAL_COMPOSITIONS;
    } catch {
      return INITIAL_COMPOSITIONS;
    }
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [days, setDays] = useState<Day[]>(() => {
    try {
      const savedDaysRaw = localStorage.getItem(STORAGE_KEYS.DAYS);
      const savedOrdersRaw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const savedSettingsRaw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const savedCompositionsRaw = localStorage.getItem(STORAGE_KEYS.COMPOSITIONS);
      const savedMovementsRaw = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);

      if (!savedDaysRaw && savedOrdersRaw && !localStorage.getItem(STORAGE_KEYS.BACKUP_PRE_DAYS)) {
        localStorage.setItem(STORAGE_KEYS.BACKUP_PRE_DAYS, savedOrdersRaw);
      }

      const parsedDays: Day[] | undefined = savedDaysRaw ? JSON.parse(savedDaysRaw) : undefined;
      const parsedOrders: Order[] = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : INITIAL_ORDERS;
      const parsedSettings: StoreSettings = savedSettingsRaw ? JSON.parse(savedSettingsRaw) : INITIAL_SETTINGS;
      const parsedComps: ProductComposition[] = savedCompositionsRaw ? JSON.parse(savedCompositionsRaw) : INITIAL_COMPOSITIONS;
      const parsedMovs: StockMovement[] = savedMovementsRaw ? JSON.parse(savedMovementsRaw) : [];

      const migrated = migrateOrdersAndDays(parsedOrders, parsedDays, parsedSettings, parsedComps, parsedMovs);
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(migrated.orders));
      localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(migrated.days));
      return migrated.days;
    } catch {
      const migrated = migrateOrdersAndDays(INITIAL_ORDERS, undefined, INITIAL_SETTINGS, INITIAL_COMPOSITIONS, []);
      return migrated.days;
    }
  });

  // Ensure initial orders in state have dayId from migration
  useEffect(() => {
    setOrders(prev => {
      const missingDayId = prev.some(o => !o.dayId);
      if (!missingDayId) return prev;
      const migrated = migrateOrdersAndDays(prev, days, settings, compositions, stockMovements);
      return migrated.orders;
    });
  }, []);

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [cashClosings, setCashClosings] = useState<CashClosing[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CASH_CLOSINGS);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_CUSTOMER);
      const parsed = saved ? JSON.parse(saved) : INITIAL_CUSTOMERS[0];
      return (parsed && typeof parsed === 'object' && parsed.id) ? parsed : INITIAL_CUSTOMERS[0];
    } catch {
      return INITIAL_CUSTOMERS[0];
    }
  });

  const [cart, setCart] = useState<OrderItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [clientActiveOrderId, setClientActiveOrderId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDER_ID);
      if (savedId && orders.some(o => o.id === savedId)) {
        return savedId;
      }
    } catch {
      // ignore
    }
    const active = orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled');
    return active ? active.id : null;
  });

  const [categories, setCategories] = useState<ProductCategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const parsed = saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [clientPageContent, setClientPageContent] = useState<ClientPageContent>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENT_PAGE);
      const parsed = saved ? JSON.parse(saved) : INITIAL_CLIENT_PAGE_CONTENT;
      return parsed && typeof parsed === 'object' && parsed.restaurantNameFr
        ? { ...INITIAL_CLIENT_PAGE_CONTENT, ...parsed }
        : INITIAL_CLIENT_PAGE_CONTENT;
    } catch {
      return INITIAL_CLIENT_PAGE_CONTENT;
    }
  });

  // Track remote updates to prevent infinite SSE/REST echo loops
  const isRemoteUpdateRef = useRef<boolean>(false);
  const sseRef = useRef<EventSource | null>(null);
  const serverVersionRef = useRef<number>(0);
  const remoteOrdersLoadedRef = useRef<boolean>(false);
  const ordersRefreshInFlightRef = useRef<boolean>(false);
  const ordersRefreshPendingRef = useRef<boolean>(false);
  const productsRef = useRef<Product[]>(products);
  const categoriesRef = useRef<ProductCategoryItem[]>(categories);
  const catalogVersionRef = useRef<number>(0);
  const catalogInitializedRef = useRef<boolean>(false);
  const catalogSyncReadyRef = useRef<boolean>(false);
  const catalogSnapshotRef = useRef<string | null>(null);
  const catalogRefreshInFlightRef = useRef<boolean>(false);
  const catalogRefreshPendingRef = useRef<boolean>(false);
  const catalogPublishInFlightRef = useRef<boolean>(false);
  const catalogPublishPendingRef = useRef<boolean>(false);
  const soundEnabledRef = useRef<boolean>(settings.soundEnabled);
  const currentDayRef = useRef<Day | null>(null);

  useEffect(() => {
    soundEnabledRef.current = settings.soundEnabled;
  }, [settings.soundEnabled]);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  // Recompute days stats reactively:
  // Pour la journée ouverte : calcule tout depuis les commandes (aucun compteur stocké figé).
  // À la clôture : fige un instantané (snapshot) dans la Day.
  const computedDays = useMemo(() => {
    return days.map(d => {
      if (d.status === 'open') {
        const dayOrders = orders.filter(o => isOrderInDay(o, d));
        return computeDaySnapshot(d, dayOrders, compositions, stockMovements);
      }
      return d;
    });
  }, [days, orders, compositions, stockMovements]);

  // Currently open Day (only one 'open' at a time)
  const currentDay = useMemo(() => {
    return computedDays.find(d => d.status === 'open') || null;
  }, [computedDays]);

  useEffect(() => {
    currentDayRef.current = currentDay;
  }, [currentDay]);

  // Check if the open day is from a past date (Africa/Algiers)
  const unclosedPastDay = useMemo(() => {
    const todayAlgiers = getAlgiersDateString();
    if (currentDay && currentDay.date !== 'initial' && currentDay.date < todayAlgiers) {
      return currentDay;
    }
    return null;
  }, [currentDay]);

  // Quota of the previous closed day (to prefill the "Ouvrir la journée" modal)
  const lastClosedDayQuota = useMemo(() => {
    const closedDays = computedDays
      .filter(d => d.status === 'closed' && d.date !== 'initial')
      .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
    if (closedDays.length > 0) {
      return closedDays[0].quotaCurrent || closedDays[0].quotaInitial || settings.dailyChickenQuota || 100;
    }
    return settings.dailyChickenQuota || 100;
  }, [computedDays, settings.dailyChickenQuota]);

  // Calculate actual store openness: requires an open Day AND (24h/24h or manual override)
  const isStoreActuallyOpen = useMemo(() => {
    if (!currentDay) {
      return false;
    }
    if (settings.manualOverride) {
      return settings.isOpen;
    }
    return true;
  }, [currentDay, settings.manualOverride, settings.isOpen]);

  // Active stock alerts count
  const activeStockAlertsCount = useMemo(() => {
    return getActiveStockAlerts(stockItems).length;
  }, [stockItems]);

  // ══════════════════════════════════════════════════
  // DAILY CHICKEN QUOTA & LIVE REMAINING COUNTDOWN (BOUND TO CURRENT OPEN DAY)
  // ══════════════════════════════════════════════════
  const dailyChickenQuota = settings.dailyChickenQuota || 100;
  const dailyChickenInitial = currentDay
    ? currentDay.quotaCurrent ?? currentDay.quotaInitial
    : 0;
  const dailyChickenSold = currentDay ? currentDay.pouletsVendus : 0;
  const dailyChickenRemaining = currentDay ? currentDay.pouletsRestants : 0;

  // Synchronize stock-1 (Poulet entier) currentStock with dailyChickenRemaining when a day is open
  useEffect(() => {
    if (!currentDay) return;
    setStockItems(prev => {
      const chickenItem = prev.find(s => s.id === 'stock-1');
      if (chickenItem && Math.abs(chickenItem.currentStock - dailyChickenRemaining) > 0.01) {
        return prev.map(s => (s.id === 'stock-1' ? { ...s, currentStock: dailyChickenRemaining } : s));
      }
      return prev;
    });
  }, [currentDay, dailyChickenRemaining]);

  // Open a new Day session
  const openDay = (quotaInitialInput: number): Day => {
    const validQuota = Math.max(1, Math.round(quotaInitialInput));
    const todayAlgiers = getAlgiersDateString();
    const nowIso = new Date().toISOString();

    const newDay: Day = {
      id: `day-${todayAlgiers}-${Date.now()}`,
      date: todayAlgiers,
      status: 'open',
      openedAt: nowIso,
      quotaInitial: validQuota,
      quotaCurrent: validQuota,
      quotaAdjustments: [],
      pouletsVendus: 0,
      pouletsRestants: validQuota,
      nbCommandes: 0,
      nbAnnulees: 0,
      ca: 0,
      panierMoyen: 0,
      nbLivraison: 0,
      nbComptoir: 0,
    };

    const nextDays = [
      newDay,
      ...days.map(d =>
        d.status === 'open'
          ? { ...d, status: 'closed' as const, closedAt: d.closedAt || nowIso }
          : d
      ),
    ];

    const nextSettings: StoreSettings = {
      ...settings,
      dailyChickenQuota: validQuota,
      dailyChickenDate: todayAlgiers,
      dailyChickenInitial: validQuota,
    };

    const nextStock = stockItems.map(s =>
      s.id === 'stock-1'
        ? { ...s, currentStock: validQuota, lastRestockedAt: nowIso }
        : s
    );

    setDays(nextDays);
    setSettings(nextSettings);
    setStockItems(nextStock);

    pushPatchToServer({
      days: nextDays,
      settings: nextSettings,
      stockItems: nextStock,
    });

    soundService.playSuccess();
    return newDay;
  };

  // Close the currently open Day (or a specific dayId)
  const closeDay = (options?: {
    dayId?: string;
    activeOrdersResolution?: 'delivered' | 'cancelled' | 'keep';
    countedCash?: number;
    cashClosingNote?: string;
  }) => {
    const targetDay = options?.dayId
      ? computedDays.find(d => d.id === options.dayId)
      : currentDay;
    if (!targetDay) return;

    const nowIso = new Date().toISOString();
    const resolution = options?.activeOrdersResolution || 'keep';

    let nextOrders = orders;
    if (resolution === 'delivered' || resolution === 'cancelled') {
      nextOrders = orders.map(o => {
        const belongsToDay =
          o.dayId === targetDay.id ||
          (!o.dayId && getAlgiersDateString(o.createdAt) === targetDay.date);
        const isActive =
          o.status === 'pending' || o.status === 'preparing' || o.status === 'ready';
        if (!belongsToDay || !isActive) return o;

        return {
          ...o,
          dayId: targetDay.id,
          status: resolution,
          updatedAt: nowIso,
          isNewAlert: false,
          cancellationReason:
            resolution === 'cancelled'
              ? o.cancellationReason || 'Clôture de journée'
              : o.cancellationReason,
          statusHistory: [
            ...(Array.isArray(o.statusHistory) ? o.statusHistory : []),
            {
              status: resolution,
              timestamp: nowIso,
              note:
                resolution === 'delivered'
                  ? 'Marquée livrée lors de la clôture de la journée'
                  : 'Annulée lors de la clôture de la journée',
            },
          ],
        };
      });
    }

    const dayOrdersAfterResolution = nextOrders.filter(
      o => isOrderInDay(o, targetDay)
    );

    // Snapshot figé des métriques ventes & poulets
    const snapshot = computeDaySnapshot(
      targetDay,
      dayOrdersAfterResolution,
      compositions,
      stockMovements
    );

    // Clôture de caisse fusionnée : espèces théoriques vs espèces comptées
    const dayExpenses = expenses.filter(e => e.date === targetDay.date);
    const cashCalc = calculateTheoreticalCash(dayOrdersAfterResolution, dayExpenses);
    const theoreticalCash = cashCalc.theoreticalCash;
    const countedCash =
      options?.countedCash !== undefined ? Math.round(options.countedCash) : theoreticalCash;
    const cashDifference = countedCash - theoreticalCash;
    const cashClosingNote = options?.cashClosingNote?.trim() || undefined;

    const closedDayObj: Day = {
      ...snapshot,
      status: 'closed',
      closedAt: nowIso,
      theoreticalCash,
      countedCash,
      cashDifference,
      cashClosingNote,
      cashClosedAt: nowIso,
    };

    const nextDays = days.map(d => (d.id === targetDay.id ? closedDayObj : d));

    const cashClosingRecord: CashClosing = {
      id: `cash-${targetDay.date}-${Date.now()}`,
      date: targetDay.date,
      theoreticalCash,
      countedCash,
      difference: cashDifference,
      note: cashClosingNote,
      closedBy: userRole,
      closedAt: nowIso,
      locked: true,
    };
    const nextCashClosings = [
      cashClosingRecord,
      ...cashClosings.filter(c => c.date !== targetDay.date),
    ];

    setOrders(nextOrders);
    setDays(nextDays);
    setCashClosings(nextCashClosings);

    // Synchroniser vers Supabase les commandes actives résolues par la clôture.
    const previousOrdersById = new Map(orders.map(o => [o.id, o]));
    const remoteOrdersToSync = nextOrders.filter(next => {
      const previous = previousOrdersById.get(next.id);
      return previous && isRemoteOrderId(next.id) && previous.status !== next.status;
    });
    if (remoteOrdersToSync.length > 0) {
      void Promise.allSettled(
        remoteOrdersToSync.map(next => {
          const previous = previousOrdersById.get(next.id)!;
          return updateOrderRemote(next.id, {
            status: next.status,
            note: next.statusHistory?.[next.statusHistory.length - 1]?.note,
            cancellationReason: next.cancellationReason,
            isNewAlert: false,
            expectedUpdatedAt: previous.updatedAt,
            language,
          });
        })
      ).then(results => {
        const successful = results
          .filter((result): result is PromiseFulfilledResult<Order> => result.status === 'fulfilled')
          .map(result => result.value);
        if (successful.length > 0) {
          mergeRemoteOrders(successful, { announceNew: false });
        }
        if (results.some(result => result.status === 'rejected')) {
          void refreshOrdersFromSupabase();
          alert(
            language === 'ar'
              ? 'بعض حالات الطلبات لم تتم مزامنتها عند الإغلاق.'
              : 'Certains statuts de commandes n’ont pas pu être synchronisés lors de la clôture.'
          );
        }
      });
    }

    // Notifier le serveur via POST /api/day/close avec les détails
    try {
      authFetch('/api/day/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayId: targetDay.id,
          activeOrdersResolution: resolution,
          countedCash,
          cashClosingNote,
        }),
      }).catch(err => console.warn('Could not POST /api/day/close:', err));
    } catch {
      // ignore
    }

    pushPatchToServer({
      days: nextDays,
      cashClosings: nextCashClosings,
    });

    soundService.playSuccess();
  };

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
    const today = getAlgiersDateString();
    const val = Math.max(0, Math.round(count));
    const nowIso = new Date().toISOString();

    if (!currentDay) return;

    const prevQuota = currentDay.quotaCurrent ?? currentDay.quotaInitial;
    let newQuota = prevQuota;
    let reasonText = '';

    if (mode === 'set_initial') {
      newQuota = val;
      reasonText = `Remplacement du quota du jour (${prevQuota} → ${newQuota})`;
    } else if (mode === 'set_remaining') {
      newQuota = val + dailyChickenSold;
      reasonText = `Définition du restant à ${val} poulets`;
    } else if (mode === 'add') {
      newQuota = prevQuota + val;
      reasonText = `Ajout d'un arrivage (+${val} poulets)`;
    }

    const adjustment: QuotaAdjustment = {
      id: `adj-${Date.now()}`,
      timestamp: nowIso,
      previousQuota: prevQuota,
      newQuota,
      delta: newQuota - prevQuota,
      mode,
      authorRole: userRole,
      reason: reasonText,
    };

    const nextDays = days.map(d =>
      d.id === currentDay.id
        ? {
            ...d,
            quotaCurrent: newQuota,
            quotaAdjustments: [adjustment, ...(d.quotaAdjustments || [])],
          }
        : d
    );

    setDays(nextDays);
    setSettings(prev => ({
      ...prev,
      dailyChickenDate: today,
      dailyChickenInitial: newQuota,
    }));

    if (mode === 'add') {
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
    const today = getAlgiersDateString();
    const target =
      newTotal !== undefined
        ? Math.max(0, Math.round(newTotal))
        : settings.dailyChickenQuota || 100;
    const nowIso = new Date().toISOString();

    if (currentDay) {
      const prevQuota = currentDay.quotaCurrent ?? currentDay.quotaInitial;
      const adjustment: QuotaAdjustment = {
        id: `adj-${Date.now()}`,
        timestamp: nowIso,
        previousQuota: prevQuota,
        newQuota: target,
        delta: target - prevQuota,
        mode: 'reset',
        authorRole: userRole,
        reason: `Réinitialisation du quota (${target} poulets)`,
      };
      setDays(prev =>
        prev.map(d =>
          d.id === currentDay.id
            ? {
                ...d,
                quotaCurrent: target,
                quotaAdjustments: [adjustment, ...(d.quotaAdjustments || [])],
              }
            : d
        )
      );
    }

    setSettings(prev => ({
      ...prev,
      dailyChickenDate: today,
      dailyChickenInitial: target,
    }));
  };

  // Sync to localStorage
  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DAYS, JSON.stringify(computedDays));
  }, [computedDays]);

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

  useEffect(() => {
    if (clientActiveOrderId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER_ID, clientActiveOrderId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORDER_ID);
    }
  }, [clientActiveOrderId]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENT_PAGE, JSON.stringify(clientPageContent));
  }, [clientPageContent]);

  // Apply authoritative state received from the server (WebSocket or REST polling)
  const applyRemoteServerState = (remoteState: any) => {
    if (!remoteState) return;

    // Les commandes ne transitent plus par l'ancien état serveur/fichier JSON :
    // Supabase (via /api/orders) est désormais leur seule source partagée.
    remoteState = { ...remoteState };
    delete remoteState.orders;

    // Supabase (/api/catalog) is authoritative for products/categories once
    // that endpoint is reachable; never let the legacy state file replace
    // the shared catalog (or its product photos) afterwards.
    if (catalogSyncReadyRef.current) {
      delete remoteState.products;
      delete remoteState.categories;
    }

    isRemoteUpdateRef.current = true;
    try {
      if (typeof remoteState.version === 'number') {
        serverVersionRef.current = remoteState.version;
      }

      if (Array.isArray(remoteState.products)) {
        setProducts(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.products)
            ? prev
            : remoteState.products
        );
      }

      if (Array.isArray(remoteState.customers)) {
        setCustomers(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.customers)
            ? prev
            : remoteState.customers
        );
      }

      if (remoteState.settings) {
        setSettings(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.settings)
            ? prev
            : remoteState.settings
        );
      }

      if (Array.isArray(remoteState.stockItems)) {
        setStockItems(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.stockItems)
            ? prev
            : remoteState.stockItems
        );
      }

      if (Array.isArray(remoteState.compositions)) {
        setCompositions(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.compositions)
            ? prev
            : remoteState.compositions
        );
      }

      if (Array.isArray(remoteState.stockMovements)) {
        setStockMovements(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.stockMovements)
            ? prev
            : remoteState.stockMovements
        );
      }

      if (Array.isArray(remoteState.expenses)) {
        setExpenses(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.expenses)
            ? prev
            : remoteState.expenses
        );
      }

      if (Array.isArray(remoteState.cashClosings)) {
        setCashClosings(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.cashClosings)
            ? prev
            : remoteState.cashClosings
        );
      }

      if (Array.isArray(remoteState.days)) {
        setDays(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.days)
            ? prev
            : remoteState.days
        );
      }

      if (Array.isArray(remoteState.categories)) {
        setCategories(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.categories)
            ? prev
            : remoteState.categories
        );
      }

      if (remoteState.clientPageContent && typeof remoteState.clientPageContent === 'object') {
        setClientPageContent(prev =>
          JSON.stringify(prev) === JSON.stringify(remoteState.clientPageContent)
            ? prev
            : { ...INITIAL_CLIENT_PAGE_CONTENT, ...remoteState.clientPageContent }
        );
      }
    } finally {
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 60);
    }
  };

  // Push local state changes to the server via HTTP REST (Authenticated for admin)
  const pushPatchToServer = (initialPatch: Record<string, any>, resetAll = false) => {
    if (!getAdminToken()) return;
    const patch = { ...initialPatch };
    if (catalogSyncReadyRef.current) {
      // Products/categories are published through /api/catalog instead.
      delete patch.products;
      delete patch.categories;
      if (!resetAll && Object.keys(patch).length === 0) return;
    }
    try {
      authFetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch, resetAll }),
      })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (data && typeof data.version === 'number') {
            serverVersionRef.current = data.version;
          }
        })
        .catch(() => {});
    } catch {
      // Ignore network errors when offline
    }
  };

  const applyRemoteCatalog = useCallback((catalog: RemoteCatalogState) => {
    catalogSyncReadyRef.current = true;

    if (!catalog.initialized) {
      catalogVersionRef.current = 0;
      catalogInitializedRef.current = false;
      catalogSnapshotRef.current = null;
      return;
    }

    const previousVersion = catalogVersionRef.current;
    const localSnapshot = makeCatalogSnapshot(productsRef.current, categoriesRef.current);
    const hasUnpublishedLocalChange = Boolean(
      getAdminToken() &&
      catalogSnapshotRef.current &&
      localSnapshot !== catalogSnapshotRef.current
    );
    if (hasUnpublishedLocalChange && catalog.version <= previousVersion) {
      // A poll that started before a staff edit must not erase that edit
      // while its debounced publication is still pending.
      return;
    }

    catalogVersionRef.current = catalog.version;
    catalogInitializedRef.current = true;
    if (catalog.unchanged) return;

    catalogSnapshotRef.current = makeCatalogSnapshot(catalog.products, catalog.categories);
    productsRef.current = catalog.products;
    categoriesRef.current = catalog.categories;
    isRemoteUpdateRef.current = true;
    try {
      setProducts(prev =>
        JSON.stringify(prev) === JSON.stringify(catalog.products) ? prev : catalog.products
      );
      setCategories(prev =>
        JSON.stringify(prev) === JSON.stringify(catalog.categories) ? prev : catalog.categories
      );
    } finally {
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 60);
    }
  }, []);

  const publishCatalogToSupabase = useCallback(async (
    nextProducts: Product[] = productsRef.current,
    nextCategories: ProductCategoryItem[] = categoriesRef.current
  ) => {
    if (!getAdminToken() || !catalogSyncReadyRef.current) return;

    const requestSnapshot = makeCatalogSnapshot(nextProducts, nextCategories);
    if (requestSnapshot === catalogSnapshotRef.current) return;

    if (catalogPublishInFlightRef.current) {
      catalogPublishPendingRef.current = true;
      return;
    }
    catalogPublishInFlightRef.current = true;

    try {
      const saved = await publishCatalogRemote({
        products: nextProducts,
        categories: nextCategories,
        expectedVersion: catalogVersionRef.current,
      });
      if (!saved?.initialized) return;

      const currentSnapshot = makeCatalogSnapshot(productsRef.current, categoriesRef.current);
      if (currentSnapshot === requestSnapshot) {
        // The API may have replaced local data URLs with public Supabase
        // Storage URLs; applying its response makes every screen use them.
        applyRemoteCatalog(saved);
      } else {
        catalogVersionRef.current = saved.version;
        catalogInitializedRef.current = true;
        catalogSyncReadyRef.current = true;
        catalogSnapshotRef.current = makeCatalogSnapshot(saved.products, saved.categories);
        catalogPublishPendingRef.current = true;
      }
    } catch (err: any) {
      if (err?.status === 409) {
        // Another staff screen published first. Force the next short poll to
        // reload the full authoritative catalog instead of retrying stale data.
        catalogInitializedRef.current = false;
        catalogVersionRef.current = 0;
        catalogSnapshotRef.current = null;
        catalogSyncReadyRef.current = false;
      }
      console.warn('Catalog publication failed:', err);
    } finally {
      catalogPublishInFlightRef.current = false;
      if (catalogPublishPendingRef.current) {
        catalogPublishPendingRef.current = false;
        void publishCatalogToSupabase(productsRef.current, categoriesRef.current);
      }
    }
  }, [applyRemoteCatalog]);

  const refreshCatalogFromSupabase = useCallback(async () => {
    if (catalogRefreshInFlightRef.current) {
      catalogRefreshPendingRef.current = true;
      return;
    }
    catalogRefreshInFlightRef.current = true;

    try {
      const remote = await fetchCatalogRemote(
        catalogInitializedRef.current ? catalogVersionRef.current : undefined
      );
      catalogSyncReadyRef.current = true;

      if (remote.initialized) {
        applyRemoteCatalog(remote);
      } else {
        catalogVersionRef.current = 0;
        catalogInitializedRef.current = false;
        catalogSnapshotRef.current = null;

        // One-time bootstrap: only a Manager browser may turn its current
        // local catalog into the first shared catalog. Requiring at least
        // one already-imported product photo prevents a second, seed-only
        // Manager browser from winning the race and replacing the photos
        // held by the browser used to import them. A later explicit product
        // or category edit can still perform the first publication.
        const hasImportedProductImage = productsRef.current.some(
          product => Boolean(product.imageUrl || product.imageThumbUrl)
        );
        if (
          getAdminToken() &&
          getStoredAdminRole() === 'gerant' &&
          hasImportedProductImage
        ) {
          void publishCatalogToSupabase(productsRef.current, categoriesRef.current);
        }
      }
    } catch (err: any) {
      // Before the SQL migration, or while offline, keep the local/seed
      // catalog visible and let the next poll retry automatically.
      if (err?.status !== 404) {
        console.warn('Catalog synchronization failed:', err);
      }
    } finally {
      catalogRefreshInFlightRef.current = false;
      if (catalogRefreshPendingRef.current) {
        catalogRefreshPendingRef.current = false;
        void refreshCatalogFromSupabase();
      }
    }
  }, [applyRemoteCatalog, publishCatalogToSupabase]);

  const normalizeRemoteOrderForCurrentDay = (order: Order): Order => {
    const day = currentDayRef.current;
    if (!day || day.status !== 'open' || !day.openedAt) return order;

    const openedTime = new Date(day.openedAt).getTime();
    const orderTime = new Date(order.createdAt).getTime();
    const sameBusinessDate = getAlgiersDateString(order.createdAt) === day.date;
    if (
      order.dayId !== day.id &&
      (
        sameBusinessDate ||
        (Number.isFinite(openedTime) && Number.isFinite(orderTime) && orderTime >= openedTime)
      )
    ) {
      // La journée reste locale à chaque appareil : on rattache visuellement
      // la commande partagée à la journée ouverte de cet appareil pour que
      // Kanban, compteurs et statistiques se mettent à jour ensemble.
      return { ...order, dayId: day.id };
    }

    return order;
  };

  const mergeRemoteOrders = (
    incomingOrders: Order[],
    { announceNew = true }: { announceNew?: boolean } = {}
  ) => {
    if (!Array.isArray(incomingOrders) || incomingOrders.length === 0) return;

    setOrders(prev => {
      const mergedById = new Map<string, Order>(prev.map(order => [order.id, order]));
      let changed = false;
      let hasBrandNewPending = false;
      let hasStatusChanged = false;

      for (const rawIncoming of incomingOrders) {
        const existing = mergedById.get(rawIncoming.id);
        const normalized = normalizeRemoteOrderForCurrentDay(migrateOrderDefaults(rawIncoming));
        const nextOrder: Order = {
          ...normalized,
          isNewAlert: existing
            ? (existing.isNewAlert === false ? false : normalized.isNewAlert)
            : (normalized.status === 'pending' ? true : normalized.isNewAlert),
        };

        if (
          !existing &&
          announceNew &&
          remoteOrdersLoadedRef.current &&
          nextOrder.status === 'pending'
        ) {
          hasBrandNewPending = true;
        }

        if (existing && existing.status !== nextOrder.status) {
          hasStatusChanged = true;
        }

        if (!existing || JSON.stringify(existing) !== JSON.stringify(nextOrder)) {
          changed = true;
          mergedById.set(nextOrder.id, nextOrder);
        }
      }

      if (!changed) return prev;

      if (soundEnabledRef.current) {
        if (hasBrandNewPending) {
          soundService.playNewOrderBeep();
        } else if (hasStatusChanged) {
          soundService.playSuccess();
        }
      }

      return Array.from(mergedById.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  };

  const refreshOrdersFromSupabase = useCallback(async () => {
    if (ordersRefreshInFlightRef.current) {
      ordersRefreshPendingRef.current = true;
      return;
    }
    ordersRefreshInFlightRef.current = true;

    try {
      let incoming: Order[] = [];

      if (getAdminToken()) {
        incoming = await fetchOrdersRemote(500);
      } else if (clientActiveOrderId && isRemoteOrderId(clientActiveOrderId)) {
        incoming = [await fetchOrderRemote(clientActiveOrderId)];
      } else {
        return;
      }

      mergeRemoteOrders(incoming);
      remoteOrdersLoadedRef.current = true;
    } catch (err) {
      // Le polling/Realtime réessaiera automatiquement ; après une coupure,
      // la prochaine lecture complète rattrape toutes les commandes manquées.
      console.warn('Order synchronization failed:', err);
    } finally {
      ordersRefreshInFlightRef.current = false;
      if (ordersRefreshPendingRef.current) {
        ordersRefreshPendingRef.current = false;
        void refreshOrdersFromSupabase();
      }
    }
  }, [clientActiveOrderId]);

  // Explicit remote state fetch function (available for polling, order creation & manual refresh button)
  const refreshRemoteState = useCallback(async () => {
    try {
      const adminToken = getAdminToken();
      let url = '/api/state';
      if (adminToken || userRole) {
        const tokenParam = adminToken ? `token=${encodeURIComponent(adminToken)}&` : '';
        url = `/api/state?${tokenParam}role=${encodeURIComponent(userRole || 'gerant')}`;
      } else {
        url = `/api/state?orderIds=${encodeURIComponent(clientActiveOrderId || '')}`;
      }

      const res = await authFetch(url);
      if (res.ok) {
        const serverData = await res.json();
        if (serverData) {
          applyRemoteServerState(serverData);
        }
      }
    } catch {
      // Ignore network failures
    }
  }, [userRole, clientActiveOrderId]);

  // Real-time multi-device Server-Sent Events (SSE) + automatic REST sync fallback (Smartphone <-> PC)
  useEffect(() => {
    let isMounted = true;

    // 1. Initial REST fetch
    refreshRemoteState();

    // 2. Server-Sent Events (SSE) stream over standard HTTPS
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        const adminToken = getAdminToken();
        const sseUrl = (adminToken || userRole)
          ? `/api/stream?${adminToken ? `token=${encodeURIComponent(adminToken)}&` : ''}role=${encodeURIComponent(userRole || 'gerant')}`
          : `/api/stream?orderIds=${encodeURIComponent(clientActiveOrderId || '')}`;
        const es = new EventSource(sseUrl);
        sseRef.current = es;
        es.onmessage = event => {
          if (!isMounted) return;
          try {
            const msg = JSON.parse(event.data);
            if ((msg.type === 'sync:init' || msg.type === 'sync:update') && msg.state) {
              applyRemoteServerState(msg.state);
            }
          } catch {
            // ignore malformed message
          }
        };
      } catch {
        // Fallback to HTTP polling below
      }
    }

    // 3. Fast periodic polling (every 2 seconds)
    const pollInterval = setInterval(() => {
      if (!isMounted) return;
      refreshRemoteState();
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [userRole, clientActiveOrderId, refreshRemoteState]);

  // Commandes partagées : Supabase Realtime + polling de secours toutes les 5 s.
  // Le même mécanisme sert au rattrapage après retour du réseau.
  useEffect(() => {
    let isMounted = true;

    const refresh = () => {
      if (isMounted) void refreshOrdersFromSupabase();
    };

    refresh();

    const unsubscribe = subscribeToOrderChanges({
      customerOrderId: clientActiveOrderId,
      onChange: refresh,
    });

    const pollInterval = setInterval(refresh, 5000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', handleVisibility);
      unsubscribe();
    };
  }, [clientActiveOrderId, authenticatedRole, userRole, refreshOrdersFromSupabase]);

  // Catalogue partagé Supabase : chargement public pour les clients, bootstrap
  // unique depuis le navigateur Gérant, puis polling léger par version. Une
  // photo publiée par le gérant apparaît donc aussi dans un autre navigateur
  // ou sur un autre appareil, sans dépendre de son localStorage.
  useEffect(() => {
    let isMounted = true;

    const refresh = () => {
      if (isMounted) void refreshCatalogFromSupabase();
    };

    refresh();
    const pollInterval = setInterval(refresh, 2000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('online', refresh);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('online', refresh);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [authenticatedRole, userRole, refreshCatalogFromSupabase]);

  // Publier automatiquement produits/catégories dès qu'un écran staff les
  // modifie. Le snapshot empêche l'écho lorsqu'on vient d'appliquer la
  // version distante; le serveur limite en plus les non-gérants au stock.
  useEffect(() => {
    if (!catalogSyncReadyRef.current || !getAdminToken()) return;
    const snapshot = makeCatalogSnapshot(products, categories);
    if (snapshot === catalogSnapshotRef.current) return;

    const timer = setTimeout(() => {
      void publishCatalogToSupabase(products, categories);
    }, 350);
    return () => clearTimeout(timer);
  }, [products, categories, publishCatalogToSupabase]);

  // Automatically sync general state changes to server when modified locally (Admin only)
  useEffect(() => {
    if (isRemoteUpdateRef.current || !getAdminToken()) return;
    const timer = setTimeout(() => {
      if (!isRemoteUpdateRef.current && getAdminToken()) {
        pushPatchToServer({
          products,
          customers,
          days: computedDays,
          settings,
          stockItems,
          compositions,
          stockMovements,
          expenses,
          cashClosings,
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [
    products,
    customers,
    computedDays,
    settings,
    stockItems,
    compositions,
    stockMovements,
    expenses,
    cashClosings,
  ]);

  // Cross-tab real-time synchronization via 'storage' event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      try {
        if (e.key === STORAGE_KEYS.ORDERS && e.newValue) {
          const incomingOrders: Order[] = JSON.parse(e.newValue);
          setOrders(prev => {
            if (JSON.stringify(prev) === e.newValue) return prev;

            // Ne jamais laisser un cache local d'un autre onglet écraser une
            // commande Supabase plus récente déjà affichée dans celui-ci.
            const mergedById = new Map<string, Order>(prev.map(o => [o.id, o]));
            let changed = false;
            let hasBrandNewOrder = false;

            for (const incoming of incomingOrders) {
              const existing = mergedById.get(incoming.id);
              if (!existing) {
                mergedById.set(incoming.id, incoming);
                changed = true;
                if (incoming.status === 'pending') hasBrandNewOrder = true;
                continue;
              }

              const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime();
              const incomingTime = new Date(incoming.updatedAt || incoming.createdAt).getTime();
              if (
                (!Number.isFinite(existingTime) || !Number.isFinite(incomingTime) || incomingTime >= existingTime) &&
                JSON.stringify(existing) !== JSON.stringify(incoming)
              ) {
                mergedById.set(incoming.id, incoming);
                changed = true;
              }
            }

            if (!changed) return prev;
            if (hasBrandNewOrder && soundEnabledRef.current) {
              soundService.playNewOrderBeep();
            }

            return Array.from(mergedById.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        } else if (e.key === STORAGE_KEYS.DAYS && e.newValue) {
          setDays(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.PRODUCTS && e.newValue) {
          setProducts(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.CUSTOMERS && e.newValue) {
          setCustomers(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.SETTINGS && e.newValue) {
          setSettings(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.STOCK_ITEMS && e.newValue) {
          setStockItems(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.COMPOSITIONS && e.newValue) {
          setCompositions(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.STOCK_MOVEMENTS && e.newValue) {
          setStockMovements(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.EXPENSES && e.newValue) {
          setExpenses(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.CASH_CLOSINGS && e.newValue) {
          setCashClosings(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.CURRENT_CUSTOMER) {
          setCurrentCustomer(e.newValue ? JSON.parse(e.newValue) : null);
        } else if (e.key === STORAGE_KEYS.CART && e.newValue) {
          setCart(prev => (JSON.stringify(prev) === e.newValue ? prev : JSON.parse(e.newValue!)));
        } else if (e.key === STORAGE_KEYS.LANG && e.newValue) {
          setLanguageState(e.newValue as Language);
        } else if (e.key === STORAGE_KEYS.ROLE && e.newValue) {
          setUserRoleState(e.newValue as UserRole);
        }
      } catch (err) {
        console.warn('Cross-tab storage sync error:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const setAuthenticatedRole = (role: UserRole) => {
    setAuthenticatedRoleState(role);
    setUserRoleState(role);
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    if (role === 'caissier') {
      setBackOfficeTabState(prev => (prev === 'orders' || prev === 'clients' ? prev : 'orders'));
    } else if (role === 'cuisinier') {
      setBackOfficeTabState(prev => (prev === 'orders' || prev === 'stock' ? prev : 'orders'));
    }
  };

  // Role Guarded Tab Navigation
  const setUserRole = (role: UserRole) => {
    // Security guard: Only authenticated 'gerant' can switch role views
    if (authenticatedRole !== 'gerant' && role !== authenticatedRole) {
      return;
    }
    setUserRoleState(role);
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    // Guard routes on role change
    if (role === 'caissier') {
      setBackOfficeTabState(prev => (prev === 'orders' || prev === 'clients' ? prev : 'orders'));
    } else if (role === 'cuisinier') {
      setBackOfficeTabState(prev => (prev === 'orders' || prev === 'stock' ? prev : 'orders'));
    }
  };

  const setBackOfficeTab = (tab: BackOfficeTab) => {
    const effectiveRole = authenticatedRole !== 'gerant' ? authenticatedRole : userRole;
    // Caissier can only access 'orders' or 'clients'
    if (effectiveRole === 'caissier' && tab !== 'orders' && tab !== 'clients') {
      setBackOfficeTabState('orders');
      return;
    }
    // Cuisinier can only access 'orders' or 'stock'
    if (effectiveRole === 'cuisinier' && tab !== 'orders' && tab !== 'stock') {
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

  // Client active order object lookup: match clientActiveOrderId or fallback to current customer's most recent order
  const clientActiveOrder = useMemo(() => {
    if (clientActiveOrderId) {
      const byId = orders.find(o => o.id === clientActiveOrderId);
      if (byId) return byId;
    }
    if (currentCustomer) {
      const custOrder = orders.find(
        o => o.customerId === currentCustomer.id || o.customerPhone === currentCustomer.phone
      );
      if (custOrder) return custOrder;
    }
    return orders[0] || null;
  }, [clientActiveOrderId, orders, currentCustomer]);

  const setClientActiveOrder = (ord: Order | null) => {
    setClientActiveOrderId(ord ? ord.id : null);
  };

  const unreadAlertCount = orders.filter(
    o =>
      o.isNewAlert &&
      o.status === 'pending' &&
      (!currentDay ||
        o.dayId === currentDay.id ||
        getAlgiersDateString(o.createdAt) === currentDay.date)
  ).length;

  const clearNewOrderAlert = (orderId: string) => {
    const previousOrder = orders.find(o => o.id === orderId);
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, isNewAlert: false } : o))
    );

    if (isRemoteOrderId(orderId) && previousOrder) {
      void updateOrderRemote(orderId, {
        isNewAlert: false,
        expectedUpdatedAt: previousOrder.updatedAt,
      })
        .then(serverOrder => mergeRemoteOrders([serverOrder], { announceNew: false }))
        .catch(err => {
          console.warn('Remote order alert update failed:', err);
          setOrders(prev => prev.map(o => (o.id === orderId ? previousOrder : o)));
          void refreshOrdersFromSupabase();
        });
    }
  };

  // Place order from Client : la commande n'existe localement qu'après
  // confirmation de /api/orders. En cas d'échec, le panier reste intact.
  const placeOrder = async ({
    type,
    items: requestedItems,
    clientRequestId,
    accessToken,
    deliveryAddress,
    pickupTimeSlot,
    kitchenNotes,
  }: {
    type: OrderType;
    items?: OrderItem[];
    clientRequestId: string;
    accessToken: string;
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
  }): Promise<Order | null> => {
    const items = requestedItems?.length ? [...requestedItems] : [...cart];

    if (items.length === 0) {
      throw new Error(language === 'ar' ? 'سلة المشتريات فارغة.' : 'Votre panier est vide.');
    }

    if (!isStoreActuallyOpen || !currentDay) {
      throw new Error(
        language === 'ar'
          ? 'المطعم مغلق حالياً. لا يمكن استقبال طلبات جديدة.'
          : 'Le restaurant est actuellement fermé. Commandes impossibles.'
      );
    }

    const unavailable = items.some(item => {
      const prod = products.find(p => p.id === item.productId);
      return prod && !prod.isAvailable;
    });
    if (unavailable) {
      throw new Error(
        language === 'ar'
          ? 'منتج واحد على الأقل لم يعد متاحاً.'
          : 'Au moins un produit de votre panier n’est plus disponible.'
      );
    }

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
      orderCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };

    const { order: serverOrder } = await createOrderRemote({
      clientRequestId,
      accessToken,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      type,
      source: 'app',
      items,
      deliveryAddress: type === 'delivery' ? deliveryAddress : undefined,
      pickupTimeSlot: type === 'pickup' ? pickupTimeSlot || 'Dès que possible' : undefined,
      kitchenNotes,
      dayId: currentDay.id,
      language,
    }, { staff: false });

    setCustomers(prev =>
      prev.map(c =>
        c.id === customer.id
          ? {
              ...c,
              orderCount: c.orderCount + 1,
              totalSpent: c.totalSpent + serverOrder.total,
            }
          : c
      )
    );

    mergeRemoteOrders([serverOrder], { announceNew: false });
    remoteOrdersLoadedRef.current = true;
    setClientActiveOrderId(serverOrder.id);

    // Ne retirer que les quantités effectivement confirmées par le serveur.
    setCart(prev => {
      let next = [...prev];
      for (const orderedItem of items) {
        next = next
          .map(item => item.productId === orderedItem.productId
            ? { ...item, quantity: item.quantity - orderedItem.quantity }
            : item)
          .filter(item => item.quantity > 0);
      }
      return next;
    });

    if (settings.soundEnabled) {
      soundService.playNewOrderBeep();
    }

    return serverOrder;
  };

  // Add manual order from Back-Office via la même API partagée.
  const addManualOrder = async ({
    clientRequestId,
    accessToken,
    customerName,
    customerPhone,
    type,
    status: initialStatus = 'pending',
    source,
    paymentMethod,
    driverName,
    driverFee,
    items,
    deliveryFee: customDeliveryFee,
    deliveryAddress,
    pickupTimeSlot,
    kitchenNotes,
    sentToWhatsApp,
    sentAt,
  }: {
    clientRequestId: string;
    accessToken: string;
    customerName: string;
    customerPhone: string;
    type: OrderType;
    status?: OrderStatus;
    source?: OrderSource;
    paymentMethod?: PaymentMethod;
    driverName?: string;
    driverFee?: number;
    items: OrderItem[];
    deliveryFee?: number;
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
    sentToWhatsApp?: boolean;
    sentAt?: string;
  }): Promise<Order | null> => {
    const nowIso = new Date().toISOString();
    const existingCustomer = customers.find(c => c.phone === customerPhone);
    const customerForOrder: Customer = existingCustomer || {
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
      orderCount: 0,
      totalSpent: 0,
      createdAt: nowIso,
    };

    const { order: serverOrder } = await createOrderRemote({
      clientRequestId,
      accessToken,
      customerId: customerForOrder.id,
      customerName,
      customerPhone,
      type,
      status: initialStatus,
      source: source || 'counter',
      paymentMethod: paymentMethod || 'cash',
      driverName: type === 'delivery' ? driverName : undefined,
      driverFee: type === 'delivery' ? driverFee : undefined,
      items,
      deliveryFee: customDeliveryFee,
      deliveryAddress: type === 'delivery' ? deliveryAddress : undefined,
      pickupTimeSlot: type === 'pickup' ? pickupTimeSlot : undefined,
      kitchenNotes,
      dayId: currentDay?.id,
      stockDeducted: initialStatus === 'ready' || (initialStatus as any) === 'preparing',
      sentToWhatsApp: Boolean(sentToWhatsApp),
      sentAt: sentAt || (sentToWhatsApp ? nowIso : undefined),
      language,
    }, { staff: true });

    if (existingCustomer) {
      setCustomers(prev =>
        prev.map(c =>
          c.id === existingCustomer.id
            ? {
                ...c,
                orderCount: c.orderCount + 1,
                totalSpent: c.totalSpent + serverOrder.total,
                mapUrl: deliveryAddress?.mapUrl || c.mapUrl,
                latitude: deliveryAddress?.latitude || c.latitude,
                longitude: deliveryAddress?.longitude || c.longitude,
              }
            : c
        )
      );
    } else {
      setCustomers(prev => [{
        ...customerForOrder,
        orderCount: 1,
        totalSpent: serverOrder.total,
      }, ...prev]);
    }

    if (initialStatus === 'ready' || (initialStatus as any) === 'preparing') {
      deductStockForOrder(serverOrder);
    }

    // L'appareil qui saisit la commande ne doit pas se l'alerter à lui-même ;
    // les autres tableaux de bord la verront comme nouvelle.
    mergeRemoteOrders([serverOrder], { announceNew: false });
    setOrders(prev => prev.map(o => o.id === serverOrder.id ? { ...o, isNewAlert: false } : o));
    remoteOrdersLoadedRef.current = true;
    soundService.playSuccess();

    return { ...serverOrder, isNewAlert: false };
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
  const advanceOrderStatus = (
    orderId: string,
    nextStatus: OrderStatus,
    note?: string,
    paymentMethod?: PaymentMethod,
    driverName?: string,
    driverFee?: number
  ) => {
    const nowIso = new Date().toISOString();
    const targetOrder = orders.find(o => o.id === orderId);

    // Auto-deduct stock on ready (or preparing)
    if (
      targetOrder &&
      (nextStatus === 'ready' || (nextStatus as any) === 'preparing') &&
      !targetOrder.stockDeducted
    ) {
      deductStockForOrder(targetOrder);
    }

    const shouldAutoSendWhatsApp = Boolean(
      settings.autoSendWhatsAppOnAccept &&
        (nextStatus === 'ready' || (nextStatus as any) === 'preparing') &&
        targetOrder &&
        !targetOrder.sentToWhatsApp
    );

    const updatedTargetOrder: Order | null = targetOrder
      ? {
          ...targetOrder,
          status: nextStatus,
          paymentMethod: paymentMethod || targetOrder.paymentMethod || 'cash',
          driverName: driverName !== undefined ? driverName : targetOrder.driverName,
          driverFee: driverFee !== undefined ? driverFee : targetOrder.driverFee,
          updatedAt: nowIso,
          isNewAlert: false,
          sentToWhatsApp: shouldAutoSendWhatsApp ? true : targetOrder.sentToWhatsApp,
          sentAt: shouldAutoSendWhatsApp ? nowIso : targetOrder.sentAt,
          stockDeducted:
            nextStatus === 'ready' || (nextStatus as any) === 'preparing'
              ? true
              : targetOrder.stockDeducted,
          statusHistory: [
            ...(Array.isArray(targetOrder.statusHistory) ? targetOrder.statusHistory : []),
            {
              status: nextStatus,
              timestamp: nowIso,
              note:
                note ||
                (nextStatus === 'ready'
                  ? 'Commande prête'
                  : nextStatus === 'delivered'
                  ? 'Livrée / Récupérée avec succès'
                  : 'Statut mis à jour'),
            },
          ],
        }
      : null;

    if (updatedTargetOrder) {
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedTargetOrder : o)));
    }

    if (updatedTargetOrder) {
      const optimisticOrder = updatedTargetOrder as Order;

      if (isRemoteOrderId(orderId) && targetOrder) {
        void updateOrderRemote(orderId, {
          status: nextStatus,
          note,
          paymentMethod: optimisticOrder.paymentMethod,
          driverName: optimisticOrder.driverName,
          driverFee: optimisticOrder.driverFee,
          stockDeducted: optimisticOrder.stockDeducted,
          isNewAlert: false,
          sentToWhatsApp: optimisticOrder.sentToWhatsApp,
          sentAt: optimisticOrder.sentAt,
          expectedUpdatedAt: targetOrder.updatedAt,
          language,
        })
          .then(serverOrder => {
            mergeRemoteOrders([serverOrder], { announceNew: false });
            if (shouldAutoSendWhatsApp) {
              try {
                sendToWhatsApp(serverOrder);
              } catch (err) {
                console.warn('Auto send WhatsApp failed:', err);
              }
            }
          })
          .catch(err => {
            console.warn('Remote order status update failed:', err);
            setOrders(prev => prev.map(o => (o.id === orderId ? targetOrder : o)));
            void refreshOrdersFromSupabase();
            alert(
              err?.message ||
                (language === 'ar'
                  ? 'فشلت مزامنة حالة الطلب. حاول مرة أخرى.'
                  : 'Échec de synchronisation du statut. Veuillez réessayer.')
            );
          });
      } else if (shouldAutoSendWhatsApp) {
        try {
          sendToWhatsApp(optimisticOrder);
        } catch (err) {
          console.warn('Auto send WhatsApp failed:', err);
        }
      }
    }

    soundService.playSuccess();
  };

  // Mark order as dispatched to WhatsApp group
  const markOrderSentToWhatsApp = (orderId: string) => {
    const nowIso = new Date().toISOString();
    const previousOrder = orders.find(o => o.id === orderId);
    const updatedTargetOrder: Order | null = previousOrder
      ? {
          ...previousOrder,
          sentToWhatsApp: true,
          sentAt: nowIso,
          updatedAt: nowIso,
        }
      : null;

    if (updatedTargetOrder) {
      setOrders(prev => prev.map(o => (o.id === orderId ? updatedTargetOrder : o)));
    }

    if (updatedTargetOrder && isRemoteOrderId(orderId) && previousOrder) {
      void updateOrderRemote(orderId, {
        sentToWhatsApp: true,
        sentAt: nowIso,
        expectedUpdatedAt: previousOrder.updatedAt,
      })
        .then(serverOrder => mergeRemoteOrders([serverOrder], { announceNew: false }))
        .catch(err => {
          console.warn('Remote WhatsApp status update failed:', err);
          setOrders(prev => prev.map(o => (o.id === orderId ? previousOrder : o)));
          void refreshOrdersFromSupabase();
        });
    }
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

    const cancelledTargetOrder: Order | null = order
      ? {
          ...order,
          status: 'cancelled',
          cancellationReason: reason,
          updatedAt: nowIso,
          isNewAlert: false,
          statusHistory: [
            ...(Array.isArray(order.statusHistory) ? order.statusHistory : []),
            {
              status: 'cancelled',
              timestamp: nowIso,
              note: `Annulée: ${reason}`,
            },
          ],
        }
      : null;

    if (cancelledTargetOrder) {
      setOrders(prev => prev.map(o => (o.id === orderId ? cancelledTargetOrder : o)));
    }

    if (cancelledTargetOrder && isRemoteOrderId(orderId) && order) {
      void updateOrderRemote(orderId, {
        status: 'cancelled',
        note: `Annulée: ${reason}`,
        cancellationReason: reason,
        isNewAlert: false,
        expectedUpdatedAt: order.updatedAt,
        language,
      })
        .then(serverOrder => mergeRemoteOrders([serverOrder], { announceNew: false }))
        .catch(err => {
          console.warn('Remote order cancellation failed:', err);
          setOrders(prev => prev.map(o => (o.id === orderId ? order : o)));
          void refreshOrdersFromSupabase();
          alert(
            err?.message ||
              (language === 'ar'
                ? 'فشلت مزامنة إلغاء الطلب. حاول مرة أخرى.'
                : 'Échec de synchronisation de l’annulation. Veuillez réessayer.')
          );
        });
    }

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
      o => o.status === 'delivered' && Boolean(o.createdAt) && typeof o.createdAt === 'string' && o.createdAt.startsWith(data.date)
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
  const unlockRevenue = async (pin: string): Promise<boolean> => {
    const cleanPin = pin.trim();
    if (cleanPin === '0000') {
      setIsRevenueUnlocked(true);
      soundService.playSuccess();
      return true;
    }
    const isValid = await verifyManagerPinServer(cleanPin);
    if (isValid) {
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
      isVisible: prodData.isVisible !== undefined ? prodData.isVisible : true,
      isArchived: false,
      isAvailable: prodData.isAvailable !== undefined ? prodData.isAvailable : true,
      sortOrder: prodData.sortOrder ?? products.length + 1,
    };
    const next = [...products, newProd];
    setProducts(next);
    pushPatchToServer({ products: next });
    soundService.playSuccess();
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const next = products.map(p => (p.id === id ? { ...p, ...updates } : p));
    setProducts(next);
    pushPatchToServer({ products: next });
    soundService.playSuccess();
  };

  const deleteProduct = (id: string) => {
    // Soft delete to protect past orders historical snapshots
    const next = products.map(p => (p.id === id ? { ...p, isArchived: true, isVisible: false } : p));
    setProducts(next);
    pushPatchToServer({ products: next });
    soundService.playSuccess();
  };

  const duplicateProduct = (id: string) => {
    const original = products.find(p => p.id === id);
    if (!original) return;
    const copy: Product = {
      ...original,
      id: `prod-${Date.now()}`,
      nameFr: `${original.nameFr} (Copie)`,
      nameAr: original.nameAr ? `${original.nameAr} (نسخة)` : `${original.nameFr} (نسخة)`,
      isArchived: false,
      isVisible: true,
      sortOrder: (original.sortOrder || 0) + 1,
    };
    const next = [...products, copy];
    setProducts(next);
    pushPatchToServer({ products: next });
    soundService.playSuccess();
  };

  const toggleProductAvailability = (id: string) => {
    const next = products.map(p => (p.id === id ? { ...p, isAvailable: !p.isAvailable } : p));
    setProducts(next);
    pushPatchToServer({ products: next });
    soundService.playSuccess();
  };

  const reorderProducts = (_categoryId: string, orderedProductIds: string[]) => {
    const next = products.map(p => {
      const idx = orderedProductIds.indexOf(p.id);
      if (idx !== -1) {
        return { ...p, sortOrder: idx + 1 };
      }
      return p;
    });
    setProducts(next);
    pushPatchToServer({ products: next });
  };

  // Categories methods
  const addCategory = (catData: Omit<ProductCategoryItem, 'id' | 'order'>) => {
    const newCat: ProductCategoryItem = {
      ...catData,
      id: `cat-${Date.now()}`,
      order: categories.length + 1,
    };
    const next = [...categories, newCat];
    setCategories(next);
    pushPatchToServer({ categories: next });
    soundService.playSuccess();
  };

  const updateCategory = (id: string, updates: Partial<ProductCategoryItem>) => {
    const next = categories.map(c => (c.id === id ? { ...c, ...updates } : c));
    setCategories(next);
    pushPatchToServer({ categories: next });
    soundService.playSuccess();
  };

  const deleteCategory = (id: string, moveProductsToCategoryId?: string) => {
    const nextCats = categories.filter(c => c.id !== id);
    setCategories(nextCats);

    let nextProds = products;
    if (moveProductsToCategoryId) {
      nextProds = products.map(p => (p.category === id ? { ...p, category: moveProductsToCategoryId } : p));
      setProducts(nextProds);
    }
    pushPatchToServer({ categories: nextCats, products: nextProds });
    soundService.playSuccess();
  };

  const reorderCategories = (orderedIds: string[]) => {
    const next = categories
      .map(c => {
        const idx = orderedIds.indexOf(c.id);
        return idx !== -1 ? { ...c, order: idx + 1 } : c;
      })
      .sort((a, b) => a.order - b.order);
    setCategories(next);
    pushPatchToServer({ categories: next });
  };

  // Client Page Content methods
  const updateClientPageContent = (updates: Partial<ClientPageContent>) => {
    setClientPageContent(prev => ({ ...prev, ...updates }));
  };

  const publishClientPageContent = async (contentToPublish: ClientPageContent): Promise<boolean> => {
    try {
      const res = await authFetch('/api/client-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientPageContent: contentToPublish }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.clientPageContent) {
          setClientPageContent(data.clientPageContent);
        }
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
        pushPatchToServer({ clientPageContent: data.clientPageContent || contentToPublish });
        soundService.playSuccess();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Backup & Restore
  const exportCatalogJson = (): string => {
    const exportData = {
      exportDate: new Date().toISOString(),
      restaurant: clientPageContent.restaurantNameFr || 'Sultan Ed-Djaj',
      categories,
      products: products.filter(p => !p.isArchived),
      version: 1,
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importCatalogJson = (jsonString: string): { success: boolean; message: string; count?: number } => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.products)) {
        return { success: false, message: 'Fichier invalide : liste de produits manquante.' };
      }
      const importedProducts: Product[] = parsed.products.map((p: any, idx: number) => ({
        id: p.id || `prod-${Date.now()}-${idx}`,
        nameFr: p.nameFr || 'Sans nom',
        nameAr: p.nameAr || p.nameFr || '',
        descriptionFr: p.descriptionFr || '',
        descriptionAr: p.descriptionAr || '',
        price: typeof p.price === 'number' ? p.price : 0,
        originalPrice: typeof p.originalPrice === 'number' ? p.originalPrice : undefined,
        category: p.category || 'poulet',
        imageUrl: p.imageUrl,
        imageThumbUrl: p.imageThumbUrl,
        isAvailable: p.isAvailable !== false,
        isVisible: p.isVisible !== false,
        isArchived: false,
        isFeatured: Boolean(p.isFeatured),
        badges: Array.isArray(p.badges) ? p.badges : [],
        options: Array.isArray(p.options) ? p.options : [],
        countsInChickenQuota: p.countsInChickenQuota !== false,
        chickenQuotaPerItem: typeof p.chickenQuotaPerItem === 'number' ? p.chickenQuotaPerItem : 1,
        sortOrder: typeof p.sortOrder === 'number' ? p.sortOrder : idx + 1,
      }));

      let nextCategories = categories;
      if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
        nextCategories = parsed.categories.map((c: any, idx: number) => ({
          id: c.id || `cat-${Date.now()}-${idx}`,
          nameFr: c.nameFr || 'Catégorie',
          nameAr: c.nameAr || c.nameFr || '',
          order: typeof c.order === 'number' ? c.order : idx + 1,
          icon: c.icon,
        }));
        setCategories(nextCategories);
      }

      setProducts(importedProducts);
      pushPatchToServer({ products: importedProducts, categories: nextCategories });
      soundService.playSuccess();
      return {
        success: true,
        message: `${importedProducts.length} produits importés avec succès`,
        count: importedProducts.length,
      };
    } catch (e: any) {
      return { success: false, message: `Erreur d'import : ${e?.message || 'Format JSON invalide'}` };
    }
  };

  const updateSettings = (updates: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetAllSeedData = () => {
    localStorage.clear();
    const generated = generateHistoricalData();
    const migrated = migrateOrdersAndDays(
      generated.orders,
      undefined,
      INITIAL_SETTINGS,
      INITIAL_COMPOSITIONS,
      generated.stockMovements
    );
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setOrders(migrated.orders);
    setDays(migrated.days);
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
    pushPatchToServer({}, true);
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
        authenticatedRole,
        setAuthenticatedRole,
        products,
        customers,
        orders,
        days: computedDays,
        currentDay,
        unclosedPastDay,
        lastClosedDayQuota,
        openDay,
        closeDay,
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
        markOrderSentToWhatsApp,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        toggleProductAvailability,
        reorderProducts,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        clientPageContent,
        updateClientPageContent,
        publishClientPageContent,
        exportCatalogJson,
        importCatalogJson,
        updateSettings,
        resetAllSeedData,
        resetToSeedData: resetAllSeedData,
        reorderPastOrder,
        registerOrLoginCustomer,
        logoutCustomer,
        refreshSync: async () => {
          await Promise.allSettled([
            refreshRemoteState(),
            refreshOrdersFromSupabase(),
            refreshCatalogFromSupabase(),
          ]);
        },
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
