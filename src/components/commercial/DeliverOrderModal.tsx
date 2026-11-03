import React, { useState } from 'react';
import { Order, PaymentMethod } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle2, Banknote, CreditCard, Smartphone, Motorbike, DollarSign } from 'lucide-react';

interface DeliverOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirm: (
    orderId: string,
    paymentMethod: PaymentMethod,
    driverName?: string,
    driverFee?: number,
    note?: string
  ) => void;
}

export const DeliverOrderModal: React.FC<DeliverOrderModalProps> = ({
  order,
  onClose,
  onConfirm,
}) => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    order?.paymentMethod || 'cash'
  );
  const [driverName, setDriverName] = useState<string>(order?.driverName || '');
  const [driverFee, setDriverFee] = useState<string>(
    order?.driverFee !== undefined ? String(order.driverFee) : ''
  );
  const [deliveryNote, setDeliveryNote] = useState<string>('');

  if (!order) return null;

  const isDelivery = order.type === 'delivery';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const feeNum = driverFee ? parseFloat(driverFee) : undefined;
    onConfirm(
      order.id,
      paymentMethod,
      driverName.trim() || undefined,
      feeNum,
      deliveryNote.trim() || undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#16161a] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-emerald-50 via-zinc-50 to-amber-50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-orange-950/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                {isArabic ? 'تأكيد التسليم والتحصيل' : 'Confirmer la livraison et le paiement'}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                {order.orderNumber} • {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* Montant à encaisser */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="font-semibold text-zinc-600 dark:text-zinc-400">
              {isArabic ? 'المبلغ الإجمالي المستحق :' : 'Montant total à encaisser :'}
            </span>
            <span className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
              {order.total.toLocaleString()} DA
            </span>
          </div>

          {/* Mode de paiement */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 block">
              {isArabic ? 'طريقة الدفع (ضروري) :' : 'Mode de règlement (Requis) :'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px]">{isArabic ? 'نقداً (كاش)' : 'Espèces'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'card'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-800 dark:text-blue-300 font-bold shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px]">{isArabic ? 'بطاقة / TPE' : 'Carte / TPE'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('other')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                  paymentMethod === 'other'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-300 font-bold shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                }`}
              >
                <Smartphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px]">{isArabic ? 'آخر / تحويل' : 'Autre'}</span>
              </button>
            </div>
          </div>

          {/* Section Livreur si commande en livraison */}
          {isDelivery && (
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Motorbike className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400" />
                <span>{isArabic ? 'معلومات التوصيل (اختياري) :' : 'Informations Livreur (Optionnel) :'}</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1">
                    {isArabic ? 'اسم السائق' : 'Nom du livreur'}
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="Ex: Mourad / Yacine"
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-750 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 dark:text-zinc-400 block mb-1">
                    {isArabic ? 'أجرة السائق (دج)' : 'Frais livreur (DA)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={driverFee}
                    onChange={e => setDriverFee(e.target.value)}
                    placeholder="Ex: 150"
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-750 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Note de livraison */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
              {isArabic ? 'ملاحظة إضافية :' : 'Remarque finale (Optionnelle) :'}
            </label>
            <input
              type="text"
              value={deliveryNote}
              onChange={e => setDeliveryNote(e.target.value)}
              placeholder={isArabic ? 'مثال: تم الاستلام نقداً مع الباقي' : 'Ex: Encaissé en espèces, client satisfait'}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-750 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold transition"
            >
              {isArabic ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-950/20 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isArabic ? 'تأكيد التسليم' : 'Valider & Marquer Livrée'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
