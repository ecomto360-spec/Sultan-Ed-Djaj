import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface ClientStickyCartBarProps {
  onOpenCart: () => void;
}

export const ClientStickyCartBar: React.FC<ClientStickyCartBarProps> = ({ onOpenCart }) => {
  const { cartItemsCount, cartTotal, language, clientTab } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // Render ONLY when cart is not empty and user is on menu or store locator tab
  if (cartItemsCount <= 0 || (clientTab !== 'menu' && (clientTab as string) !== 'store_locator')) {
    return null;
  }

  return (
    <div className="absolute bottom-[68px] left-0 right-0 z-30 px-3 py-1.5 flex justify-center pointer-events-none animate-slideUp">
      <div className="w-full pointer-events-auto">
        <button
          onClick={onOpenCart}
          className="w-full h-12 px-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-xl shadow-orange-950/40 border border-orange-400/30 flex items-center justify-between gap-2.5 transition active:scale-[0.98] group cursor-pointer"
        >
          {/* Left info: Badge + Count + Total */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative p-1.5 rounded-xl bg-black/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-orange-600 font-black text-[10px] flex items-center justify-center shadow-xs">
                {cartItemsCount}
              </span>
            </div>

            <div className="flex flex-col text-start min-w-0">
              <span className="text-xs font-black tracking-tight truncate leading-tight">
                {cartItemsCount} {cartItemsCount > 1 ? (isArabic ? 'منتجات' : 'articles') : (isArabic ? 'منتج' : 'article')}
              </span>
              <span className="text-[11px] font-extrabold text-orange-100 leading-none mt-0.5">
                {cartTotal.toLocaleString()} {t.currency}
              </span>
            </div>
          </div>

          {/* Right action button label */}
          <div className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-black tracking-tight shrink-0 group-hover:translate-x-0.5 transition-transform">
            <span>{isArabic ? 'عرض السلة' : 'Voir le panier'}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </div>
    </div>
  );
};
