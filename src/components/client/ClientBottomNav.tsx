import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { UtensilsCrossed, ShoppingBag, Clock, User, MapPin } from 'lucide-react';

export const ClientBottomNav: React.FC = () => {
  const {
    clientTab,
    setClientTab,
    cartItemsCount,
    clientActiveOrder,
    language,
  } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const hasActiveOrder = clientActiveOrder && clientActiveOrder.status !== 'delivered' && clientActiveOrder.status !== 'cancelled';

  return (
    <nav className="h-16 bg-white dark:bg-[#161619] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-1 shrink-0 z-40 transition-colors shadow-sm">
      {/* Menu */}
      <button
        onClick={() => setClientTab('menu')}
        className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition ${
          clientTab === 'menu'
            ? 'text-orange-600 dark:text-orange-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400'
        }`}
      >
        <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] leading-none font-extrabold">{t.navMenu}</span>
      </button>

      {/* Store Locator */}
      <button
        onClick={() => setClientTab('store_locator' as any)}
        className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition ${
          (clientTab as string) === 'store_locator'
            ? 'text-orange-600 dark:text-orange-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400'
        }`}
      >
        <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] leading-none font-extrabold">{isArabic ? 'المطعم' : 'Restaurant'}</span>
      </button>

      {/* Cart */}
      <button
        onClick={() => setClientTab('cart')}
        className={`relative flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition ${
          clientTab === 'cart'
            ? 'text-orange-600 dark:text-orange-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400'
        }`}
      >
        <div className="relative">
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
              {cartItemsCount}
            </span>
          )}
        </div>
        <span className="text-[10px] leading-none font-extrabold">{t.navCart}</span>
      </button>

      {/* Orders / Tracking */}
      <button
        onClick={() => setClientTab('tracking')}
        className={`relative flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition ${
          clientTab === 'tracking'
            ? 'text-orange-600 dark:text-orange-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400'
        }`}
      >
        <div className="relative">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          {hasActiveOrder && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
          )}
        </div>
        <span className="text-[10px] leading-none font-extrabold">{t.navOrders}</span>
      </button>

      {/* Profile */}
      <button
        onClick={() => setClientTab('profile')}
        className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition ${
          clientTab === 'profile'
            ? 'text-orange-600 dark:text-orange-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400'
        }`}
      >
        <User className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-[10px] leading-none font-extrabold">{t.navProfile}</span>
      </button>
    </nav>
  );
};
