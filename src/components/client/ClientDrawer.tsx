import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  X,
  MapPin,
  Clock,
  Phone,
  User,
  ShoppingBag,
  Map,
  Truck,
  Heart,
  Info,
  FileText,
  Shield,
  MessageCircle,
  Globe,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: 'menu' | 'cart' | 'tracking' | 'profile' | 'store_locator' | 'favorites') => void;
  onOpenInfoModal: (type: 'about' | 'cgu' | 'privacy' | 'contact') => void;
}

export const ClientDrawer: React.FC<ClientDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenInfoModal,
}) => {
  const {
    language,
    setLanguage,
    currentCustomer,
    settings,
    isStoreActuallyOpen,
    clientPageContent,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  if (!isOpen) return null;

  const phoneNumber = clientPageContent?.contact?.phone || settings.phone || '+213 771 01 20 33';
  const cleanPhone = phoneNumber.replace(/[\s\-\.]/g, '');
  const addressText = clientPageContent?.contact?.address || (isArabic ? 'البساتين · مقابل ثانوية زحوال، بئر خادم، الجزائر' : 'Les Vergers · En face Technicum Lycée Zahoual, Birkhadem, Alger');
  const hoursText = clientPageContent?.contact?.hours || (isArabic ? 'خدمة متواصلة 24 سا / 24 سا' : 'Ouvert 24h/24, 7j/7');

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden animate-fadeIn">
      {/* Dark Overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <aside
        dir={isArabic ? 'rtl' : 'ltr'}
        className={`relative w-full max-w-[320px] sm:max-w-[360px] bg-white dark:bg-[#151519] h-full shadow-2xl flex flex-col z-10 transition-transform duration-300 ${
          isArabic ? 'mr-auto rounded-l-3xl border-r' : 'ml-auto rounded-r-3xl border-l'
        } border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 overflow-y-auto`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800/80 bg-[#fbfaf7] dark:bg-[#1a1a1f] flex items-center justify-between gap-3">
          {/* User Account / Profile status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-orange-950/20 shrink-0">
              {currentCustomer?.name ? currentCustomer.name.slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">
                {currentCustomer?.name || (isArabic ? 'مرحباً بك' : 'Bienvenue')}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {currentCustomer?.phone || (isArabic ? 'زائر' : 'Client Sultan Ed-Djaj')}
              </span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition active:scale-95"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Light/Dark Theme + Language Switcher */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(isArabic ? 'fr' : 'ar')}
            className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
            <span>{isArabic ? 'Français (FR)' : 'العربية (AR)'}</span>
          </button>

          {/* Theme Toggle */}
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Primary Navigation Links */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => {
              onNavigate('menu');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-950/30 text-zinc-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs transition group text-start"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span>{isArabic ? 'كتالوج الوجبات والمنيو' : 'Découvrir le menu'}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-transform ${isArabic ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => {
              onNavigate('store_locator');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-950/30 text-zinc-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs transition group text-start"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <MapPin className="w-4 h-4" />
              </div>
              <span>{isArabic ? 'موقع المطعم على الخريطة' : 'Localisateur de magasin'}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-transform ${isArabic ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => {
              onNavigate('tracking');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-950/30 text-zinc-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs transition group text-start"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Truck className="w-4 h-4" />
              </div>
              <span>{isArabic ? 'تتبع طلبيتك المباشر' : 'Suivre la commande'}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-transform ${isArabic ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => {
              onNavigate('favorites');
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-950/30 text-zinc-800 dark:text-zinc-200 hover:text-orange-600 dark:hover:text-orange-400 font-bold text-xs transition group text-start"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Heart className="w-4 h-4" />
              </div>
              <span>{isArabic ? 'قائمة المفضلة' : 'Mes Favoris'}</span>
            </div>
            <ChevronRight className={`w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-transform ${isArabic ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="my-2 border-t border-zinc-200 dark:border-zinc-800/80 mx-4" />

        {/* Secondary Info Links */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => {
              onOpenInfoModal('about');
              onClose();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition text-start"
          >
            <Info className="w-4 h-4 text-orange-500 shrink-0" />
            <span>{isArabic ? 'عن السلطان (من نحن)' : 'À propos de nous'}</span>
          </button>

          <button
            onClick={() => {
              onOpenInfoModal('cgu');
              onClose();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition text-start"
          >
            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{isArabic ? 'الشروط والأحكام' : 'Conditions générales'}</span>
          </button>

          <button
            onClick={() => {
              onOpenInfoModal('privacy');
              onClose();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition text-start"
          >
            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{isArabic ? 'سياسة الخصوصية' : 'Politique de confidentialité'}</span>
          </button>

          <a
            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              isArabic ? 'مرحباً سلطان الدجاج، أود الاستفسار عن المنيو والطلبات' : 'Bonjour Sultan Ed-Djaj, je souhaite avoir des informations.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition text-start"
          >
            <MessageCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{isArabic ? 'تواصل معنا عبر واتساب' : 'Contact & WhatsApp'}</span>
          </a>
        </div>

        {/* Drawer Footer Restaurant Contact */}
        <div className="mt-auto p-4 bg-[#fbfaf7] dark:bg-[#121216] border-t border-zinc-200 dark:border-zinc-800/80 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <span className="leading-snug">
              {addressText}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="font-bold text-zinc-800 dark:text-zinc-200">
              {hoursText}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Phone className="w-4 h-4 text-orange-500 shrink-0" />
            <a href={`tel:${cleanPhone}`} className="font-extrabold text-orange-600 dark:text-orange-400 hover:underline">
              {phoneNumber}
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
};
