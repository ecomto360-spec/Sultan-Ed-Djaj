import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Smartphone, LayoutDashboard, Volume2, VolumeX, Globe, Menu } from 'lucide-react';

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
    toggleMobileSidebar,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#121215] border-b border-zinc-800 text-zinc-100 shadow-md">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2">
        {/* Left: Mobile Drawer Trigger + Brand / Prototype Tag */}
        <div className="flex items-center gap-2 min-w-0">
          {view === 'commercial' && (
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-orange-400 border border-zinc-700/60 transition active:scale-95 shrink-0"
              title="Menu Navigation"
              aria-label="Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-bold tracking-tight text-zinc-200">
              <span className="hidden sm:inline">{t.protoBarTitle}</span>
              <span className="sm:hidden font-black text-orange-400">Sultan</span>
            </span>
          </div>
        </div>

        {/* Center: View Switcher: Vue Client vs Vue Commercial */}
        <div className="flex items-center gap-1 bg-zinc-900/90 p-0.5 sm:p-1 rounded-xl border border-zinc-700/60 shadow-inner shrink-0">
          <button
            onClick={() => setView('client')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
              view === 'client'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline sm:inline">{t.clientViewBtn}</span>
            <span className="xs:hidden sm:hidden">Client</span>
          </button>

          <button
            onClick={() => setView('commercial')}
            className={`relative flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
              view === 'commercial'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline sm:inline">{t.commercialViewBtn}</span>
            <span className="xs:hidden sm:hidden">Back-Office</span>
            {unreadAlertCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        </div>

        {/* Right: Extra controls: Role badge (md+), sound toggle, language switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {view === 'commercial' && (
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-800 text-amber-300 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {t.role} {userRole === 'gerant' ? t.roleGerant : userRole === 'cuisinier' ? t.roleCuisinier : t.roleCaissier}
            </span>
          )}

          {/* Sound Toggle */}
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            title={settings.soundEnabled ? 'Son activé' : 'Son désactivé'}
            className="p-1.5 sm:p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-orange-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          {/* Language Switcher AR / FR */}
          <button
            onClick={() => setLanguage(isArabic ? 'fr' : 'ar')}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition"
            title="Changer de langue / تغيير اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-orange-400" />
            <span>{isArabic ? 'FR' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
