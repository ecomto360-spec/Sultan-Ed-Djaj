import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { DailyChickenModal } from './DailyChickenModal';
import {
  ShoppingBag,
  BookOpen,
  Users,
  Package,
  TrendingUp,
  Settings,
  PlusCircle,
  Volume2,
  VolumeX,
  Lock,
  LockOpen,
  X,
  History,
  ShieldCheck,
  ChefHat,
  Receipt,
  RefreshCw,
  Smartphone,
} from 'lucide-react';

interface CommercialSidebarProps {
  onOpenManualOrder: () => void;
  isStandaloneAdmin?: boolean;
  onLockAdminPin?: () => void;
}

export const CommercialSidebar: React.FC<CommercialSidebarProps> = ({
  onOpenManualOrder,
  onLockAdminPin,
}) => {
  const {
    backOfficeTab,
    setBackOfficeTab,
    userRole,
    setUserRole,
    authenticatedRole,
    unreadAlertCount,
    activeStockAlertsCount,
    isRevenueUnlocked,
    language,
    settings,
    updateSettings,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    currentDay,
    dailyChickenInitial,
    dailyChickenRemaining,
    dailyChickenSold,
    refreshSync,
  } = useApp();

  const [showChickenModal, setShowChickenModal] = useState(false);
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
  const effectiveRole = authenticatedRole !== 'gerant' ? authenticatedRole : userRole;
  const isCook = effectiveRole === 'cuisinier';
  const isCashier = effectiveRole === 'caissier';
  const isManager = effectiveRole === 'gerant';

  const chickenStatusColor =
    dailyChickenRemaining <= 0
      ? 'red'
      : dailyChickenRemaining <= 15
      ? 'orange'
      : 'green';

  const handleTabClick = (tab: any) => {
    setBackOfficeTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const handleManualOrderClick = () => {
    setIsMobileSidebarOpen(false);
    onOpenManualOrder();
  };

  const renderContent = (isMobileDrawer: boolean) => (
    <div className="flex flex-col justify-between h-full bg-[#faf9f5] dark:bg-[#111114] text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="p-4 space-y-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <BrandLogo size="md" isArabic={isArabic} />
          {isMobileDrawer && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Role & En direct (Live status) in Sidebar */}
        {authenticatedRole === 'gerant' ? (
          <div className="space-y-1.5 p-2 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between px-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
              <span className="uppercase tracking-wider text-[10px]">{t.role}</span>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition active:scale-95 shadow-xs"
                title={isArabic ? 'مزامنة فورية' : 'Synchroniser en direct'}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {isArabic ? 'مباشر' : 'En direct'}
                </span>
                <RefreshCw className={`w-3 h-3 text-zinc-500 dark:text-zinc-400 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-white dark:bg-zinc-950 p-1 rounded-xl border border-zinc-250 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setUserRole('gerant')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  userRole === 'gerant'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="truncate">{t.roleGerant}</span>
              </button>
              <button
                type="button"
                onClick={() => setUserRole('cuisinier')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  userRole === 'cuisinier'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span className="truncate">{t.roleCuisinier}</span>
              </button>
              <button
                type="button"
                onClick={() => setUserRole('caissier')}
                className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition ${
                  userRole === 'caissier'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="truncate">{t.roleCaissier}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {authenticatedRole === 'caissier' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
                <Receipt className="w-3.5 h-3.5" />
                <span>{t.roleCaissier}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs shadow-xs">
                <ChefHat className="w-3.5 h-3.5" />
                <span>{t.roleCuisinier}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition active:scale-95 shadow-xs"
              title={isArabic ? 'مزامنة فورية' : 'Synchroniser en direct'}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {isArabic ? 'مباشر' : 'En direct'}
              </span>
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        )}

        {/* Quick action button: Nouvelle commande manuelle */}
        {!isCook && (
          <button
            onClick={handleManualOrderClick}
            disabled={!currentDay}
            className={`w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              currentDay
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md shadow-orange-950/20 active:scale-95'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border border-zinc-300 dark:border-zinc-700 cursor-not-allowed'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.addManualOrder}</span>
          </button>
        )}

        {/* Navigation list */}
        <nav className="space-y-1">
          {/* Commandes (All roles) */}
          <button
            onClick={() => handleTabClick('orders')}
            className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              backOfficeTab === 'orders'
                ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-orange-400" />
              <span>{t.tabOrders}</span>
            </div>
            {unreadAlertCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* Catalogue (Visible to Gérant, Cuisinier, Caissier) */}
          <button
            onClick={() => handleTabClick('catalog')}
            className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              backOfficeTab === 'catalog'
                ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t.tabCatalog}</span>
            </div>
            {!isManager && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Dispo
              </span>
            )}
          </button>

          {/* Page client (Gérant ONLY) */}
          {isManager && (
            <button
              onClick={() => handleTabClick('client_page')}
              className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'client_page'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Smartphone className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>{t.tabClientPage}</span>
            </button>
          )}

          {/* Clients (Hidden for cook) */}
          {!isCook && (
            <button
              onClick={() => handleTabClick('clients')}
              className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'clients'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t.tabClients}</span>
            </button>
          )}

          {/* STOCK (Gérant & Cuisinier, Hidden for Caissier) */}
          {!isCashier && (
            <>
              <button
                onClick={() => handleTabClick('stock')}
                className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  backOfficeTab === 'stock'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.tabStock}</span>
                </div>
                {activeStockAlertsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                    {activeStockAlertsCount}
                  </span>
                )}
              </button>

              {/* Capture 2 : Poulets du Jour sous STOCK */}
              <div
                onClick={() => isManager && setShowChickenModal(true)}
                className={`mx-0.5 my-1.5 p-2.5 rounded-2xl border transition shadow-sm ${
                  isManager ? 'cursor-pointer hover:border-amber-500/50 active:scale-[0.99]' : ''
                } ${
                  chickenStatusColor === 'red'
                    ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300'
                    : chickenStatusColor === 'orange'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-500/50 text-amber-900 dark:text-amber-300'
                    : 'bg-white dark:bg-zinc-900/90 border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                }`}
                title={isManager ? t.dailyChickenAdjustBtn : undefined}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none mt-0.5 shrink-0">🍗</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="font-bold text-zinc-900 dark:text-white truncate">
                        {t.dailyChickenTitle} :
                      </span>
                      <span
                        className={`font-black font-mono shrink-0 ${
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
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between gap-1 mt-0.5">
                      <span>{dailyChickenSold} {t.dailyChickenSold}</span>
                      {isManager && (
                        <span className="text-amber-700 dark:text-orange-400 font-semibold hover:underline">
                          {t.dailyChickenAdjustBtn}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Pour Caissier (qui n'a pas Stock) : Poulets du Jour sous Clients */}
          {isCashier && (
            <div
              className={`mx-0.5 my-1.5 p-2.5 rounded-2xl border shadow-sm ${
                chickenStatusColor === 'red'
                  ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-300'
                  : chickenStatusColor === 'orange'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-500/50 text-amber-900 dark:text-amber-300'
                  : 'bg-white dark:bg-zinc-900/90 border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5 shrink-0">🍗</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="font-bold text-zinc-900 dark:text-white truncate">
                      {t.dailyChickenTitle} :
                    </span>
                    <span
                      className={`font-black font-mono shrink-0 ${
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
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                    <span>{dailyChickenSold} {t.dailyChickenSold}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RECETTES (Gérant ONLY) */}
          {isManager && (
            <button
              onClick={() => handleTabClick('revenue')}
              className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'revenue'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t.tabRevenue}</span>
            </button>
          )}

          {/* HISTORIQUE DES JOURNÉES (Gérant ONLY) */}
          {isManager && (
            <button
              onClick={() => handleTabClick('history')}
              className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'history'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              <History className="w-4 h-4 text-amber-600 dark:text-orange-400" />
              <span>{t.tabHistory}</span>
            </button>
          )}

          {/* Paramètres (Gérant only) */}
          {isManager && (
            <button
              onClick={() => handleTabClick('settings')}
              className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'settings'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Settings className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>{t.tabSettings}</span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer Info & Settings */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
        {/* Theme Switcher in Back-Office Sidebar */}
        <ThemeToggle variant="full" />

        {/* Sound toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-medium">{t.soundAlerts}</span>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`min-h-[38px] px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition ${
              settings.soundEnabled
                ? 'bg-amber-500/10 text-amber-700 dark:text-orange-400 border-amber-500/30 font-semibold'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px]">
              {settings.soundEnabled ? t.soundActive : t.soundMute}
            </span>
          </button>
        </div>

        {onLockAdminPin && (
          <button
            onClick={onLockAdminPin}
            className="w-full min-h-[38px] px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تسجيل الخروج / قفل' : 'Déconnexion / Verrouiller'}</span>
          </button>
        )}

        <div className="pt-2 text-[10px] text-zinc-500 space-y-0.5 border-t border-zinc-200 dark:border-zinc-800/60">
          <p className="font-semibold text-zinc-700 dark:text-zinc-400">{t.appName} • 24h/24</p>
          <p>{isArabic ? 'البساتين، بئر خادم • مقابل تقنيكوم ثانوية زحوال' : 'Les Vergers, Birkhadem • Face Technicum Zahoual'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (lg screens and up) */}
      <aside
        className={`hidden lg:flex w-64 bg-[#faf9f5] dark:bg-[#111114] ${
          isArabic ? 'border-l' : 'border-r'
        } border-zinc-200 dark:border-zinc-800 flex-col justify-between shrink-0 select-none transition-colors`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile & Tablet Slide-over Drawer */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer content */}
          <div
            className={`relative w-72 max-w-[85vw] bg-[#faf9f5] dark:bg-[#111114] ${
              isArabic ? 'border-l mr-auto' : 'border-r ml-0'
            } border-zinc-200 dark:border-zinc-800 flex flex-col justify-between z-10 shadow-2xl h-full overflow-y-auto select-none transition-colors`}
          >
            {renderContent(true)}
          </div>
        </div>
      )}

      {showChickenModal && (
        <DailyChickenModal onClose={() => setShowChickenModal(false)} />
      )}
    </>
  );
};
