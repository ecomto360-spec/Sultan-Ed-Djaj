import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../i18n/translations';
import { StockItem, StockCategory } from '../../../types';
import { Package, X, Check } from 'lucide-react';

interface StockItemEditModalProps {
  itemToEdit?: StockItem | null;
  onClose: () => void;
}

export const StockItemEditModal: React.FC<StockItemEditModalProps> = ({ itemToEdit, onClose }) => {
  const { addStockItem, updateStockItem, language, userRole } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isCook = userRole === 'cuisinier';

  const [nameFr, setNameFr] = useState<string>(itemToEdit?.nameFr || '');
  const [nameAr, setNameAr] = useState<string>(itemToEdit?.nameAr || '');
  const [category, setCategory] = useState<StockCategory>(itemToEdit?.category || 'poulet');
  const [unit, setUnit] = useState<string>(itemToEdit?.unit || 'pièce');
  const [currentStock, setCurrentStock] = useState<number>(itemToEdit?.currentStock ?? 10);
  const [alertThreshold, setAlertThreshold] = useState<number>(itemToEdit?.alertThreshold ?? 5);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(itemToEdit?.criticalThreshold ?? 2);
  const [unitCostDA, setUnitCostDA] = useState<number>(itemToEdit?.unitCostDA ?? 100);
  const [supplierName, setSupplierName] = useState<string>(itemToEdit?.supplierName || '');
  const [supplierPhone, setSupplierPhone] = useState<string>(itemToEdit?.supplierPhone || '');
  const [location, setLocation] = useState<string>(itemToEdit?.location || 'Cuisine');

  const categories: { id: StockCategory; labelFr: string; labelAr: string }[] = [
    { id: 'poulet', labelFr: 'Poulet & Viandes', labelAr: 'دجاج ولحوم' },
    { id: 'epices_sauces', labelFr: 'Épices & Sauces', labelAr: 'توابل وصلصات' },
    { id: 'boissons', labelFr: 'Boissons', labelAr: 'مشروبات' },
    { id: 'emballages', labelFr: 'Emballages & Sachets', labelAr: 'تغليف وأكياس' },
    { id: 'combustible', labelFr: 'Combustible & Charbon', labelAr: 'فحم وغاز' },
    { id: 'autre', labelFr: 'Autre consommable', labelAr: 'مواد أخرى' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFr.trim()) return;

    if (itemToEdit) {
      updateStockItem(itemToEdit.id, {
        nameFr,
        nameAr: nameAr || nameFr,
        category,
        unit,
        currentStock,
        alertThreshold,
        criticalThreshold,
        unitCostDA: isCook ? itemToEdit.unitCostDA : unitCostDA,
        supplierName: isCook ? itemToEdit.supplierName : supplierName,
        supplierPhone: isCook ? itemToEdit.supplierPhone : supplierPhone,
        location,
      });
    } else {
      addStockItem({
        nameFr,
        nameAr: nameAr || nameFr,
        category,
        unit,
        currentStock,
        alertThreshold,
        criticalThreshold,
        idealStock: alertThreshold * 2 || 10,
        unitCostDA: isCook ? 0 : unitCostDA,
        supplierName: isCook ? '' : supplierName,
        supplierPhone: isCook ? '' : supplierPhone,
        location,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-[#18181c] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {itemToEdit
                  ? isArabic
                    ? 'تعديل مادة بالمخزون'
                    : 'Modifier l\'article'
                  : isArabic
                  ? 'إضافة مادة جديدة للمخزون'
                  : 'Nouvel article de stock'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isArabic ? 'إدارة المكونات والمواد الاستهلاكية' : 'Gestion des matières premières'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">
                Nom français <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={nameFr}
                onChange={e => setNameFr(e.target.value)}
                placeholder="Ex: Poulet frais calibré"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">الاسم بالعربية</label>
              <input
                type="text"
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                placeholder="مثال: دجاج طازج"
                dir="rtl"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 text-right"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Catégorie</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as StockCategory)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {isArabic ? c.labelAr : c.labelFr}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">{t.stockUnit}</label>
              <input
                type="text"
                required
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="kg, pièce, litre, boîte..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Quantities & Thresholds */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-300">
                {t.stockInitialQty}
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={currentStock}
                onChange={e => setCurrentStock(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-center font-bold text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-amber-400">
                {t.stockAlertThreshold}
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={alertThreshold}
                onChange={e => setAlertThreshold(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-center font-bold text-amber-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-red-400">
                {t.stockCriticalThreshold}
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={criticalThreshold}
                onChange={e => setCriticalThreshold(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-center font-bold text-red-400 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Cost & Location (Cost only for Gérant) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {!isCook && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  {t.stockCostDA} (DA)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={unitCostDA}
                  onChange={e => setUnitCostDA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Emplacement</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Chambre froide, Étagère, Baril..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Supplier details (Gérant only) */}
          {!isCook && (
            <div className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/80 space-y-3">
              <span className="text-xs font-bold text-orange-400">
                {isArabic ? 'بيانات المورّد (خاص بالإدارة)' : 'Fournisseur habituel (Gérant)'}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Nom du fournisseur</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder="Ex: Élevage Mitidja"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">Téléphone fournisseur</label>
                  <input
                    type="tel"
                    value={supplierPhone}
                    onChange={e => setSupplierPhone(e.target.value)}
                    placeholder="0550 00 00 00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition shadow-lg shadow-orange-950/40 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{t.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
