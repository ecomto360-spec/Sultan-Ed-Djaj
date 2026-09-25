import {
  Order,
  Expense,
  ProductComposition,
  StockItem,
  Product,
  RevenuePeriod,
} from '../types';

export interface RevenueKPIs {
  caRealise: number;
  deliveredRevenue: number;
  deliveredCount: number;
  deliveredOrdersCount: number;
  avgBasket: number;
  deliveryFeesCollected: number;
  caInProgress: number;
  pendingOrdersRevenue: number;
  inProgressCount: number;
  cancellationsCount: number;
  cancellationsAmount: number;
  cancellationRate: number;
  totalExpenses: number;
  netProfit: number;
  estimatedRawMaterialCost: number;
  estimatedGrossMargin: number;
  grossMarginRate: number;
  grossMarginPercent: number;
  revenueGrowthPercent: number;
  prevPeriodComparison: {
    caPercent: number;
    ordersPercent: number;
    basketPercent: number;
  };
}

export const getPeriodDateRange = (
  period: RevenuePeriod,
  customRange?: { start: string; end: string }
): { start: Date; end: Date; prevStart: Date; prevEnd: Date } => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (period === 'today') {
    const prevStart = new Date(todayStart.getTime() - 24 * 3600 * 1000);
    const prevEnd = new Date(todayEnd.getTime() - 24 * 3600 * 1000);
    return { start: todayStart, end: todayEnd, prevStart, prevEnd };
  }

  if (period === 'yesterday') {
    const yStart = new Date(todayStart.getTime() - 24 * 3600 * 1000);
    const yEnd = new Date(todayEnd.getTime() - 24 * 3600 * 1000);
    const prevStart = new Date(todayStart.getTime() - 48 * 3600 * 1000);
    const prevEnd = new Date(todayEnd.getTime() - 48 * 3600 * 1000);
    return { start: yStart, end: yEnd, prevStart, prevEnd };
  }

  if (period === '7days') {
    const start = new Date(todayStart.getTime() - 6 * 24 * 3600 * 1000);
    const prevStart = new Date(start.getTime() - 7 * 24 * 3600 * 1000);
    const prevEnd = new Date(todayStart.getTime() - 7 * 24 * 3600 * 1000 + 23 * 3600 * 1000);
    return { start, end: todayEnd, prevStart, prevEnd };
  }

  if (period === '30days') {
    const start = new Date(todayStart.getTime() - 29 * 24 * 3600 * 1000);
    const prevStart = new Date(start.getTime() - 30 * 24 * 3600 * 1000);
    const prevEnd = new Date(todayStart.getTime() - 30 * 24 * 3600 * 1000 + 23 * 3600 * 1000);
    return { start, end: todayEnd, prevStart, prevEnd };
  }

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start, end: todayEnd, prevStart, prevEnd };
  }

  // Custom
  const start = customRange?.start
    ? new Date(customRange.start + 'T00:00:00')
    : new Date(todayStart.getTime() - 6 * 24 * 3600 * 1000);
  const end = customRange?.end
    ? new Date(customRange.end + 'T23:59:59')
    : todayEnd;
  const duration = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - duration);
  const prevEnd = new Date(start.getTime() - 1000);
  return { start, end, prevStart, prevEnd };
};

export const filterOrdersByRange = (orders: Order[], start: Date, end: Date): Order[] => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return orders.filter(o => {
    const t = new Date(o.createdAt).getTime();
    return t >= startTime && t <= endTime;
  });
};

export const filterExpensesByRange = (expenses: Expense[], start: Date, end: Date): Expense[] => {
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  return expenses.filter(e => e.date >= startStr && e.date <= endStr);
};

