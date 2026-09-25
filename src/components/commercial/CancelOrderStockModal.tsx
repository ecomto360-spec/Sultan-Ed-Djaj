import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Order } from '../../types';
import { AlertTriangle, RotateCcw, Flame, Ban, X } from 'lucide-react';

interface CancelOrderStockModalProps {
  order: Order;
  onClose: () => void;
}

export const CancelOrderStockModal: React.FC<CancelOrderStockModalProps> = ({ order, onClose }) => {
  const { cancelOrderWithStockChoice, language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [reason, setReason] = useState<string>('Client injoignable');
  const [customReason, setCustomReason] = useState<string>('');
  const [stockChoice, setStockChoice] = useState<'return' | 'loss' | 'none'>('loss');

  const reasonsList = [
    { value: 'Client injoignable', labelFr: 'Client injoignable', labelAr: 'الزبون لا يرد' },
    { value: 'Annulation demandée par le client', labelFr: 'Annulation demandée par le client', labelAr: 'إلغاء بطلب من الزبون' },
    { value: 'Erreur de saisie / Doublon', labelFr: 'Erreur de saisie / Doublon', labelAr: 'خطأ في الإدخال / تكرار' },
    { value: 'Retard de préparation / Rupture', labelFr: 'Retard de préparation / Rupture', labelAr: 'تأخر في التحضير / نفاد' },
    { value: 'Autre', labelFr: 'Autre raison...', labelAr: 'سبب آخر...' },
  ];

  const handleConfirm = () => {
    const finalReason = reason === 'Autre' ? customReason.trim() || 'Annulée' : reason;
    cancelOrderWithStockChoice(order.id, finalReason, stockChoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#18181c] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isArabic ? `إلغاء الطلب ${order.orderNumber}` : `Annuler la commande ${order.orderNumber}`}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isArabic
                  ? 'تم خصم المكونات سابقاً عند بدء التحضير'
                  : 'Ingrédients déjà déduits lors du lancement en préparation'}
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
        <div className="p-4 space-y-4">
          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              {isArabic ? 'سبب الإلغاء :' : 'Motif d\'annulation :'}
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-orange-500"
            >
              {reasonsList.map(r => (
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
                placeholder={isArabic ? 'اكتب سبب الإلغاء هنا...' : 'Préciser le motif...'}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 mt-2"
              />
            )}
          </div>

          {/* Stock Action Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">
              {isArabic ? 'ماذا نفعل بالمكونات المستهلكة ؟' : 'Traitement des ingrédients déduits :'}
            </label>

            <div className="space-y-2">
              {/* Option 1: Return to stock */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  stockChoice === 'return'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <input
                  type="radio"
                  name="stockChoice"
                  value="return"
                  checked={stockChoice === 'return'}
                  onChange={() => setStockChoice('return')}
                  className="mt-0.5 text-emerald-600 focus:ring-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.cancelModalRestoreStock}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isArabic
                      ? 'إرجاع الكميات إلى المخزون (الطبق لم يُطهَ بعد ويمكن إعادة استخدامه)'
                      : 'Réinjecter les portions en stock (produits non cuits ou réutilisables)'}
                  </p>
                </div>
              </label>

              {/* Option 2: Declare loss/waste */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  stockChoice === 'loss'
                    ? 'bg-red-500/10 border-red-500/40 text-white'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <input
                  type="radio"
                  name="stockChoice"
                  value="loss"
                  checked={stockChoice === 'loss'}
                  onChange={() => setStockChoice('loss')}
                  className="mt-0.5 text-red-600 focus:ring-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{t.cancelModalDeclareLoss}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isArabic
                      ? 'تسجيل كفاقد/هدر في دفتر الحركات (الطبق طُهي بالفعل ولا يمكن بيعه)'
                      : 'Enregistrer en gaspillage/perte (poulet déjà rôti/brûlé/inutilisable)'}
                  </p>
                </div>
              </label>

              {/* Option 3: Do nothing */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  stockChoice === 'none'
                    ? 'bg-amber-500/10 border-amber-500/40 text-white'
                    : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <input
                  type="radio"
                  name="stockChoice"
                  value="none"
                  checked={stockChoice === 'none'}
                  onChange={() => setStockChoice('none')}
                  className="mt-0.5 text-amber-600 focus:ring-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Ban className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'إلغاء دون أي حركة مخزون' : 'Annuler sans modifier le stock'}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {isArabic
                      ? 'الاحتفاظ بالخصم التلقائي الحالي دون تعديل'
                      : 'Laisser la déduction existante sans mouvement inverse'}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-950/40"
          >
            {isArabic ? 'تأكيد الإلغاء' : 'Confirmer l\'annulation'}
          </button>
        </div>
      </div>
    </div>
  );
};
