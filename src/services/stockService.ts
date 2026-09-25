import {
  StockItem,
  ProductComposition,
  StockMovement,
  AlertLevel,
  SupplierPurchaseGroup,
  InventoryDiscrepancy,
  Order,
  UserRole,
} from '../types';

export const getAlertLevel = (item: StockItem): AlertLevel => {
  if (item.currentStock <= 0) return 'out';
  if (item.currentStock <= item.criticalThreshold) return 'critical';
  if (item.currentStock <= item.alertThreshold) return 'low';
  return 'ok';
};

export const getActiveStockAlerts = (items: StockItem[]): StockItem[] => {
  return items.filter(item => getAlertLevel(item) !== 'ok');
};

export const getAvailablePortions = (
  productId: string,
  stockItems: StockItem[],
  compositions: ProductComposition[]
): number => {
  const comp = compositions.find(c => c.productId === productId);
  if (!comp || comp.ingredients.length === 0) {
    return 999;
  }

  let minPortions = Infinity;

  for (const ing of comp.ingredients) {
    if (ing.quantity <= 0) continue;
    const stockItem = stockItems.find(s => s.id === ing.stockItemId);
    if (!stockItem) continue;

    const availableForIng = Math.floor(stockItem.currentStock / ing.quantity);
    if (availableForIng < minPortions) {
      minPortions = availableForIng;
    }
  }

  return minPortions === Infinity ? 999 : Math.max(0, minPortions);
};

export const calculateSpecialChickenAutonomy = (
  chickenInput: StockItem | StockItem[] | undefined,
  orders: Order[]
): {
  remainingCount: number;
  chickenPieces: number;
  estimatedHours: number;
  hoursRemaining: number;
  estimatedMinutes: number;
  minutesRemaining: number;
  statusColor: 'green' | 'orange' | 'red';
  textFr: string;
  textAr: string;
} => {
  let chickenItem: StockItem | undefined;
  if (Array.isArray(chickenInput)) {
    chickenItem = chickenInput.find(
      s => s.id === 'stk-poulet' || s.category === 'poulet' || s.nameFr.toLowerCase().includes('poulet')
    );
  } else {
    chickenItem = chickenInput;
  }

  if (!chickenItem) {
    return {
      remainingCount: 0,
      chickenPieces: 0,
      estimatedHours: 0,
      hoursRemaining: 0,
      estimatedMinutes: 0,
      minutesRemaining: 0,
      statusColor: 'red',
      textFr: 'Données non disponibles',
      textAr: 'البيانات غير متوفرة',
    };
  }

  const remaining = Math.max(0, Math.floor(chickenItem.currentStock));

  // Determine hourly sales pace based on recent delivered / preparing chicken orders
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(
    o => o.createdAt.startsWith(today) && o.status !== 'cancelled'
  );

  let chickensSoldToday = 0;
  todayOrders.forEach(o => {
    o.items.forEach(it => {
      if (it.productId === 'prod-1' || it.productId === 'prod-2') {
        chickensSoldToday += it.quantity;
      }
    });
  });

  // Average hourly burn rate during service (13h-00h = 11 hours active)
  const currentHour = new Date().getHours();
  const hoursIntoService = Math.max(1, currentHour >= 13 ? currentHour - 12 : 2);
  const burnRatePerHour = Math.max(
    1.8,
    chickensSoldToday > 0 ? chickensSoldToday / hoursIntoService : 2.2
  );

  const totalHoursLeft = remaining / burnRatePerHour;
  const hours = Math.floor(totalHoursLeft);
  const mins = Math.round((totalHoursLeft - hours) * 60);

  let statusColor: 'green' | 'orange' | 'red' = 'green';
  if (remaining <= chickenItem.criticalThreshold || hours < 2) {
    statusColor = 'red';
  } else if (remaining <= chickenItem.alertThreshold || hours < 4) {
    statusColor = 'orange';
  }

  return {
    remainingCount: remaining,
    chickenPieces: remaining,
    estimatedHours: hours,
    hoursRemaining: hours,
    estimatedMinutes: mins,
    minutesRemaining: mins,
    statusColor,
    textFr: `≈ ${remaining} poulets restants ≈ ${hours}h ${mins}min au rythme actuel`,
    textAr: `≈ ${remaining} دجاجة متبقية ≈ ${hours} سا و ${mins} د بالوتيرة الحالية`,
  };
};

