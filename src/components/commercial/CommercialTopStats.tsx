import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { calculateSalesMetrics, isOrderInDay } from '../../services/salesService';
import {
  ShoppingBag,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  ChefHat,
  Receipt,
  Settings2,
  Menu,
  Globe,
  Volume2,
  VolumeX,
  Lock,
  Archive,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { DailyChickenModal } from './DailyChickenModal';
import { CloseDayModal } from './CloseDayModal';
import { ThemeToggle } from '../common/ThemeToggle';

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
    setLanguage,
    userRole,
    setUserRole,
    settings,
    updateSettings,
    toggleMobileSidebar,
    dailyChickenInitial,
    dailyChickenRemaining,
    dailyChickenSold,
    currentDay,
    unclosedPastDay,
    refreshSync,
  } = useApp();

  const [showChickenModal, setShowChickenModal] = useState(false);
  const [showCloseDayModal, setShowCloseDayModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSync();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

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
    <div className="bg-white dark:bg-[#151518] border-b border-zinc-200 dark:border-zinc-800 p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 transition-colors">
      {/* Unclosed past day warning banner */}
      {unclosedPastDay && (
        <div className="p-2.5 sm:px-3.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/50 text-amber-950 dark:text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-bold">
              {isArabic
                ? `تنبيه: يوم ${unclosedPastDay.date.slice(8, 10)}/${unclosedPastDay.date.slice(5, 7)} لم يتم إغلاقه بعد`
                : `La journée du ${unclosedPastDay.date.slice(8, 10)}/${unclosedPastDay.date.slice(5, 7)} n'est pas clôturée`}
            </span>
          </div>
          {isManager && (
            <button
              onClick={() => setShowCloseDayModal(true)}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 font-extrabold text-xs transition active:scale-95"
            >
              {isArabic ? 'إغلاق الآن' : 'Clôturer'}
            </button>
          )}
        </div>
      )}

      {/* Top row: Role switcher & Daily Chicken Quick Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Role Switcher (+ Mobile Drawer button in standalone /admin) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 max-w-full">
          {isStandaloneAdmin && (
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-amber-600 dark:text-orange-400 border border-zinc-300 dark:border-zinc-700/60 transition active:scale-95 shrink-0"
              title="Menu Navigation"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider shrink-0">
            {t.role}
          </span>
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-0.5 sm:p-1 rounded-xl border border-zinc-300 dark:border-zinc-800 shadow-inner shrink-0">
            <button
              onClick={() => setUserRole('gerant')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition ${
                userRole === 'gerant'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.roleGerant}</span>
            </button>

            <button
              onClick={() => setUserRole('cuisinier')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition ${
                userRole === 'cuisinier'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
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
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t.roleCaissier}</span>
            </button>
          </div>
        </div>

        {/* Daily Chicken Quota Interactive Pill + Standalone Admin Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowChickenModal(true)}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition shadow-sm active:scale-95 ${
              chickenStatusColor === 'red'
                ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60'
                : chickenStatusColor === 'orange'
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-500/50 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                : 'bg-zinc-50 dark:bg-zinc-900/90 border-zinc-250 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 hover:border-amber-500/40'
            }`}
            title={t.dailyChickenAdjustBtn}
          >
            <div className="text-base leading-none">🍗</div>
            <div className="text-left text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-zinc-900 dark:text-white">
                  {t.dailyChickenTitle} :
                </span>
                <span
                  className={`font-black font-mono ${
                    chickenStatusColor === 'red'
                      ? 'text-red-600 dark:text-red-400 animate-pulse'
                      : chickenStatusColor === 'orange'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {dailyChickenRemaining} / {dailyChickenInitial} {t.dailyChickenRemaining}
                </span>
              </div>
              <div className="text-[10px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                <span>{dailyChickenSold} {t.dailyChickenSold}</span>
                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                <span className="text-amber-700 dark:text-orange-400 font-semibold">{t.dailyChickenAdjustBtn}</span>
              </div>
            </div>
            <Settings2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0 ml-1" />
          </button>

          {/* Real-time Sync Indicator & Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-750 transition active:scale-95 shadow-sm min-h-[40px]"
            title={isArabic ? 'مزامنة وتحديث فوري للطلبات' : 'Actualiser et synchroniser les commandes en direct'}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {isArabic ? 'مباشر' : 'En direct'}
            </span>
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {isManager && currentDay && (
            <button
              onClick={() => setShowCloseDayModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/70 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/40 text-xs font-bold transition active:scale-95"
              title="Clôturer la journée en cours"
            >
              <Archive className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              <span>{isArabic ? 'إغلاق اليوم' : 'Clôturer la journée'}</span>
            </button>
          )}

          {isStandaloneAdmin && (
            <div className="flex items-center gap-1.5">
              <ThemeToggle />

              {onLockAdminPin && (
                <button
                  onClick={onLockAdminPin}
                  title={isArabic ? 'شاشة الدخول برمز PIN' : 'Écran de connexion PIN'}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 transition min-h-[44px]"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">PIN</span>
                </button>
              )}

              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                title={settings.soundEnabled ? 'Son activé' : 'Son désactivé'}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-600 dark:text-orange-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                )}
              </button>

              <button
                onClick={() => setLanguage(isArabic ? 'fr' : 'ar')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-800 transition min-h-[44px]"
                title="Changer de langue / تغيير اللغة"
              >
                <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400" />
                <span>{isArabic ? 'FR' : 'عربي'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

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

      {/* Daily Chicken Modal */}
      {showChickenModal && (
        <DailyChickenModal onClose={() => setShowChickenModal(false)} />
      )}

      {/* Close Day Modal */}
      {showCloseDayModal && (
        <CloseDayModal onClose={() => setShowCloseDayModal(false)} />
      )}
    </div>
  );
};
