import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { ProductCategory, Product } from '../../types';
import { ProductSvgThumb } from '../common/ProductSvgThumb';
import { Search, Plus, Minus, ShoppingBag, CheckCircle2, XCircle, Flame } from 'lucide-react';

export const ClientMenu: React.FC = () => {
  const {
    products,
    addToCart,
    cartItemsCount,
    cartTotal,
    setClientTab,
    language,
    isStoreActuallyOpen,
    dailyChickenRemaining,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: t.categoriesAll },
    { id: 'poulets', label: t.catPoulets },
    { id: 'accompagnements', label: t.catAccompagnements },
    { id: 'pains', label: t.catPains },
    { id: 'boissons', label: t.catBoissons },
  ];

  const filteredProducts = products.filter(product => {
    const matchCat = selectedCategory === 'all' || product.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      product.nameFr.toLowerCase().includes(q) ||
      product.nameAr.includes(q) ||
      product.descriptionFr.toLowerCase().includes(q) ||
      product.descriptionAr.includes(q);
    return matchCat && matchSearch;
  });

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, delta: number) => {
    const current = getQty(id);
    const next = Math.max(1, Math.min(20, current + delta));
    setQuantities(prev => ({ ...prev, [id]: next }));
  };

  const handleAdd = (product: Product) => {
    const qty = getQty(product.id);
    addToCart(product, qty);
    setJustAddedId(product.id);
    setTimeout(() => {
      setJustAddedId(prev => (prev === product.id ? null : prev));
    }, 1200);
    // Reset local stepper back to 1
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Scrollable Products List */}
      <div className="flex-1 overflow-y-auto p-3.5 pb-24 space-y-4">
        {/* Closed warning if store closed */}
        {!isStoreActuallyOpen && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{t.storeClosedCannotOrder}</span>
          </div>
        )}

      {/* Hero Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-950/70 via-zinc-900 to-amber-950/60 p-3.5 border border-orange-500/30 shadow-md">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-bold border border-orange-500/30">
              <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />
              <span>{isArabic ? 'مشوي على الجمر الأصيل' : 'Braisé au charbon de bois'}</span>
            </div>
            <h2 className="text-base font-bold text-white font-serif">
              {isArabic ? 'سلطان الدجاج – بئر خادم' : 'Sultan Ed-Djaj • Birkhadem'}
            </h2>
            <p className="text-xs text-zinc-300">
              {isArabic
                ? 'دجاج محمر على السيخ ومشوي على الجمر، مقرمش، طازج ومتبل بعناية'
                : 'Poulet rôti à la broche & braisé au charbon naturel'}
            </p>
          </div>
          <div className="w-12 h-12 shrink-0">
            <ProductSvgThumb type="poulet-roti" className="w-full h-full drop-shadow-md" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 ${isArabic ? 'right-3' : 'left-3'}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className={`w-full h-11 bg-zinc-900/90 rounded-xl border border-zinc-700/80 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition shadow-inner ${
            isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
          }`}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className={`absolute top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white ${isArabic ? 'left-3' : 'right-3'}`}
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Chips: wraps onto 2 neat lines instead of horizontal scroll */}
      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm ring-1 ring-orange-400/40'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700/50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Product Grid (2 cols on phone, 3 on tablet, 4 on wide screen) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {filteredProducts.map(product => {
          const qty = getQty(product.id);
          const isChickenProduct = product.category === 'poulets' || product.id === 'prod-1' || product.id === 'prod-2';
          const isChickenSoldOut = isChickenProduct && dailyChickenRemaining <= 0;
          const isAvailable = product.isAvailable && !isChickenSoldOut;

          return (
            <div
              key={product.id}
              className={`flex flex-col justify-between bg-zinc-900/90 rounded-2xl border transition-all p-2.5 relative group ${
                isAvailable
                  ? 'border-zinc-800 hover:border-orange-500/40 shadow-sm'
                  : 'border-zinc-800/50 opacity-60'
              }`}
            >
              {/* Product Thumbnail */}
              <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950/80 mb-2 border border-zinc-800/60 flex items-center justify-center">
                <ProductSvgThumb type={product.imageType} className="w-full h-full object-contain" />
                
                {/* Availability Badge */}
                <div
                  className={`absolute top-1.5 ${isArabic ? 'left-1.5' : 'right-1.5'} text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md border ${
                    isAvailable
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                      : 'bg-red-950/80 text-red-300 border-red-500/30'
                  }`}
                >
                  {isAvailable
                    ? t.available
                    : isChickenSoldOut
                    ? t.dailyChickenSoldOutToday
                    : t.outOfStock}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 mb-2">
                <h3 className="text-xs font-bold text-zinc-100 line-clamp-1 leading-snug">
                  {isArabic ? product.nameAr : product.nameFr}
                </h3>
                <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {isArabic ? product.descriptionAr : product.descriptionFr}
                </p>
              </div>

              {/* Price & Action */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2 mt-auto">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-extrabold text-amber-400">
                    {product.price.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-semibold">{t.currency}</span>
                </div>

                {isAvailable && isStoreActuallyOpen ? (
                  <div className="flex items-center gap-1.5">
                    {/* Stepper */}
                    <div className="flex items-center bg-zinc-800/80 rounded-lg border border-zinc-700 p-0.5 shrink-0">
                      <button
                        onClick={() => setQty(product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-white rounded hover:bg-zinc-700/60 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-zinc-100">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty(product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-white rounded hover:bg-zinc-700/60 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Add to Cart button */}
                    <button
                      onClick={() => handleAdd(product)}
                      className={`flex-1 h-7 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition active:scale-95 ${
                        justAddedId === product.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white'
                      }`}
                    >
                      {justAddedId === product.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                          <span className="text-[10px]">{isArabic ? 'تمت الإضافة' : 'Ajouté !'}</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span className="text-[11px]">{t.addToCart}</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="w-full py-1 text-center text-[10px] font-semibold text-zinc-500 bg-zinc-800/40 rounded-lg">
                    {!isStoreActuallyOpen
                      ? t.storeClosed
                      : isChickenSoldOut
                      ? t.dailyChickenSoldOutToday
                      : t.outOfStock}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="py-12 text-center text-zinc-400 space-y-2">
          <p className="text-xs">{isArabic ? 'لا توجد أطباق مطابقة لبحثك.' : 'Aucun plat ne correspond à votre recherche.'}</p>
        </div>
      )}
      </div>

      {/* Floating Cart Button placed cleanly inside simulator screen directly above BottomNav */}
      {cartItemsCount > 0 && (
        <div className="absolute bottom-2 left-3 right-3 z-30 pointer-events-none">
          <button
            onClick={() => setClientTab('cart')}
            className="pointer-events-auto w-full h-12 bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-2xl shadow-black/80 flex items-center justify-between px-3.5 font-bold border border-orange-400/50 hover:brightness-105 active:scale-[0.98] transition ring-2 ring-orange-500/30"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-zinc-950 text-white flex items-center justify-center text-xs font-black ring-1 ring-white/30">
                {cartItemsCount}
              </div>
              <span className="text-xs sm:text-sm font-extrabold tracking-wide text-white">
                {t.floatingCartText}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/20 text-white text-sm font-black">
              <span>{cartTotal.toLocaleString()}</span>
              <span className="text-xs font-bold text-orange-200">{t.currency}</span>
              <span className="text-xs font-bold text-white ml-0.5">{isArabic ? '←' : '→'}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
