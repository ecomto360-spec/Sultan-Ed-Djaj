import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Product, ProductBadge, ProductOption } from '../../../types';
import { processAndUploadProductImage } from '../../../utils/imageUtils';
import { ProductSvgThumb } from '../../common/ProductSvgThumb';
import {
  X,
  Upload,
  Camera,
  Trash2,
  Plus,
  Flame,
  Sparkles,
  TrendingUp,
  Tag,
  Star,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null; // null if adding new product
  onOpenCategoryManager?: () => void;
}

const AVAILABLE_BADGES: { id: ProductBadge; labelFr: string; labelAr: string; icon: any; color: string }[] = [
  { id: 'nouveau', labelFr: 'Nouveau', labelAr: 'جديد', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'populaire', labelFr: 'Populaire', labelAr: 'الأكثر طلباً', icon: TrendingUp, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  { id: 'epice', labelFr: 'Épicé', labelAr: 'حار', icon: Flame, color: 'text-red-500 bg-red-500/10 border-red-500/30' },
  { id: 'promo', labelFr: 'Promo', labelAr: 'تخفيض', icon: Tag, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
];

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  isOpen,
  onClose,
  product,
  onOpenCategoryManager,
}) => {
  const { categories, addProduct, updateProduct, language } = useApp();
  const isArabic = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [nameFr, setNameFr] = useState(product?.nameFr || '');
  const [nameAr, setNameAr] = useState(product?.nameAr || '');
  const [descFr, setDescFr] = useState(product?.descriptionFr || '');
  const [descAr, setDescAr] = useState(product?.descriptionAr || '');
  const [price, setPrice] = useState<number>(product?.price || 1200);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(product?.originalPrice);
  const [hasPromoPrice, setHasPromoPrice] = useState<boolean>(Boolean(product?.originalPrice && product.originalPrice > product.price));
  const [category, setCategory] = useState<string>(product?.category || (categories[0]?.id || 'poulets'));

  // Image states
  const [imageUrl, setImageUrl] = useState<string | undefined>(product?.imageUrl);
  const [imageThumbUrl, setImageThumbUrl] = useState<string | undefined>(product?.imageThumbUrl);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Chicken quota logic
  const [countsInChickenQuota, setCountsInChickenQuota] = useState<boolean>(product?.countsInChickenQuota !== false);
  const [chickenQuotaPerItem, setChickenQuotaPerItem] = useState<number>(product?.chickenQuotaPerItem ?? 1);

  // Badges & features
  const [badges, setBadges] = useState<ProductBadge[]>(product?.badges || []);
  const [isFeatured, setIsFeatured] = useState<boolean>(Boolean(product?.isFeatured));
  const [isAvailable, setIsAvailable] = useState<boolean>(product?.isAvailable !== false);
  const [isVisible, setIsVisible] = useState<boolean>(product?.isVisible !== false);

  // Options & Supplements
  const [options, setOptions] = useState<ProductOption[]>(product?.options || []);
  const [newOptionNameFr, setNewOptionNameFr] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState<number>(100);

  // Validation
  const [formError, setFormError] = useState<string | null>(null);

  // Keep state perfectly synchronized with product whenever modal opens or product changes
  useEffect(() => {
    if (isOpen) {
      setNameFr(product?.nameFr || '');
      setNameAr(product?.nameAr || '');
      setDescFr(product?.descriptionFr || '');
      setDescAr(product?.descriptionAr || '');
      setPrice(product?.price || 1200);
      setOriginalPrice(product?.originalPrice);
      setHasPromoPrice(Boolean(product?.originalPrice && product.originalPrice > (product?.price || 0)));
      setCategory(product?.category || (categories[0]?.id || 'poulets'));
      setImageUrl(product?.imageUrl);
      setImageThumbUrl(product?.imageThumbUrl);
      setCountsInChickenQuota(product?.countsInChickenQuota !== false);
      setChickenQuotaPerItem(product?.chickenQuotaPerItem ?? 1);
      setBadges(product?.badges || []);
      setIsFeatured(Boolean(product?.isFeatured));
      setIsAvailable(product?.isAvailable !== false);
      setIsVisible(product?.isVisible !== false);
      setOptions(product?.options || []);
      setNewOptionNameFr('');
      setNewOptionPrice(100);
      setImageError(null);
      setIsUploadingImage(false);
      setFormError(null);
    }
  }, [isOpen, product, categories]);

  if (!isOpen) return null;

  const handleImageFileSelected = async (file: File) => {
    setImageError(null);
    setIsUploadingImage(true);
    try {
      const res = await processAndUploadProductImage(file, product?.id || 'prod-new');
      if (!res || !res.imageUrl) {
        setImageError('Erreur lors du traitement de l\'image');
      } else {
        setImageUrl(res.imageUrl);
        setImageThumbUrl(res.imageThumbUrl);
      }
    } catch (err: any) {
      setImageError(err?.message || 'Échec de l\'upload');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleToggleBadge = (badgeId: ProductBadge) => {
    setBadges(prev =>
      prev.includes(badgeId) ? prev.filter(b => b !== badgeId) : [...prev, badgeId]
    );
  };

  const handleAddOption = () => {
    if (!newOptionNameFr.trim()) return;
    const newOpt: ProductOption = {
      id: `opt-${Date.now()}`,
      nameFr: newOptionNameFr.trim(),
      nameAr: newOptionNameFr.trim(),
      extraPrice: Math.max(0, newOptionPrice),
    };
    setOptions(prev => [...prev, newOpt]);
    setNewOptionNameFr('');
    setNewOptionPrice(100);
  };

  const handleRemoveOption = (id: string) => {
    setOptions(prev => prev.filter(o => o.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isUploadingImage) {
      setFormError('Veuillez attendre la fin de l’envoi de la photo avant de publier le produit.');
      return;
    }
    if (!nameFr.trim()) {
      setFormError('Le nom en français est obligatoire.');
      return;
    }
    if (price < 0 || isNaN(price)) {
      setFormError('Le prix doit être un nombre positif ou nul.');
      return;
    }

    const payload: Partial<Product> = {
      nameFr: nameFr.trim(),
      nameAr: nameAr.trim() || nameFr.trim(),
      descriptionFr: descFr.trim(),
      descriptionAr: descAr.trim(),
      price: Math.round(price),
      originalPrice: hasPromoPrice && originalPrice && originalPrice > price ? Math.round(originalPrice) : undefined,
      category,
      imageUrl,
      imageThumbUrl,
      countsInChickenQuota,
      chickenQuotaPerItem: countsInChickenQuota ? Math.max(0.1, chickenQuotaPerItem) : 0,
      badges,
      isFeatured,
      isAvailable,
      isVisible,
      options,
    };

    if (product) {
      updateProduct(product.id, payload);
    } else {
      addProduct({
        nameFr: payload.nameFr!,
        nameAr: payload.nameAr!,
        descriptionFr: payload.descriptionFr || '',
        descriptionAr: payload.descriptionAr || '',
        price: payload.price!,
        originalPrice: payload.originalPrice,
        category: payload.category || 'poulets',
        imageUrl: payload.imageUrl,
        imageThumbUrl: payload.imageThumbUrl,
        isAvailable: payload.isAvailable ?? true,
        isVisible: payload.isVisible ?? true,
        isFeatured: payload.isFeatured ?? false,
        badges: payload.badges || [],
        options: payload.options || [],
        countsInChickenQuota: payload.countsInChickenQuota ?? true,
        chickenQuotaPerItem: payload.chickenQuotaPerItem ?? 1,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              {product ? (isArabic ? 'تعديل المنتج' : 'Modifier le produit') : (isArabic ? 'إضافة منتج جديد' : 'Nouveau Produit')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isArabic ? 'إدارة الصورة، الأسعار، الحصص والمكملات' : 'Image carrée WebP, prix, quota poulets et suppléments'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {formError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Image Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Photo du produit (Format 1:1 Carré WebP)</span>
              <span className="text-[11px] font-normal text-zinc-500">Max 5 Mo</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-300 dark:border-zinc-700">
              {/* Preview Box */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shrink-0 flex items-center justify-center shadow-inner">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Aperçu"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="p-3 w-full h-full flex flex-col items-center justify-center text-zinc-400">
                    <ProductSvgThumb type={product?.imageType || 'poulet-roti'} className="w-14 h-14" />
                    <span className="text-[10px] text-zinc-400 mt-1">Illustration</span>
                  </div>
                )}

                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500 mb-1" />
                    <span>Traitement...</span>
                  </div>
                )}
              </div>

              {/* Upload Buttons */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFileSelected(file);
                  }}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{imageUrl ? 'Remplacer l\'image' : 'Importer une photo'}</span>
                  </button>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl(undefined);
                        setImageThumbUrl(undefined);
                      }}
                      className="min-h-[44px] px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Prise de photo mobile ou import de fichier. Recadrage automatique au ratio 1:1 et compression WebP optimisée (~80%).
                </p>

                {imageError && (
                  <p className="text-xs text-red-500 font-semibold">{imageError}</p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Names (FR + AR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block mb-1">
                Nom du plat (Français) *
              </label>
              <input
                type="text"
                value={nameFr}
                onChange={e => setNameFr(e.target.value)}
                placeholder="Ex: Poulet braisé aux herbes"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block mb-1">
                اسم الطبق (العربية)
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                placeholder="مثال: دجاج محمر على الفحم"
                dir="rtl"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* 3. Category & Chicken Quota Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                  Catégorie *
                </label>
                {onOpenCategoryManager && (
                  <button
                    type="button"
                    onClick={onOpenCategoryManager}
                    className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    + Gérer catégories
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nameFr} ({c.nameAr})
                  </option>
                ))}
              </select>
            </div>

            {/* Chicken Quota decrement logic */}
            <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={countsInChickenQuota}
                  onChange={e => setCountsInChickenQuota(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Décompte le quota poulets du jour
                </span>
              </label>

              {countsInChickenQuota && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-zinc-600 dark:text-zinc-300">Portion par unité :</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    max="10"
                    value={chickenQuotaPerItem}
                    onChange={e => setChickenQuotaPerItem(parseFloat(e.target.value) || 1)}
                    className="w-20 px-2 py-1 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-bold text-center text-zinc-900 dark:text-white"
                  />
                  <span className="text-[11px] text-zinc-500">(Ex: 1 = entier, 0.5 = demi)</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Pricing & Promo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block mb-1">
                Prix de vente (DA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={price}
                  onChange={e => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm font-bold text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">DA</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={hasPromoPrice}
                  onChange={e => {
                    setHasPromoPrice(e.target.checked);
                    if (e.target.checked && (!originalPrice || originalPrice <= price)) {
                      setOriginalPrice(price + 200);
                    }
                  }}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                  Prix barré / Promo spéciale
                </span>
              </label>

              {hasPromoPrice && (
                <div className="relative">
                  <input
                    type="number"
                    min={price + 10}
                    step="50"
                    value={originalPrice || ''}
                    onChange={e => setOriginalPrice(parseInt(e.target.value) || undefined)}
                    placeholder="Ancien prix (ex: 1500)"
                    className="w-full min-h-[40px] px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs line-through text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">DA</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Descriptions (FR + AR) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block mb-1">
                Description (Français)
              </label>
              <textarea
                rows={2}
                value={descFr}
                onChange={e => setDescFr(e.target.value)}
                placeholder="Ingrédients, accompagnements inclus..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block mb-1">
                الوصف (العربية)
              </label>
              <textarea
                rows={2}
                value={descAr}
                onChange={e => setDescAr(e.target.value)}
                placeholder="المكونات، طريقة الطهي والصلصات..."
                dir="rtl"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          </div>

          {/* 6. Badges & Highlights */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block">
              Badges & Mise en avant
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_BADGES.map(b => {
                const isSelected = badges.includes(b.id);
                const Icon = b.icon;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleToggleBadge(b.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                      isSelected
                        ? b.color + ' ring-2 ring-orange-500/40'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{b.labelFr}</span>
                  </button>
                );
              })}

              {/* Pin to top / Featured */}
              <button
                type="button"
                onClick={() => setIsFeatured(prev => !prev)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  isFeatured
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 ring-2 ring-amber-500/40'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Mis en tête (Star)</span>
              </button>
            </div>
          </div>

          {/* 7. Options & Suppléments (sauces, portions) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Suppléments & Options au choix (ex: Sauce maison, Grand format...)
              </label>
              <span className="text-[11px] text-zinc-500">{options.length} définies</span>
            </div>

            {/* Existing Options List */}
            {options.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {options.map(opt => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
                  >
                    <span className="font-semibold text-zinc-900 dark:text-white">{opt.nameFr}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-orange-600 dark:text-orange-400">+{opt.extraPrice} DA</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-1 text-zinc-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add option row */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newOptionNameFr}
                onChange={e => setNewOptionNameFr(e.target.value)}
                placeholder="Nom du supplément (ex: Sauce Harissa)"
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
              <input
                type="number"
                min="0"
                step="50"
                value={newOptionPrice}
                onChange={e => setNewOptionPrice(parseInt(e.target.value) || 0)}
                placeholder="Prix DA"
                className="w-24 px-3 py-2 text-xs bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold"
              />
              <button
                type="button"
                onClick={handleAddOption}
                className="min-h-[38px] px-3 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {/* 8. Availability & Visibility Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white">Disponible en cuisine</div>
                <div className="text-[11px] text-zinc-500">Si non, s'affiche comme "Épuisé"</div>
              </div>
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={e => setIsAvailable(e.target.checked)}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 cursor-pointer">
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white">Visible sur la page client</div>
                <div className="text-[11px] text-zinc-500">Si non, le plat est temporairement masqué</div>
              </div>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={e => setIsVisible(e.target.checked)}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
              />
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploadingImage}
            className="min-h-[44px] px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {isUploadingImage
              ? 'Envoi de la photo...'
              : product
                ? 'Mettre à jour le produit'
                : 'Créer et publier le produit'}
          </button>
        </div>
      </div>
    </div>
  );
};