export const calculateRevenueKPIs = (
  orders: Order[],
  expenses: Expense[],
  compositions: ProductComposition[],
  stockItems: StockItem[],
  period: RevenuePeriod,
  customRange?: { start: string; end: string }
): RevenueKPIs => {
  const { start, end, prevStart, prevEnd } = getPeriodDateRange(period, customRange);

  const currentOrders = filterOrdersByRange(orders, start, end);
  const previousOrders = filterOrdersByRange(orders, prevStart, prevEnd);

  const currentExpenses = filterExpensesByRange(expenses, start, end);

  // Delivered current
  const deliveredCurrent = currentOrders.filter(o => o.status === 'delivered');
  const caRealise = deliveredCurrent.reduce((acc, o) => acc + o.total, 0);
  const deliveredCount = deliveredCurrent.length;
  const avgBasket = deliveredCount > 0 ? Math.round(caRealise / deliveredCount) : 0;
  const deliveryFeesCollected = deliveredCurrent
    .filter(o => o.type === 'delivery')
    .reduce((acc, o) => acc + o.deliveryFee, 0);

  // In progress
  const inProgressCurrent = currentOrders.filter(
    o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  );
  const caInProgress = inProgressCurrent.reduce((acc, o) => acc + o.total, 0);
  const inProgressCount = inProgressCurrent.length;

  // Cancelled
  const cancelledCurrent = currentOrders.filter(o => o.status === 'cancelled');
  const cancellationsCount = cancelledCurrent.length;
  const cancellationsAmount = cancelledCurrent.reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = currentOrders.length;
  const cancellationRate =
    totalOrdersCount > 0
      ? Math.round((cancellationsCount / totalOrdersCount) * 1000) / 10
      : 0;

  // Expenses & Net profit
  const totalExpenses = currentExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = caRealise - totalExpenses;

  // Material cost calculation via composition * unitCostDA
  let estimatedRawMaterialCost = 0;
  deliveredCurrent.forEach(o => {
    o.items.forEach(it => {
      const comp = compositions.find(c => c.productId === it.productId);
      if (comp) {
        comp.ingredients.forEach(ing => {
          const sItem = stockItems.find(s => s.id === ing.stockItemId);
          if (sItem) {
            estimatedRawMaterialCost += ing.quantity * sItem.unitCostDA * it.quantity;
          }
        });
      } else {
        // approximate standard food cost ~32% of item price if no composition
        estimatedRawMaterialCost += it.price * it.quantity * 0.32;
      }
    });
  });
  estimatedRawMaterialCost = Math.round(estimatedRawMaterialCost);
  const estimatedGrossMargin = Math.max(0, caRealise - estimatedRawMaterialCost);
  const grossMarginRate =
    caRealise > 0 ? Math.round((estimatedGrossMargin / caRealise) * 1000) / 10 : 0;

  // Previous period comparison
  const deliveredPrev = previousOrders.filter(o => o.status === 'delivered');
  const prevCa = deliveredPrev.reduce((acc, o) => acc + o.total, 0);
  const prevOrdersCount = deliveredPrev.length;
  const prevAvgBasket = prevOrdersCount > 0 ? Math.round(prevCa / prevOrdersCount) : 0;

  const caPercent =
    prevCa > 0
      ? Math.round(((caRealise - prevCa) / prevCa) * 100)
      : caRealise > 0
      ? 100
      : 0;
  const ordersPercent =
    prevOrdersCount > 0
      ? Math.round(((deliveredCount - prevOrdersCount) / prevOrdersCount) * 100)
      : deliveredCount > 0
      ? 100
      : 0;
  const basketPercent =
    prevAvgBasket > 0
      ? Math.round(((avgBasket - prevAvgBasket) / prevAvgBasket) * 100)
      : avgBasket > 0
      ? 100
      : 0;

  return {
    caRealise,
    deliveredRevenue: caRealise,
    deliveredCount,
    deliveredOrdersCount: deliveredCount,
    avgBasket,
    deliveryFeesCollected,
    caInProgress,
    pendingOrdersRevenue: caInProgress,
    inProgressCount,
    cancellationsCount,
    cancellationsAmount,
    cancellationRate,
    totalExpenses,
    netProfit,
    estimatedRawMaterialCost,
    estimatedGrossMargin,
    grossMarginRate,
    grossMarginPercent: grossMarginRate,
    revenueGrowthPercent: caPercent,
    prevPeriodComparison: {
      caPercent,
      ordersPercent,
      basketPercent,
    },
  };
};

