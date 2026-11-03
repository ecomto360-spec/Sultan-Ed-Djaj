import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  Menu,
  ShoppingBag,
  Truck,
  Store,
  Clock,
  MapPin,
  Flame,
} from 'lucide-react';

interface ClientHeaderProps {
  onOpenDrawer: () => void;
  onOpenCart: () => void;
  orderType: 'delivery' | 'pickup';
  onOrderTypeChange: (type: 'delivery' | 'pickup') => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  onOpenDrawer,
  onOpenCart,
  orderType,
  onOrderTypeChange,
}) => {
  const {
    cartItemsCount,
    language,
    isStoreActuallyOpen,
    dailyChickenRemaining,
    clientPageContent,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isStockExhausted = dailyChickenRemaining <= 0;

  // Sultan Ed-Djaj Emblem SVG
  const logoEmblem = (
    <div className="w-9 h-9 shrink-0 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 p-1 border border-zinc-700/80 shadow-md flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="clientHeaderLogoFlame" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="clientHeaderLogoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="52" r="38" fill="#18181b" opacity="0.7" />
        <path d="M 32 36 L 40 44 L 50 30 L 60 44 L 68 36 L 66 48 L 34 48 Z" fill="url(#clientHeaderLogoGold)" />
        <circle cx="32" cy="35" r="2" fill="#fff" />
        <circle cx="50" cy="29" r="2.5" fill="#fff" />
        <circle cx="68" cy="35" r="2" fill="#fff" />
        <path d="M50 42 C40 56, 32 65, 32 76 C32 86, 40 92, 50 92 C60 92, 68 86, 68 76 C68 65, 60 56, 50 42 Z" fill="url(#clientHeaderLogoFlame)" />
        <path d="M50 56 C45 64, 40 70, 40 77 C40 83, 44 87, 50 87 C56 87, 60 83, 60 77 C60 70, 55 64, 50 56 Z" fill="#fef08a" opacity="0.9" />
      </svg>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#141418]/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-3.5 py-2.5 space-y-2.5 shrink-0 transition-colors shadow-xs">
      {/* Top Bar Row: Hamburger + Brand + Cart */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Hamburger Button */}
        <button
          onClick={onOpenDrawer}
          className="p-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 transition active:scale-95 shrink-0 border border-zinc-200 dark:border-zinc-700/60"
          aria-label="Menu principal"
        >
          <Menu className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </button>

        {/* Center: Brand Identity */}
        <div className="flex items-center gap-2 min-w-0 flex-1 px-1">
          {clientPageContent?.logoUrl ? (
            <img
              src={clientPageContent.logoUrl}
              alt="Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-2xl object-cover border border-zinc-300 dark:border-zinc-700 shadow-md"
            />
          ) : (
            logoEmblem
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-black text-xs sm:text-sm text-zinc-900 dark:text-white tracking-tight leading-tight truncate">
              {clientPageContent?.restaurantNameFr || 'Sultan Ed-Djaj'}
            </span>
            <span className="text-[10px] font-extrabold text-orange-600 dark:text-orange-400 font-arabic truncate mt-0.5 leading-none">
              {clientPageContent?.restaurantNameAr || 'سلطان الدجاج'} · {isArabic ? 'بئر خادم' : 'Birkhadem'}
            </span>
          </div>
        </div>

        {/* Right: Cart Button with Badge */}
        <button
          onClick={onOpenCart}
          className="relative p-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/20 hover:from-orange-500 hover:to-amber-500 transition active:scale-95 shrink-0"
          aria-label="Panier de commande"
        >
          <ShoppingBag className="w-5 h-5" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-white text-orange-600 font-black text-[10px] flex items-center justify-center border-2 border-orange-600 shadow-sm animate-bounce">
              {cartItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* Under Header: Delivery vs Takeaway Dual Toggle Cards (KFC Style) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Toggle 1: Livraison */}
        <button
          type="button"
          onClick={() => onOrderTypeChange('delivery')}
          className={`h-11 px-3 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 ${
            orderType === 'delivery'
              ? 'bg-orange-500/10 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/50 shadow-xs'
              : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-250 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50'
          }`}
        >
          <Truck className={`w-4 h-4 shrink-0 ${orderType === 'delivery' ? 'text-orange-500 animate-pulse' : ''}`} />
          <span>{isArabic ? 'توصيل للمنزل' : 'Livraison'}</span>
        </button>

        {/* Toggle 2: À emporter */}
        <button
          type="button"
          onClick={() => onOrderTypeChange('pickup')}
          className={`h-11 px-3 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 ${
            orderType === 'pickup'
              ? 'bg-orange-500/10 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/50 shadow-xs'
              : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-250 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50'
          }`}
        >
          <Store className={`w-4 h-4 shrink-0 ${orderType === 'pickup' ? 'text-orange-500' : ''}`} />
          <span>{isArabic ? 'استلام في المطعم' : 'À emporter'}</span>
        </button>
      </div>
    </header>
  );
};
