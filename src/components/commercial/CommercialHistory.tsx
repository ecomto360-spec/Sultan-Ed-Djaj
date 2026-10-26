import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Day, Order } from '../../types';
import {
  Calendar,
  Download,
  Eye,
  X,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Motorbike,
  Store,
  XCircle,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  BarChart3,
  Timer,
  MapPin,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Table as TableIcon,
  Percent,
} from 'lucide-react';
import { getAlgiersDateString } from '../../services/dayService';
import {
  computeHourlySales,
  computeTopProducts,
  computeSalesByCommune,
  computeGrossMarginByDay,
  computeAveragePrepTimeMinutes,
  computeSameDayPreviousWeekComparison,
  generateHistoryCsv,
  isOrderInDay,
  HourlySalesPoint,
  ProductPerformance,
  CommuneSales,
  DayGrossMargin,
  WeekComparison,
} from '../../services/salesService';

type HistoryPeriod = 'today' | '7days' | '30days' | 'month' | 'custom';
type HistoryViewMode = 'analytics' | 'table';

export const CommercialHistory: React.FC = () => {
  const {
    days,
    orders,
    language,
    compositions = [],
    stockItems = [],
  } = useApp();
  const isArabic = language === 'ar';

  const [period, setPeriod] = useState<HistoryPeriod>('30days');
  const [viewMode, setViewMode] = useState<HistoryViewMode>('analytics');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    return getAlgiersDateString(d);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => getAlgiersDateString());
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);

  const todayStr = getAlgiersDateString();

  // Filter days by selected period
  const filteredDays = useMemo(() => {
    return days.filter(d => {
      if (d.date === 'initial') {
        return period === '30days' || period === 'custom';
      }
      if (period === 'today') {
        return d.date === todayStr;
      }
      if (period === '7days') {
        const cutoff = getAlgiersDateString(new Date(Date.now() - 7 * 24 * 3600 * 1000));
        return d.date >= cutoff && d.date <= todayStr;
      }
      if (period === '30days') {
        const cutoff = getAlgiersDateString(new Date(Date.now() - 30 * 24 * 3600 * 1000));
        return d.date >= cutoff && d.date <= todayStr;
      }
      if (period === 'month') {
        const monthPrefix = todayStr.slice(0, 7); // YYYY-MM
        return d.date.startsWith(monthPrefix);
      }
      if (period === 'custom') {
        return (!customStart || d.date >= customStart) && (!customEnd || d.date <= customEnd);
      }
      return true;
    });
  }, [days, period, customStart, customEnd, todayStr]);

  // Orders linked to the filtered days
  const filteredOrders = useMemo(() => {
    return orders.filter(o => filteredDays.some(d => isOrderInDay(o, d)));
  }, [orders, filteredDays]);

  // Totals and averages for the period
  const summary = useMemo(() => {
    const nbDays = filteredDays.length;
    const totalCommandes = filteredDays.reduce((acc, d) => acc + d.nbCommandes, 0);
    const totalAnnulees = filteredDays.reduce((acc, d) => acc + d.nbAnnulees, 0);
    const totalCa = filteredDays.reduce((acc, d) => acc + d.ca, 0);
    const totalPouletsVendus = filteredDays.reduce((acc, d) => acc + d.pouletsVendus, 0);
    const totalQuota = filteredDays.reduce(
      (acc, d) => acc + (d.quotaCurrent ?? d.quotaInitial),
      0
    );
    const totalLivraison = filteredDays.reduce((acc, d) => acc + d.nbLivraison, 0);
    const totalComptoir = filteredDays.reduce((acc, d) => acc + d.nbComptoir, 0);

    const avgCommandesParJour = nbDays > 0 ? (totalCommandes / nbDays).toFixed(1) : '0';
    const avgCaParJour = nbDays > 0 ? Math.round(totalCa / nbDays) : 0;
    const avgPouletsParJour = nbDays > 0 ? (totalPouletsVendus / nbDays).toFixed(1) : '0';
    const globalPanierMoyen = totalCommandes > 0 ? Math.round(totalCa / totalCommandes) : 0;

    return {
      nbDays,
      totalCommandes,
      totalAnnulees,
      totalCa,
      totalPouletsVendus,
      totalQuota,
      totalLivraison,
      totalComptoir,
      avgCommandesParJour,
      avgCaParJour,
      avgPouletsParJour,
      globalPanierMoyen,
    };
  }, [filteredDays]);

  // 1. Ventes par heure (24h)
  const salesByHour: HourlySalesPoint[] = useMemo(
    () => computeHourlySales(filteredOrders),
    [filteredOrders]
  );
  const maxHourlyCount = useMemo(
    () => Math.max(...salesByHour.map((h: HourlySalesPoint) => h.ordersCount), 1),
    [salesByHour]
  );
  // Focus hours between 11h and 00h
  const activeHours = useMemo(() => {
    return salesByHour.filter((h: HourlySalesPoint) => h.hour >= 11 || h.hour === 0);
  }, [salesByHour]);

  // 2. Top produits
  const topProducts: ProductPerformance[] = useMemo(
    () => computeTopProducts(filteredOrders, compositions, stockItems),
    [filteredOrders, compositions, stockItems]
  );
  const maxTopProductQty = useMemo(
    () => (topProducts.length > 0 ? topProducts[0].quantitySold : 1),
    [topProducts]
  );

  // 3. Ventes par commune
  const salesByCommune: CommuneSales[] = useMemo(
    () => computeSalesByCommune(filteredOrders),
    [filteredOrders]
  );
  const totalCommuneOrders = useMemo(
    () => Math.max(1, salesByCommune.reduce((acc, c) => acc + c.ordersCount, 0)),
    [salesByCommune]
  );

  // 4. Marge brute par jour (CA - COGS)
  const dailyMargins: DayGrossMargin[] = useMemo(
    () => computeGrossMarginByDay(filteredDays, orders, compositions, stockItems),
    [filteredDays, orders, compositions, stockItems]
  );

  // 5. Bilan Poulets (Quota, Vendus, Restants, Pertes)
  const pouletsSummary = useMemo(() => {
    const quotaInitial = filteredDays.reduce((acc, d) => acc + d.quotaInitial, 0);
    const vendus = filteredDays.reduce((acc, d) => acc + d.pouletsVendus, 0);
    const restants = filteredDays.reduce((acc, d) => acc + d.pouletsRestants, 0);
    const totalProduced = quotaInitial;
    const pertes = Math.max(0, totalProduced - vendus - restants);
    const tauxPerte = totalProduced > 0 ? Math.round((pertes / totalProduced) * 1000) / 10 : 0;
    return {
      quotaInitial,
      vendus: Math.round(vendus * 10) / 10,
      restants: Math.round(restants * 10) / 10,
      pertes: Math.round(pertes * 10) / 10,
      tauxPerte,
    };
  }, [filteredDays]);

  // 6. Délai moyen de préparation (depuis statusHistory)
  const avgPrepTimeMinutes = useMemo(
    () => computeAveragePrepTimeMinutes(filteredOrders),
    [filteredOrders]
  );

  // 7. Comparaison avec le même jour de la semaine précédente (J vs J-7)
  const targetDayForComp = filteredDays[0] || days[0];
  const weekComparison: WeekComparison | null = useMemo(() => {
    if (!targetDayForComp) return null;
    return computeSameDayPreviousWeekComparison(targetDayForComp, days, orders);
  }, [targetDayForComp, days, orders]);

  // CSV export handler (Lot B Requirement 5)
  const handleExportCsv = () => {
    const csvContent = generateHistoryCsv(filteredDays, orders, isArabic);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historique-sultan-ed-djaj-${period}-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Orders for the selected Day modal
  const selectedDayOrders: Order[] = useMemo(() => {
    if (!selectedDay) return [];
    return orders.filter(
      o =>
        o.dayId === selectedDay.id ||
        (!o.dayId && getAlgiersDateString(o.createdAt) === selectedDay.date)
    );
  }, [selectedDay, orders]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4 bg-transparent text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-orange-400" />
            <span>
              {isArabic ? 'سجل الأيام والتحليلات (Historique)' : 'Historique des Ventes & Sessions'}
            </span>
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {isArabic
              ? 'متابعة شاملة للمبيعات، ساعات الذروة، هوامش الربح، حصص الدجاج ومقارنة أسبوعية دقيقة.'
              : 'Rapports consolidés, ventes par heure, top produits, marge brute, bilan volaille et comparaison S-1.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center">
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'analytics'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isArabic ? 'التحليلات والمخططات' : 'Analyses & Graphiques'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{isArabic ? 'جدول الجلسات' : 'Journal des Sessions'}</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            title={isArabic ? 'تصدير بصيغة CSV' : 'Export CSV (BOM UTF-8, séparateur point-virgule)'}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isArabic ? 'تصدير CSV' : 'Exporter CSV'}</span>
          </button>
        </div>
      </div>

      {/* Period Filter Bar */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'today', label: isArabic ? 'اليوم' : "Aujourd'hui" },
              { id: '7days', label: isArabic ? '7 أيام' : '7 jours' },
              { id: '30days', label: isArabic ? '30 يوماً' : '30 jours' },
              { id: 'month', label: isArabic ? 'هذا الشهر' : 'Mois en cours' },
              { id: 'custom', label: isArabic ? 'فترة مخصصة' : 'Personnalisée' },
            ] as { id: HistoryPeriod; label: string }[]
          ).map(btn => (
            <button
              key={btn.id}
              onClick={() => setPeriod(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                period === btn.id
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">{isArabic ? 'من:' : 'Du :'}</span>
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            />
            <span className="text-zinc-600 dark:text-zinc-400 font-medium">{isArabic ? 'إلى:' : 'Au :'}</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        )}
      </div>

      {/* Period Totals & Averages Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
            🍗 {isArabic ? 'إجمالي الدجاج المباع' : 'Poulets vendus (Période)'}
          </span>
          <div className="text-lg font-extrabold text-zinc-900 dark:text-white font-mono">
            {summary.totalPouletsVendus}{' '}
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">/ {summary.totalQuota}</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-orange-400 font-semibold">
            {isArabic
              ? `المعدل: ${summary.avgPouletsParJour} / يوم`
              : `Moyenne : ${summary.avgPouletsParJour} poulets / jour`}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
            📦 {isArabic ? 'إجمالي الطلبات' : 'Commandes validées'}
          </span>
          <div className="text-lg font-extrabold text-zinc-900 dark:text-white font-mono">
            {summary.totalCommandes}{' '}
            <span className="text-xs font-normal text-red-600 dark:text-red-400">
              ({summary.totalAnnulees} {isArabic ? 'ملغاة' : 'annulées'})
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
            {isArabic
              ? `المعدل: ${summary.avgCommandesParJour} طلب / يوم`
              : `Moyenne : ${summary.avgCommandesParJour} cmd / jour`}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
            💰 {isArabic ? 'إجمالي رقم الأعمال (CA)' : "Chiffre d'Affaires Total"}
          </span>
          <div className="text-lg font-extrabold text-amber-700 dark:text-amber-400 font-mono">
            {summary.totalCa.toLocaleString()} DA
          </div>
          <div className="text-[11px] text-amber-800 dark:text-amber-300/80 font-semibold">
            {isArabic
              ? `المعدل اليومي: ${summary.avgCaParJour.toLocaleString()} دج`
              : `Moyenne : ${summary.avgCaParJour.toLocaleString()} DA / jour`}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 space-y-1 shadow-sm transition-colors">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
            🛵 {isArabic ? 'متوسط السلة والتوزيع' : 'Panier moyen & Canal'}
          </span>
          <div className="text-lg font-extrabold text-blue-700 dark:text-blue-400 font-mono">
            {summary.globalPanierMoyen.toLocaleString()} DA
          </div>
          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-semibold">
            <span className="text-amber-700 dark:text-orange-400">{summary.totalLivraison} Liv.</span> •{' '}
            <span className="text-emerald-700 dark:text-emerald-400">{summary.totalComptoir} Cpt.</span> (
            {summary.nbDays} j)
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: ANALYTICS & CHARTS (LOT B Requirement 4) */}
      {viewMode === 'analytics' && (
        <div className="space-y-4">
          {/* Row 1: Ventes par heure (Barres) & Comparaison S-1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Ventes par heure (Barres SVG/CSS) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-600 dark:text-orange-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
                    {isArabic ? 'المبيعات حسب الساعة (ساعات الذروة)' : 'Ventes par heure (Affluence & Rush)'}
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {filteredOrders.length} {isArabic ? 'طلب مسجل' : 'commandes'}
                </span>
              </div>

              {/* Lightweight SVG/CSS Bar Chart */}
              <div className="h-44 sm:h-48 pt-4 flex items-end gap-1 sm:gap-2 px-1">
                {activeHours.map((item: HourlySalesPoint) => {
                  const heightPercent =
                    maxHourlyCount > 0 ? Math.max(8, Math.round((item.ordersCount / maxHourlyCount) * 100)) : 8;
                  const isPeak = item.ordersCount === maxHourlyCount && item.ordersCount > 0;
                  return (
                    <div
                      key={item.hour}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 pointer-events-none transition bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-lg font-mono z-10 whitespace-nowrap shadow-lg border border-zinc-700">
                        {item.ordersCount} cmd • {item.caProduits.toLocaleString()} DA
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 relative ${
                          isPeak
                            ? 'bg-gradient-to-t from-orange-600 to-amber-500 shadow-md shadow-orange-500/20'
                            : item.ordersCount > 0
                            ? 'bg-amber-500/70 dark:bg-amber-500/50 hover:bg-amber-500'
                            : 'bg-zinc-100 dark:bg-zinc-800/40'
                        }`}
                      >
                        {isPeak && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
                          </div>
                        )}
                      </div>

                      {/* Hour label */}
                      <span
                        className={`text-[10px] font-mono leading-none ${
                          isPeak
                            ? 'font-bold text-amber-600 dark:text-amber-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {item.hour}h
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <span>Plage horaire : 11h00 - 00h30</span>
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>
                    Pic :{' '}
                    {salesByHour.reduce(
                      (prev: HourlySalesPoint, cur: HourlySalesPoint) =>
                        cur.ordersCount > prev.ordersCount ? cur : prev,
                      salesByHour[0] || { label: '13h', ordersCount: 0 }
                    ).label}
                  </span>
                </span>
              </div>
            </div>

            {/* Comparaison avec le même jour de la semaine précédente (J vs J - 7) */}
            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
                    {isArabic ? 'مقارنة مع الأسبوع الماضي (J - 7)' : 'Comparaison Semaine S-1'}
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {weekComparison ? weekComparison.currentDayDate : targetDayForComp?.date || todayStr}
                </span>
              </div>

              {weekComparison ? (
                <div className="space-y-3 my-auto">
                  {/* CA Evolution */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold block">
                      {isArabic ? 'تطور رقم الأعمال (CA)' : "Évolution Chiffre d'Affaires"}
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black font-mono text-zinc-900 dark:text-white">
                        {weekComparison.currentCa.toLocaleString()} DA
                      </span>
                      <span
                        className={`text-xs font-black font-mono flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                          weekComparison.caDeltaPercent >= 0
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {weekComparison.caDeltaPercent >= 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {weekComparison.caDeltaPercent >= 0 ? '+' : ''}
                          {weekComparison.caDeltaPercent}%
                        </span>
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      vs {weekComparison.prevCa.toLocaleString()} DA le {weekComparison.prevWeekDate}
                    </div>
                  </div>

                  {/* Commandes Evolution */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Commandes livrées</span>
                    <div className="font-mono font-bold text-zinc-900 dark:text-white">
                      {weekComparison.currentOrders} cmd{' '}
                      <span
                        className={`text-[10px] font-bold ${
                          weekComparison.ordersDeltaPercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        ({weekComparison.ordersDeltaPercent >= 0 ? '+' : ''}
                        {weekComparison.ordersDeltaPercent}%)
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="my-auto p-4 text-center text-zinc-500 text-xs italic">
                  Aucune session correspondante trouvée à J-7 pour cette date.
                </div>
              )}

              <div className="text-[10px] text-zinc-500 italic">
                {weekComparison
                  ? `Comparé avec la journée homologue du ${weekComparison.prevWeekDate}.`
                  : 'Données S-1 partielles pour cette journée.'}
              </div>
            </div>
          </div>

          {/* Row 2: Top Produits (avec marge via fiches techniques) & Marge Brute par Jour */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Top Produits avec Marge */}
            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-orange-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
                    {isArabic ? 'أفضل المنتجات (الكمية، المبيعات والهامش)' : 'Top Produits (Quantité, CA & Marge Brute)'}
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {topProducts.length} articles vendus
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic p-4 text-center">
                    Aucune vente enregistrée sur cette période.
                  </p>
                ) : (
                  topProducts.slice(0, 6).map((prod: ProductPerformance, idx: number) => {
                    const widthPercent =
                      maxTopProductQty > 0 ? Math.round((prod.quantitySold / maxTopProductQty) * 100) : 0;
                    return (
                      <div
                        key={prod.productId}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold font-mono text-[10px] flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-white truncate">
                              {isArabic ? prod.nameAr : prod.nameFr}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono">
                            <span className="font-extrabold text-zinc-900 dark:text-white">
                              {prod.quantitySold}x
                            </span>
                            <span className="text-amber-700 dark:text-amber-400 font-black">
                              {prod.ca.toLocaleString()} DA
                            </span>
                          </div>
                        </div>

                        {/* Progress bar + Marge pill */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${widthPercent}%` }}
                              className="bg-gradient-to-r from-orange-600 to-amber-500 h-full rounded-full"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] font-mono shrink-0">
                            <span className="text-zinc-500">
                              Coût: {prod.cogs.toLocaleString()} DA
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                              Marge: +{prod.grossMargin.toLocaleString()} DA ({prod.marginPercent}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Marge Brute par Jour (CA - COGS) */}
            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
                    {isArabic ? 'الهامش الإجمالي اليومي (CA - تكلفة المواد)' : 'Marge Brute Quotidienne (CA - COGS)'}
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {dailyMargins.length} journées
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {dailyMargins.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic p-4 text-center">
                    Aucune journée calculée sur cette période.
                  </p>
                ) : (
                  dailyMargins.slice(0, 6).map((dm: DayGrossMargin) => (
                    <div
                      key={dm.dayId}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-white block">
                          {dm.date}
                        </span>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span>CA: {dm.ca.toLocaleString()} DA</span>
                          <span>•</span>
                          <span>Coût: -{dm.cogs.toLocaleString()} DA</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm block">
                          +{dm.grossMargin.toLocaleString()} DA
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                          {dm.marginPercent}% de marge
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Ventes par Commune, Bilan Poulets & Délai de Préparation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Ventes par Commune */}
            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
                    {isArabic ? 'المبيعات حسب البلدية' : 'Ventes par commune'}
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {salesByCommune.length} zones
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {salesByCommune.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic p-3 text-center">
                    Aucune livraison géolocalisée.
                  </p>
                ) : (
                  salesByCommune.map((comm: CommuneSales) => {
                    const percent = Math.round((comm.ordersCount / totalCommuneOrders) * 100);
                    return (
                      <div key={comm.commune} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {comm.commune}
                          </span>
                          <span className="font-mono text-[11px] text-zinc-500">
                            {comm.ordersCount} cmd • {percent}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percent}%` }}
                            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bilan Poulets : Quota initial, vendus, restants, pertes */}
            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600 dark:text-orange-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
                    {isArabic ? 'حصيلة الدجاج والفاقد' : 'Bilan Poulets & Pertes'}
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Taux perte : {pouletsSummary.tauxPerte}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Quota Initial</span>
                  <span className="text-base font-black text-zinc-900 dark:text-white">
                    {pouletsSummary.quotaInitial}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block">Poulets Vendus</span>
                  <span className="text-base font-black text-amber-700 dark:text-amber-400">
                    {pouletsSummary.vendus}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Restants session</span>
                  <span className="text-base font-black text-zinc-800 dark:text-zinc-200">
                    {pouletsSummary.restants}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-800/40">
                  <span className="text-[10px] text-red-700 dark:text-red-400 block">Pertes déclarées</span>
                  <span className="text-base font-black text-red-700 dark:text-red-400">
                    {pouletsSummary.pertes} ({pouletsSummary.tauxPerte}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Délai moyen de préparation */}
            <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-600 dark:text-orange-400" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white">
                    {isArabic ? 'متوسط وقت التحضير (المطبخ)' : 'Délai moyen de préparation'}
                  </h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  statusHistory
                </span>
              </div>

              <div className="text-center py-2 space-y-1 my-auto">
                <div className="text-3xl sm:text-4xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {avgPrepTimeMinutes} <span className="text-sm font-normal text-zinc-500">min</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Calculé de la mise en préparation jusqu'au prêt en cuisine
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 font-mono">
                <span>Moyenne Cuisine</span>
                <span>{filteredOrders.filter(o => o.status === 'delivered').length} cmd livrées</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DAYS TABLE (Journal des sessions) */}
      {viewMode === 'table' && (
        <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 overflow-hidden flex flex-col shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-xs text-left border-collapse">
              <thead className="bg-zinc-50 dark:bg-[#16161a] border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                <tr>
                  <th className="p-3">{isArabic ? 'التاريخ' : 'Date'}</th>
                  <th className="p-3">{isArabic ? 'الحالة' : 'Statut'}</th>
                  <th className="p-3">{isArabic ? 'الدجاج (مباع / حصة)' : 'Poulets (Vendus / Quota)'}</th>
                  <th className="p-3">{isArabic ? 'الطلبات' : 'Commandes'}</th>
                  <th className="p-3">{isArabic ? 'رقم الأعمال (CA)' : 'CA'}</th>
                  <th className="p-3">{isArabic ? 'متوسط السلة' : 'Panier moyen'}</th>
                  <th className="p-3">{isArabic ? 'توصيل / كاونتر' : 'Liv. / Cpt.'}</th>
                  <th className="p-3">{isArabic ? 'الملغاة' : 'Annulées'}</th>
                  <th className="p-3 text-right">{isArabic ? 'التفاصيل' : 'Détail'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200">
                {filteredDays.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-zinc-500 italic">
                      {isArabic
                        ? 'لا توجد أيام مسجلة في هذه الفترة.'
                        : 'Aucune journée trouvée pour cette période.'}
                    </td>
                  </tr>
                ) : (
                  filteredDays.map(day => {
                    const quota = day.quotaCurrent ?? day.quotaInitial;
                    return (
                      <tr
                        key={day.id}
                        onClick={() => setSelectedDay(day)}
                        className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 cursor-pointer transition"
                      >
                        <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">
                          {day.label || day.date}
                        </td>
                        <td className="p-3">
                          {day.status === 'open' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
                              {isArabic ? 'مفتوح حالياً' : 'En cours'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                              {isArabic ? 'مغلق ومؤرشف' : 'Clôturée'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          <span className="font-bold text-amber-700 dark:text-amber-400">{day.pouletsVendus}</span>
                          <span className="text-zinc-400 dark:text-zinc-500"> / {quota}</span>
                          <span className="ml-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                            ({day.pouletsRestants} rest.)
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">{day.nbCommandes}</td>
                        <td className="p-3 font-mono font-bold text-amber-700 dark:text-amber-400">
                          {day.ca.toLocaleString()} DA
                        </td>
                        <td className="p-3 font-mono text-zinc-800 dark:text-zinc-200">
                          {day.panierMoyen.toLocaleString()} DA
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <span className="text-amber-700 dark:text-orange-400 font-bold">{day.nbLivraison} Liv.</span>
                          <span className="text-zinc-400 dark:text-zinc-600"> / </span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">{day.nbComptoir} Cpt.</span>
                        </td>
                        <td className="p-3 font-mono">
                          {day.nbAnnulees > 0 ? (
                            <span className="text-red-600 dark:text-red-400 font-bold">{day.nbAnnulees}</span>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-500">0</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedDay(day);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1 border border-zinc-250 dark:border-transparent transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400" />
                            <span>{isArabic ? 'عرض' : 'Détail'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] transition-colors">
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 transition-colors">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>
                    {isArabic ? 'تفاصيل يوم :' : 'Détail de la journée :'} {selectedDay.label || selectedDay.date}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedDay.status === 'open'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {selectedDay.status === 'open' ? 'Ouverte' : 'Clôturée'}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                  Ouverture : {new Date(selectedDay.openedAt).toLocaleString('fr-DZ')}
                  {selectedDay.closedAt
                    ? ` • Clôture : ${new Date(selectedDay.closedAt).toLocaleString('fr-DZ')}`
                    : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1 text-zinc-800 dark:text-zinc-200">
              {/* Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Poulets vendus / Quota</span>
                  <span className="text-sm font-black font-mono text-amber-700 dark:text-amber-400">
                    {selectedDay.pouletsVendus} / {selectedDay.quotaCurrent ?? selectedDay.quotaInitial}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Chiffre d'Affaires</span>
                  <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                    {selectedDay.ca.toLocaleString()} DA
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Commandes / Annulées</span>
                  <span className="text-sm font-black font-mono text-zinc-900 dark:text-white">
                    {selectedDay.nbCommandes} cmd ({selectedDay.nbAnnulees} ann.)
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block">Livraison / Comptoir</span>
                  <span className="text-sm font-black font-mono text-zinc-800 dark:text-zinc-200">
                    {selectedDay.nbLivraison} Liv. / {selectedDay.nbComptoir} Cpt.
                  </span>
                </div>
              </div>

              {/* Cash Reconciliation Details if Closed Day */}
              {selectedDay.theoreticalCash !== undefined && (
                <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-zinc-900 border border-amber-500/20 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span>💰 Clôture de Caisse (Espèces)</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {selectedDay.cashClosedAt ? new Date(selectedDay.cashClosedAt).toLocaleTimeString() : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-500 block">Théorique</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {selectedDay.theoreticalCash?.toLocaleString()} DA
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-500 block">Compté réel</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {selectedDay.countedCash?.toLocaleString()} DA
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-500 block">Écart caisse</span>
                      <span
                        className={`font-bold ${
                          (selectedDay.cashDifference || 0) === 0
                            ? 'text-emerald-600'
                            : (selectedDay.cashDifference || 0) > 0
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}
                      >
                        {(selectedDay.cashDifference || 0) > 0 ? `+${selectedDay.cashDifference}` : selectedDay.cashDifference} DA
                      </span>
                    </div>
                  </div>

                  {selectedDay.cashClosingNote && (
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 italic">
                      Note de caisse : "{selectedDay.cashClosingNote}"
                    </p>
                  )}
                </div>
              )}

              {/* Quota Adjustments Log */}
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400" />
                  <span>
                    Journal des ajustements de quota ({selectedDay.quotaAdjustments?.length || 0})
                  </span>
                </h4>
                {!selectedDay.quotaAdjustments || selectedDay.quotaAdjustments.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 italic bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/60">
                    Aucun ajustement manuel enregistré (Quota initial : {selectedDay.quotaInitial} poulets).
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDay.quotaAdjustments.map(adj => (
                      <div
                        key={adj.id}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-white">{adj.reason || adj.mode}</span>
                          <span className="text-zinc-500 ml-2">({adj.authorRole})</span>
                        </div>
                        <div className="font-mono">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {adj.previousQuota} → <strong className="text-amber-700 dark:text-orange-400">{adj.newQuota}</strong>
                          </span>
                          <span className="text-zinc-500 ml-2">
                            {new Date(adj.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Orders List for that Day */}
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-300 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400" />
                  <span>Commandes de la journée ({selectedDayOrders.length})</span>
                </h4>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                      <tr>
                        <th className="p-2.5">N°</th>
                        <th className="p-2.5">Heure</th>
                        <th className="p-2.5">Client</th>
                        <th className="p-2.5">Type & Canal</th>
                        <th className="p-2.5">Paiement</th>
                        <th className="p-2.5">Articles</th>
                        <th className="p-2.5">Statut</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 bg-white dark:bg-zinc-950/60 text-zinc-800 dark:text-zinc-200">
                      {selectedDayOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-zinc-500 italic">
                            Aucune commande enregistrée sur cette journée.
                          </td>
                        </tr>
                      ) : (
                        selectedDayOrders.map(ord => (
                          <tr key={ord.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                            <td className="p-2.5 font-mono font-bold text-amber-700 dark:text-amber-400">
                              {ord.orderNumber}
                            </td>
                            <td className="p-2.5 font-mono text-zinc-500 dark:text-zinc-400">
                              {new Date(ord.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="p-2.5">
                              <div className="font-bold text-zinc-900 dark:text-white">{ord.customerName}</div>
                              <div className="text-[10px] text-zinc-500 font-mono">
                                {ord.customerPhone}
                              </div>
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1">
                                {ord.type === 'delivery' ? (
                                  <span className="text-amber-700 dark:text-orange-400 font-semibold">Livraison</span>
                                ) : (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Comptoir</span>
                                )}
                                <span className="text-[9px] px-1 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-zinc-600 dark:text-zinc-400">
                                  {ord.source || 'app'}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <span className="font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase">
                                {ord.paymentMethod || 'cash'}
                              </span>
                            </td>
                            <td className="p-2.5 text-zinc-700 dark:text-zinc-300">
                              {ord.items.map(i => `${i.quantity}x ${i.nameFr}`).join(', ')}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ord.status === 'cancelled'
                                    ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                                    : ord.status === 'delivered'
                                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                }`}
                              >
                                {ord.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-zinc-900 dark:text-white">
                              {ord.total.toLocaleString()} DA
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
