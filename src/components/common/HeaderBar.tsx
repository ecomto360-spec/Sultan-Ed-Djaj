import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Smartphone, Receipt, ChefHat, ShieldCheck, Volume2, VolumeX, Globe, Menu, AlertTriangle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { setAdminToken } from '../../services/authService';

export const HeaderBar: React.FC = () => {
  const {
    view,
    setView,
    language,
    setLanguage,
    settings,
    updateSettings,
    unreadAlertCount,
    userRole,
    setUserRole,
    setAuthenticatedRole,
    toggleMobileSidebar,
    unclosedPastDay,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#121215] border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Left: Mobile Drawer Trigger + Brand / Prototype Tag */}
        <div className="flex items-center gap-2 min-w-0">
          {view === 'commercial' && (
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-amber-600 dark:text-orange-400 border border-zinc-300 dark:border-zinc-700/60 transition active:scale-95 shrink-0"
              title="Menu Navigation"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-200">
              <span className="hidden sm:inline">{t.protoBarTitle}</span>
              <span className="sm:hidden font-black text-amber-600 dark:text-orange-400">Sultan</span>
            </span>
          </div>
        </div>

        {/* Center: Unclosed Past Day Message + View Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Unclosed Past Day Alert Badge (to the left of Client / Caissier switcher) */}
          {unclosedPastDay && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-[#1d130a] dark:bg-[#1a0f07] border border-amber-600/80 text-amber-400 text-xs font-bold shadow-sm shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                {isArabic
                  ? `يوم ${unclosedPastDay.date.slice(8, 10)}/${unclosedPastDay.date.slice(5, 7)} غير مغلق`
                  : `La journée du ${unclosedPastDay.date.slice(8, 10)}/${unclosedPastDay.date.slice(5, 7)} n'est pas clôturée`}
              </span>
            </div>
          )}

          {/* View Switcher: Vue Client vs Rôles Back-Office */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900/90 p-0.5 sm:p-1 rounded-xl border border-zinc-300 dark:border-zinc-700/60 shadow-inner shrink-0">
          <button
            onClick={() => setView('client')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
              view === 'client'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>{isArabic ? 'الزبون' : 'Client'}</span>
          </button>

          <button
            onClick={() => {
              setAdminToken('preview-caissier-token', 'caissier');
              setAuthenticatedRole('caissier');
              setUserRole('caissier');
              setView('commercial');
            }}
            className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
              view === 'commercial' && userRole === 'caissier'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40 ring-1 ring-blue-400/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 shrink-0" />
            <span>{t.roleCaissier}</span>
            {unreadAlertCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setAdminToken('preview-cuisinier-token', 'cuisinier');
              setAuthenticatedRole('cuisinier');
              setUserRole('cuisinier');
              setView('commercial');
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
              view === 'commercial' && userRole === 'cuisinier'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">{t.roleCuisinier}</span>
          </button>

          <button
            onClick={() => {
              setAdminToken('preview-gerant-token', 'gerant');
              setAuthenticatedRole('gerant');
              setUserRole('gerant');
              setView('commercial');
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
              view === 'commercial' && userRole === 'gerant'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">{t.roleGerant}</span>
          </button>
        </div>
        </div>

        {/* Right: Extra controls: Role badge (md+), sound toggle, theme toggle, language switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {view === 'commercial' && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-zinc-800 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {t.role} {userRole === 'gerant' ? t.roleGerant : userRole === 'cuisinier' ? t.roleCuisinier : t.roleCaissier}
            </span>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            title={settings.soundEnabled ? 'Son activé' : 'Son désactivé'}
            className="h-9 w-9 p-0 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition active:scale-95 flex items-center justify-center shrink-0 shadow-xs"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-600 dark:text-orange-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            )}
          </button>

          {/* Mode Jour / Nuit / Auto Switcher */}
          <ThemeToggle />

          {/* Language Switcher AR / FR */}
          <button
            onClick={() => setLanguage(isArabic ? 'fr' : 'ar')}
            className="h-9 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-extrabold text-xs flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 shadow-xs active:scale-95 transition shrink-0"
            title="Changer de langue / تغيير اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>{isArabic ? 'FR' : 'AR'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