export const getDailyRevenueChartData = (
  orders: Order[],
  start: Date,
  end: Date
): { date: string; displayDate: string; ca: number; commandes: number }[] => {
  const result: Record<string, { displayDate: string; ca: number; commandes: number }> = {};

  // Build days in interval
  const cur = new Date(start);
  while (cur <= end) {
    const key = cur.toISOString().split('T')[0];
    const displayDate = `${cur.getDate()}/${cur.getMonth() + 1}`;
    result[key] = { displayDate, ca: 0, commandes: 0 };
    cur.setDate(cur.getDate() + 1);
  }

  const delivered = orders.filter(
    o =>
      o.status === 'delivered' &&
      new Date(o.createdAt) >= start &&
      new Date(o.createdAt) <= end
  );

  delivered.forEach(o => {
    const key = o.createdAt.split('T')[0];
    if (result[key]) {
      result[key].ca += o.total;
      result[key].commandes += 1;
    }
  });

  return Object.entries(result).map(([date, val]) => ({
    date,
    displayDate: val.displayDate,
    ca: val.ca,
    commandes: val.commandes,
  }));
};

export const getHourlyRevenueChartData = (
  orders: Order[],
  start: Date,
  end: Date
): { hour: string; ca: number; count: number; isRush: boolean }[] => {
  const hoursData: Record<number, { ca: number; count: number }> = {};
  for (let h = 12; h <= 23; h++) {
    hoursData[h] = { ca: 0, count: 0 };
  }
  hoursData[0] = { ca: 0, count: 0 }; // midnight

  const delivered = orders.filter(
    o =>
      o.status === 'delivered' &&
      new Date(o.createdAt) >= start &&
      new Date(o.createdAt) <= end
  );

  delivered.forEach(o => {
    const h = new Date(o.createdAt).getHours();
    if (hoursData[h] !== undefined) {
      hoursData[h].ca += o.total;
      hoursData[h].count += 1;
    }
  });

  const orderKeys = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
  return orderKeys.map(h => {
    const isRush = (h === 13 || h === 14) || (h >= 20 && h <= 22);
    return {
      hour: `${h}h`,
      ca: hoursData[h].ca,
      count: hoursData[h].count,
      isRush,
    };
  });
};

export const getTypeDistributionChartData = (
  orders: Order[],
  start: Date,
  end: Date
): { name: string; value: number; count: number; color: string }[] => {
  const delivered = orders.filter(
    o =>
      o.status === 'delivered' &&
      new Date(o.createdAt) >= start &&
      new Date(o.createdAt) <= end
  );

  let delivCa = 0;
  let delivCount = 0;
  let pickCa = 0;
  let pickCount = 0;

  delivered.forEach(o => {
    if (o.type === 'delivery') {
      delivCa += o.total;
      delivCount++;
    } else {
      pickCa += o.total;
      pickCount++;
    }
  });

  return [
    { name: 'Livraison à domicile', value: delivCa, count: delivCount, color: '#ea580c' },
    { name: 'Retrait comptoir', value: pickCa, count: pickCount, color: '#10b981' },
  ];
};

export const getTopProductsChartData = (
  orders: Order[],
  start: Date,
  end: Date
): { name: string; quantity: number; ca: number }[] => {
  const prodMap: Record<string, { name: string; quantity: number; ca: number }> = {};

  const delivered = orders.filter(
    o =>
      o.status === 'delivered' &&
      new Date(o.createdAt) >= start &&
      new Date(o.createdAt) <= end
  );

  delivered.forEach(o => {
    o.items.forEach(it => {
      if (!prodMap[it.productId]) {
        prodMap[it.productId] = { name: it.nameFr, quantity: 0, ca: 0 };
      }
      prodMap[it.productId].quantity += it.quantity;
      prodMap[it.productId].ca += it.price * it.quantity;
    });
  });

  return Object.values(prodMap)
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 8);
};

