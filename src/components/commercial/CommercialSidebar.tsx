import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { BrandLogo } from '../common/BrandLogo';
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
} from 'lucide-react';

interface CommercialSidebarProps {
  onOpenManualOrder: () => void;
}

export const CommercialSidebar: React.FC<CommercialSidebarProps> = ({ onOpenManualOrder }) => {
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
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isCook = userRole === 'cuisinier';
  const isCashier = userRole === 'caissier';
  const isManager = userRole === 'gerant';

  return (
    <aside
      className={`w-64 bg-[#111114] ${
        isArabic ? 'border-l' : 'border-r'
      } border-zinc-800 flex flex-col justify-between shrink-0 select-none`}
    >
      <div className="p-4 space-y-5">
        {/* Brand */}
        <BrandLogo size="md" isArabic={isArabic} />

        {/* Quick action button: Nouvelle commande manuelle */}
        {!isCook && (
          <button
            onClick={onOpenManualOrder}
            className="w-full h-10 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-950/40 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.addManualOrder}</span>
          </button>
        )}

        {/* Navigation list */}
        <nav className="space-y-1">
          {/* Commandes (All roles) */}
          <button
            onClick={() => setBackOfficeTab('orders')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
              backOfficeTab === 'orders'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-orange-400" />
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
              onClick={() => setBackOfficeTab('catalog')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'catalog'
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>{t.tabCatalog}</span>
            </button>
          )}

          {/* Clients (Hidden for cook) */}
          {!isCook && (
            <button
              onClick={() => setBackOfficeTab('clients')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'clients'
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>{t.tabClients}</span>
            </button>
          )}

          {/* STOCK (Gérant & Cuisinier, Hidden for Caissier) */}
          {!isCashier && (
            <button
              onClick={() => setBackOfficeTab('stock')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'stock'
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-emerald-400" />
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
              onClick={() => setBackOfficeTab('revenue')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'revenue'
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>{t.tabRevenue}</span>
              </div>
              {isRevenueUnlocked ? (
                <LockOpen className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </button>
          )}

          {/* Paramètres (Gérant only) */}
          {isManager && (
            <button
              onClick={() => setBackOfficeTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                backOfficeTab === 'settings'
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>{t.tabSettings}</span>
            </button>
          )}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-800 space-y-2 text-xs text-zinc-400">
        <div className="flex items-center justify-between">
          <span className="text-[11px]">{t.soundAlerts}</span>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
              settings.soundEnabled
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700'
            }`}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px]">
              {settings.soundEnabled ? t.soundActive : t.soundMute}
            </span>
          </button>
        </div>

        <div className="pt-2 text-[10px] text-zinc-500">
          <p className="font-semibold text-zinc-400">{t.appName} v2.0</p>
          <p>{isArabic ? 'بئر خادم، الجزائر العاصمة' : 'Birkhadem, Alger'}</p>
        </div>
      </div>
    </aside>
  );
};
