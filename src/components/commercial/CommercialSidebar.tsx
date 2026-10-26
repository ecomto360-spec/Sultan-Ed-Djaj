import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
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
    unreadAlertCount,
    activeStockAlertsCount,
    isRevenueUnlocked,
    language,
    settings,
    updateSettings,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    currentDay,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isCook = userRole === 'cuisinier';
  const isCashier = userRole === 'caissier';
  const isManager = userRole === 'gerant';

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
      <div className="p-4 space-y-5">
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

          {/* Catalogue (Hidden for cook) */}
          {!isCook && (
            <button
              onClick={() => handleTabClick('catalog')}
              className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'catalog'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t.tabCatalog}</span>
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
          )}

          {/* RECETTES (Gérant ONLY, Lock icon) */}
          {isManager && (
            <button
              onClick={() => handleTabClick('revenue')}
              className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'revenue'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-orange-400 border border-amber-500/30'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{t.tabRevenue}</span>
              </div>
              {isRevenueUnlocked ? (
                <LockOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              )}
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
    </>
  );
};
