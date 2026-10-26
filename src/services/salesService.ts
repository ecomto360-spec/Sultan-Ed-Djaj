import {
  Day,
  Order,
  ProductComposition,
  StockItem,
  Expense,
  StockMovement,
  PaymentMethod,
  OrderSource,
} from '../types';
import { getAlgiersDateString, getOrderChickenCount } from './dayService';

export interface SalesMetrics {
  /** CA produits = somme des articles des commandes delivered, hors frais de livraison */
  caProduits: number;
  /** Frais de livraison encaissés = affichés séparément */
  fraisLivraison: number;
  /** CA total = CA produits + frais de livraison */
  caTotal: number;
  /** CA en cours = commandes pending/preparing/ready, affiché à part */
  caEnCours: number;
  /** Nombre de commandes livrées (delivered) */
  nbCommandes: number;
  /** Panier moyen = CA produits / nombre de commandes delivered (arrondi en DA) */
  panierMoyen: number;
  /** Annulations : nombre, valeur perdue, motifs */
  annulations: {
    count: number;
    valeurPerdue: number;
    motifs: { orderId: string; orderNumber?: string; reason: string }[];
    motifsGroupes: Record<string, number>;
  };
  nbLivraison: number;
  nbComptoir: number;
  paiements: {
    cash: number;
    card: number;
    other: number;
  };
  sources: {
    app: number;
    phone: number;
    counter: number;
  };
}

/**
 * Calcule le CA des produits d'une commande (sous-total des articles, hors frais de livraison).
 */
export function getOrderProductsTotal(order: Order): number {
  if (typeof order.subtotal === 'number' && !isNaN(order.subtotal)) {
    return Math.round(order.subtotal);
  }
  const sum = (order.items || []).reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 0), 0);
  return Math.round(sum);
}

/**
 * Calcule les métriques de ventes pures à partir d'une liste de commandes.
 * Utilisé uniformément sur le Dashboard, l'Historique, la Clôture et le module Recettes.
 */
export function calculateSalesMetrics(orders: Order[]): SalesMetrics {
  const deliveredOrders = (orders || []).filter(o => o.status === 'delivered');
  const inProgressOrders = (orders || []).filter(
    o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  );
  const cancelledOrders = (orders || []).filter(o => o.status === 'cancelled');

  // 1. CA produits = somme des articles des commandes delivered, hors frais de livraison
  const caProduits = deliveredOrders.reduce(
    (sum, o) => sum + getOrderProductsTotal(o),
    0
  );

  // 2. Frais de livraison encaissés = affichés séparément
  const fraisLivraison = deliveredOrders.reduce(
    (sum, o) => sum + (o.type === 'delivery' ? (o.deliveryFee || 0) : 0),
    0
  );

  const caTotal = caProduits + fraisLivraison;

  // 3. CA en cours = commandes pending/preparing/ready, affiché à part
  const caEnCours = inProgressOrders.reduce((sum, o) => {
    const prodTotal = getOrderProductsTotal(o);
    const fee = o.type === 'delivery' ? (o.deliveryFee || 0) : 0;
    return sum + (o.total ?? (prodTotal + fee));
  }, 0);

  // 4. Panier moyen = CA produits / nombre de commandes delivered
  const nbCommandes = deliveredOrders.length;
  const panierMoyen = nbCommandes > 0 ? Math.round(caProduits / nbCommandes) : 0;

  // 5. Annulations = nombre, valeur perdue, motif
  const motifs: { orderId: string; orderNumber?: string; reason: string }[] = [];
  const motifsGroupes: Record<string, number> = {};

  let valeurPerdue = 0;
  for (const o of cancelledOrders) {
    const lost = o.total ?? (getOrderProductsTotal(o) + (o.deliveryFee || 0));
    valeurPerdue += lost;
    const reason = o.cancellationReason || 'Motif non précisé';
    motifs.push({
      orderId: o.id,
      orderNumber: o.orderNumber,
      reason,
    });
    motifsGroupes[reason] = (motifsGroupes[reason] || 0) + 1;
  }

  // Ventilation paiements pour les commandes delivered
  const paiements = {
    cash: 0,
    card: 0,
    other: 0,
  };
  for (const o of deliveredOrders) {
    const method = (o.paymentMethod || 'cash') as PaymentMethod;
    const amount = o.total ?? (getOrderProductsTotal(o) + (o.deliveryFee || 0));
    if (method === 'card') paiements.card += amount;
    else if (method === 'other') paiements.other += amount;
    else paiements.cash += amount;
  }

  // Ventilation sources
  const sources = {
    app: 0,
    phone: 0,
    counter: 0,
  };
  for (const o of orders || []) {
    const src = (o.source || (o.kitchenNotes?.includes('comptoir') ? 'counter' : 'app')) as OrderSource;
    if (src === 'phone') sources.phone += 1;
    else if (src === 'counter') sources.counter += 1;
    else sources.app += 1;
  }

  const nbLivraison = deliveredOrders.filter(o => o.type === 'delivery').length;
  const nbComptoir = deliveredOrders.filter(o => o.type === 'pickup').length;

  return {
    caProduits: Math.round(caProduits),
    fraisLivraison: Math.round(fraisLivraison),
    caTotal: Math.round(caTotal),
    caEnCours: Math.round(caEnCours),
    nbCommandes,
    panierMoyen: Math.round(panierMoyen),
    annulations: {
      count: cancelledOrders.length,
      valeurPerdue: Math.round(valeurPerdue),
      motifs,
      motifsGroupes,
    },
    nbLivraison,
    nbComptoir,
    paiements: {
      cash: Math.round(paiements.cash),
      card: Math.round(paiements.card),
      other: Math.round(paiements.other),
    },
    sources,
  };
}

