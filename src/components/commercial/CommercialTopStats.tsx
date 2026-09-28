import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { UserRole } from '../../types';
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  ChefHat,
  Receipt,
  Flame,
  Settings2,
} from 'lucide-react';
import { DailyChickenModal } from './DailyChickenModal';

export const CommercialTopStats: React.FC = () => {
  const {
    orders,
    language,
    userRole,
    setUserRole,
    dailyChickenInitial,
    dailyChickenRemaining,
    dailyChickenSold,
  } = useApp();

  const [showChickenModal, setShowChickenModal] = useState(false);

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // Stats calculations
  const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
  const countToday = nonCancelledOrders.length;
  const revenueToday = nonCancelledOrders.reduce((acc, o) => acc + o.total, 0);
  const avgBasket = countToday > 0 ? Math.round(revenueToday / countToday) : 0;

  const deliveriesCount = nonCancelledOrders.filter(o => o.type === 'delivery').length;
  const pickupsCount = nonCancelledOrders.filter(o => o.type === 'pickup').length;
  const deliveryRatio = countToday > 0 ? Math.round((deliveriesCount / countToday) * 100) : 50;

  const isCook = userRole === 'cuisinier';

  // Chicken status color
  const chickenStatusColor =
    dailyChickenRemaining <= 0
      ? 'red'
      : dailyChickenRemaining <= 15
      ? 'orange'
      : 'green';

  const percentSold =
    dailyChickenInitial > 0
      ? Math.min(100, Math.round((dailyChickenSold / dailyChickenInitial) * 100))
      : 0;

  return (
    <div className="bg-[#151518] border-b border-zinc-800 p-2.5 sm:p-4 space-y-2.5 sm:space-y-3">
      {/* Top row: Role switcher & Daily Chicken Quick Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Role Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-full">
          <span className="hidden sm:inline text-xs font-bold text-zinc-400 uppercase tracking-wider shrink-0">
            {t.role}
          </span>
          <div className="flex items-center bg-zinc-900 p-0.5 sm:p-1 rounded-xl border border-zinc-800 shadow-inner shrink-0">
            <button
              onClick={() => setUserRole('gerant')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition ${
                userRole === 'gerant'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.roleGerant}</span>
            </button>

            <button
              onClick={() => setUserRole('cuisinier')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition ${
                userRole === 'cuisinier'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>{t.roleCuisinier}</span>
            </button>

            <button
              onClick={() => setUserRole('caissier')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition ${
                userRole === 'caissier'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t.roleCaissier}</span>
            </button>
          </div>
        </div>

        {/* Daily Chicken Quota Interactive Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChickenModal(true)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition shadow-sm active:scale-95 ${
              chickenStatusColor === 'red'
                ? 'bg-red-950/60 border-red-500/50 text-red-300 hover:bg-red-900/60'
                : chickenStatusColor === 'orange'
                ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 hover:bg-amber-900/50'
                : 'bg-zinc-900/90 border-zinc-750 text-zinc-200 hover:border-orange-500/40'
            }`}
            title={t.dailyChickenAdjustBtn}
          >
            <div className="text-base leading-none">🍗</div>
            <div className="text-left text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">
                  {t.dailyChickenTitle} :
                </span>
                <span
                  className={`font-black font-mono ${
                    chickenStatusColor === 'red'
                      ? 'text-red-400 animate-pulse'
                      : chickenStatusColor === 'orange'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {dailyChickenRemaining} / {dailyChickenInitial} {t.dailyChickenRemaining}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <span>{dailyChickenSold} {t.dailyChickenSold}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-orange-400 font-semibold">{t.dailyChickenAdjustBtn}</span>
              </div>
            </div>
            <Settings2 className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-1" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!isCook && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {/* Orders Today (Gerant & Caissier) */}
          <div className="bg-zinc-900/80 p-2.5 sm:p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">{t.todayOrders}</span>
              <div className="text-lg sm:text-xl font-extrabold text-white">{countToday}</div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          {/* Revenue Today (GERANT ONLY) */}
          {userRole === 'gerant' && (
            <div className="bg-zinc-900/80 p-2.5 sm:p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">{t.todayRevenue}</span>
                <div className="text-base sm:text-xl font-extrabold text-amber-400 truncate">
                  {revenueToday.toLocaleString()} <span className="text-[10px] sm:text-xs font-semibold text-zinc-400">{t.currency}</span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Average Basket (GERANT ONLY) */}
          {userRole === 'gerant' && (
            <div className="bg-zinc-900/80 p-2.5 sm:p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">{t.avgBasket}</span>
                <div className="text-base sm:text-xl font-extrabold text-zinc-200 truncate">
                  {avgBasket.toLocaleString()} <span className="text-[10px] sm:text-xs font-semibold text-zinc-400">{t.currency}</span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Ratio Delivery vs Pickup (Gerant & Caissier) */}
          <div className="bg-zinc-900/80 p-2.5 sm:p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">{t.ratioDeliveries}</span>
              <div className="text-[11px] sm:text-xs font-bold text-zinc-200 flex items-center gap-1 sm:gap-1.5">
                <span className="text-orange-400">{deliveryRatio}% {isArabic ? 'توصيل' : 'Liv.'}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-emerald-400">{100 - deliveryRatio}% {isArabic ? 'استلام' : 'Cpt.'}</span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Daily Chicken Modal */}
      {showChickenModal && (
        <DailyChickenModal onClose={() => setShowChickenModal(false)} />
      )}
    </div>
  );
};

