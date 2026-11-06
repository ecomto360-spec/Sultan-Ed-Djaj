import React from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Motorbike,
  Store,
  Phone,
  ShoppingBag,
  AlertCircle,
  XCircle,
} from 'lucide-react';

// Timeline verticale du suivi de commande : Reçue → En préparation → Prête →
// En livraison / À récupérer → Livrée / Terminée. L'étape active est animée,
// chaque étape horodatée depuis l'historique serveur (statusHistory).
// Utilisée par l'onglet « Mes commandes » et par la page /commande/:id.
export const OrderTrackingView: React.FC<{ order: Order }> = ({ order }) => {
  const { settings, language } = useApp();
  const isArabic = language === 'ar';

  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const isDelivery = order.type === 'delivery';
  const isDelivering = isDelivery && order.status === 'ready' && Boolean(order.driverName);

  const statusRank: Record<string, number> = { pending: 0, preparing: 1, ready: 2, delivered: 3 };
  const currentRank = isDelivering ? 2.5 : (statusRank[order.status] ?? 0);

  const historyTime = (status: string): string | null => {
    const entry = (order.statusHistory || []).find(h => h.status === status);
    if (!entry?.timestamp) return null;
    const date = new Date(entry.timestamp);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleTimeString(isArabic ? 'ar-DZ' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  interface Step {
    key: string;
    label: string;
    icon: React.ReactNode;
    rank: number;
    time: string | null;
  }

  const steps: Step[] = isDelivery
    ? [
        { key: 'pending', label: isArabic ? 'تم الاستلام' : 'Reçue', icon: <Clock className="w-4 h-4" />, rank: 0, time: historyTime('pending') },
        { key: 'preparing', label: isArabic ? 'قيد التحضير' : 'En préparation', icon: <ChefHat className="w-4 h-4" />, rank: 1, time: historyTime('preparing') },
        { key: 'ready', label: isArabic ? 'جاهزة' : 'Prête', icon: <CheckCircle2 className="w-4 h-4" />, rank: 2, time: historyTime('ready') },
        { key: 'delivering', label: isArabic ? 'في الطريق' : 'En livraison', icon: <Motorbike className="w-4 h-4" />, rank: 2.5, time: null },
        { key: 'delivered', label: isArabic ? 'تم التسليم' : 'Livrée', icon: <CheckCircle2 className="w-4 h-4" />, rank: 3, time: historyTime('delivered') },
      ]
    : [
        { key: 'pending', label: isArabic ? 'تم الاستلام' : 'Reçue', icon: <Clock className="w-4 h-4" />, rank: 0, time: historyTime('pending') },
        { key: 'preparing', label: isArabic ? 'قيد التحضير' : 'En préparation', icon: <ChefHat className="w-4 h-4" />, rank: 1, time: historyTime('preparing') },
        { key: 'ready', label: isArabic ? 'جاهزة للاستلام' : 'Prête · À récupérer', icon: <Store className="w-4 h-4" />, rank: 2, time: historyTime('ready') },
        { key: 'delivered', label: isArabic ? 'مكتملة' : 'Terminée', icon: <CheckCircle2 className="w-4 h-4" />, rank: 3, time: historyTime('delivered') },
      ];

  const phoneHref = `tel:${(settings.phone || '').replace(/[^\d+]/g, '')}`;

  return (
    <div className="space-y-4">
      {/* En-tête commande */}
      <div className="bg-gradient-to-r from-white via-zinc-50 to-amber-50/50 dark:from-zinc-900 dark:via-zinc-900 dark:to-orange-950/40 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
            {isArabic ? 'رقم الطلب' : 'Numéro de commande'}
          </span>
          <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            {order.orderNumber}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-800 dark:text-zinc-300">
            {isDelivery ? (
              <Motorbike className="w-4 h-4 text-amber-600 dark:text-orange-400" />
            ) : (
              <Store className="w-4 h-4 text-amber-600 dark:text-orange-400" />
            )}
            <span className="font-bold">
              {isDelivery ? (isArabic ? 'توصيل' : 'Livraison') : (isArabic ? 'استلام من المطعم' : 'À récupérer')}
            </span>
          </div>
          <div className="text-xs font-extrabold text-zinc-900 dark:text-white">
            {order.total.toLocaleString()} {isArabic ? 'دج' : 'DA'}
          </div>
        </div>
        {!isCancelled && !isDelivered && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">
              {isArabic ? 'الوقت المتوقع' : 'Temps estimé'}
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ~{settings.estimatedPrepTimeMinutes} min
            </span>
          </div>
        )}
      </div>

      {/* Annulation */}
      {isCancelled && (
        <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-500/40 text-red-800 dark:text-red-300 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <XCircle className="w-4 h-4" />
            <span>{isArabic ? 'تم إلغاء هذا الطلب' : 'Cette commande a été annulée'}</span>
          </div>
          {order.cancellationReason && (
            <p className="leading-relaxed">
              {isArabic ? 'السبب' : 'Motif'} : {order.cancellationReason}
            </p>
          )}
        </div>
      )}

      {/* Timeline verticale */}
      {!isCancelled && (
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm transition-colors">
          <ol className="space-y-0">
            {steps.map((step, index) => {
              const done = currentRank > step.rank || (currentRank === step.rank && isDelivered);
              const active = !isDelivered && currentRank === step.rank && step.rank !== 3;
              const last = index === steps.length - 1;
              return (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : active
                            ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-orange-400 animate-pulse'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {step.icon}
                    </div>
                    {!last && (
                      <div
                        className={`w-0.5 flex-1 min-h-[26px] ${
                          done ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                    )}
                  </div>
                  <div className={`pb-4 ${last ? 'pb-0' : ''} flex-1 flex items-start justify-between gap-2`}>
                    <div className="pt-1">
                      <p
                        className={`text-xs font-bold ${
                          done
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : active
                              ? 'text-amber-700 dark:text-orange-300'
                              : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                    {step.time && (
                      <span className="pt-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                        {step.time}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Récapitulatif */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2.5 shadow-sm transition-colors">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-100">
          <ShoppingBag className="w-4 h-4 text-orange-500" />
          <span>{isArabic ? 'ملخص الطلب' : 'Récapitulatif'}</span>
        </div>
        <ul className="space-y-1.5">
          {order.items.map((item, idx) => (
            <li key={`${item.productId}-${idx}`} className="flex items-center justify-between text-xs">
              <span className="text-zinc-700 dark:text-zinc-300">
                <span className="font-bold text-amber-700 dark:text-orange-400">{item.quantity}×</span>{' '}
                {isArabic ? item.nameAr : item.nameFr}
              </span>
              <span className="font-mono text-zinc-600 dark:text-zinc-400">
                {(item.price * item.quantity).toLocaleString()} {isArabic ? 'دج' : 'DA'}
              </span>
            </li>
          ))}
        </ul>
        {order.type === 'delivery' && order.deliveryFee > 0 && (
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>{isArabic ? 'رسوم التوصيل' : 'Frais de livraison'}</span>
            <span className="font-mono">{order.deliveryFee.toLocaleString()} {isArabic ? 'دج' : 'DA'}</span>
          </div>
        )}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
            {isArabic ? 'المجموع' : 'Total'}
          </span>
          <span className="text-sm font-black text-orange-600 dark:text-orange-400">
            {order.total.toLocaleString()} {isArabic ? 'دج' : 'DA'}
          </span>
        </div>
        {order.deliveryAddress?.address && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
            {isArabic ? 'العنوان' : 'Adresse'} : {order.deliveryAddress.address}
            {order.deliveryAddress.commune ? `, ${order.deliveryAddress.commune}` : ''}
          </p>
        )}
      </div>

      {/* Appeler le restaurant */}
      <a
        href={phoneHref}
        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black rounded-2xl shadow-md shadow-orange-950/20 transition active:scale-95"
      >
        <Phone className="w-4 h-4" />
        {isArabic ? 'اتصل بالمطعم' : 'Appeler le restaurant'}
      </a>
    </div>
  );
};