/**
 * Détermine si une commande est rattachée à une Day spécifique.
 * Gère le cas d'une commande passée tard la nuit (ex: 00h30) rattachée à la journée ouverte en cours.
 */
export function isOrderInDay(order: Order, day: Day): boolean {
  if (!order || !day) return false;

  // 1. Rattachement explicite via dayId
  if (order.dayId) {
    return order.dayId === day.id;
  }

  // 2. Si la journée est ouverte, toute commande créée depuis son ouverture lui est rattachée
  if (day.status === 'open' && day.openedAt && order.createdAt) {
    const openedTime = new Date(day.openedAt).getTime();
    const orderTime = new Date(order.createdAt).getTime();
    if (!isNaN(openedTime) && !isNaN(orderTime) && orderTime >= openedTime) {
      return true;
    }
  }

  // 3. Fallback sur la date fuseau horaire Alger (YYYY-MM-DD)
  const orderDate = order.createdAt ? getAlgiersDateString(order.createdAt) : '';
  return orderDate === day.date;
}

/**
 * Filtre les commandes appartenant à une journée donnée.
 */
export function getOrdersForDay(orders: Order[], day: Day): Order[] {
  if (!day || !Array.isArray(orders)) return [];
  return orders.filter(o => isOrderInDay(o, day));
}

/**
 * Calcule les statistiques d'une journée (Day) de manière dynamique.
 * Pour une journée ouverte : ne lit PAS de compteurs stockés, recalcule tout depuis les commandes.
 * À la clôture : fige un instantané (snapshot) complet.
 */
export function computeDaySnapshot(
  day: Day,
  dayOrders: Order[],
  compositions: ProductComposition[] = [],
  stockMovements: StockMovement[] = []
): Day {
  const metrics = calculateSalesMetrics(dayOrders);

  // Calcul du nombre de poulets vendus (sur commandes livrées / actives non-annulées)
  const nonCancelledOrders = dayOrders.filter(o => o.status !== 'cancelled');
  let pouletsVendus = 0;
  for (const o of nonCancelledOrders) {
    pouletsVendus += getOrderChickenCount(o, compositions);
  }
  pouletsVendus = Math.round(pouletsVendus * 10) / 10;

  // Pertes de poulet enregistrées ce jour
  const dayWastes = (stockMovements || []).filter(
    m =>
      m.stockItemId === 'stock-1' &&
      m.type === 'waste' &&
      getAlgiersDateString(m.timestamp) === day.date
  );
  const pouletsPerdus = dayWastes.reduce((sum, m) => sum + Math.abs(m.quantity), 0);

  const effectiveQuota = day.quotaCurrent ?? day.quotaInitial;
  const pouletsRestants = Math.max(
    0,
    Math.round((effectiveQuota - pouletsVendus - pouletsPerdus) * 10) / 10
  );

  return {
    ...day,
    quotaCurrent: effectiveQuota,
    pouletsVendus,
    pouletsRestants,
    nbCommandes: metrics.nbCommandes,
    nbAnnulees: metrics.annulations.count,
    ca: metrics.caProduits, // CA produits hors frais de livraison
    deliveryFees: metrics.fraisLivraison,
    caTotal: metrics.caTotal,
    caInProgress: metrics.caEnCours,
    panierMoyen: metrics.panierMoyen,
    nbLivraison: metrics.nbLivraison,
    nbComptoir: metrics.nbComptoir,
    annulationsPerte: metrics.annulations.valeurPerdue,
  };
}

