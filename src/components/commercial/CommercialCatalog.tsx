import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Product } from '../../types';
import { ProductSvgThumb } from '../common/ProductSvgThumb';
import { ProductEditModal } from './catalog/ProductEditModal';
import { CategoryManagerModal } from './catalog/CategoryManagerModal';
import { CompositionModal } from './catalog/CompositionModal';
import {
  Plus,
  Edit2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  AlertCircle,
  FolderCog,
  Star,
  Eye,
  EyeOff,
  Flame,
  Tag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export const CommercialCatalog: React.FC = () => {
  const {
    products,
    categories,
    deleteProduct,
    duplicateProduct,
    toggleProductAvailability,
    reorderProducts,
    exportCatalogJson,
    importCatalogJson,
    language,
    userRole,
    authenticatedRole,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const effectiveRole = authenticatedRole !== 'gerant' ? authenticatedRole : userRole;
  const isManager = effectiveRole === 'gerant';

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [compositionProduct, setCompositionProduct] = useState<Product | null>(null);

  // Soft delete confirmation
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Import JSON file ref
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importNotice, setImportNotice] = useState<{ text: string; error?: boolean } | null>(null);

  // Active products (exclude archived)
  const nonArchivedProducts = products.filter(p => !p.isArchived);

  // Sorted and filtered
  const filteredProducts = nonArchivedProducts
    .filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.nameFr.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q) ||
        (p.descriptionFr && p.descriptionFr.toLowerCase().includes(q));
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      // Featured first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setIsEditModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingProduct) return;
    deleteProduct(deletingProduct.id);
    setDeletingProduct(null);
  };

  const handleMoveProduct = (prod: Product, direction: 'up' | 'down') => {
    const prodsInCat = nonArchivedProducts
      .filter(p => p.category === prod.category)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    const currentIndex = prodsInCat.findIndex(p => p.id === prod.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= prodsInCat.length) return;

    const reordered = [...prodsInCat];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    reorderProducts(prod.category, reordered.map(p => p.id));
  };

  const handleExportJson = () => {
    const jsonStr = exportCatalogJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sultan-ed-djaj-catalogue-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportJsonSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      const res = importCatalogJson(content);
      if (res.success) {
        setImportNotice({ text: res.message, error: false });
      } else {
        setImportNotice({ text: res.message, error: true });
      }
      setTimeout(() => setImportNotice(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-5 space-y-4">
      {/* Read-Only Notice for Cuisinier / Caissier */}
      {!isManager && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Mode Consultation & Disponibilités :</strong> Vous pouvez basculer les plats en rupture ("Épuisé") ou disponibles en temps réel. La modification des prix et du menu est réservée au Gérant.
            </span>
          </div>
        </div>
      )}

      {/* Import Notice */}
      {importNotice && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            importNotice.error
              ? 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{importNotice.text}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
            {t.catalogTitle}
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-bold">
            {nonArchivedProducts.length} {isArabic ? 'منتج' : 'produits'}
          </span>
        </div>

        {/* Manager Action buttons */}
        {isManager && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category manager button */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="min-h-[40px] px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <FolderCog className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Gérer catégories</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportJson}
              className="min-h-[40px] px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs flex items-center gap-1.5 transition"
              title="Exporter le catalogue en JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            {/* Import JSON */}
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportJsonSelected}
            />
            <button
              onClick={() => importInputRef.current?.click()}
              className="min-h-[40px] px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold text-xs flex items-center gap-1.5 transition"
              title="Restaurer ou importer un catalogue JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Importer</span>
            </button>

            {/* Add product button */}
            <button
              onClick={handleOpenAddModal}
              className="min-h-[40px] px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addProductBtn}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        {/* Categories scrollable bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`min-h-[36px] px-3.5 rounded-full text-xs font-bold shrink-0 transition ${
              selectedCategory === 'all'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-500/20'
            }`}
          >
            {isArabic ? 'الكل' : 'Tous'} ({nonArchivedProducts.length})
          </button>
          {categories.map(c => {
            const count = nonArchivedProducts.filter(p => p.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`min-h-[36px] px-3.5 rounded-full text-xs font-bold shrink-0 transition ${
                  selectedCategory === c.id
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-500/10 dark:hover:bg-orange-500/20'
                }`}
              >
                {c.nameFr} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 ${isArabic ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchProductPlaceholder}
            className={`w-full min-h-[40px] rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 space-y-2">
            <p className="text-sm font-semibold">Aucun produit ne correspond à ces critères.</p>
            {isManager && (
              <button
                onClick={handleOpenAddModal}
                className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline"
              >
                + Ajouter un premier produit
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((p, idx) => {
              const catObj = categories.find(c => c.id === p.category);
              return (
                <div
                  key={p.id}
                  className={`relative flex flex-col rounded-2xl bg-white dark:bg-zinc-850 border transition shadow-sm ${
                    !p.isAvailable
                      ? 'border-zinc-200 dark:border-zinc-800 opacity-80'
                      : 'border-zinc-200 dark:border-zinc-700/80 hover:border-orange-500/50'
                  }`}
                >
                  {/* Top image area */}
                  <div className="relative aspect-square w-full rounded-t-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    {(p.imageThumbUrl || p.imageUrl) ? (
                      <img
                        src={p.imageThumbUrl || p.imageUrl}
                        alt={p.nameFr}
                        loading="lazy"
                        className={`w-full h-full object-cover transition duration-300 ${
                          !p.isAvailable ? 'grayscale' : ''
                        }`}
                      />
                    ) : (
                      <div className="p-4 w-full h-full flex flex-col items-center justify-center">
                        <ProductSvgThumb type={p.imageType || 'poulet-roti'} className="w-24 h-24" />
                      </div>
                    )}

                    {/* Featured Star Badge */}
                    {p.isFeatured && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-md">
                        <Star className="w-3 h-3 fill-current" />
                        <span>En tête</span>
                      </div>
                    )}

                    {/* Visibility Badge */}
                    {!p.isVisible && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-zinc-900/80 text-zinc-300 font-bold text-[10px] flex items-center gap-1 backdrop-blur-xs">
                        <EyeOff className="w-3 h-3" />
                        <span>Masqué client</span>
                      </div>
                    )}

                    {/* Chicken Quota badge */}
                    {p.countsInChickenQuota && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-orange-400 font-mono text-[10px] font-bold">
                        🍗 -{p.chickenQuotaPerItem ?? 1} quota
                      </div>
                    )}

                    {/* Promo tag */}
                    {p.originalPrice && p.originalPrice > p.price && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-orange-600 text-white text-[10px] font-black">
                        PROMO
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Category tag & Badges */}
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          {catObj?.nameFr || p.category}
                        </span>

                        {p.badges?.includes('nouveau') && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Nouveau
                          </span>
                        )}
                        {p.badges?.includes('populaire') && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Populaire
                          </span>
                        )}
                        {p.badges?.includes('epice') && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 dark:text-red-400">
                            Épicé
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">
                        {p.nameFr}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1" dir="rtl">
                        {p.nameAr}
                      </p>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-base font-extrabold text-orange-600 dark:text-orange-400">
                          {p.price} DA
                        </span>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-xs line-through text-zinc-400">
                            {p.originalPrice} DA
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Availability toggle button (Visible to ALL roles) */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <button
                        onClick={() => toggleProductAvailability(p.id)}
                        className={`min-h-[36px] flex-1 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          p.isAvailable
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25 border border-red-500/30'
                        }`}
                        title="Cliquer pour changer l'état disponible / épuisé"
                      >
                        {p.isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>En stock (Dispo)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Épuisé (Rupture)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Manager Operations (Edit, Duplicate, Move, Delete, Fiche technique) */}
                    {isManager && (
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        {/* Move Up/Down */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleMoveProduct(p, 'up')}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            title="Monter dans la catégorie"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveProduct(p, 'down')}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                            title="Descendre dans la catégorie"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Fiche technique / Composition */}
                        <button
                          onClick={() => setCompositionProduct(p)}
                          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                          title="Fiche technique (Ingrédients déduits)"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => duplicateProduct(p.id)}
                          className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                          title="Dupliquer ce plat"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition"
                          title="Modifier le produit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete (Soft) */}
                        <button
                          onClick={() => setDeletingProduct(p)}
                          className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                          title="Archiver / Supprimer le produit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      <ProductEditModal
        key={editingProduct ? editingProduct.id : 'new-product'}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={editingProduct}
        onOpenCategoryManager={() => {
          setIsEditModalOpen(false);
          setIsCategoryModalOpen(true);
        }}
      />

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Composition / Stock Recipe Modal */}
      {compositionProduct && (
        <CompositionModal
          product={compositionProduct}
          onClose={() => setCompositionProduct(null)}
        />
      )}

      {/* Soft Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-red-500/40 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Confirmer la suppression</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              Voulez-vous supprimer le produit <strong className="text-zinc-900 dark:text-white">"{deletingProduct.nameFr}"</strong> ?
              Il sera archivé et retiré du menu client tout en préservant l'historique des anciennes commandes.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="flex-1 min-h-[40px] rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 min-h-[40px] rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md transition"
              >
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
