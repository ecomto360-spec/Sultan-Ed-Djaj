import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { ProductCategoryItem } from '../../../types';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Edit2, Check, AlertCircle } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories, products, language } = useApp();
  const isArabic = language === 'ar';

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameFr, setEditNameFr] = useState('');
  const [editNameAr, setEditNameAr] = useState('');

  const [newNameFr, setNewNameFr] = useState('');
  const [newNameAr, setNewNameAr] = useState('');

  // Delete confirmation with migration
  const [deletingCategory, setDeletingCategory] = useState<ProductCategoryItem | null>(null);
  const [targetMigrationCategoryId, setTargetMigrationCategoryId] = useState<string>('');

  if (!isOpen) return null;

  const handleStartEdit = (cat: ProductCategoryItem) => {
    setEditingId(cat.id);
    setEditNameFr(cat.nameFr);
    setEditNameAr(cat.nameAr);
  };

  const handleSaveEdit = (id: string) => {
    if (!editNameFr.trim()) return;
    updateCategory(id, {
      nameFr: editNameFr.trim(),
      nameAr: editNameAr.trim() || editNameFr.trim(),
    });
    setEditingId(null);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameFr.trim()) return;
    addCategory({
      nameFr: newNameFr.trim(),
      nameAr: newNameAr.trim() || newNameFr.trim(),
    });
    setNewNameFr('');
    setNewNameAr('');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    reorderCategories(reordered.map(c => c.id));
  };

  const handlePromptDelete = (cat: ProductCategoryItem) => {
    const prodsInCat = products.filter(p => !p.isArchived && p.category === cat.id);
    if (prodsInCat.length === 0) {
      if (confirm(`Supprimer la catégorie "${cat.nameFr}" ?`)) {
        deleteCategory(cat.id);
      }
    } else {
      const remainingCats = categories.filter(c => c.id !== cat.id);
      setTargetMigrationCategoryId(remainingCats[0]?.id || '');
      setDeletingCategory(cat);
    }
  };

  const handleConfirmMigrationDelete = () => {
    if (!deletingCategory) return;
    deleteCategory(deletingCategory.id, targetMigrationCategoryId || undefined);
    setDeletingCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              {isArabic ? 'إدارة تصنيفات القائمة' : 'Gestion des Catégories'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isArabic ? 'إضافة، تعديل، ترتيب أو حذف الفئات' : 'Ordre, noms français/arabe et organisation du menu'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {categories.map((cat, idx) => {
            const isEditing = editingId === cat.id;
            const prodsCount = products.filter(p => !p.isArchived && p.category === cat.id).length;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60"
              >
                {isEditing ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editNameFr}
                      onChange={e => setEditNameFr(e.target.value)}
                      placeholder="Nom FR"
                      className="px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editNameAr}
                      onChange={e => setEditNameAr(e.target.value)}
                      placeholder="الاسم بالعربية"
                      dir="rtl"
                      className="px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                        {cat.nameFr} <span className="text-zinc-400 font-normal">| {cat.nameAr}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {prodsCount} {prodsCount === 1 ? 'produit' : 'produits'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                        title="Sauvegarder"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
                        title="Annuler"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleMove(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 'down')}
                        disabled={idx === categories.length - 1}
                        className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                        title="Renommer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePromptDelete(cat)}
                        className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new category form */}
        <form onSubmit={handleAddCategory} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 shrink-0">
          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
            {isArabic ? '+ إضافة تصنيف جديد' : '+ Ajouter une nouvelle catégorie'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
            <input
              type="text"
              value={newNameFr}
              onChange={e => setNewNameFr(e.target.value)}
              placeholder="Nom (FR) ex: Grillades"
              className="px-3 py-2 text-xs bg-white dark:bg-zinc-800 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="text"
              value={newNameAr}
              onChange={e => setNewNameAr(e.target.value)}
              placeholder="الاسم بالعربية (اختياري)"
              dir="rtl"
              className="px-3 py-2 text-xs bg-white dark:bg-zinc-800 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isArabic ? 'إضافة التصنيف' : 'Ajouter la catégorie'}</span>
          </button>
        </form>

        {/* Delete Confirmation Modal with Product Migration */}
        {deletingCategory && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm p-4 flex flex-col justify-center items-center">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-red-500/40 max-w-sm w-full space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>Catégorie non vide</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                La catégorie <strong className="text-zinc-900 dark:text-white">"{deletingCategory.nameFr}"</strong> contient des produits. Choisissez la catégorie vers laquelle déplacer ces produits avant de la supprimer :
              </p>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Déplacer les produits vers :
                </label>
                <select
                  value={targetMigrationCategoryId}
                  onChange={e => setTargetMigrationCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {categories
                    .filter(c => c.id !== deletingCategory.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nameFr} ({c.nameAr})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="flex-1 min-h-[40px] rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMigrationDelete}
                  className="flex-1 min-h-[40px] rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md transition"
                >
                  Déplacer & Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