/**
 * Calcule les espèces théoriques attendues en caisse :
 * Somme des encaissements en espèces (commandes livrées)
 * MOINS les dépenses payées en espèces de la journée.
 */
export function calculateTheoreticalCash(
  dayOrders: Order[],
  dayExpenses: Expense[] = []
): {
  cashIn: number;
  cashOut: number;
  theoreticalCash: number;
} {
  const deliveredOrders = dayOrders.filter(o => o.status === 'delivered');

  // Encaissements en espèces
  const cashIn = deliveredOrders.reduce((sum, o) => {
    const isCash = (o.paymentMethod || 'cash') === 'cash';
    if (!isCash) return sum;
    return sum + (o.total ?? (getOrderProductsTotal(o) + (o.deliveryFee || 0)));
  }, 0);

  // Décaissements / Dépenses payées en cash
  const cashOut = (dayExpenses || []).reduce((sum, e) => {
    return sum + (e.amount || 0);
  }, 0);

  const theoreticalCash = Math.round(cashIn - cashOut);

  return {
    cashIn: Math.round(cashIn),
    cashOut: Math.round(cashOut),
    theoreticalCash,
  };
}

/**
 * Migration idempotente pour une commande :
 * Garantit la présence de paymentMethod, source, driverName, driverFee.
 */
export function migrateOrderDefaults(order: Order): Order {
  const paymentMethod: PaymentMethod = order.paymentMethod || 'cash';

  let source: OrderSource = order.source || 'app';
  if (!order.source) {
    if (
      order.kitchenNotes?.includes('comptoir') ||
      order.statusHistory?.[0]?.note?.includes('comptoir') ||
      order.type === 'pickup'
    ) {
      source = 'counter';
    } else {
      source = 'app';
    }
  }

  return {
    ...order,
    paymentMethod,
    source,
    driverName: order.driverName,
    driverFee: order.driverFee,
  };
}

/**
 * 4.1. Ventes par heure (00h à 23h).
 */
export interface HourlySalesPoint {
  hour: number;
  label: string; // "13h", "14h"...
  ordersCount: number;
  caProduits: number;
}

export function computeHourlySales(orders: Order[]): HourlySalesPoint[] {
  const delivered = orders.filter(o => o.status === 'delivered');
  const buckets: Record<number, { count: number; ca: number }> = {};

  for (let h = 0; h < 24; h++) {
    buckets[h] = { count: 0, ca: 0 };
  }

  for (const o of delivered) {
    if (!o.createdAt) continue;
    try {
      const d = new Date(o.createdAt);
      // Heure locale d'Alger UTC+1
      const hourStr = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Africa/Algiers',
        hour: 'numeric',
        hour12: false,
      }).format(d);
      const h = parseInt(hourStr, 10);
      if (!isNaN(h) && buckets[h]) {
        buckets[h].count += 1;
        buckets[h].ca += getOrderProductsTotal(o);
      }
    } catch {
      // ignore
    }
  }

  return Object.keys(buckets).map(hKey => {
    const h = parseInt(hKey, 10);
    return {
      hour: h,
      label: `${h}h`,
      ordersCount: buckets[h].count,
      caProduits: Math.round(buckets[h].ca),
    };
  });
}

/**
 * 4.2. Top produits : quantité, CA, coût matières (COGS), marge brute et taux de marge.
 */
export interface ProductPerformance {
  productId: string;
  nameFr: string;
  nameAr: string;
  quantitySold: number;
  ca: number;
  cogs: number;
  grossMargin: number;
  marginPercent: number;
}

