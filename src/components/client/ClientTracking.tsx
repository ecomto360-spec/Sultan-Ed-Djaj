import React from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { OrderStatus } from '../../types';
import {
  Clock,
  CheckCircle2,
  Phone,
  MapPin,
  ChefHat,
  Motorbike,
  Store,
  AlertCircle,
  ArrowRight,
  Navigation,
  ExternalLink,
} from 'lucide-react';

export const ClientTracking: React.FC = () => {
  const {
    clientActiveOrder,
    orders,
    setClientActiveOrder,
    setClientTab,
    settings,
    language,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const order = clientActiveOrder || orders[0] || null;

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Clock className="w-12 h-12 text-zinc-500" />
        <h3 className="text-sm font-bold text-zinc-200">{t.noPastOrders}</h3>
        <button
          onClick={() => setClientTab('menu')}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold rounded-xl"
        >
          {t.exploreMenu}
        </button>
      </div>
    );
  }

  // Define steps
  const steps: { key: OrderStatus; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      key: 'pending',
      label: t.statusPending,
      desc: t.timelineSteps.pending,
      icon: <Clock className="w-4 h-4" />,
    },
    {
      key: 'preparing',
      label: t.statusPreparing,
      desc: t.timelineSteps.preparing,
      icon: <ChefHat className="w-4 h-4" />,
    },
    {
      key: 'ready',
      label: t.statusReady,
      desc: t.timelineSteps.ready,
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      key: 'delivered',
      label: order.type === 'delivery' ? t.statusDelivered : t.statusPickedUp,
      desc: t.timelineSteps.delivered,
      icon: order.type === 'delivery' ? <Motorbike className="w-4 h-4" /> : <Store className="w-4 h-4" />,
    },
  ];

  const statusOrder: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered'];
  const currentIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="flex-1 overflow-y-auto p-3.5 pb-24 space-y-4">
      {/* Header with order number */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-orange-950/40 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-zinc-400">
            {t.orderNumberLabel}
          </span>
          <span className="text-xs font-extrabold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
            {order.orderNumber}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-300">
            {order.type === 'delivery' ? (
              <Motorbike className="w-4 h-4 text-orange-400" />
            ) : (
              <Store className="w-4 h-4 text-orange-400" />
            )}
            <span className="font-bold">
              {order.type === 'delivery' ? t.typeDelivery : t.typePickup}
            </span>
          </div>

          <div className="text-xs font-extrabold text-white">
            {order.total.toLocaleString()} {t.currency}
          </div>
        </div>

        {/* ETA notification */}
        {!isCancelled && order.status !== 'delivered' && (
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400">{t.estimatedTime}</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              ~{settings.estimatedPrepTimeMinutes} min
            </span>
          </div>
        )}
      </div>

      {/* Cancelled notice if applicable */}
      {isCancelled ? (
        <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{t.statusCancelled}</span>
          </div>
          {order.cancellationReason && (
            <p className="text-[11px] text-red-300/80 pl-6">
              {order.cancellationReason}
            </p>
          )}
        </div>
      ) : (
        /* Visual Stepper Timeline */
        <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 space-y-4">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            {t.trackingTitle}
          </h3>

          <div className="relative space-y-6">
            {steps.map((s, index) => {
              const isPast = currentIndex > index;
              const isCurrent = currentIndex === index;
              const isPending = currentIndex < index;

              return (
                <div key={s.key} className="relative flex items-start gap-3">
                  {/* Vertical connecting line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute ${isArabic ? 'right-4' : 'left-4'} top-8 w-0.5 h-10 ${
                        isPast ? 'bg-orange-500' : 'bg-zinc-800'
                      }`}
                    />
                  )}

                  {/* Icon circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                      isPast
                        ? 'bg-orange-600 text-white'
                        : isCurrent
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white ring-4 ring-orange-500/20 shadow-lg animate-pulse'
                        : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                    }`}
                  >
                    {s.icon}
                  </div>

                  {/* Label & Description */}
                  <div className="space-y-0.5 pt-1">
                    <h4
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? 'text-orange-400 font-extrabold'
                          : isPast
                          ? 'text-zinc-200'
                          : 'text-zinc-500'
                      }`}
                    >
                      {s.label}
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Call restaurant button */}
      <a
        href={`tel:${settings.phone.replace(/\s+/g, '')}`}
        className="w-full h-11 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl text-xs font-bold text-zinc-200 flex items-center justify-center gap-2 border border-zinc-700 transition"
      >
        <Phone className="w-4 h-4 text-orange-400" />
        <span>{t.callRestaurant} ({settings.phone})</span>
      </a>

      {/* Order Articles Recap */}
      <div className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 space-y-2.5 text-xs">
        <h4 className="font-bold text-zinc-300">
          {language === 'ar' ? 'تفاصيل الطلب' : 'Détail de la commande'}
        </h4>
        <div className="space-y-1.5 divide-y divide-zinc-800/60">
          {order.items.map((it, idx) => (
            <div key={idx} className="pt-1.5 flex justify-between items-baseline">
              <span className="text-zinc-300">
                <strong className="text-amber-400">{it.quantity}x</strong>{' '}
                {isArabic ? it.nameAr : it.nameFr}
              </span>
              <span className="text-zinc-400 font-medium">
                {(it.price * it.quantity).toLocaleString()} {t.currency}
              </span>
            </div>
          ))}
        </div>

        {order.kitchenNotes && (
          <div className="pt-2 border-t border-zinc-800 text-[11px] text-amber-300/90 bg-amber-950/20 p-2 rounded-lg border border-amber-500/20">
            <strong>Note :</strong> {order.kitchenNotes}
          </div>
        )}

        {order.deliveryAddress && (
          <div className="pt-2 border-t border-zinc-800 space-y-1 text-[11px] text-zinc-400">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
              <span>
                {order.deliveryAddress.address}, {order.deliveryAddress.commune}
                {order.deliveryAddress.landmark ? ` (${order.deliveryAddress.landmark})` : ''}
              </span>
            </div>
            {(order.deliveryAddress.mapUrl || (order.deliveryAddress.latitude && order.deliveryAddress.longitude)) && (
              <a
                href={
                  order.deliveryAddress.mapUrl ||
                  `https://maps.google.com/?q=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:underline pt-0.5"
              >
                <Navigation className="w-3 h-3" />
                <span>{isArabic ? 'عرض موقع التوصيل على الخريطة (GPS)' : 'Voir la localisation GPS sur Google Maps'}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Switch active order selector if multiple orders exist */}
      {orders.length > 1 && (
        <div className="pt-2">
          <button
            onClick={() => setClientTab('profile')}
            className="w-full text-center text-[11px] text-zinc-400 hover:text-orange-400 underline underline-offset-4"
          >
            {t.orderHistory} ({orders.length})
          </button>
        </div>
      )}
    </div>
  );
};
