import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../i18n/translations';
import { Product, CompositionIngredient } from '../../../types';
import { getAvailablePortions } from '../../../services/stockService';
import { X, Plus, Trash2, Check, AlertTriangle, Layers } from 'lucide-react';

interface CompositionModalProps {
  product: Product;
  onClose: () => void;
}

export const CompositionModal: React.FC<CompositionModalProps> = ({ product, onClose }) => {
  const {
    stockItems,
    compositions,
    updateComposition,
    language,
    userRole,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isCook = userRole === 'cuisinier';

  // Find existing composition
  const existingComp = compositions.find(c => c.productId === product.id);
  const [ingredients, setIngredients] = useState<CompositionIngredient[]>(
    existingComp ? [...existingComp.ingredients] : []
  );

  const availablePortions = getAvailablePortions(product.id, stockItems, [
    { productId: product.id, ingredients },
  ]);

  const handleAddRow = () => {
    const firstStock = stockItems[0]?.id || '';
    setIngredients(prev => [...prev, { stockItemId: firstStock, quantity: 1 }]);
  };

  const handleRemoveRow = (idx: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleStockChange = (idx: number, stockItemId: string) => {
    setIngredients(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], stockItemId };
      return next;
    });
  };

  const handleQtyChange = (idx: number, quantity: number) => {
    setIngredients(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: Math.max(0.001, quantity) };
      return next;
    });
  };

  const handleSave = () => {
    updateComposition(product.id, ingredients);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181c] border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {t.compositionModalTitle} : {isArabic ? product.nameAr : product.nameFr}
              </h3>
              <p className="text-xs text-zinc-400">{t.compositionSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Real-time portions availability banner */}
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold text-zinc-300">
                {isArabic ? 'القدرة الإنتاجية الفورية :' : 'Capacité immédiate :'}
              </span>
            </div>
            <span className="text-xs font-extrabold text-orange-400 bg-orange-500/20 px-2.5 py-1 rounded-lg">
              {availablePortions === 999
                ? isArabic
                  ? 'غير محددة'
                  : 'Non limitée'
                : `${availablePortions} ${t.portionPortionsAvailable}`}
            </span>
          </div>

          {/* Ingredient rows */}
          <div className="space-y-2.5">
            {ingredients.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                {isArabic
                  ? 'لم يتم تحديد أي مكوّن لهذا الطبق بعد. انقر على الزر أدناه لإضافة مكوّنات.'
                  : 'Aucun ingrédient défini pour ce produit. Cliquez ci-dessous pour en ajouter.'}
              </div>
            ) : (
              ingredients.map((ing, idx) => {
                const sItem = stockItems.find(s => s.id === ing.stockItemId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/80"
                  >
                    {/* Select stock item */}
                    <div className="flex-1">
                      <select
                        value={ing.stockItemId}
                        onChange={e => handleStockChange(idx, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-orange-500"
                      >
                        {stockItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {isArabic ? item.nameAr : item.nameFr} ({item.currentStock} {item.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity input */}
                    <div className="w-28 flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0.001"
                        value={ing.quantity}
                        onChange={e => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs font-bold text-white text-center focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-xs font-semibold text-zinc-400 shrink-0">
                        {sItem ? sItem.unit : ''}
                      </span>
                    </div>

                    {/* Cost calculation (for Gerant only) */}
                    {!isCook && sItem && (
                      <div className="text-[11px] text-zinc-400 font-mono w-20 text-right shrink-0">
                        {Math.round(ing.quantity * sItem.unitCostDA)} DA
                      </div>
                    )}

                    {/* Delete row */}
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="w-full py-2.5 border border-dashed border-zinc-700 hover:border-orange-500/50 hover:bg-zinc-800/40 text-zinc-300 hover:text-orange-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addIngredientRow}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-orange-950/40"
          >
            <Check className="w-4 h-4" />
            <span>{t.save}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