export function computeTopProducts(
  orders: Order[],
  compositions: ProductComposition[] = [],
  stockItems: StockItem[] = []
): ProductPerformance[] {
  const delivered = orders.filter(o => o.status === 'delivered');
  const map: Record<string, { nameFr: string; nameAr: string; qty: number; ca: number; cogs: number }> = {};

  const stockMap = new Map<string, StockItem>(stockItems.map(s => [s.id, s]));
  const compMap = new Map<string, ProductComposition>(compositions.map(c => [c.productId, c]));

  for (const o of delivered) {
    for (const it of o.items || []) {
      if (!map[it.productId]) {
        map[it.productId] = {
          nameFr: it.nameFr,
          nameAr: it.nameAr,
          qty: 0,
          ca: 0,
          cogs: 0,
        };
      }
      map[it.productId].qty += it.quantity;
      const lineCa = it.price * it.quantity;
      map[it.productId].ca += lineCa;

      // Calcul COGS selon fiche technique
      const comp = compMap.get(it.productId);
      if (comp) {
        let unitCost = 0;
        for (const ing of comp.ingredients) {
          const s = stockMap.get(ing.stockItemId);
          if (s) {
            unitCost += ing.quantity * (s.unitCostDA || 0);
          }
        }
        map[it.productId].cogs += Math.round(unitCost * it.quantity);
      } else {
        // Estimation par défaut 32% food-cost si pas de fiche technique
        map[it.productId].cogs += Math.round(lineCa * 0.32);
      }
    }
  }

  return Object.keys(map)
    .map(productId => {
      const entry = map[productId];
      const grossMargin = Math.max(0, entry.ca - entry.cogs);
      const marginPercent = entry.ca > 0 ? Math.round((grossMargin / entry.ca) * 1000) / 10 : 0;
      return {
        productId,
        nameFr: entry.nameFr,
        nameAr: entry.nameAr,
        quantitySold: entry.qty,
        ca: Math.round(entry.ca),
        cogs: Math.round(entry.cogs),
        grossMargin: Math.round(grossMargin),
        marginPercent,
      };
    })
    .sort((a, b) => b.ca - a.ca);
}

/**
 * 4.3. Ventes par commune (pour les livraisons et clients).
 */
export interface CommuneSales {
  commune: string;
  ordersCount: number;
  ca: number;
}

export function computeSalesByCommune(orders: Order[]): CommuneSales[] {
  const delivered = orders.filter(o => o.status === 'delivered');
  const map: Record<string, { count: number; ca: number }> = {};

  for (const o of delivered) {
    const commune = o.deliveryAddress?.commune?.trim() || (o.type === 'pickup' ? 'Comptoir (Sur place)' : 'Non précisée');
    if (!map[commune]) {
      map[commune] = { count: 0, ca: 0 };
    }
    map[commune].count += 1;
    map[commune].ca += getOrderProductsTotal(o);
  }

  return Object.keys(map)
    .map(commune => ({
      commune,
      ordersCount: map[commune].count,
      ca: Math.round(map[commune].ca),
    }))
    .sort((a, b) => b.ca - a.ca);
}

/**
 * 4.4. Marge brute par jour (CA - COGS).
 */
export interface DayGrossMargin {
  dayId: string;
  date: string;
  ca: number;
  cogs: number;
  grossMargin: number;
  marginPercent: number;
}

export function computeGrossMarginByDay(
  days: Day[],
  orders: Order[],
  compositions: ProductComposition[] = [],
  stockItems: StockItem[] = []
): DayGrossMargin[] {
  const stockMap = new Map<string, StockItem>(stockItems.map(s => [s.id, s]));
  const compMap = new Map<string, ProductComposition>(compositions.map(c => [c.productId, c]));

  return days.map(day => {
    const dayOrders = getOrdersForDay(orders, day).filter(o => o.status === 'delivered');
    const ca = dayOrders.reduce((sum, o) => sum + getOrderProductsTotal(o), 0);

    let cogs = 0;
    for (const o of dayOrders) {
      for (const it of o.items || []) {
        const comp = compMap.get(it.productId);
        if (comp) {
          let unitCost = 0;
          for (const ing of comp.ingredients) {
            const s = stockMap.get(ing.stockItemId);
            if (s) {
              unitCost += ing.quantity * (s.unitCostDA || 0);
            }
          }
          cogs += unitCost * it.quantity;
        } else {
          cogs += it.price * it.quantity * 0.32;
        }
      }
    }

    const cogsRound = Math.round(cogs);
    const grossMargin = Math.max(0, ca - cogsRound);
    const marginPercent = ca > 0 ? Math.round((grossMargin / ca) * 1000) / 10 : 0;

    return {
      dayId: day.id,
      date: day.date,
      ca: Math.round(ca),
      cogs: cogsRound,
      grossMargin: Math.round(grossMargin),
      marginPercent,
    };
  });
}

