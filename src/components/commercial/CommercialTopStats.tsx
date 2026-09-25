import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { UserRole } from '../../types';
import { ShoppingBag, TrendingUp, DollarSign, PieChart, Users, ShieldCheck, ChefHat, Receipt } from 'lucide-react';

export const CommercialTopStats: React.FC = () => {
  const { orders, language, userRole, setUserRole } = useApp();
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

  return (
    <div className="bg-[#151518] border-b border-zinc-800 p-4 space-y-3">
      {/* Top row: Role switcher & quick info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {t.role}
          </span>
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 shadow-inner">
            <button
              onClick={() => setUserRole('gerant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
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

        {/* Cuisinier info badge */}
        {isCook && (
          <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
            {isArabic
              ? '👨‍🍳 وضع شاشة المطبخ: عرض مبسط للتحضير السريع (بدون أسعار أو بيانات الزبائن)'
              : '👨‍🍳 Mode Écran Cuisine : Affichage simplifié pour préparation (sans prix ni données clients)'}
          </div>
        )}
      </div>

      {/* Stats Cards: Cuisinier has no stats; Caissier sees Orders & Delivery ratio; Gerant sees all including Revenue & Basket */}
      {!isCook && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Orders Today (Gerant & Caissier) */}
          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-zinc-400 font-medium">{t.todayOrders}</span>
              <div className="text-xl font-extrabold text-white">{countToday}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          {/* Revenue Today (GERANT ONLY) */}
          {userRole === 'gerant' && (
            <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] text-zinc-400 font-medium">{t.todayRevenue}</span>
                <div className="text-xl font-extrabold text-amber-400">
                  {revenueToday.toLocaleString()} <span className="text-xs font-semibold text-zinc-400">{t.currency}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Average Basket (GERANT ONLY) */}
          {userRole === 'gerant' && (
            <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] text-zinc-400 font-medium">{t.avgBasket}</span>
                <div className="text-xl font-extrabold text-zinc-200">
                  {avgBasket.toLocaleString()} <span className="text-xs font-semibold text-zinc-400">{t.currency}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Ratio Delivery vs Pickup (Gerant & Caissier) */}
          <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400 font-medium">{t.ratioDeliveries}</span>
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <span className="text-orange-400">{deliveryRatio}% {isArabic ? 'توصيل' : 'Liv.'}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-emerald-400">{100 - deliveryRatio}% {isArabic ? 'استلام' : 'Cpt.'}</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
