import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Smartphone, LayoutDashboard, Volume2, VolumeX, Globe } from 'lucide-react';

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
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  return (
    <header className="sticky top-0 z-50 w-full bg-[#121215] border-b border-zinc-800 text-zinc-100 shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Title and Prototype Tag */}
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-200">
            {t.protoBarTitle}
          </span>
        </div>

        {/* View Switcher: Vue Client (Mobile Simulator) vs Vue Commercial (Back-Office) */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-700/60 shadow-inner">
          <button
            onClick={() => setView('client')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'client'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{t.clientViewBtn}</span>
          </button>

          <button
            onClick={() => setView('commercial')}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'commercial'
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-orange-400/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t.commercialViewBtn}</span>
            {unreadAlertCount > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>
        </div>

        {/* Extra controls: Language toggle, sound toggle, role indicator */}
        <div className="flex items-center gap-2">
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
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 transition"
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition"
            title="Changer de langue / تغيير اللغة"
          >
            <Globe className="w-3.5 h-3.5 text-orange-400" />
            <span>{isArabic ? 'FR' : 'عربي (AR)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
