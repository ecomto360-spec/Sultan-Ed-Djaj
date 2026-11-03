import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../i18n/translations';
import { ExpenseCategory } from '../../../types';
import { DollarSign, X, Check } from 'lucide-react';

interface ExpenseModalProps {
  onClose: () => void;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({ onClose }) => {
  const { addExpense, language, userRole } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [category, setCategory] = useState<ExpenseCategory>('achats_matieres');
  const [amount, setAmount] = useState<number>(5000);
  const [note, setNote] = useState<string>('');

  const categories: { id: ExpenseCategory; labelFr: string; labelAr: string }[] = [
    { id: 'achats_matieres', labelFr: 'Achats matières premières', labelAr: 'شراء مواد أولية' },
    { id: 'livreur', labelFr: 'Frais de livraison (courses)', labelAr: 'مستحقات التوصيل' },
    { id: 'salaires', labelFr: 'Salaires & Avances', labelAr: 'أجور وسلفيات' },
    { id: 'loyer', labelFr: 'Loyer local', labelAr: 'إيجار المحل' },
    { id: 'energie', labelFr: 'Énergie & Gaz (Sonelgaz/Bouteilles)', labelAr: 'غاز وكهرباء' },
    { id: 'autre', labelFr: 'Autre charge ou imprévu', labelAr: 'مصاريف أخرى' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    addExpense({
      date,
      category,
      amount,
      note: note.trim(),
      createdBy: userRole === 'gerant' ? 'Gérant' : 'Back-Office',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-[#18181c] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t.expenseModalTitle}</h3>
              <p className="text-[11px] text-zinc-400">
                {isArabic ? 'تسجيل نفقة أو مصروف تشغيلي' : 'Enregistrement d\'une dépense'}
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
          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Catégorie</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {isArabic ? c.labelAr : c.labelFr}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Montant (DA)</label>
            <input
              type="number"
              step="10"
              min="1"
              required
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-red-400 focus:outline-none focus:border-orange-500 text-lg"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              {isArabic ? 'ملاحظة أو تفاصيل :' : 'Description / Détails :'}
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: Achat charbon 5 sacs"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

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
