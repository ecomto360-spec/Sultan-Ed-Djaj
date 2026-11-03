import { Day, Order, ProductComposition, StockMovement, StoreSettings } from '../types';

/**
 * Returns YYYY-MM-DD in Africa/Algiers timezone for a given Date or ISO string.
 */
export function getAlgiersDateString(dateInput?: Date | string): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Algiers',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    const fallback = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(fallback.getTime())) return '';
    return fallback.toISOString().split('T')[0];
  }
}

/**
 * Computes how many chickens were used in a single order.
 */
export function getOrderChickenCount(order: Order, compositions: ProductComposition[]): number {
  let count = 0;
  order.items.forEach(it => {
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
  return Math.round(count * 10) / 10;
}

/**
 * Computes updated statistics for a Day given its orders, compositions, and stock movements.
 */
export function computeDayStats(
  day: Day,
  dayOrders: Order[],
  compositions: ProductComposition[],
  stockMovements: StockMovement[] = []
): Day {
  const nonCancelled = dayOrders.filter(o => o.status !== 'cancelled');
  const cancelled = dayOrders.filter(o => o.status === 'cancelled');

  let pouletsVendus = 0;
  nonCancelled.forEach(o => {
    pouletsVendus += getOrderChickenCount(o, compositions);
  });
  pouletsVendus = Math.round(pouletsVendus * 10) / 10;

  // Also include chicken waste logged during this day's date if open
  const dayWastes = stockMovements.filter(
    m =>
      m.stockItemId === 'stock-1' &&
      m.type === 'waste' &&
      getAlgiersDateString(m.timestamp) === day.date
  );
  const wasted = dayWastes.reduce((sum, m) => sum + Math.abs(m.quantity), 0);

  const effectiveQuota = day.quotaCurrent ?? day.quotaInitial;
  const pouletsRestants = Math.max(
    0,
    Math.round((effectiveQuota - pouletsVendus - wasted) * 10) / 10
  );

  const nbCommandes = nonCancelled.length;
  const nbAnnulees = cancelled.length;
  const ca = nonCancelled.reduce((sum, o) => sum + o.total, 0);
  const panierMoyen = nbCommandes > 0 ? Math.round(ca / nbCommandes) : 0;
  const nbLivraison = nonCancelled.filter(o => o.type === 'delivery').length;
  const nbComptoir = nonCancelled.filter(o => o.type === 'pickup').length;

  return {
    ...day,
    quotaCurrent: effectiveQuota,
    pouletsVendus,
    pouletsRestants,
    nbCommandes,
    nbAnnulees,
    ca,
    panierMoyen,
    nbLivraison,
    nbComptoir,
  };
}

/**
 * Migrates existing orders into Day entities without losing any order or resetting #SD-xxxx numbering.
 * - Past dates (Africa/Algiers) -> status 'closed', quotaInitial = poulets vendus (if unknown, or max(pouletsVendus, 1))
 * - Current date (Africa/Algiers) -> status 'open', attached to open day with current quota preserved
 * - Orders without valid date -> grouped into "Données initiales" closed Day
 */
export function migrateOrdersAndDays(
  orders: Order[],
  existingDays: Day[] | undefined,
  settings: StoreSettings,
  compositions: ProductComposition[],
  stockMovements: StockMovement[] = []
): { days: Day[]; orders: Order[] } {
  const todayAlgiers = getAlgiersDateString();

  // Map existing days by id and by date
  const dayById = new Map<string, Day>();
  const dayByDate = new Map<string, Day>();

  if (Array.isArray(existingDays) && existingDays.length > 0) {
    for (const d of existingDays) {
      dayById.set(d.id, { ...d, quotaAdjustments: d.quotaAdjustments || [] });
      dayByDate.set(d.date, d);
    }
  }

  // Group orders that don't have a valid dayId yet
  const updatedOrders: Order[] = orders.map(o => ({ ...o }));
  const ordersByDateGroup = new Map<string, Order[]>();

  for (const ord of updatedOrders) {
    if (ord.dayId && dayById.has(ord.dayId)) {
      continue;
    }
    const dateKey = ord.createdAt ? getAlgiersDateString(ord.createdAt) : '';
    const key = dateKey || 'initial';
    if (!ordersByDateGroup.has(key)) {
      ordersByDateGroup.set(key, []);
    }
    ordersByDateGroup.get(key)!.push(ord);
  }

  // Ensure there is at most ONE 'open' day if we are creating from scratch
  const hasAnyOpenDay = Array.from(dayById.values()).some(d => d.status === 'open');

  // Process each date group of unattached orders
  const sortedKeys = Array.from(ordersByDateGroup.keys()).sort();

  for (const dateKey of sortedKeys) {
    const groupOrders = ordersByDateGroup.get(dateKey)!;
    let targetDay = dayByDate.get(dateKey);

    if (!targetDay) {
      const isToday = dateKey === todayAlgiers;
      const isInitial = dateKey === 'initial';

      // Calculate chickens sold in this group
      let soldCount = 0;
      groupOrders
        .filter(o => o.status !== 'cancelled')
        .forEach(o => {
          soldCount += getOrderChickenCount(o, compositions);
        });
      soldCount = Math.round(soldCount * 10) / 10;

      const currentQuotaSetting =
        settings.dailyChickenInitial ?? settings.dailyChickenQuota ?? 100;

      const quotaInit = isToday
        ? Math.max(currentQuotaSetting, soldCount)
        : soldCount > 0
        ? soldCount
        : settings.dailyChickenQuota || 100;

      // Determine openedAt and closedAt from group orders timestamps
      const timestamps = groupOrders
        .map(o => new Date(o.createdAt).getTime())
        .filter(t => !isNaN(t));
      const minTime =
        timestamps.length > 0
          ? new Date(Math.min(...timestamps)).toISOString()
          : `${dateKey === 'initial' ? '2026-01-01' : dateKey}T09:00:00.000Z`;
      const maxTime =
        timestamps.length > 0
          ? new Date(Math.max(...timestamps) + 3600000).toISOString()
          : `${dateKey === 'initial' ? '2026-01-01' : dateKey}T23:55:00.000Z`;

      const shouldBeOpen = isToday && !hasAnyOpenDay;

      targetDay = {
        id: isInitial ? 'day-initial' : `day-${dateKey}`,
        date: dateKey,
        label: isInitial ? 'Données initiales' : undefined,
        status: shouldBeOpen ? 'open' : 'closed',
        openedAt: minTime,
        closedAt: shouldBeOpen ? undefined : maxTime,
        quotaInitial: quotaInit,
        quotaCurrent: quotaInit,
        quotaAdjustments: [],
        pouletsVendus: soldCount,
        pouletsRestants: shouldBeOpen ? Math.max(0, quotaInit - soldCount) : 0,
        nbCommandes: 0,
        nbAnnulees: 0,
        ca: 0,
        panierMoyen: 0,
        nbLivraison: 0,
        nbComptoir: 0,
      };

      dayById.set(targetDay.id, targetDay);
      dayByDate.set(dateKey, targetDay);
    }

    for (const ord of groupOrders) {
      ord.dayId = targetDay.id;
    }
  }

  // If no open day exists at all and today has no orders yet on initial migration, create today's open day if existingDays was empty
  if ((!existingDays || existingDays.length === 0) && !dayByDate.has(todayAlgiers)) {
    const hasOpen = Array.from(dayById.values()).some(d => d.status === 'open');
    if (!hasOpen) {
      const currentQuotaSetting =
        settings.dailyChickenInitial ?? settings.dailyChickenQuota ?? 100;
      const todayDay: Day = {
        id: `day-${todayAlgiers}`,
        date: todayAlgiers,
        status: 'open',
        openedAt: new Date().toISOString(),
        quotaInitial: currentQuotaSetting,
        quotaCurrent: currentQuotaSetting,
        quotaAdjustments: [],
        pouletsVendus: 0,
        pouletsRestants: currentQuotaSetting,
        nbCommandes: 0,
        nbAnnulees: 0,
        ca: 0,
        panierMoyen: 0,
        nbLivraison: 0,
        nbComptoir: 0,
      };
      dayById.set(todayDay.id, todayDay);
      dayByDate.set(todayAlgiers, todayDay);
    }
  }

  // Recompute stats for all days based on their linked orders
  const allDays: Day[] = Array.from(dayById.values()).map(d => {
    const linkedOrders = updatedOrders.filter(o => o.dayId === d.id);
    const computed = computeDayStats(d, linkedOrders, compositions, stockMovements);
    // For past closed days where quotaInitial was set to pouletsVendus, pouletsRestants is 0
    return computed;
  });

  // Sort days: newest date first ('initial' at the end)
  allDays.sort((a, b) => {
    if (a.date === 'initial') return 1;
    if (b.date === 'initial') return -1;
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();
  });

  return {
    days: allDays,
    orders: updatedOrders,
  };
}