export const getCategoryRevenueChartData = (
  orders: Order[],
  products: Product[],
  start: Date,
  end: Date
): { category: string; ca: number; count: number }[] => {
  const catNames: Record<string, string> = {
    poulets: 'Poulets',
    accompagnements: 'Accompagnements',
    pains: 'Pains',
    boissons: 'Boissons',
  };

  const catMap: Record<string, { ca: number; count: number }> = {
    poulets: { ca: 0, count: 0 },
    accompagnements: { ca: 0, count: 0 },
    pains: { ca: 0, count: 0 },
    boissons: { ca: 0, count: 0 },
  };

  const delivered = orders.filter(
    o =>
      o.status === 'delivered' &&
      new Date(o.createdAt) >= start &&
      new Date(o.createdAt) <= end
  );

  delivered.forEach(o => {
    o.items.forEach(it => {
      const prod = products.find(p => p.id === it.productId);
      const cat = prod?.category || 'poulets';
      if (catMap[cat]) {
        catMap[cat].ca += it.price * it.quantity;
        catMap[cat].count += it.quantity;
      }
    });
  });

  return Object.entries(catMap).map(([key, val]) => ({
    category: catNames[key] || key,
    ca: val.ca,
    count: val.count,
  }));
};

export const getDayOfWeekChartData = (
  orders: Order[],
  start: Date,
  end: Date
): { day: string; ca: number; count: number }[] => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const dayTotals: Record<number, { ca: number; count: number }> = {};
  for (let i = 0; i < 7; i++) dayTotals[i] = { ca: 0, count: 0 };

  const delivered = orders.filter(
    o =>
      o.status === 'delivered' &&
      new Date(o.createdAt) >= start &&
      new Date(o.createdAt) <= end
  );

  delivered.forEach(o => {
    const d = new Date(o.createdAt).getDay();
    dayTotals[d].ca += o.total;
    dayTotals[d].count += 1;
  });

  // Reorder starting from Friday (Algeria weekend start: Ven, Sam, Dim, Lun...)
  const orderedIndices = [5, 6, 0, 1, 2, 3, 4];
  return orderedIndices.map(idx => ({
    day: days[idx],
    ca: dayTotals[idx].ca,
    count: dayTotals[idx].count,
  }));
};

export const getDeliveryCommunesChartData = (
  orders: Order[],
  start: Date,
  end: Date
): { commune: string; count: number; ca: number }[] => {
  const map: Record<string, { count: number; ca: number }> = {};

  const deliveredDeliveries = orders.filter(
    o =>
      o.status === 'delivered' &&
      o.type === 'delivery' &&
      new Date(o.createdAt) >= start &&
      new Date(o.createdAt) <= end
  );

  deliveredDeliveries.forEach(o => {
    const commune = o.deliveryAddress?.commune || 'Birkhadem';
    if (!map[commune]) {
      map[commune] = { count: 0, ca: 0 };
    }
    map[commune].count += 1;
    map[commune].ca += o.total;
  });

  return Object.entries(map)
    .map(([commune, val]) => ({ commune, count: val.count, ca: val.ca }))
    .sort((a, b) => b.count - a.count);
};

export const getTopCustomersChartData = (
  orders: Order[],
  start: Date,
  end: Date
): { name: string; phone: string; orders: number; totalSpent: number }[] => {
  const map: Record<string, { name: string; phone: string; orders: number; totalSpent: number }> = {};

  const delivered = orders.filter(
    o =>
      o.status === 'delivered' &&
      new Date(o.createdAt) >= start &&
      new Date(o.createdAt) <= end
  );

  delivered.forEach(o => {
    const key = o.customerPhone || o.customerName;
    if (!map[key]) {
      map[key] = {
        name: o.customerName,
        phone: o.customerPhone,
        orders: 0,
        totalSpent: 0,
      };
    }
    map[key].orders += 1;
    map[key].totalSpent += o.total;
  });

  return Object.values(map)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 6);
};

export const getAvgBasketEvolutionChartData = (
  orders: Order[],
  start: Date,
  end: Date
): { date: string; avgBasket: number }[] => {
  const daily = getDailyRevenueChartData(orders, start, end);
  return daily.map(d => ({
    date: d.displayDate,
    avgBasket: d.commandes > 0 ? Math.round(d.ca / d.commandes) : 0,
  }));
};

