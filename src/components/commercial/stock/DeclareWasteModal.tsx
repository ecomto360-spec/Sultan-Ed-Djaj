import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../i18n/translations';
import { StockItem } from '../../../types';
import { Flame, X } from 'lucide-react';

interface DeclareWasteModalProps {
  stockItem?: StockItem | null;
  onClose: () => void;
}

export const DeclareWasteModal: React.FC<DeclareWasteModalProps> = ({ stockItem, onClose }) => {
  const { stockItems, declareWasteLoss, language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [selectedItemId, setSelectedItemId] = useState<string>(
    stockItem ? stockItem.id : stockItems[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('Brûlé / Trop cuit');
  const [customReason, setCustomReason] = useState<string>('');

  const targetItem = stockItems.find(s => s.id === selectedItemId);

  const reasons = [
    { value: 'Brûlé / Trop cuit', labelFr: 'Brûlé / Trop cuit', labelAr: 'محروق / مطهو زيادة' },
    { value: 'Périmé / Odeur', labelFr: 'Périmé / Avarié', labelAr: 'منتهي الصلاحية / تالف' },
    { value: 'Tombé par terre', labelFr: 'Tombé au sol / Contaminé', labelAr: 'سقط على الأرض / ملوث' },
    { value: 'Erreur découpe / Calibre', labelFr: 'Erreur de découpe', labelAr: 'خطأ في التقطيع' },
    { value: 'Dégât / Casse emballage', labelFr: 'Emballage percé / Cassé', labelAr: 'تلف في التغليف' },
    { value: 'Autre', labelFr: 'Autre...', labelAr: 'سبب آخر...' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem || quantity <= 0) return;
    const finalReason = reason === 'Autre' ? customReason.trim() || 'Perte' : reason;
    declareWasteLoss(targetItem.id, quantity, finalReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-[#18181c] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t.declareLossBtn}</h3>
              <p className="text-[11px] text-zinc-400">
                {isArabic ? 'تسجيل فاقد أو تالف في المطبخ' : 'Déclaration de perte ou gaspillage'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-4 space-y-4 overflow-y-auto flex-1">
          {/* Article selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">{t.colStockItem}</label>
            <select
              value={selectedItemId}
              onChange={e => setSelectedItemId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-orange-500"
            >
              {stockItems.map(item => (
                <option key={item.id} value={item.id}>
                  {isArabic ? item.nameAr : item.nameFr} ({item.currentStock} {item.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">{t.colMovementQty}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0.01"
                required
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-orange-500 text-center"
              />
              <span className="text-xs font-semibold text-zinc-400 w-16 shrink-0">
                {targetItem ? targetItem.unit : ''}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              {isArabic ? 'السبب / التعليل :' : 'Motif de la perte :'}
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-orange-500"
            >
              {reasons.map(r => (
                <option key={r.value} value={r.value}>
                  {isArabic ? r.labelAr : r.labelFr}
                </option>
              ))}
            </select>
            {reason === 'Autre' && (
              <input
                type="text"
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder={isArabic ? 'اكتب السبب...' : 'Préciser le motif...'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 mt-2"
              />
            )}
          </div>

          {/* Estimated cost impact */}
          {targetItem && (
            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                {isArabic ? 'التكلفة المقدرة للتلف :' : 'Coût estimé de la perte :'}
              </span>
              <span className="font-bold text-red-400 font-mono">
                {Math.round(quantity * targetItem.unitCostDA)} DA
              </span>
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-950/40"
            >
              {t.declareLossBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