/**
 * 4.6. Délai moyen de préparation en minutes (depuis statusHistory).
 */
export function computeAveragePrepTimeMinutes(orders: Order[]): number {
  const validTimes: number[] = [];

  for (const o of orders || []) {
    if (!Array.isArray(o.statusHistory) || o.statusHistory.length < 2) continue;

    const startLog = o.statusHistory.find(
      h => h.status === 'preparing' || h.status === 'pending'
    );
    const endLog = o.statusHistory.find(
      h => h.status === 'ready' || h.status === 'delivered'
    );

    if (startLog && endLog) {
      const t1 = new Date(startLog.timestamp).getTime();
      const t2 = new Date(endLog.timestamp).getTime();
      if (!isNaN(t1) && !isNaN(t2) && t2 > t1) {
        const diffMinutes = (t2 - t1) / (1000 * 60);
        // Filtrer les valeurs aberrantes (> 180 min)
        if (diffMinutes > 0 && diffMinutes <= 180) {
          validTimes.push(diffMinutes);
        }
      }
    }
  }

  if (validTimes.length === 0) return 0;
  const avg = validTimes.reduce((sum, v) => sum + v, 0) / validTimes.length;
  return Math.round(avg * 10) / 10;
}

/**
 * 4.7. Comparaison avec le même jour de la semaine précédente (J-7).
 */
export interface WeekComparison {
  currentDayDate: string;
  prevWeekDate: string;
  currentCa: number;
  prevCa: number;
  caDeltaPercent: number;
  currentOrders: number;
  prevOrders: number;
  ordersDeltaPercent: number;
}

export function computeSameDayPreviousWeekComparison(
  currentDay: Day,
  allDays: Day[],
  orders: Order[]
): WeekComparison | null {
  if (!currentDay || currentDay.date === 'initial') return null;

  try {
    const curDate = new Date(currentDay.date + 'T12:00:00Z');
    if (isNaN(curDate.getTime())) return null;

    const prevDateObj = new Date(curDate.getTime() - 7 * 24 * 3600 * 1000);
    const prevDateStr = prevDateObj.toISOString().split('T')[0];

    const prevDay = allDays.find(d => d.date === prevDateStr);
    if (!prevDay) return null;

    const currentOrders = getOrdersForDay(orders, currentDay).filter(o => o.status === 'delivered');
    const prevOrders = getOrdersForDay(orders, prevDay).filter(o => o.status === 'delivered');

    const currentCa = currentOrders.reduce((sum, o) => sum + getOrderProductsTotal(o), 0);
    const prevCa = prevOrders.reduce((sum, o) => sum + getOrderProductsTotal(o), 0);

    const caDeltaPercent =
      prevCa > 0
        ? Math.round(((currentCa - prevCa) / prevCa) * 1000) / 10
        : currentCa > 0
        ? 100
        : 0;

    const ordersDeltaPercent =
      prevOrders.length > 0
        ? Math.round(((currentOrders.length - prevOrders.length) / prevOrders.length) * 1000) / 10
        : currentOrders.length > 0
        ? 100
        : 0;

    return {
      currentDayDate: currentDay.date,
      prevWeekDate: prevDateStr,
      currentCa: Math.round(currentCa),
      prevCa: Math.round(prevCa),
      caDeltaPercent,
      currentOrders: currentOrders.length,
      prevOrders: prevOrders.length,
      ordersDeltaPercent,
    };
  } catch {
    return null;
  }
}

/**
 * 5. Formatage de nombre français : virgule comme séparateur décimal, sans espace brisé.
 */
export function formatFrenchNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  // Remplace le point par une virgule
  return num.toString().replace('.', ',');
}

/**
 * 5. Export CSV conforme aux spécifications :
 * - séparateur ';'
 * - BOM UTF-8
 * - nombres au format français (virgule)
 * - colonnes entre guillemets
 * - en-têtes traduits FR/AR selon la langue active
 */
