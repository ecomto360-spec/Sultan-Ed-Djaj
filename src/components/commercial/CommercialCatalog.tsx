import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Product, ProductCategory } from '../../types';
import { ProductSvgThumb } from '../common/ProductSvgThumb';
import { CompositionModal } from './catalog/CompositionModal';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  Layers,
} from 'lucide-react';

export const CommercialCatalog: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, toggleProductAvailability, language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [compositionProduct, setCompositionProduct] = useState<Product | null>(null);

  // Form fields
  const [nameFr, setNameFr] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descFr, setDescFr] = useState('');
  const [descAr, setDescAr] = useState('');
  const [price, setPrice] = useState<number>(1000);
  const [category, setCategory] = useState<ProductCategory>('poulets');
  const [imageType, setImageType] = useState<Product['imageType']>('poulet-roti');

  // Quick inline price edit
  const [quickPriceId, setQuickPriceId] = useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<number>(0);

  const categories = [
    { id: 'all', label: isArabic ? 'جميع الأصناف' : 'Toutes les catégories' },
    { id: 'poulets', label: t.catPoulets },
    { id: 'accompagnements', label: t.catAccompagnements },
    { id: 'pains', label: t.catPains },
    { id: 'boissons', label: t.catBoissons },
  ];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.nameFr.toLowerCase().includes(q) ||
      p.nameAr.includes(q);
    return matchCat && matchSearch;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setNameFr('');
    setNameAr('');
    setDescFr('');
    setDescAr('');
    setPrice(1200);
    setCategory('poulets');
    setImageType('poulet-roti');
    setIsEditingModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setNameFr(p.nameFr);
    setNameAr(p.nameAr);
    setDescFr(p.descriptionFr);
    setDescAr(p.descriptionAr);
    setPrice(p.price);
    setCategory(p.category);
    setImageType(p.imageType);
    setIsEditingModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFr.trim() || !nameAr.trim() || price <= 0) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        nameFr,
        nameAr,
        descriptionFr: descFr,
        descriptionAr: descAr,
        price,
        category,
        imageType,
      });
    } else {
      addProduct({
        nameFr,
        nameAr,
        descriptionFr: descFr,
        descriptionAr: descAr,
        price,
        category,
        imageType,
        isAvailable: true,
      });
    }

    setIsEditingModalOpen(false);
  };

  const handleQuickPriceSave = (id: string) => {
    if (quickPriceVal > 0) {
      updateProduct(id, { price: quickPriceVal });
    }
    setQuickPriceId(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 space-y-3.5 sm:space-y-4">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-white">{t.catalogTitle}</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
            {products.length} {isArabic ? 'منتج' : 'articles'}
          </span>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addProductBtn}</span>
        </button>
      </div>

      {/* Filter and Search: wraps cleanly across lines on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 ${isArabic ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchProductPlaceholder}
            className={`w-full bg-zinc-900 rounded-xl border border-zinc-700/80 py-2 text-xs text-white placeholder:text-zinc-500 ${
              isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        {/* Category selector */}
        <div className="flex flex-wrap items-center gap-1.5 max-w-full">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-1">
        {filteredProducts.map(product => {
          const isQuickEditing = quickPriceId === product.id;

          return (
            <div
              key={product.id}
              className={`bg-zinc-900/90 rounded-2xl border p-3 flex flex-col justify-between transition-all ${
                product.isAvailable
                  ? 'border-zinc-800 hover:border-zinc-700 shadow-sm'
                  : 'border-red-900/40 bg-red-950/10 opacity-75'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* SVG Thumb */}
                <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1 shrink-0">
                  <ProductSvgThumb type={product.imageType} className="w-full h-full object-contain" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-bold text-xs text-white truncate">
                      {isArabic ? product.nameAr : product.nameFr}
                    </h4>
                  </div>
                  <p className="text-[11px] text-amber-400/90 truncate" dir={isArabic ? 'ltr' : 'rtl'}>
                    {isArabic ? product.nameFr : product.nameAr}
                  </p>
                  <p className="text-[10px] text-zinc-400 line-clamp-2">
                    {isArabic ? product.descriptionAr : product.descriptionFr}
                  </p>
                </div>
              </div>

              {/* Price and Availability toggle */}
              <div className="pt-3 mt-3 border-t border-zinc-800 flex items-center justify-between">
                {/* Price editable */}
                <div>
                  {isQuickEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        autoFocus
                        value={quickPriceVal}
                        onChange={e => setQuickPriceVal(Number(e.target.value))}
                        className="w-20 bg-zinc-800 border border-orange-500 rounded px-1.5 py-0.5 text-xs text-white font-mono"
                      />
                      <button
                        onClick={() => handleQuickPriceSave(product.id)}
                        className="p-1 text-emerald-400 hover:bg-zinc-800 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setQuickPriceId(product.id);
                        setQuickPriceVal(product.price);
                      }}
                      className="cursor-pointer group flex items-center gap-1.5"
                      title={isArabic ? 'اضغط لتعديل السعر سريعاً' : 'Cliquer pour modifier le prix'}
                    >
                      <span className="text-sm font-extrabold text-amber-400">
                        {product.price.toLocaleString()} {t.currency}
                      </span>
                      <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
                    </div>
                  )}
                </div>

                {/* One-click toggle available / out of stock */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleProductAvailability(product.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 transition ${
                      product.isAvailable
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                        : 'bg-red-950/60 text-red-300 border-red-500/40 hover:bg-red-900/60'
                    }`}
                  >
                    {product.isAvailable ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{t.inStock}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span>{t.stockOut}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setCompositionProduct(product)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500/20 text-zinc-400 hover:text-orange-400 transition"
                    title={isArabic ? 'المكونات والمخزون' : 'Fiche technique / Ingrédients'}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(product)}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                    title={t.edit}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(isArabic ? `هل تريد حذف ${product.nameAr} ؟` : `Supprimer ${product.nameFr} ?`)) {
                        deleteProduct(product.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-500 hover:text-red-400"
                    title={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Product */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingProduct ? t.editProductModalTitle : t.newProductModalTitle}
              </h3>
              <button
                onClick={() => setIsEditingModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400">{t.productNameFr} *</label>
                  <input
                    type="text"
                    required
                    value={nameFr}
                    onChange={e => setNameFr(e.target.value)}
                    placeholder="Poulet rôti entier"
                    className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400">{t.productNameAr} *</label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={nameAr}
                    onChange={e => setNameAr(e.target.value)}
                    placeholder="دجاج محمر كامل"
                    className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-1 font-arabic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400">{t.productCategory}</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-1"
                  >
                    <option value="poulets">{t.catPoulets}</option>
                    <option value="accompagnements">{t.catAccompagnements}</option>
                    <option value="pains">{t.catPains}</option>
                    <option value="boissons">{t.catBoissons}</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400">{t.productPrice} *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400">{t.productDescFr}</label>
                <textarea
                  value={descFr}
                  onChange={e => setDescFr(e.target.value)}
                  placeholder="Accompagné d'épices du chef et sauce maison..."
                  className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-1"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400">{t.productDescAr}</label>
                <textarea
                  dir="rtl"
                  value={descAr}
                  onChange={e => setDescAr(e.target.value)}
                  placeholder="متبل بخلطة السلطان السرية..."
                  className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-1 font-arabic"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400">{t.illustrationType}</label>
                <select
                  value={imageType}
                  onChange={e => setImageType(e.target.value as any)}
                  className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-1"
                >
                  <option value="poulet-roti">{isArabic ? 'دجاج محمر كلاسيكي' : 'Poulet rôti classique'}</option>
                  <option value="poulet-braise">{isArabic ? 'دجاج مشوي على الجمر' : 'Poulet braisé au charbon'}</option>
                  <option value="frites">{isArabic ? 'بطاطا مقلية ذهبية' : 'Frites dorées'}</option>
                  <option value="riz">{isArabic ? 'أرز بسمتي متبل' : 'Riz basmati épicé'}</option>
                  <option value="matlouh">{isArabic ? 'خبز مطلوع تقليدي' : 'Pain matlouh traditionnel'}</option>
                  <option value="hmiss">{isArabic ? 'حميس حار تقليدي' : 'Hmiss traditionnel'}</option>
                  <option value="boisson">{isArabic ? 'مشروب غازي' : 'Boisson / Soda'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl shadow-md"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fiche Technique / Composition */}
      {compositionProduct && (
        <CompositionModal
          product={compositionProduct}
          onClose={() => setCompositionProduct(null)}
        />
      )}
    </div>
  );
};
