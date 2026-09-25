import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { UtensilsCrossed, ShoppingBag, Clock, User } from 'lucide-react';

export const ClientBottomNav: React.FC = () => {
  const {
    clientTab,
    setClientTab,
    cartItemsCount,
    clientActiveOrder,
    language,
  } = useApp();
  const t = TRANSLATIONS[language];

  const hasActiveOrder = clientActiveOrder && clientActiveOrder.status !== 'delivered' && clientActiveOrder.status !== 'cancelled';

  return (
    <nav className="h-16 bg-[#161619] border-t border-zinc-800 flex items-center justify-around px-2 shrink-0 z-40">
      {/* Menu */}
      <button
        onClick={() => setClientTab('menu')}
        className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition ${
          clientTab === 'menu'
            ? 'text-orange-400 font-bold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <UtensilsCrossed className="w-5 h-5" />
        <span className="text-[11px] leading-none">{t.navMenu}</span>
      </button>

      {/* Cart */}
      <button
        onClick={() => setClientTab('cart')}
        className={`relative flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition ${
          clientTab === 'cart'
            ? 'text-orange-400 font-bold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          {cartItemsCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-scale">
              {cartItemsCount}
            </span>
          )}
        </div>
        <span className="text-[11px] leading-none">{t.navCart}</span>
      </button>

      {/* Orders / Tracking */}
      <button
        onClick={() => setClientTab('tracking')}
        className={`relative flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition ${
          clientTab === 'tracking'
            ? 'text-orange-400 font-bold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <div className="relative">
          <Clock className="w-5 h-5" />
          {hasActiveOrder && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900 animate-pulse" />
          )}
        </div>
        <span className="text-[11px] leading-none">{t.navOrders}</span>
      </button>

      {/* Profile */}
      <button
        onClick={() => setClientTab('profile')}
        className={`flex-1 min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl transition ${
          clientTab === 'profile'
            ? 'text-orange-400 font-bold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[11px] leading-none">{t.navProfile}</span>
      </button>
    </nav>
  );
};
