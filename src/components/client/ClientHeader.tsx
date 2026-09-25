import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { BrandLogo } from '../common/BrandLogo';
import { Clock, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export const ClientHeader: React.FC = () => {
  const { language, isStoreActuallyOpen, settings } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  return (
    <div className="bg-[#18181c] border-b border-zinc-800 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <BrandLogo size="md" isArabic={isArabic} />
        
        {/* Open / Closed pill badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            isStoreActuallyOpen
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
              : 'bg-red-950/60 text-red-400 border-red-500/30'
          }`}
        >
          {isStoreActuallyOpen ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t.storeOpen}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span>{t.storeClosed}</span>
            </>
          )}
        </div>
      </div>

      {/* Info Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1 bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-800">
          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
          <span>{settings.openTime} – {settings.closeTime === '00:00' ? '00h' : settings.closeTime}</span>
        </div>

        <a
          href={`tel:${settings.phone.replace(/\s+/g, '')}`}
          className="flex items-center gap-1 bg-zinc-900/80 hover:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-800 text-orange-400 transition"
        >
          <Phone className="w-3 h-3 shrink-0" />
          <span dir="ltr">{settings.phone}</span>
        </a>

        <div className="flex items-center gap-1 bg-zinc-900/80 px-2 py-0.5 rounded-md border border-zinc-800">
          <MapPin className="w-3 h-3 text-red-400 shrink-0" />
          <span>{isArabic ? 'البساتين، بئر خادم' : 'Les Vergers, Birkhadem'}</span>
        </div>
      </div>
    </div>
  );
};
