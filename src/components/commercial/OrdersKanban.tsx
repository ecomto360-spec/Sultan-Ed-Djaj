import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  Clock,
  Phone,
  MapPin,
  ChefHat,
  CheckCircle2,
  Motorbike,
  Store,
  Printer,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Navigation,
  ExternalLink,
  MessageCircle,
  Check,
  Eye,
} from 'lucide-react';
import { getAlgiersDateString } from '../../services/dayService';
import { DeliverOrderModal } from './DeliverOrderModal';
import { WhatsAppPreviewModal } from './WhatsAppPreviewModal';

interface OrdersKanbanProps {
  onPrintTicket: (order: Order) => void;
  onCancelOrder: (order: Order) => void;
  onViewOrder?: (order: Order) => void;
  filterType: 'all' | 'delivery' | 'pickup';
  searchQuery: string;
}

export const OrdersKanban: React.FC<OrdersKanbanProps> = ({
  onPrintTicket,
  onCancelOrder,
  onViewOrder,
  filterType,
  searchQuery,
}) => {
  const { orders, currentDay, updateOrderStatus, userRole, language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isCook = userRole === 'cuisinier';

  // Responsive column focus for mobile & tablet
  const [selectedColumn, setSelectedColumn] = useState<OrderStatus | 'all'>('all');
  const [deliverModalOrder, setDeliverModalOrder] = useState<Order | null>(null);
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<Order | null>(null);

  // Filter orders: Include active open day orders AND all ongoing orders (pending, preparing, ready)
  const filteredOrders = orders.filter(o => {
    const isOngoingOrder = o.status === 'pending' || o.status === 'preparing' || o.status === 'ready';
    if (!isOngoingOrder) {
      if (!currentDay) return false;
      const belongsToOpenDay =
        o.dayId === currentDay.id ||
        (!o.dayId && getAlgiersDateString(o.createdAt) === currentDay.date);
      if (!belongsToOpenDay) return false;
    }

    const matchType = filterType === 'all' || o.type === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q);
    return matchType && matchSearch;
  });

  const columns: {
    status: OrderStatus;
    title: string;
    accentColor: string;
    bgColor: string;
    borderColor: string;
  }[] = [
    {
      status: 'pending',
      title: t.statusPending,
      accentColor: 'text-amber-800 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-950/20',
      borderColor: 'border-amber-400/60 dark:border-amber-500/40',
    },
    {
      status: 'preparing',
      title: t.statusPreparing,
      accentColor: 'text-orange-800 dark:text-orange-400',
      bgColor: 'bg-orange-500/10 dark:bg-orange-950/20',
      borderColor: 'border-orange-400/60 dark:border-orange-500/40',
    },
    {
      status: 'ready',
      title: t.statusReady,
      accentColor: 'text-emerald-800 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-400/60 dark:border-emerald-500/40',
    },
    {
      status: 'delivered',
      title: t.statusDelivered,
      accentColor: 'text-zinc-700 dark:text-zinc-400',
      bgColor: 'bg-zinc-200/50 dark:bg-zinc-900/40',
      borderColor: 'border-zinc-300 dark:border-zinc-800',
    },
  ];

  // Helper for minutes elapsed
  const getElapsedMinutes = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / 60000);
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === 'pending') return 'preparing';
    if (current === 'preparing') return 'ready';
    if (current === 'ready') return 'delivered';
    return null;
  };

  const getActionLabel = (order: Order) => {
    if (order.status === 'pending') return t.actionAccept;
    if (order.status === 'preparing') return t.actionReady;
    if (order.status === 'ready') {
      return order.type === 'delivery' ? t.actionDeliver : t.actionPickupDone;
    }
    return '';
  };

  const displayedColumns = columns.filter(
    c => selectedColumn === 'all' || c.status === selectedColumn
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Mobile / Tablet Column Selector Pill Bar: wraps onto lines cleanly */}
      <div className="lg:hidden px-3 py-2 flex flex-wrap items-center gap-1.5 shrink-0 bg-white/70 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <button
          onClick={() => setSelectedColumn('all')}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
            selectedColumn === 'all'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          {isArabic ? 'الكل' : 'Toutes'} ({filteredOrders.length})
        </button>
        {columns.map(col => {
          const count = filteredOrders.filter(o => o.status === col.status).length;
          return (
            <button
              key={col.status}
              onClick={() => setSelectedColumn(col.status)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                selectedColumn === col.status
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <span>{col.title}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white dark:bg-zinc-900 font-extrabold text-zinc-700 dark:text-zinc-300">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Columns Container */}
      <div className="flex-1 overflow-x-auto p-2.5 sm:p-4 min-h-0">
        <div className={`flex items-stretch gap-3 sm:gap-4 h-full ${
          selectedColumn === 'all'
            ? 'min-w-[85vw] lg:min-w-0 w-full snap-x snap-mandatory'
            : 'w-full'
        }`}>
          {displayedColumns.map(col => {
            const colOrders = filteredOrders.filter(o => o.status === col.status);

            return (
              <div
                key={col.status}
                className={`flex flex-col rounded-2xl border ${col.borderColor} ${col.bgColor} max-h-full overflow-hidden shadow-sm shrink-0 snap-start transition-colors ${
                  selectedColumn === 'all'
                    ? 'w-[88vw] sm:w-[340px] lg:w-auto lg:flex-1'
                    : 'w-full flex-1'
                }`}
              >
              {/* Column Header */}
              <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.status === 'pending' ? 'bg-amber-500 animate-ping' : col.status === 'preparing' ? 'bg-orange-500 animate-pulse' : col.status === 'ready' ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-500'}`} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${col.accentColor}`}>
                    {col.title}
                  </h3>
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-transparent">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
                {colOrders.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-zinc-500 italic">
                    {isArabic ? 'لا توجد طلبات' : 'Aucune commande'}
                  </div>
                ) : (
                  colOrders.map(order => {
                    const elapsed = getElapsedMinutes(order.createdAt);
                    const isLate = col.status === 'pending' && elapsed >= 15;
                    const next = getNextStatus(order.status);

                    return (
                      <div
                        key={order.id}
                        className={`bg-white dark:bg-zinc-900/95 rounded-xl border p-3 space-y-2.5 shadow-md transition-all ${
                          isLate
                            ? 'border-red-500/80 ring-2 ring-red-500/20 shadow-red-500/10'
                            : order.status === 'pending'
                            ? 'border-amber-400 dark:border-amber-500/50 ring-1 ring-amber-500/20'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        {/* Top: Order number & Type badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                              {order.orderNumber}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                order.type === 'delivery'
                                  ? 'bg-orange-50 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30'
                                  : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                              }`}
                            >
                              {order.type === 'delivery' ? (
                                <Motorbike className="w-3 h-3" />
                              ) : (
                                <Store className="w-3 h-3" />
                              )}
                              <span>
                                {order.type === 'delivery'
                                  ? (isArabic ? 'توصيل' : 'Livraison')
                                  : (isArabic ? 'استلام' : 'Comptoir')}
                              </span>
                            </span>

                            {order.source && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                {order.source === 'phone'
                                  ? (isArabic ? '📞 هاتف' : '📞 Tél')
                                  : order.source === 'counter'
                                  ? (isArabic ? '🏪 منضدة' : '🏪 Comptoir')
                                  : order.source === 'whatsapp'
                                  ? '💬 WhatsApp'
                                  : '📱 App'}
                              </span>
                            )}
                          </div>

                          {/* Time elapsed timer */}
                          <div
                            className={`flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isLate
                                ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/40 animate-pulse'
                                : 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-transparent'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{elapsed} {isArabic ? 'د' : 'min'}</span>
                          </div>
                        </div>

                        {/* Customer Info (hidden if cuisinier) */}
                        {!isCook ? (
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {order.customerName}
                              </span>
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="text-amber-700 dark:text-orange-400 hover:underline flex items-center gap-1 text-[11px] font-mono font-semibold"
                              >
                                <Phone className="w-3 h-3" />
                                <span dir="ltr">{order.customerPhone}</span>
                              </a>
                            </div>

                            {order.deliveryAddress && (
                              <div className="space-y-1">
                                <div className="flex items-start gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                                  <MapPin className="w-3 h-3 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">
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
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-400 hover:underline font-bold bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/20"
                                  >
                                    <Navigation className="w-2.5 h-2.5" />
                                    <span>{isArabic ? 'خرائط GPS' : 'GPS Google Maps'}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-75" />
                                  </a>
                                )}
                              </div>
                            )}

                            {order.pickupTimeSlot && (
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                {isArabic ? 'موعد الاستلام :' : 'Créneau :'} {order.pickupTimeSlot}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Simplified view for Cook: Big item tags */
                          <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                            {isArabic ? `طلب ${order.orderNumber}` : `Commande #${order.orderNumber.replace('#', '')}`}
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="bg-zinc-50 dark:bg-zinc-950/70 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80 space-y-1 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-baseline text-zinc-800 dark:text-zinc-200">
                              <span className="font-bold">
                                <span className="text-amber-700 dark:text-amber-400 text-sm">{it.quantity}x</span> {isArabic ? it.nameAr : it.nameFr}
                              </span>
                              {!isCook && (
                                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-mono">
                                  {(it.price * it.quantity).toLocaleString()} {isArabic ? 'دج' : 'DA'}
                                </span>
                              )}
                            </div>
                          ))}

                          {order.kitchenNotes && (
                            <div className="pt-1 mt-1 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-amber-900 dark:text-amber-300 font-semibold bg-amber-100/70 dark:bg-amber-950/30 p-1.5 rounded">
                              👉 {order.kitchenNotes}
                            </div>
                          )}
                        </div>

                        {/* Total price (hidden for cook) */}
                        {!isCook && (
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-zinc-500 dark:text-zinc-400">{isArabic ? 'المجموع :' : 'Total :'}</span>
                            <span className="font-extrabold text-zinc-900 dark:white text-sm">
                              {order.total.toLocaleString()} {isArabic ? 'دج' : 'DA'}
                            </span>
                          </div>
                        )}

                        {/* WhatsApp dispatch status badge */}
                        {order.sentToWhatsApp && (
                          <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-md font-semibold">
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>{isArabic ? '✓ أرسلت للمجموعة' : '✓ Envoyée au groupe'}</span>
                            </span>
                            {order.sentAt && (
                              <span className="font-mono text-[9px] opacity-80" dir="ltr">
                                {new Date(order.sentAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-1.5">
                          {/* Detail button */}
                          {onViewOrder && (
                            <button
                              onClick={() => onViewOrder(order)}
                              title={isArabic ? 'تفاصيل الطلب' : 'Détails de la commande'}
                              className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-transparent transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print ticket */}
                          <button
                            onClick={() => onPrintTicket(order)}
                            title={isArabic ? 'طباعة التذكرة' : 'Imprimer ticket cuisine 80mm'}
                            className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-250 dark:border-transparent transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp dispatch button */}
                          <button
                            onClick={() => setWhatsAppModalOrder(order)}
                            title={
                              order.sentToWhatsApp
                                ? (isArabic ? 'إعادة الإرسال إلى مجموعة واتساب' : 'Renvoyer au groupe WhatsApp')
                                : (isArabic ? 'إرسال إلى مجموعة واتساب' : 'Envoyer au groupe WhatsApp')
                            }
                            className={`p-2 rounded-lg border transition flex items-center justify-center ${
                              order.sentToWhatsApp
                                ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 shadow-sm'
                                : 'bg-zinc-100 hover:bg-emerald-50 dark:bg-zinc-800 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-zinc-250 dark:border-transparent hover:border-emerald-500/40'
                            }`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancel button */}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => onCancelOrder(order)}
                              title={isArabic ? 'إلغاء الطلب' : 'Annuler la commande'}
                              className="p-2 rounded-lg bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-950/60 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 border border-zinc-250 dark:border-transparent transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Advance Status Button */}
                          {next && (
                            <button
                              onClick={() => {
                                if (next === 'delivered') {
                                  setDeliverModalOrder(order);
                                } else {
                                  updateOrderStatus(order.id, next);
                                  if (next === 'preparing') {
                                    setWhatsAppModalOrder({ ...order, status: 'preparing' });
                                  }
                                }
                              }}
                              className="flex-1 h-8 px-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
                            >
                              <span>{getActionLabel(order)}</span>
                              <ArrowRight className={`w-3.5 h-3.5 ${isArabic ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Modal choix de paiement & livreur pour statut Livrée */}
      {deliverModalOrder && (
        <DeliverOrderModal
          order={deliverModalOrder}
          onClose={() => setDeliverModalOrder(null)}
          onConfirm={(orderId, paymentMethod, driverName, driverFee, note) => {
            updateOrderStatus(orderId, 'delivered', note, paymentMethod, driverName, driverFee);
          }}
        />
      )}

      {/* Modal aperçu WhatsApp dispatch */}
      {whatsAppModalOrder && (
        <WhatsAppPreviewModal
          order={whatsAppModalOrder}
          onClose={() => setWhatsAppModalOrder(null)}
        />
      )}
    </div>
  );
};
