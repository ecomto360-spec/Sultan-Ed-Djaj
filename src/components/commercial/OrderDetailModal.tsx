import React from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Phone, MapPin, Printer, Clock, Motorbike, Store, CheckCircle2, Navigation, ExternalLink } from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onPrint: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose, onPrint }) => {
  const { updateOrderStatus, language } = useApp();
  const isArabic = language === 'ar';
  if (!order) return null;

  const mapsLink =
    order.deliveryAddress?.mapUrl ||
    (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude
      ? `https://maps.google.com/?q=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`
      : order.deliveryAddress?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${order.deliveryAddress.address}, ${order.deliveryAddress.commune}, Alger`
        )}`
      : null);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {isArabic ? `طلب رقم ${order.orderNumber}` : `Commande ${order.orderNumber}`}
            </span>
            <h3 className="text-sm font-bold text-white">{order.customerName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4 space-y-3 text-xs overflow-y-auto flex-1">
          {/* Status & Timing */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
            <div>
              <span className="text-zinc-400 block text-[11px]">{isArabic ? 'النوع والحالة' : 'Mode & Statut'}</span>
              <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                {order.type === 'delivery' ? <Motorbike className="w-4 h-4 text-orange-400" /> : <Store className="w-4 h-4 text-emerald-400" />}
                {order.type === 'delivery'
                  ? (isArabic ? 'توصيل إلى العنوان' : 'Livraison à domicile')
                  : (isArabic ? 'استلام من المطعم' : 'Retrait comptoir')}
              </span>
            </div>
            <div className={isArabic ? 'text-left' : 'text-right'}>
              <span className="text-zinc-400 block text-[11px]">{isArabic ? 'وقت التسجيل' : 'Créée le'}</span>
              <span className="font-mono text-zinc-200">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Customer details */}
          <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">{isArabic ? 'هاتف الزبون :' : 'Téléphone client :'}</span>
              <a
                href={`tel:${order.customerPhone}`}
                className="text-orange-400 font-mono font-bold hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr">{order.customerPhone}</span>
              </a>
            </div>

            {order.deliveryAddress && (
              <div className="space-y-2 pt-1.5 border-t border-zinc-800 text-zinc-300">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>
                    {order.deliveryAddress.address}, {order.deliveryAddress.commune}
                    {order.deliveryAddress.landmark ? ` (${order.deliveryAddress.landmark})` : ''}
                  </span>
                </div>
                {mapsLink && (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'فتح المسار في خرائط جوجل (GPS للسائق)' : 'Ouvrir l\'itinéraire Google Maps (GPS)'}</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <span className="text-zinc-400 font-semibold block pb-1 border-b border-zinc-800">
              {isArabic ? 'الأطباق المطلوبة' : 'Articles commandés'}
            </span>
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-zinc-200">
                <span>
                  <strong className="text-amber-400">{it.quantity}x</strong> {isArabic ? it.nameAr : it.nameFr}
                </span>
                <span className="font-mono font-semibold">
                  {(it.price * it.quantity).toLocaleString()} {isArabic ? 'دج' : 'DA'}
                </span>
              </div>
            ))}
          </div>

          {/* Kitchen note */}
          {order.kitchenNotes && (
            <div className="p-2.5 bg-amber-950/30 rounded-xl border border-amber-500/30 text-amber-300">
              <strong>{isArabic ? 'ملاحظات خاصة :' : 'Instructions spéciales :'}</strong> {order.kitchenNotes}
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-baseline pt-2 border-t border-zinc-800 font-bold text-sm">
            <span className="text-white">{isArabic ? 'المجموع المستحق :' : 'Total à encaisser :'}</span>
            <span className="text-amber-400 text-base font-extrabold">
              {order.total.toLocaleString()} {isArabic ? 'دج' : 'DA'}
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            onClick={() => onPrint(order)}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isArabic ? 'طباعة' : 'Imprimer'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl"
          >
            {isArabic ? 'إغلاق' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
