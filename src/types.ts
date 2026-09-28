export type Language = 'fr' | 'ar';

export type UserRole = 'gerant' | 'cuisinier' | 'caissier';

export type ProductCategory = 'poulets' | 'accompagnements' | 'pains' | 'boissons';

export interface Product {
  id: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  price: number;
  category: ProductCategory;
  isAvailable: boolean;
  imageType: 'poulet-roti' | 'poulet-braise' | 'frites' | 'hmiss' | 'riz' | 'matlouh' | 'boisson';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  landmark?: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  orderCount: number;
  totalSpent: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  nameFr: string;
  nameAr: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderType = 'delivery' | 'pickup';

export interface StatusLog {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. #SD-0001
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
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
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusLog[];
  cancellationReason?: string;
  isNewAlert?: boolean;
  stockDeducted?: boolean; // indicates if ingredients were deducted on preparing
}

export interface StoreSettings {
  isOpen: boolean;
  isOpenManually?: boolean;
  manualOverride: boolean; // if false, relies on 13h - 00h
  openTime: string; // "13:00"
  closeTime: string; // "00:00"
  deliveryFee: number; // e.g. 200 DA
  estimatedPrepTimeMinutes: number; // e.g. 25 min
  phone: string; // "+213 771 01 20 33"
  address: string; // "Les Vergers, Birkhadem"
  city: string; // "Alger"
  soundEnabled: boolean;
  managerPin: string; // e.g. "0000"
  dailyRevenueTarget: number; // e.g. 25000 DA
  autoStockAvailability: boolean; // dynamic out-of-stock when portions = 0
  dailyChickenQuota: number; // Nombre de poulets prévus chaque jour (ex: 100)
  dailyChickenDate: string; // Date du quota actif (YYYY-MM-DD)
  dailyChickenInitial: number; // Quantité totale mise en cuisson/broche aujourd'hui (ex: 100)
}

// ══════════════════════════════════════════════════
// MODULE STOCK TYPES
// ══════════════════════════════════════════════════

export type StockCategory =
  | 'viandes'
  | 'poulet'
  | 'legumes'
  | 'epicerie'
  | 'epices_sauces'
  | 'boissons'
  | 'emballages'
  | 'combustible'
  | 'autre';

export type StockUnit = 'piece' | 'kg' | 'L' | 'boite' | 'pièce' | string;

export type AlertLevel = 'ok' | 'low' | 'critical' | 'out';

export interface StockItem {
  id: string;
  nameFr: string;
  nameAr: string;
  category: StockCategory;
  unit: StockUnit;
  currentStock: number;
  alertThreshold: number; // Seuil d'alerte (Bas, orange)
  criticalThreshold: number; // Seuil critique (rouge)
  idealStock: number; // Cible de réapprovisionnement
  unitCostDA: number; // Coût unitaire en DA (visible Gérant seul)
  supplierName: string; // Nom fournisseur
  supplierPhone: string; // Tél fournisseur
  location?: string; // Emplacement (Cuisine, Réserve, Chambre froide...)
  expiryDate?: string; // Date limite de consommation (DLC optionnelle)
  lastRestockedAt?: string;
}

export interface CompositionIngredient {
  stockItemId: string;
  quantity: number; // e.g. 1 (piece), 0.3 (kg), 0.03 (L)
}

export interface ProductComposition {
  productId: string;
  ingredients: CompositionIngredient[];
}

export type StockMovementType = 'in' | 'out_auto' | 'waste' | 'adjustment';

export interface StockMovement {
  id: string;
  timestamp: string;
  stockItemId: string;
  stockItemName: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  balanceAfter: number;
  authorRole: UserRole;
  authorName?: string;
  reason: string; // e.g. "Commande #SD-0002", "Brûlé", "Périmé", "Tombé", "Offert", "Inventaire...", "Réception..."
  orderId?: string;
  unitCostDA?: number;
}

export interface PurchaseItem {
  stockItem: StockItem;
  neededQuantity: number;
  estimatedCost: number;
  estimatedCostDA?: number;
}

export interface SupplierPurchaseGroup {
  supplierName: string;
  supplierPhone: string;
  items: PurchaseItem[];
  totalCost: number;
}

export interface InventoryDiscrepancy {
  stockItemId: string;
  stockItemName?: string;
  nameFr?: string;
  nameAr?: string;
  unit: StockUnit;
  theoreticalStock: number;
  countedStock: number;
  difference: number; // counted - theoretical
  unitCostDA?: number;
  totalCostDifference?: number; // difference * unitCostDA
  costDifferenceDA?: number;
}

// ══════════════════════════════════════════════════
// MODULE RECETTES (REVENUE & FINANCES) TYPES
// ══════════════════════════════════════════════════

export type ExpenseCategory =
  | 'achats_matieres'
  | 'livreur'
  | 'loyer'
  | 'energie'
  | 'salaires'
  | 'autre';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  note: string;
  stockPurchaseId?: string;
  createdBy: string;
  createdAt: string;
}

export interface CashClosing {
  id: string;
  date: string; // YYYY-MM-DD
  theoreticalCash: number; // CA espèces théorique (commandes livrées payées en espèces)
  countedCash: number; // Montant réel compté dans le tiroir caisse
  difference: number; // countedCash - theoreticalCash
  note?: string;
  closedBy: string;
  closedAt: string;
  locked: boolean;
}

export type RevenuePeriod =
  | 'today'
  | 'yesterday'
  | '7days'
  | '30days'
  | 'month'
  | 'custom';

export type BackOfficeTab =
  | 'orders'
  | 'catalog'
  | 'clients'
  | 'stock'
  | 'revenue'
  | 'settings';
