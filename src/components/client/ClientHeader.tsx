import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  Navigation,
  QrCode,
  Monitor,
  X,
  Share2,
  Globe,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

export const ClientHeader: React.FC = () => {
  const { language, setLanguage, isStoreActuallyOpen, settings, dailyChickenRemaining } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isStockExhausted = dailyChickenRemaining <= 0;

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  const phoneNumber = settings.phone || '+213 771 01 20 33';
  const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, '');

  const fullAddress =
    isArabic
      ? 'البساتين · مقابل تقنيكوم ثانوية زحوال، بئر خادم، الجزائر'
      : 'Les Vergers · En face Technicum Lycée Zahoual, Birkhadem, Alger';

  // Sultan Ed-Djaj Emblem SVG
  const logoEmblem = (sizeClass = 'w-10 h-10') => (
    <div
      className={`${sizeClass} shrink-0 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 p-1.5 border border-zinc-700/60 shadow-md flex items-center justify-center overflow-hidden`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="headerLogoFlame" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="headerLogoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="52" r="38" fill="#18181b" opacity="0.7" />
        {/* Sultan Crown */}
        <path d="M 32 36 L 40 44 L 50 30 L 60 44 L 68 36 L 66 48 L 34 48 Z" fill="url(#headerLogoGold)" />
        <circle cx="32" cy="35" r="2" fill="#fff" />
        <circle cx="50" cy="29" r="2.5" fill="#fff" />
        <circle cx="68" cy="35" r="2" fill="#fff" />
        {/* Flame */}
        <path d="M50 42 C40 56, 32 65, 32 76 C32 86, 40 92, 50 92 C60 92, 68 86, 68 76 C68 65, 60 56, 50 42 Z" fill="url(#headerLogoFlame)" />
        <path d="M50 56 C45 64, 40 70, 40 77 C40 83, 44 87, 50 87 C56 87, 60 83, 60 77 C60 70, 55 64, 50 56 Z" fill="#fef08a" opacity="0.9" />
        <line x1="28" y1="84" x2="72" y2="84" stroke="#71717a" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );

  // Status Pill Badge component
  const statusBadge = (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition shrink-0 ${
        !isStoreActuallyOpen || isStockExhausted
          ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          !isStoreActuallyOpen || isStockExhausted ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'
        }`}
      />
      <span>
        {!isStoreActuallyOpen
          ? isArabic
            ? 'مغلق'
            : 'Fermé'
          : isStockExhausted
          ? isArabic
            ? 'نفد اليوم'
            : 'Épuisé'
          : isArabic
          ? 'مفتوح'
          : 'Ouvert'}
      </span>
    </div>
  );

  return (
    <>
      {/* ══════════════════════════════════════════════════
          CAPTURE 1 : HEADER PRINCIPAL COMPACT & PROFESSIONNEL
          ══════════════════════════════════════════════════ */}
      <header className="bg-[#fbfaf7] dark:bg-[#141418] border-b border-zinc-200/80 dark:border-zinc-800/80 px-3.5 py-3 space-y-2.5 shrink-0 transition-colors">
        {/* Top row: Brand Identity + Status + Language button */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Logo & Dual Brand Text */}
          <div className="flex items-center gap-2.5 min-w-0">
            {logoEmblem('w-10 h-10')}

            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-[15px] sm:text-base text-zinc-900 dark:text-white tracking-tight leading-snug truncate">
                Sultan Ed-Djaj
              </span>
              <div className="flex items-center gap-1 text-[11px] truncate">
                <span className="text-orange-600 dark:text-orange-400 font-bold font-arabic">
                  سلطان الدجاج
                </span>
                <span className="text-zinc-400 dark:text-zinc-500">·</span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {isArabic ? 'مشوي ومحمر' : 'Braisé & rôti'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Ouvert pill + Language button + Theme toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {statusBadge}

            {/* Language Quick Switcher with Globe & AR/FR */}
            <button
              onClick={() => setLanguage(isArabic ? 'fr' : 'ar')}
              className="h-8 px-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-extrabold text-[11px] flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 shadow-xs active:scale-95 transition"
              title={isArabic ? 'Passer en Français (FR)' : 'تغيير إلى العربية (AR)'}
              aria-label="Changer de langue"
            >
              <Globe className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
              <span className="font-bold tracking-tight">{isArabic ? 'FR' : 'AR'}</span>
            </button>

            <ThemeToggle />
          </div>
        </div>

        {/* Bottom row: Compact Info Card (Opens Capture 2 Bottom Sheet) */}
        <button
          onClick={() => setIsInfoModalOpen(true)}
          type="button"
          className="w-full bg-white dark:bg-[#1a1a1f] hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-2xl py-2 px-3.5 border border-zinc-250 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-2 text-start transition active:scale-[0.99] group cursor-pointer"
        >
          {/* Left info summary */}
          <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 min-w-0 truncate font-semibold">
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-bold">{isArabic ? '24 سا / 24 سا' : '24h/24'}</span>
            </div>

            <span className="text-zinc-300 dark:text-zinc-600 shrink-0">•</span>

            <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 truncate">
              <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
              <span className="truncate">
                {isArabic ? 'بئر خادم · البساتين' : 'Birkhadem · Les Vergers'}
              </span>
            </div>
          </div>

          {/* Right action indicator */}
          <div className="flex items-center gap-0.5 text-xs font-black text-orange-600 dark:text-orange-400 shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span>{isArabic ? 'معلومات' : 'Infos'}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </header>

      {/* ══════════════════════════════════════════════════
          CAPTURE 2 : FICHE « INFOS » (BOTTOM SHEET MODAL)
          ══════════════════════════════════════════════════ */}
      {isInfoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn p-0 sm:p-4"
          onClick={() => setIsInfoModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            dir={isArabic ? 'rtl' : 'ltr'}
            className="w-full max-w-[480px] bg-[#fbfaf7] dark:bg-[#16161a] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800 max-h-[92vh] overflow-y-auto space-y-4 animate-slideUp relative transition-colors"
          >
            {/* Top Drag Handle */}
            <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto -mt-1 mb-2" />

            {/* Close Button */}
            <button
              onClick={() => setIsInfoModalOpen(false)}
              className={`absolute top-4 ${
                isArabic ? 'left-4' : 'right-4'
              } p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition`}
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header: Logo + Title + Status */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-3 min-w-0">
                {logoEmblem('w-12 h-12')}
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-white leading-tight truncate">
                    Sultan Ed-Djaj
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {isArabic
                      ? 'دجاج محمر ومشوي على الجمر · بئر خادم'
                      : 'Poulet braisé & rôti · Birkhadem'}
                  </p>
                </div>
              </div>

              {statusBadge}
            </div>

            {/* SECTION 1 : INFOS PRATIQUES */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase px-1">
                {isArabic ? 'معلومات عملية' : 'INFOS PRATIQUES'}
              </div>

              {/* Horaires Card */}
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-3 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {isArabic ? 'أوقات العمل' : 'Horaires'}
                  </div>
                  <div className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    {isArabic ? '24 سا / 24 سا · 7 أيام / 7' : '24h/24 · 7j/7'}
                  </div>
                </div>
              </div>

              {/* Téléphone Card */}
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-3 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                      {isArabic ? 'الهاتف' : 'Téléphone'}
                    </div>
                    <div className="text-sm font-extrabold text-zinc-900 dark:text-white" dir="ltr">
                      {phoneNumber}
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${cleanPhone}`}
                  className="w-10 h-10 rounded-full border border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 active:scale-95 transition flex items-center justify-center shrink-0"
                  title={isArabic ? 'اتصال مباشر' : 'Appeler directement'}
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

              {/* Adresse Card */}
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-3 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                      {isArabic ? 'العنوان' : 'Adresse'}
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white leading-snug">
                      {fullAddress}
                    </div>
                  </div>
                </div>

                <a
                  href="https://maps.google.com/?q=Les+Vergers+Birkhadem+Alger"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 active:scale-95 transition flex items-center justify-center shrink-0"
                  title={isArabic ? 'فتح الخريطة' : 'Ouvrir l\'itinéraire Google Maps'}
                >
                  <Navigation className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* SECTION 2 : OUTILS */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase px-1">
                {isArabic ? 'أدوات' : 'OUTILS'}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Tuile 1 : Code QR du menu */}
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="p-3.5 rounded-2xl bg-[#18181b] dark:bg-zinc-900 hover:bg-zinc-900/90 text-left border border-zinc-800 hover:border-amber-500/50 transition active:scale-95 flex flex-col justify-between min-h-[96px] shadow-sm group"
                >
                  <QrCode className="w-6 h-6 text-amber-500 group-hover:scale-110 transition" />
                  <div>
                    <div className="font-bold text-xs text-white">
                      {isArabic ? 'رمز QR للقائمة' : 'Code QR du menu'}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {isArabic ? 'مشاركة على الطاولة' : 'Partager à table'}
                    </div>
                  </div>
                </button>

                {/* Tuile 2 : Mode grand écran */}
                <a
                  href="/admin"
                  className="p-3.5 rounded-2xl bg-[#18181b] dark:bg-zinc-900 hover:bg-zinc-900/90 text-left border border-zinc-800 hover:border-amber-500/50 transition active:scale-95 flex flex-col justify-between min-h-[96px] shadow-sm group"
                >
                  <Monitor className="w-6 h-6 text-amber-500 group-hover:scale-110 transition" />
                  <div>
                    <div className="font-bold text-xs text-white">
                      {isArabic ? 'وضع الشاشة الكبيرة' : 'Mode grand écran'}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {isArabic ? 'عرض المكتب' : 'Affichage bureau'}
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* SECTION 3 : LANGUE */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase px-1">
                {isArabic ? 'اللغة' : 'LANGUE'}
              </div>

              <div className="bg-zinc-200/80 dark:bg-zinc-800/80 p-1 rounded-2xl flex items-center gap-1">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition ${
                    language === 'fr'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Français
                </button>

                <button
                  onClick={() => setLanguage('ar')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold font-arabic transition ${
                    language === 'ar'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Popup Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setShowQrModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xs bg-white dark:bg-[#18181c] rounded-3xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-4 animate-scaleUp"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                {isArabic ? 'رمز QR للقائمة' : 'QR Code du Menu'}
              </h4>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Stylized QR Code Visual */}
            <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-inner flex flex-col items-center justify-center">
              <div className="relative w-44 h-44 bg-zinc-950 rounded-xl p-2.5 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
                  {/* Outer corner blocks */}
                  <rect x="5" y="5" width="26" height="26" rx="4" />
                  <rect x="8" y="8" width="20" height="20" fill="#09090b" rx="2" />
                  <rect x="12" y="12" width="12" height="12" rx="2" />

                  <rect x="69" y="5" width="26" height="26" rx="4" />
                  <rect x="72" y="8" width="20" height="20" fill="#09090b" rx="2" />
                  <rect x="76" y="12" width="12" height="12" rx="2" />

                  <rect x="5" y="69" width="26" height="26" rx="4" />
                  <rect x="8" y="72" width="20" height="20" fill="#09090b" rx="2" />
                  <rect x="12" y="76" width="12" height="12" rx="2" />

                  {/* QR dot matrix patterns */}
                  <rect x="36" y="8" width="6" height="6" rx="1" />
                  <rect x="46" y="8" width="6" height="6" rx="1" />
                  <rect x="56" y="8" width="6" height="6" rx="1" />
                  <rect x="36" y="18" width="16" height="6" rx="1" />
                  <rect x="56" y="18" width="6" height="16" rx="1" />

                  <rect x="8" y="36" width="6" height="6" rx="1" />
                  <rect x="8" y="46" width="16" height="6" rx="1" />
                  <rect x="8" y="56" width="6" height="6" rx="1" />

                  <rect x="36" y="36" width="28" height="28" fill="#ea580c" rx="6" />

                  <rect x="69" y="36" width="6" height="16" rx="1" />
                  <rect x="80" y="36" width="15" height="6" rx="1" />
                  <rect x="75" y="46" width="10" height="6" rx="1" />
                  <rect x="69" y="56" width="26" height="6" rx="1" />

                  <rect x="36" y="69" width="16" height="6" rx="1" />
                  <rect x="36" y="80" width="6" height="15" rx="1" />
                  <rect x="46" y="85" width="16" height="10" rx="1" />

                  <rect x="69" y="69" width="6" height="6" rx="1" />
                  <rect x="80" y="69" width="15" height="15" rx="2" />
                  <rect x="69" y="80" width="6" height="15" rx="1" />
                  <rect x="89" y="89" width="6" height="6" rx="1" />
                </svg>

                {/* Center Badge with chicken flame logo */}
                <div className="absolute inset-0 m-auto w-9 h-9 rounded-lg bg-zinc-950 border border-orange-500/80 p-1 flex items-center justify-center shadow-lg">
                  <span className="text-sm">🍗</span>
                </div>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold mt-2 font-mono">
                sultan-ed-djaj.dz
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {isArabic
                ? 'امسح الرمز بكاميرا الهاتف لفتح القائمة مباشرة على الطاولة'
                : 'Scannez avec votre appareil photo pour commander directement à table.'}
            </p>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Sultan Ed-Djaj Menu',
                    url: window.location.origin,
                  }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(window.location.origin);
                  setHasCopiedLink(true);
                  setTimeout(() => setHasCopiedLink(false), 2500);
                }
              }}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-orange-950/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>
                {hasCopiedLink
                  ? isArabic
                    ? '✓ تم نسخ الرابط !'
                    : '✓ Lien copié !'
                  : isArabic
                  ? 'مشاركة رابط القائمة'
                  : 'Partager le lien du menu'}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
