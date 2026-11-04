import React, { useState } from 'react';
import { Product, ProductOption } from '../../types';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { ProductSvgThumb } from '../common/ProductSvgThumb';
import { X, Plus, Minus, ShoppingBag, Heart, Check, Flame, Tag, Sparkles } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
}) => {
  const { addToCart, language, dailyChickenRemaining, isStoreActuallyOpen } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [qty, setQty] = useState(1);
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!isOpen || !product) return null;

  const countsInQuota = product.countsInChickenQuota !== false;
  const isChickenSoldOut = countsInQuota && dailyChickenRemaining <= 0;
  const isAvailable = product.isAvailable && !isChickenSoldOut;

  // Options extra total
  const optionsTotal = (product.options || [])
    .filter(o => selectedOptions.includes(o.id))
    .reduce((sum, o) => sum + o.extraPrice, 0);

  const unitTotal = product.price + optionsTotal;
  const grandTotal = unitTotal * qty;

  const toggleOption = (optId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optId) ? prev.filter(id => id !== optId) : [...prev, optId]
    );
  };

  const handleAddToCart = () => {
    if (!isAvailable || !isStoreActuallyOpen) return;

    // Build combined notes if options were picked
    const chosenOptionsList = (product.options || []).filter(o => selectedOptions.includes(o.id));
    const optionsText = chosenOptionsList.length > 0
      ? `Suppléments: ${chosenOptionsList.map(o => `${o.nameFr} (+${o.extraPrice}DA)`).join(', ')}`
      : '';
    const fullNotes = [kitchenNotes.trim(), optionsText].filter(Boolean).join(' | ');

    addToCart(product, qty, fullNotes || undefined);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn p-0 sm:p-4">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Sheet Modal */}
      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className="relative w-full max-w-[480px] bg-white dark:bg-[#16161a] rounded-t-[32px] sm:rounded-3xl shadow-2xl border-t sm:border border-zinc-200 dark:border-zinc-800/80 overflow-hidden z-10 animate-slideUp max-h-[90vh] flex flex-col text-zinc-900 dark:text-zinc-100"
      >
        {/* Top Handle & Close */}
        <div className="absolute top-3 left-0 right-0 z-20 flex items-center justify-between px-4 pointer-events-none">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 pointer-events-auto transition active:scale-95 shadow-md"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={() => onToggleFavorite(product.id)}
            className={`p-2 rounded-full backdrop-blur-md pointer-events-auto transition active:scale-95 shadow-md ${
              isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
            aria-label="Ajouter aux favoris"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Product Image / Illustration Hero */}
        <div className="relative w-full aspect-[16/10] bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
          {(product.imageUrl || product.imageThumbUrl) ? (
            <img
              src={product.imageUrl || product.imageThumbUrl}
              alt={product.nameFr}
              className={`w-full h-full object-cover ${!isAvailable ? 'grayscale' : ''}`}
            />
          ) : (
            <ProductSvgThumb type={product.imageType || 'poulet-roti'} className="w-full h-full object-contain p-4 max-h-[220px]" />
          )}

          {/* Status badge */}
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
              <span className="px-4 py-2 rounded-2xl bg-red-600 text-white font-black text-sm shadow-xl">
                {isChickenSoldOut ? (isArabic ? 'نفد لليوم' : 'Épuisé pour la journée') : (isArabic ? 'غير متوفر' : 'Non disponible')}
              </span>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Category & Title */}
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400">
                {product.category}
              </span>

              {countsInQuota && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  <Flame className="w-3 h-3" />
                  <span>{isArabic ? 'دجاج محمر طازج' : 'Poulet frais rôti'}</span>
                </span>
              )}

              {product.badges?.includes('promo') && (
                <span className="px-2 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-bold">
                  PROMO
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white leading-tight">
              {isArabic ? product.nameAr : product.nameFr}
            </h2>
          </div>

          {/* Description */}
          {(product.descriptionFr || product.descriptionAr) && (
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
              {isArabic ? (product.descriptionAr || product.descriptionFr) : (product.descriptionFr || product.descriptionAr)}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline justify-between py-1 border-y border-zinc-200 dark:border-zinc-800/80">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              {isArabic ? 'السعر الفردي:' : 'Prix unitaire :'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                {product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs line-through text-zinc-400">
                  {product.originalPrice.toLocaleString()} DA
                </span>
              )}
              <span className="text-xs font-extrabold text-zinc-500">{t.currency}</span>
            </div>
          </div>

          {/* Optional Supplements / Extras selection */}
          {product.options && product.options.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                {isArabic ? 'إضافات ومكملات حسب الرغبة :' : 'Suppléments au choix :'}
              </span>
              <div className="space-y-1.5">
                {product.options.map(opt => {
                  const isChecked = selectedOptions.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleOption(opt.id)}
                      className={`w-full min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-orange-500/10 border-orange-500/40 text-orange-700 dark:text-orange-300'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isChecked ? 'bg-orange-600 border-orange-600 text-white' : 'border-zinc-400'}`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{isArabic ? opt.nameAr : opt.nameFr}</span>
                      </div>
                      <span className="font-bold text-orange-600 dark:text-orange-400">+{opt.extraPrice} DA</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen Notes Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {isArabic ? 'ملاحظات وتخصيص (اختياري):' : 'Instructions ou précisions (optionnel) :'}
            </label>
            <input
              type="text"
              value={kitchenNotes}
              onChange={e => setKitchenNotes(e.target.value)}
              placeholder={isArabic ? 'مثال: بدون صلصة حارة، طهي إضافي...' : 'Ex: Bien cuit, sauce à part...'}
              className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
            />
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-[#121216] border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3">
          {/* Stepper */}
          <div className="flex items-center bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-300 dark:border-zinc-700 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-black text-zinc-900 dark:text-zinc-100">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty(q => Math.min(20, q + 1))}
              className="w-9 h-9 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            disabled={!isAvailable || !isStoreActuallyOpen}
            onClick={handleAddToCart}
            className={`flex-1 h-12 px-4 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-md ${
              addedSuccess
                ? 'bg-emerald-600 text-white'
                : isAvailable && isStoreActuallyOpen
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/20'
                : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>{isArabic ? 'تمت الإضافة بنجاح!' : 'Ajouté au panier !'}</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {isArabic ? 'إضافة إلى السلة' : 'Ajouter au panier'} • {grandTotal.toLocaleString()} {t.currency}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
