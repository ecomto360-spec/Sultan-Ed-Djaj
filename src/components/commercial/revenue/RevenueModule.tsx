import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../i18n/translations';
import { RevenuePeriod, Order, Expense } from '../../../types';
import {
  calculateRevenueKPIs,
  filterOrdersByPeriod,
  filterExpensesByPeriod,
  formatDailyRevenueChartData,
  formatRushHoursChartData,
  formatDeliveryVsPickupChartData,
  formatTopProductsChartData,
  exportOrdersToCSV,
  exportExpensesToCSV,
} from '../../../services/revenueService';
import { PinProtectionModal } from './PinProtectionModal';
import { ExpenseModal } from './ExpenseModal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Truck,
  CreditCard,
  Lock,
  Calendar,
  Layers,
  FileSpreadsheet,
  Printer,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  PieChart as PieIcon,
  Search,
} from 'lucide-react';

type RevenueSubTab = 'overview' | 'sales' | 'expenses' | 'closing' | 'reports';

const PIE_COLORS = ['#ea580c', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

export const RevenueModule: React.FC = () => {
  const {
    orders,
    expenses,
    stockItems,
    compositions,
    cashClosings,
    closeCashRegister,
    deleteExpense,
    settings,
    isRevenueUnlocked,
    lockRevenue,
    language,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // Sub tab & Period
  const [activeSubTab, setActiveSubTab] = useState<RevenueSubTab>('overview');
  const [period, setPeriod] = useState<RevenuePeriod>('today');
  const [customStart, setCustomStart] = useState<string>(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);

  // Expenses modal
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);

  // Cash Closing state
  const [closingDate, setClosingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [countedCash, setCountedCash] = useState<number>(0);
  const [closingNote, setClosingNote] = useState<string>('');
  const [closingSuccess, setClosingSuccess] = useState<boolean>(false);

  // Sales search
  const [salesSearch, setSalesSearch] = useState<string>('');

  // If not unlocked, render PIN screen
  if (!isRevenueUnlocked) {
    return <PinProtectionModal />;
  }

  // Filter data by selected period
  const filteredOrders = useMemo(() => {
    return filterOrdersByPeriod(orders, period, customStart, customEnd);
  }, [orders, period, customStart, customEnd]);

  const filteredExpenses = useMemo(() => {
    return filterExpensesByPeriod(expenses, period, customStart, customEnd);
  }, [expenses, period, customStart, customEnd]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    return calculateRevenueKPIs(
      filteredOrders,
      filteredExpenses,
      orders,
      expenses,
      period,
      stockItems,
      compositions,
      customStart,
      customEnd
    );
  }, [filteredOrders, filteredExpenses, orders, expenses, period, stockItems, compositions, customStart, customEnd]);

  // Daily target progress
  const dailyTarget = settings.dailyRevenueTarget || 25000;
  const todayDeliveredRevenue = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return orders
      .filter(o => o.status === 'delivered' && o.createdAt.startsWith(todayStr))
      .reduce((acc, o) => acc + o.total, 0);
  }, [orders]);
  const targetPercent = Math.min(100, Math.round((todayDeliveredRevenue / dailyTarget) * 100));

  // Charts data
  const dailyChartData = useMemo(() => {
    return formatDailyRevenueChartData(filteredOrders, filteredExpenses);
  }, [filteredOrders, filteredExpenses]);

  const rushHoursChartData = useMemo(() => {
    return formatRushHoursChartData(filteredOrders);
  }, [filteredOrders]);

  const deliveryVsPickupChartData = useMemo(() => {
    return formatDeliveryVsPickupChartData(filteredOrders);
  }, [filteredOrders]);

  const topProductsChartData = useMemo(() => {
    return formatTopProductsChartData(filteredOrders);
  }, [filteredOrders]);

  // Cash Closing calculations for selected date
  const closingTheoreticalCash = useMemo(() => {
    return orders
      .filter(o => o.status === 'delivered' && o.createdAt.startsWith(closingDate))
      .reduce((acc, o) => acc + o.total, 0);
  }, [orders, closingDate]);

  const closingDifference = countedCash - closingTheoreticalCash;

  const handleCashClosingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    closeCashRegister({
      date: closingDate,
      countedCash,
      note: closingNote.trim() || undefined,
    });
    setClosingSuccess(true);
    setTimeout(() => setClosingSuccess(false), 3000);
  };

  const periods: { id: RevenuePeriod; label: string }[] = [
    { id: 'today', label: t.revenuePeriodToday },
    { id: 'yesterday', label: t.revenuePeriodYesterday },
    { id: '7days', label: t.revenuePeriod7Days },
    { id: '30days', label: t.revenuePeriod30Days },
    { id: 'this_month', label: t.revenuePeriodMonth },
    { id: 'custom', label: t.revenuePeriodCustom },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0e]">
      {/* Top Header: Period Selector & Lock Button */}
      <div className="p-4 border-b border-zinc-800 bg-[#111114] flex flex-wrap items-center justify-between gap-4">
        {/* Period Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs font-bold text-zinc-400 mr-1">
            <Calendar className="w-4 h-4 text-orange-400" />
            <span>{isArabic ? 'الفترة :' : 'Période :'}</span>
          </div>
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                period === p.id
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range if custom is selected */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-800 text-xs">
            <input
              type="date"
              value={customStart}
              onChange={e => setCustomStart(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none"
            />
            <span className="text-zinc-500">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={e => setCustomEnd(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none"
            />
          </div>
        )}

        {/* Lock button */}
        <button
          onClick={lockRevenue}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition border border-zinc-700/60"
        >
          <Lock className="w-3.5 h-3.5 text-orange-400" />
          <span>{t.revenueLockModule}</span>
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="px-5 pt-3 border-b border-zinc-800 flex items-center justify-between bg-[#111114]">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t.revenueTabOverview}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sales')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'sales'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.revenueTabSales}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
              {filteredOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'expenses'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{t.revenueTabExpenses}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
              {filteredExpenses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('closing')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'closing'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{t.revenueTabCashClosing}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'reports'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.revenueTabReports}</span>
          </button>
        </div>

        {/* Quick Add Expense Button */}
        {activeSubTab === 'expenses' && (
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 mb-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md shadow-red-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>{t.revenueAddExpense}</span>
          </button>
        )}
      </div>

      {/* Main SubTab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* SUBTAB 1: OVERVIEW */}
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            {/* Daily Target Progress Card */}
            <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {t.revenueDailyTarget}
                    </span>
                    <span className="text-xs font-extrabold text-orange-400 font-mono">
                      {todayDeliveredRevenue.toLocaleString()} / {dailyTarget.toLocaleString()} DA
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {targetPercent >= 100
                      ? isArabic ? '🎉 تم بلوغ الهدف اليومي بنجاح !' : '🎉 Objectif quotidien atteint !'
                      : isArabic
                      ? `تبقى ${(dailyTarget - todayDeliveredRevenue).toLocaleString()} DA لتحقيق الهدف اليومي`
                      : `Encore ${(dailyTarget - todayDeliveredRevenue).toLocaleString()} DA pour atteindre le quota`}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full md:w-64 space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                  <span>Progression</span>
                  <span className="text-white">{targetPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${targetPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* CA Réalisé */}
              <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>{t.revenueDeliveredCA}</span>
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {kpis.deliveredRevenue.toLocaleString()}{' '}
                  <span className="text-xs font-bold text-zinc-400">DA</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {kpis.revenueGrowthPercent >= 0 ? (
                    <span className="text-emerald-400 flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +{kpis.revenueGrowthPercent}%
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {kpis.revenueGrowthPercent}%
                    </span>
                  )}
                  <span className="text-zinc-500">vs période préc.</span>
                </div>
              </div>

              {/* Commandes Livrées */}
              <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>{t.revenueDeliveredOrders}</span>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {kpis.deliveredOrdersCount}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {kpis.pendingOrdersRevenue > 0 ? (
                    <span className="text-orange-400 font-semibold">
                      +{kpis.pendingOrdersRevenue.toLocaleString()} DA en cours
                    </span>
                  ) : (
                    <span className="text-zinc-500">Aucune en préparation</span>
                  )}
                </div>
              </div>

              {/* Panier Moyen */}
              <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>{t.revenueAvgBasket}</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {kpis.avgBasket.toLocaleString()}{' '}
                  <span className="text-xs font-bold text-zinc-400">DA</span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  Frais livraison inclus: {kpis.deliveryFeesCollected.toLocaleString()} DA
                </div>
              </div>

              {/* Bénéfice Net Estimé */}
              <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-zinc-400 text-xs">
                  <span>{t.revenueNetProfit}</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div
                  className={`text-2xl font-black font-mono ${
                    kpis.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {kpis.netProfit.toLocaleString()}{' '}
                  <span className="text-xs font-bold text-zinc-400">DA</span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Charges: {kpis.totalExpenses.toLocaleString()} DA</span>
                  <span className="text-emerald-400 font-bold">
                    Marge {kpis.grossMarginPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Revenue Area Chart */}
              <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {t.revenueEvolutionDaily}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {isArabic ? 'تطور المداخيل اليومية والمصاريف' : 'Chiffre d\'affaires et dépenses par jour'}
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChartData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="recette"
                        name="Chiffre d'affaires"
                        stroke="#ea580c"
                        fillOpacity={1}
                        fill="url(#colorRev)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="depenses"
                        name="Dépenses"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorExp)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rush Hours Hourly Breakdown */}
              <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {t.revenueHourlyRushHours}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {isArabic
                        ? 'ذروة الطلبات: الغداء (13:00-14:30) والعشاء (20:00-23:00)'
                        : 'Rush déjeuner (13h-14h30) et dîner (20h-23h)'}
                    </p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rushHoursChartData}>
                      <XAxis dataKey="hour" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="commandes"
                        name="Commandes"
                        fill="#ea580c"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Secondary Charts: Delivery vs Pickup & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Delivery vs Pickup Pie */}
              <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xl">
                <h4 className="font-bold text-white text-sm">
                  {t.revenueDeliveryVsPickup}
                </h4>
                <div className="h-56 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deliveryVsPickupChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {deliveryVsPickupChartData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Products */}
              <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xl">
                <h4 className="font-bold text-white text-sm">{t.revenueTopProducts}</h4>
                <div className="space-y-2.5">
                  {topProductsChartData.map((p, idx) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px]">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-white">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-400 font-mono">
                          {p.ca.toLocaleString()} DA
                        </div>
                        <div className="text-[10px] text-zinc-500 font-semibold">
                          {p.quantite} {isArabic ? 'قطعة' : 'unités'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: SALES TABLE */}
        {activeSubTab === 'sales' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center justify-between gap-3 bg-[#141418] p-3 rounded-2xl border border-zinc-800">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={salesSearch}
                  onChange={e => setSalesSearch(e.target.value)}
                  placeholder={isArabic ? 'بحث برقم الطلب أو الزبون...' : 'Recherche par commande ou client...'}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="text-xs text-zinc-400">
                <span className="font-bold text-white">{filteredOrders.length}</span>{' '}
                {isArabic ? 'طلبات منجزة' : 'commandes dans la période'}
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-[#141418] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Commande</th>
                      <th className="py-3 px-4">Date & Heure</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Articles</th>
                      <th className="py-3 px-4 text-right">Total (DA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {filteredOrders
                      .filter(o => {
                        const q = salesSearch.toLowerCase();
                        return (
                          o.orderNumber.toLowerCase().includes(q) ||
                          o.customerName.toLowerCase().includes(q) ||
                          o.customerPhone.includes(q)
                        );
                      })
                      .map(order => (
                        <tr key={order.id} className="hover:bg-zinc-800/30 transition">
                          <td className="py-3 px-4 font-bold text-orange-400 font-mono">
                            {order.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                            {new Date(order.createdAt).toLocaleDateString(
                              language === 'ar' ? 'ar-DZ' : 'fr-DZ',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{order.customerName}</div>
                            <div className="text-[10px] text-zinc-500">{order.customerPhone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                order.type === 'delivery'
                                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {order.type === 'delivery' ? 'Livraison' : 'Comptoir'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-300 max-w-xs truncate">
                            {order.items.map(i => `${i.quantity}x ${i.nameFr}`).join(', ')}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-amber-400 font-mono">
                            {order.total.toLocaleString()} DA
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: EXPENSES */}
        {activeSubTab === 'expenses' && (
          <div className="space-y-4">
            {/* Category breakdown cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { id: 'achats_matieres', label: 'Achats matières' },
                { id: 'livreur', label: 'Livreurs' },
                { id: 'salaires', label: 'Salaires' },
                { id: 'loyer', label: 'Loyer' },
                { id: 'energie', label: 'Énergie / Gaz' },
                { id: 'autre', label: 'Autres' },
              ].map(cat => {
                const totalCat = filteredExpenses
                  .filter(e => e.category === cat.id)
                  .reduce((acc, e) => acc + e.amount, 0);

                return (
                  <div
                    key={cat.id}
                    className="bg-[#141418] border border-zinc-800 rounded-xl p-3 space-y-1"
                  >
                    <span className="text-[10px] text-zinc-400 font-semibold truncate block">
                      {cat.label}
                    </span>
                    <div className="text-base font-black text-red-400 font-mono">
                      {totalCat.toLocaleString()} DA
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expenses List */}
            <div className="bg-[#141418] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Saisi par</th>
                      <th className="py-3 px-4 text-right">Montant (DA)</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-3 px-4 font-mono text-zinc-400">{exp.date}</td>
                        <td className="py-3 px-4 font-bold text-white capitalize">
                          {exp.category.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 text-zinc-300">{exp.note || '—'}</td>
                        <td className="py-3 px-4 text-zinc-400">{exp.createdBy}</td>
                        <td className="py-3 px-4 text-right font-black text-red-400 font-mono">
                          -{exp.amount.toLocaleString()} DA
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(isArabic ? 'حذف هذه النفقة ؟' : 'Supprimer cette dépense ?')) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: CASH CLOSING */}
        {activeSubTab === 'closing' && (
          <div className="space-y-6">
            {/* Closing Form */}
            <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {t.closingServiceFormTitle}
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      {isArabic
                        ? 'مقارنة النقد الفعلي في الدرج مع مجموع مبيعات اليوم'
                        : 'Comparaison entre le liquide en caisse et le total théorique des ventes'}
                    </p>
                  </div>
                </div>

                <input
                  type="date"
                  value={closingDate}
                  onChange={e => setClosingDate(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <form onSubmit={handleCashClosingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Theoretical */}
                  <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 font-semibold">
                      {t.closingTheoreticalCash}
                    </span>
                    <div className="text-xl font-black text-amber-400 font-mono">
                      {closingTheoreticalCash.toLocaleString()} DA
                    </div>
                  </div>

                  {/* Counted Cash input */}
                  <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 font-semibold">
                      {t.closingCountedCash} (DA)
                    </span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      required
                      value={countedCash}
                      onChange={e => setCountedCash(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-lg font-black text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Difference */}
                  <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-[11px] text-zinc-400 font-semibold">
                      {t.closingDifference}
                    </span>
                    <div
                      className={`text-xl font-black font-mono ${
                        closingDifference === 0
                          ? 'text-emerald-400'
                          : closingDifference > 0
                          ? 'text-blue-400'
                          : 'text-red-400'
                      }`}
                    >
                      {closingDifference > 0 ? `+${closingDifference}` : closingDifference} DA
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    {isArabic ? 'ملاحظة نهاية الخدمة :' : 'Observations de caisse :'}
                  </label>
                  <input
                    type="text"
                    value={closingNote}
                    onChange={e => setClosingNote(e.target.value)}
                    placeholder="Ex: Fond de caisse initial 5000 DA déduit, tout concorde"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {closingSuccess && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isArabic ? 'تمت المصادقة وقفل الصندوق !' : 'Caisse clôturée avec succès !'}</span>
                    </span>
                  )}
                  <button
                    type="submit"
                    className="ml-auto px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{t.closingValidateAndLock}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Historical Closings */}
            <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xl max-w-4xl mx-auto">
              <h4 className="font-bold text-white text-sm">{t.closingHistoryTitle}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Théorique</th>
                      <th className="py-2.5 px-4">Compté</th>
                      <th className="py-2.5 px-4">Écart</th>
                      <th className="py-2.5 px-4">Responsable</th>
                      <th className="py-2.5 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {cashClosings.map(c => (
                      <tr key={c.id} className="hover:bg-zinc-800/30 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-white">{c.date}</td>
                        <td className="py-2.5 px-4 font-mono text-zinc-300">
                          {c.theoreticalCash.toLocaleString()} DA
                        </td>
                        <td className="py-2.5 px-4 font-mono text-white font-bold">
                          {c.countedCash.toLocaleString()} DA
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold">
                          <span
                            className={
                              c.difference === 0
                                ? 'text-emerald-400'
                                : c.difference > 0
                                ? 'text-blue-400'
                                : 'text-red-400'
                            }
                          >
                            {c.difference > 0 ? `+${c.difference}` : c.difference} DA
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-zinc-400">{c.closedBy}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {t.closingStatusLocked}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: REPORTS & EXPORTS */}
        {activeSubTab === 'reports' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">{t.revenueExportTitle}</h3>
                <p className="text-xs text-zinc-400">
                  {isArabic
                    ? 'تصدير البيانات المالية والمبيعات بصيغة CSV المتوافقة مع Excel'
                    : 'Exportez l\'ensemble des données de ventes et de charges au format CSV'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Sales */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">
                      {isArabic ? 'سجل المبيعات والطلبات' : 'Journal des Ventes'}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {filteredOrders.length} {isArabic ? 'طلب منجز' : 'commandes prêtes à exporter'}
                    </p>
                  </div>
                  <button
                    onClick={() => exportOrdersToCSV(filteredOrders)}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-orange-950/40"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{t.revenueExportSalesCSV}</span>
                  </button>
                </div>

                {/* Export Expenses */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">
                      {isArabic ? 'سجل النفقات والمصاريف' : 'Journal des Dépenses'}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {filteredExpenses.length} {isArabic ? 'مصروف مسجل' : 'dépenses prêtes à exporter'}
                    </p>
                  </div>
                  <button
                    onClick={() => exportExpensesToCSV(filteredExpenses)}
                    className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{t.revenueExportExpensesCSV}</span>
                  </button>
                </div>
              </div>

              {/* Print action */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  {isArabic ? 'طباعة تقرير الإيرادات الكامل' : 'Impression directe de la synthèse'}
                </span>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isArabic ? 'طباعة التقرير' : 'Imprimer la synthèse'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      {showExpenseModal && <ExpenseModal onClose={() => setShowExpenseModal(false)} />}
    </div>
  );
};
