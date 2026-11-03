import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Product } from '../../types';
import { ProductSvgThumb } from '../common/ProductSvgThumb';
import { ProductDetailModal } from './ProductDetailModal';
import {
  Search,
  Plus,
  Minus,
  Heart,
  XCircle,
  Megaphone,
  Sparkles,
  Flame,
  Tag,
  Star,
  TrendingUp,
} from 'lucide-react';

const STORAGE_FAVORITES_KEY = 'sultan_favorites_v2';

export const ClientMenu: React.FC = () => {
  const {
    products,
    categories,
    clientPageContent,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    language,
    isStoreActuallyOpen,
    dailyChickenRemaining,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Favorites state saved in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Build sorted category tabs: "All" first, then dynamic categories by order
  const categoryTabs = [
    { id: 'all', label: isArabic ? 'الكل' : t.categoriesAll },
    ...categories
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(c => ({ id: c.id, label: isArabic ? c.nameAr : c.nameFr })),
  ];

  // Filter visible, non-archived products
  const filteredProducts = products
    .filter(product => {
      if (product.isArchived) return false;
      if (product.isVisible === false) return false;

      const matchCat = selectedCategory === 'all' || product.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        product.nameFr.toLowerCase().includes(q) ||
        product.nameAr.toLowerCase().includes(q) ||
        (product.descriptionFr && product.descriptionFr.toLowerCase().includes(q)) ||
        (product.descriptionAr && product.descriptionAr.toLowerCase().includes(q));
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      // Featured first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

  // Helper to find existing cart item quantity
  const getCartItemQty = (productId: string) => {
    const found = cart.find(item => item.productId === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f8f7f4] dark:bg-[#121215] transition-colors">
      {/* Sticky Horizontal Category Scrollbar */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#141418]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 p-2.5 shadow-xs overflow-x-auto no-scrollbar flex items-center gap-2">
        {categoryTabs.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm ring-1 ring-orange-400/40'
                  : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-500/20 hover:border-orange-500/50 border border-zinc-200 dark:border-zinc-700/50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Scrollable Catalog Container */}
      <div className="flex-1 overflow-y-auto p-3.5 pb-36 sm:pb-40 space-y-3.5">
        {/* Flash Announcement Banner from Manager */}
        {clientPageContent?.service?.showAnnouncement && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 shadow-xs">
            <Megaphone className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="font-bold">
              {clientPageContent.service.announcementNotice}
            </span>
          </div>
        )}

        {/* Top Promo Banner from Manager */}
        {clientPageContent?.banner?.enabled && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 shrink-0 text-amber-200" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-amber-100">
                  {isArabic ? (clientPageContent.banner.badgeTextAr || 'عرض خاص') : (clientPageContent.banner.badgeTextFr || 'Offre Spéciale')}
                </div>
                <div className="text-xs sm:text-sm font-black">
                  {isArabic ? clientPageContent.banner.textAr : clientPageContent.banner.textFr}
                </div>
              </div>
            </div>
            {clientPageContent.banner.imageUrl && (
              <img
                src={clientPageContent.banner.imageUrl}
                alt="Promo"
                className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
              />
            )}
          </div>
        )}

        {/* Closed Store Notice */}
        {!isStoreActuallyOpen && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{t.storeClosedCannotOrder}</span>
          </div>
        )}

        {/* Chicken Stock Exhausted Banner */}
        {isStoreActuallyOpen && dailyChickenRemaining <= 0 && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/30 text-red-900 dark:text-red-200 text-xs flex items-center gap-2 shadow-xs">
            <XCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span className="font-bold">
              {isArabic
                ? 'نفدت كمية الدجاج لليوم — البضاعة غير متوفرة حالياً'
                : "Épuisé pour aujourd'hui — Stock de poulet du jour épuisé"}
            </span>
          </div>
        )}

        {/* Product Search Bar */}
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 ${isArabic ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full h-10 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-250 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500 transition shadow-xs ${
              isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white ${isArabic ? 'left-3' : 'right-3'}`}
            >
              ✕
            </button>
          )}
        </div>

        {/* Product Grid (Strictly 2 cards per row on mobile) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {filteredProducts.map(product => {
            // Chicken quota logic check
            const countsInQuota = product.countsInChickenQuota !== false;
            const isChickenSoldOut = countsInQuota && dailyChickenRemaining <= 0;
            const isAvailable = product.isAvailable && !isChickenSoldOut;
            const cartQty = getCartItemQty(product.id);
            const isFav = favorites.includes(product.id);

            return (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setIsDetailOpen(true);
                }}
                className={`flex flex-col justify-between bg-white dark:bg-[#16161a] rounded-2xl border p-2.5 relative group transition-all cursor-pointer ${
                  isAvailable
                    ? 'border-zinc-200 dark:border-zinc-800 hover:border-orange-500/50 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800/60 opacity-60'
                }`}
              >
                {/* Top badges (Nouveau, Populaire, Promo) */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                  {product.isFeatured && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[9px] flex items-center gap-0.5 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Top</span>
                    </span>
                  )}
                  {product.badges?.includes('promo') && (
                    <span className="px-1.5 py-0.5 rounded-md bg-orange-600 text-white font-black text-[9px] shadow-xs">
                      PROMO
                    </span>
                  )}
                  {product.badges?.includes('epice') && (
                    <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white font-bold text-[9px] flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Favorite Heart Button */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-500 transition active:scale-95 shadow-xs"
                  aria-label="Favori"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {/* Product Image / Custom WebP or SVG Fallback */}
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center mb-2 border border-zinc-100 dark:border-zinc-800">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.nameFr}
                      loading="lazy"
                      className={`w-full h-full object-cover transition duration-300 ${
                        !isAvailable ? 'grayscale' : ''
                      }`}
                    />
                  ) : (
                    <ProductSvgThumb type={product.imageType || 'poulet-roti'} className="w-full h-full object-contain p-2" />
                  )}

                  {!isAvailable && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-1">
                      <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-red-600 text-white shadow-xs">
                        {isChickenSoldOut ? (isArabic ? 'نفد لليوم' : 'Épuisé') : (isArabic ? 'غير متوفر' : 'Épuisé')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-1 mb-2">
                  <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                    {isArabic ? product.nameAr : product.nameFr}
                  </h3>
                </div>

                {/* Price & Cart Actions */}
                <div className="pt-2 border-t border-zinc-150 dark:border-zinc-800/80 space-y-2 mt-auto">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-orange-600 dark:text-orange-400">
                        {product.price.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold">{t.currency}</span>
                    </div>

                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-[10px] line-through text-zinc-400">
                        {product.originalPrice.toLocaleString()} DA
                      </span>
                    )}
                  </div>

                  {/* Add to Cart OR Quantity Stepper */}
                  {isAvailable && isStoreActuallyOpen ? (
                    cartQty > 0 ? (
                      /* Quantity Stepper when item is already in cart */
                      <div
                        onClick={e => e.stopPropagation()}
                        className="flex items-center justify-between bg-orange-500/10 dark:bg-orange-950/50 rounded-xl border border-orange-500/50 p-1"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (cartQty === 1) {
                              removeFromCart(product.id);
                            } else {
                              updateCartQuantity(product.id, cartQty - 1);
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold transition active:scale-95 shadow-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="text-xs font-black text-orange-600 dark:text-orange-400 px-2">
                          {cartQty}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateCartQuantity(product.id, cartQty + 1)}
                          className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold transition active:scale-95 shadow-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      /* Initial Full Width Add Button */
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          addToCart(product, 1);
                        }}
                        className="w-full h-8 px-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs shadow-orange-950/20"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isArabic ? 'إضافة' : 'Ajouter'}</span>
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="w-full h-8 px-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-extrabold text-[11px] cursor-not-allowed"
                    >
                      {isArabic ? 'غير متوفر' : 'Indisponible'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        isFavorite={selectedProduct ? favorites.includes(selectedProduct.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
};
