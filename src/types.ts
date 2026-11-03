export type Language = 'fr' | 'ar';

export type UserRole = 'gerant' | 'cuisinier' | 'caissier';

export type ProductCategory = 'poulets' | 'accompagnements' | 'pains' | 'boissons' | string;

export type ProductBadge = 'nouveau' | 'populaire' | 'epice' | 'promo';

export interface ProductOption {
  id: string;
  nameFr: string;
  nameAr: string;
  extraPrice: number;
}

export interface ProductCategoryItem {
  id: string;
  nameFr: string;
  nameAr: string;
  order: number;
}

export interface ClientPageContent {
  restaurantNameFr: string;
  restaurantNameAr: string;
  taglineFr: string;
  taglineAr: string;
  logoUrl?: string;
  banner: {
    enabled: boolean;
    textFr: string;
    textAr: string;
    imageUrl?: string;
    badgeTextFr?: string;
    badgeTextAr?: string;
  };
  contact: {
    address: string;
    phone: string;
    hours: string;
    whatsappUrl?: string;
    googleMapsUrl?: string;
    facebookUrl?: string;
    instagramUrl?: string;
  };
  service: {
    deliveryFee: number;
    prepTimeMinutes: number;
    announcementNotice?: string;
    showAnnouncement: boolean;
  };
  legalPages: {
    aboutFr: string;
    aboutAr: string;
    cguFr: string;
    cguAr: string;
    privacyFr: string;
    privacyAr: string;
  };
}

export interface Product {
  id: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  price: number;
  originalPrice?: number; // Prix barré / promo optionnel
  category: ProductCategory;
  isAvailable: boolean;
  isVisible?: boolean; // Default true (false = hidden on client)
  isFeatured?: boolean; // Pinned to top of category
  sortOrder?: number; // Ordre manuel au sein de la catégorie
  imageType?: 'poulet-roti' | 'poulet-braise' | 'frites' | 'hmiss' | 'riz' | 'matlouh' | 'boisson';
  imageUrl?: string; // 800px WebP ou URL
  imageThumbUrl?: string; // 400px WebP
  badges?: ProductBadge[]; // Nouveau, Populaire, Épicé, Promo
  options?: ProductOption[]; // Suppléments optionnels avec surcoût
  countsInChickenQuota?: boolean; // Compte dans le quota poulets
  chickenQuotaPerItem?: number; // Quantité décrémentée (ex: 1, 0.5)
  isArchived?: boolean; // Soft delete pour conserver l'historique
  createdAt?: string;
  updatedAt?: string;
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
  source?: OrderSource;
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
  dayId?: string;
  paymentMethod?: PaymentMethod; // 'cash' | 'card' | 'other' (default 'cash')
  driverName?: string;
  driverFee?: number;
  sentToWhatsApp?: boolean; // Indique si la commande a été envoyée au groupe WhatsApp de dispatch
  sentAt?: string; // Heure / date d'envoi au groupe WhatsApp
}

export type PaymentMethod = 'cash' | 'card' | 'other';
export type OrderSource = 'app' | 'phone' | 'counter' | 'whatsapp';

export type DayStatus = 'open' | 'closed';

export interface QuotaAdjustment {
  id: string;
  timestamp: string;
  previousQuota: number;
  newQuota: number;
  delta: number;
  mode: 'set_initial' | 'set_remaining' | 'add' | 'reset';
  authorRole: UserRole;
  reason?: string;
}

export interface Day {
  id: string;
  date: string; // YYYY-MM-DD (Africa/Algiers) ou 'initial'
  label?: string; // e.g., "Données initiales"
  status: DayStatus;
  openedAt: string;
  closedAt?: string;
  quotaInitial: number;
  quotaCurrent: number;
  quotaAdjustments: QuotaAdjustment[];
  pouletsVendus: number;
  pouletsRestants: number;
  nbCommandes: number; // Commandes delivered
  nbAnnulees: number;
  ca: number; // CA produits (hors frais de livraison)
  deliveryFees?: number; // Frais de livraison encaissés
  caTotal?: number; // CA total (produits + livraison)
  caInProgress?: number; // CA des commandes en cours
  panierMoyen: number; // CA produits / nbCommandes
  nbLivraison: number;
  nbComptoir: number;
  annulationsPerte?: number; // Valeur perdue par annulations
  // Clôture de caisse intégrée
  theoreticalCash?: number;
  countedCash?: number;
  cashDifference?: number;
  cashClosingNote?: string;
  cashClosedAt?: string;
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
  cookPin?: string; // e.g. "1111"
  cashierPin?: string; // e.g. "2222"
  requireAdminPin?: boolean; // Optional PIN gate for /admin (activable plus tard)
  dailyRevenueTarget: number; // e.g. 25000 DA
  autoStockAvailability: boolean; // dynamic out-of-stock when portions = 0
  dailyChickenQuota: number; // Nombre de poulets prévus chaque jour (ex: 100)
  dailyChickenDate: string; // Date du quota actif (YYYY-MM-DD)
  dailyChickenInitial: number; // Quantité totale mise en cuisson/broche aujourd'hui (ex: 100)
  autoSendWhatsAppOnAccept?: boolean; // Envoi automatique au groupe dès l'acceptation de la commande
  whatsAppGroupInviteUrl?: string; // Lien d'invitation du groupe WhatsApp (https://chat.whatsapp.com/...)
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
  | 'client_page'
  | 'clients'
  | 'stock'
  | 'revenue'
  | 'history'
  | 'settings';