export const calculateStockAutonomy = (
  item: StockItem,
  movements: StockMovement[]
): { days: number; hours: number; formattedFr: string; formattedAr: string } => {
  // Filter out auto deductions over last 30 days for this item
  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const itemOuts = movements.filter(
    m =>
      m.stockItemId === item.id &&
      (m.type === 'out_auto' || m.type === 'waste') &&
      new Date(m.timestamp).getTime() >= thirtyDaysAgo
  );

  const totalOut = itemOuts.reduce((acc, m) => acc + Math.abs(m.quantity), 0);
  const dailyRate = Math.max(0.1, totalOut / 30);
  const daysLeft = item.currentStock / dailyRate;

  if (daysLeft < 1) {
    const hours = Math.max(1, Math.round(daysLeft * 24));
    return {
      days: daysLeft,
      hours,
      formattedFr: `${hours}h`,
      formattedAr: `${hours} سا`,
    };
  }

  const days = Math.round(daysLeft * 10) / 10;
  return {
    days,
    hours: Math.round(daysLeft * 24),
    formattedFr: `${days}j`,
    formattedAr: `${days} يوم`,
  };
};

export const generatePurchaseList = (
  stockItems: StockItem[]
): SupplierPurchaseGroup[] => {
  const neededItems = stockItems.filter(
    item => item.currentStock <= item.alertThreshold
  );

  const groupsMap: Record<string, SupplierPurchaseGroup> = {};

  neededItems.forEach(item => {
    const supplierKey = item.supplierName.trim() || 'Fournisseur Général';
    if (!groupsMap[supplierKey]) {
      groupsMap[supplierKey] = {
        supplierName: supplierKey,
        supplierPhone: item.supplierPhone || '+213 770 00 00 00',
        items: [],
        totalCost: 0,
      };
    }

    const neededQty = Math.max(
      1,
      Math.round((item.idealStock - item.currentStock) * 10) / 10
    );
    const estimatedCost = Math.round(neededQty * item.unitCostDA);

    groupsMap[supplierKey].items.push({
      stockItem: item,
      neededQuantity: neededQty,
      estimatedCost,
    });
    groupsMap[supplierKey].totalCost += estimatedCost;
  });

  return Object.values(groupsMap);
};

export const formatWhatsAppPurchaseMessage = (
  group: SupplierPurchaseGroup,
  restaurantName: string,
  isArabic: boolean
): string => {
  if (isArabic) {
    let msg = `السلام عليكم ورحمة الله،\nطلبية تموين لمطعم *${restaurantName}* :\n\n`;
    group.items.forEach((it, idx) => {
      msg += `${idx + 1}. *${it.stockItem.nameAr}* : ${it.neededQuantity} ${it.stockItem.unit}\n`;
    });
    msg += `\nيرجى تأكيد التوصيل في أقرب وقت. شكراً جزيلاً.`;
    return msg;
  }

  let msg = `Bonjour,\nCommande de réapprovisionnement pour le restaurant *${restaurantName}* :\n\n`;
  group.items.forEach((it, idx) => {
    msg += `${idx + 1}. *${it.stockItem.nameFr}* : ${it.neededQuantity} ${it.stockItem.unit}\n`;
  });
  msg += `\nMerci de nous confirmer la disponibilité et l'heure de livraison. Cordialement.`;
  return msg;
};

export const calculateInventoryDiscrepancies = (
  stockItems: StockItem[],
  countedStock: Record<string, number>
): InventoryDiscrepancy[] => {
  return stockItems.map(item => {
    const counted = countedStock[item.id] !== undefined ? countedStock[item.id] : item.currentStock;
    const diff = Math.round((counted - item.currentStock) * 100) / 100;
    return {
      stockItemId: item.id,
      stockItemName: item.nameFr,
      unit: item.unit,
      theoreticalStock: item.currentStock,
      countedStock: counted,
      difference: diff,
      unitCostDA: item.unitCostDA,
      totalCostDifference: Math.round(diff * item.unitCostDA),
    };
  });
};

export const generateSupplierPurchaseList = generatePurchaseList;
export const generateWhatsAppOrderMessage = (group: SupplierPurchaseGroup, isArabic = false): string =>
  formatWhatsAppPurchaseMessage(group, 'Sultan Ed-Djaj', isArabic);

