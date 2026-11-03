import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { calculateSalesMetrics, isOrderInDay } from '../../services/salesService';
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  PieChart,
  Menu,
  Lock,
  Archive,
  AlertTriangle,
} from 'lucide-react';
import { CloseDayModal } from './CloseDayModal';

interface CommercialTopStatsProps {
  isStandaloneAdmin?: boolean;
  onLockAdminPin?: () => void;
}

export const CommercialTopStats: React.FC<CommercialTopStatsProps> = ({
  isStandaloneAdmin = false,
  onLockAdminPin,
}) => {
  const {
    orders,
    language,
    userRole,
    toggleMobileSidebar,
    currentDay,
    unclosedPastDay,
  } = useApp();

  const [showCloseDayModal, setShowCloseDayModal] = useState(false);

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // Orders belonging to open day
  const todayOrders = useMemo(() => {
    if (!currentDay) return [];
    return orders.filter(o => isOrderInDay(o, currentDay));
  }, [orders, currentDay]);

  const salesMetrics = useMemo(() => {
    return calculateSalesMetrics(todayOrders);
  }, [todayOrders]);

  // Pure stats: ONLY for the currently open Day (0 if no day open)
  const countToday = currentDay ? salesMetrics.nbCommandes : 0;
  const revenueToday = currentDay ? salesMetrics.caProduits : 0;
  const deliveryFeesToday = currentDay ? salesMetrics.fraisLivraison : 0;
  const caInProgress = currentDay ? salesMetrics.caEnCours : 0;
  const avgBasket = currentDay ? salesMetrics.panierMoyen : 0;

  const deliveriesCount = currentDay ? salesMetrics.nbLivraison : 0;
  const pickupsCount = currentDay ? salesMetrics.nbComptoir : 0;
  const deliveryRatio = countToday > 0 ? Math.round((deliveriesCount / countToday) * 100) : 0;
  const pickupRatio = countToday > 0 ? 100 - deliveryRatio : 0;

  const isCook = userRole === 'cuisinier';
  const isManager = userRole === 'gerant';

  const hasStatsCards = !isCook;
  const hasCloseDay = isManager && Boolean(currentDay);
  const hasPinLock = Boolean(isStandaloneAdmin && onLockAdminPin);
  const hasMobileMenu = Boolean(isStandaloneAdmin);

  const hasDesktopContent = hasStatsCards || hasCloseDay || hasPinLock;

  // If there's no desktop content and no mobile menu, don't render anything
  if (!hasDesktopContent && !hasMobileMenu) {
    return null;
  }

  return (
    <div
      className={`bg-white dark:bg-[#151518] transition-colors ${
        !hasDesktopContent
          ? 'lg:hidden border-b border-zinc-200 dark:border-zinc-800 p-2.5'
          : 'border-b border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-4 space-y-2.5 sm:space-y-3'
      }`}
    >
      {/* Top action row: Mobile menu button (on mobile) + Close Day (Manager) + Standalone PIN lock */}
      {(hasMobileMenu || hasCloseDay || hasPinLock) && (
        <div className={`flex items-center justify-between gap-2 ${!hasCloseDay && !hasPinLock ? 'lg:hidden' : ''}`}>
          {hasMobileMenu && (
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-amber-600 dark:text-orange-400 border border-zinc-300 dark:border-zinc-700/60 transition active:scale-95 shrink-0"
              title="Menu Navigation"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {(hasCloseDay || hasPinLock) && (
            <div className="flex items-center gap-1.5 ms-auto shrink-0">
              {hasCloseDay && (
                <button
                  onClick={() => setShowCloseDayModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/70 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/40 text-xs font-bold transition active:scale-95"
                  title="Clôturer la journée en cours"
                >
                  <Archive className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>{isArabic ? 'إغلاق اليوم' : 'Clôturer la journée'}</span>
                </button>
              )}

              {hasPinLock && (
                <button
                  onClick={onLockAdminPin}
                  title={isArabic ? 'شاشة الدخول برمز PIN' : 'Écran de connexion PIN'}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 transition min-h-[44px]"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">PIN</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {!isCook && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          {/* Orders Today (Gerant & Caissier) */}
          <div className="bg-zinc-50 dark:bg-zinc-900/80 p-2.5 sm:p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">{t.todayOrders}</span>
              <div className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white">{countToday}</div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-orange-400 flex items-center justify-center border border-amber-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          {/* Revenue Today (GERANT ONLY) */}
          {userRole === 'gerant' && (
            <div className="bg-zinc-50 dark:bg-zinc-900/80 p-2.5 sm:p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 font-medium block">
                  {isArabic ? 'رقم أعمال المنتجات' : 'CA Produits'}
                </span>
                <div className="text-base sm:text-xl font-extrabold text-amber-700 dark:text-amber-400 truncate">
                  {revenueToday.toLocaleString()} <span className="text-[10px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.currency}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-zinc-500">
                  {deliveryFeesToday > 0 && (
                    <span className="text-amber-600 dark:text-amber-500 font-semibold">
                      +{deliveryFeesToday.toLocaleString()} DA livr.
                    </span>
                  )}
                  {caInProgress > 0 && (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      • {caInProgress.toLocaleString()} DA en cours
                    </span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Average Basket (GERANT ONLY) */}
          {userRole === 'gerant' && (
            <div className="bg-zinc-50 dark:bg-zinc-900/80 p-2.5 sm:p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">{t.avgBasket}</span>
                <div className="text-base sm:text-xl font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                  {avgBasket.toLocaleString()} <span className="text-[10px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400">{t.currency}</span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Ratio Delivery vs Pickup (Gerant & Caissier) */}
          <div className="bg-zinc-50 dark:bg-zinc-900/80 p-2.5 sm:p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">{t.ratioDeliveries}</span>
              <div className="text-[11px] sm:text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 sm:gap-1.5">
                <span className="text-amber-700 dark:text-orange-400">{deliveryRatio}% {isArabic ? 'توصيل' : 'Liv.'} ({deliveriesCount})</span>
                <span className="text-zinc-400 dark:text-zinc-600">/</span>
                <span className="text-emerald-700 dark:text-emerald-400">{pickupRatio}% {isArabic ? 'استلام' : 'Cpt.'} ({pickupsCount})</span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Close Day Modal */}
      {showCloseDayModal && (
        <CloseDayModal onClose={() => setShowCloseDayModal(false)} />
      )}
    </div>
  );
};
