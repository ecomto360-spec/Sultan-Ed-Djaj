import React, { useState } from 'react';
import { Order } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';
import { useApp } from '../../context/AppContext';
import { AlertCircle, X } from 'lucide-react';

interface CancelOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ order, onClose, onConfirm }) => {
  const { language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const predefinedReasons = isArabic
    ? [
        'نفاد الدجاج / المكملات',
        'الزبون لا يجيب على الهاتف',
        'العنوان خارج نطاق التوصيل',
        'تجاوز موعد الإغلاق',
        'طلب الإلغاء من طرف الزبون',
        'سبب آخر',
      ]
    : [
        'Rupture de poulet / accompagnement',
        'Client injoignable au téléphone',
        'Adresse hors zone de livraison',
        'Heure de fermeture dépassée',
        'Demande d\'annulation du client',
        'Autre motif',
      ];

  const defaultReason = predefinedReasons[0];
  const [selectedReason, setSelectedReason] = useState<string>(defaultReason);
  const [customReason, setCustomReason] = useState<string>('');

  if (!order) return null;

  const otherLabel = isArabic ? 'سبب آخر' : 'Autre motif';

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === otherLabel ? customReason.trim() || otherLabel : selectedReason;
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-5 space-y-4 max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-sm font-bold">{t.cancelOrder}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-300">
          {isArabic ? (
            <>هل أنت متأكد من إلغاء الطلب <strong className="text-white">{order.orderNumber}</strong> ({order.customerName})؟</>
          ) : (
            <>Voulez-vous vraiment annuler la commande <strong className="text-white">{order.orderNumber}</strong> ({order.customerName}) ?</>
          )}
        </p>

        <form onSubmit={handleConfirm} className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400">
              {t.cancelReasonLabel}
            </label>
            <div className="space-y-1">
              {predefinedReasons.map(r => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                    selectedReason === r
                      ? 'bg-red-950/40 border-red-500 text-red-200'
                      : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="accent-red-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === otherLabel && (
            <textarea
              required
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder={isArabic ? 'حدد السبب بالتفصيل...' : 'Précisez le motif...'}
              className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 text-xs"
              rows={2}
            />
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl"
            >
              {isArabic ? 'رجوع' : 'Retour'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md"
            >
              {t.confirmCancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