export const exportSalesCSV = (orders: Order[]) => {
  const headers = [
    'N° Commande',
    'Date',
    'Heure',
    'Client',
    'Téléphone',
    'Mode',
    'Statut',
    'Articles',
    'Sous-total (DA)',
    'Frais livraison (DA)',
    'Total (DA)',
  ];

  const rows = orders.map(o => {
    const dateObj = new Date(o.createdAt);
    const dateStr = dateObj.toLocaleDateString('fr-FR');
    const timeStr = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const itemsSummary = o.items.map(it => `${it.quantity}x ${it.nameFr}`).join(' | ');

    return [
      o.orderNumber,
      dateStr,
      timeStr,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      o.type === 'delivery' ? 'Livraison' : 'Comptoir',
      o.status,
      `"${itemsSummary}"`,
      o.subtotal,
      o.deliveryFee,
      o.total,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ventes_sultan_ed_djaj_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportExpensesCSV = (expenses: Expense[]) => {
  const headers = ['ID', 'Date', 'Catégorie', 'Montant (DA)', 'Note', 'Créé par'];

  const rows = expenses.map(e => [
    e.id,
    e.date,
    e.category,
    e.amount,
    `"${e.note.replace(/"/g, '""')}"`,
    e.createdBy,
  ].join(','));

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `depenses_sultan_ed_djaj_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const filterOrdersByPeriod = (
  orders: Order[],
  period: RevenuePeriod,
  customStart?: string,
  customEnd?: string
): Order[] => {
  const customRange = customStart && customEnd ? { start: customStart, end: customEnd } : undefined;
  const { start, end } = getPeriodDateRange(period, customRange);
  return filterOrdersByRange(orders, start, end);
};

export const filterExpensesByPeriod = (
  expenses: Expense[],
  period: RevenuePeriod,
  customStart?: string,
  customEnd?: string
): Expense[] => {
  const customRange = customStart && customEnd ? { start: customStart, end: customEnd } : undefined;
  const { start, end } = getPeriodDateRange(period, customRange);
  return filterExpensesByRange(expenses, start, end);
};

export const formatDailyRevenueChartData = (orders: Order[], expenses: Expense[]) => {
  const map: Record<string, { date: string; recette: number; depenses: number }> = {};
  orders.forEach(o => {
    if (o.status === 'delivered') {
      const d = o.createdAt.split('T')[0];
      if (!map[d]) map[d] = { date: d, recette: 0, depenses: 0 };
      map[d].recette += o.total;
    }
  });
  expenses.forEach(e => {
    const d = e.date;
    if (!map[d]) map[d] = { date: d, recette: 0, depenses: 0 };
    map[d].depenses += e.amount;
  });
  const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    const today = new Date().toISOString().split('T')[0];
    const parts = today.split('-');
    return [{ date: `${parts[2]}/${parts[1]}`, recette: 0, depenses: 0 }];
  }
  return sorted.map(item => {
    const parts = item.date.split('-');
    return {
      date: `${parts[2]}/${parts[1]}`,
      recette: item.recette,
      depenses: item.depenses,
    };
  });
};

export const formatRushHoursChartData = (orders: Order[]) => {
  const hourly = getHourlyRevenueChartData(orders, new Date(0), new Date(Date.now() + 86400000));
  return hourly.map(h => ({
    hour: h.hour,
    commandes: h.count,
    ca: h.ca,
  }));
};

export const formatDeliveryVsPickupChartData = (orders: Order[]) => {
  return getTypeDistributionChartData(orders, new Date(0), new Date(Date.now() + 86400000));
};

export const formatTopProductsChartData = (orders: Order[]) => {
  const list = getTopProductsChartData(orders, new Date(0), new Date(Date.now() + 86400000));
  return list.map(item => ({
    name: item.name,
    ca: item.ca,
    quantite: item.quantity,
  }));
};

export const exportOrdersToCSV = exportSalesCSV;
export const exportExpensesToCSV = exportExpensesCSV;