export function generateHistoryCsv(
  days: Day[],
  orders: Order[],
  isArabic: boolean
): string {
  const headers = isArabic
    ? [
        '"التاريخ"',
        '"الحالة"',
        '"الحصة الأولية"',
        '"الحصة النهائية"',
        '"الدجاج المباع"',
        '"الدجاج المتبقي"',
        '"الطلبات المسلمة"',
        '"رقم أعمال المنتجات (دج)"',
        '"رسوم التوصيل (دج)"',
        '"المجموع الكلي (دج)"',
        '"متوسط السلة (دج)"',
        '"توصيل"',
        '"كاونتر"',
        '"الطلبات الملغاة"',
        '"القيمة المفقودة (دج)"',
        '"النقد النظري (دج)"',
        '"النقد المحسوب (دج)"',
        '"فارق الصندوق (دج)"',
        '"وقت الافتتاح"',
        '"وقت الإغلاق"',
      ]
    : [
        '"Date"',
        '"Statut"',
        '"Quota Initial"',
        '"Quota Final"',
        '"Poulets Vendus"',
        '"Poulets Restants"',
        '"Commandes Livrees"',
        '"CA Produits (DA)"',
        '"Frais Livraison (DA)"',
        '"CA Total (DA)"',
        '"Panier Moyen (DA)"',
        '"Livraisons"',
        '"Comptoir"',
        '"Commandes Annulees"',
        '"Valeur Perdue (DA)"',
        '"Especes Theoriques (DA)"',
        '"Especes Comptees (DA)"',
        '"Ecart Caisse (DA)"',
        '"Ouverture"',
        '"Cloture"',
      ];

  const rows = days.map(d => {
    const dayOrders = getOrdersForDay(orders, d);
    const metrics = calculateSalesMetrics(dayOrders);

    const caProduits = d.status === 'closed' && typeof d.ca === 'number' ? d.ca : metrics.caProduits;
    const fraisLivraison =
      d.status === 'closed' && typeof d.deliveryFees === 'number'
        ? d.deliveryFees
        : metrics.fraisLivraison;
    const caTotal = caProduits + fraisLivraison;
    const panierMoyen =
      d.status === 'closed' && typeof d.panierMoyen === 'number' ? d.panierMoyen : metrics.panierMoyen;
    const nbLivrees =
      d.status === 'closed' && typeof d.nbCommandes === 'number' ? d.nbCommandes : metrics.nbCommandes;
    const nbAnnulees =
      d.status === 'closed' && typeof d.nbAnnulees === 'number'
        ? d.nbAnnulees
        : metrics.annulations.count;
    const perteAnnulation =
      d.status === 'closed' && typeof d.annulationsPerte === 'number'
        ? d.annulationsPerte
        : metrics.annulations.valeurPerdue;

    const values = [
      `"${d.date}"`,
      `"${d.status}"`,
      `"${formatFrenchNumber(d.quotaInitial)}"`,
      `"${formatFrenchNumber(d.quotaCurrent ?? d.quotaInitial)}"`,
      `"${formatFrenchNumber(d.pouletsVendus)}"`,
      `"${formatFrenchNumber(d.pouletsRestants)}"`,
      `"${formatFrenchNumber(nbLivrees)}"`,
      `"${formatFrenchNumber(caProduits)}"`,
      `"${formatFrenchNumber(fraisLivraison)}"`,
      `"${formatFrenchNumber(caTotal)}"`,
      `"${formatFrenchNumber(panierMoyen)}"`,
      `"${formatFrenchNumber(d.nbLivraison ?? metrics.nbLivraison)}"`,
      `"${formatFrenchNumber(d.nbComptoir ?? metrics.nbComptoir)}"`,
      `"${formatFrenchNumber(nbAnnulees)}"`,
      `"${formatFrenchNumber(perteAnnulation)}"`,
      `"${d.theoreticalCash !== undefined ? formatFrenchNumber(d.theoreticalCash) : ''}"`,
      `"${d.countedCash !== undefined ? formatFrenchNumber(d.countedCash) : ''}"`,
      `"${d.cashDifference !== undefined ? formatFrenchNumber(d.cashDifference) : ''}"`,
      `"${d.openedAt || ''}"`,
      `"${d.closedAt || ''}"`,
    ];

    return values.join(';');
  });

  // BOM UTF-8 (\uFEFF)
  return '\uFEFF' + [headers.join(';'), ...rows].join('\n');
}
