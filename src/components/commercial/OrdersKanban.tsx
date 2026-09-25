import React from 'react';
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
} from 'lucide-react';

interface OrdersKanbanProps {
  onPrintTicket: (order: Order) => void;
  onCancelOrder: (order: Order) => void;
  filterType: 'all' | 'delivery' | 'pickup';
  searchQuery: string;
}

export const OrdersKanban: React.FC<OrdersKanbanProps> = ({
  onPrintTicket,
  onCancelOrder,
  filterType,
  searchQuery,
}) => {
  const { orders, updateOrderStatus, userRole, language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isCook = userRole === 'cuisinier';

  // Filter orders
  const filteredOrders = orders.filter(o => {
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
      accentColor: 'text-amber-400',
      bgColor: 'bg-amber-950/20',
      borderColor: 'border-amber-500/40',
    },
    {
      status: 'preparing',
      title: t.statusPreparing,
      accentColor: 'text-orange-400',
      bgColor: 'bg-orange-950/20',
      borderColor: 'border-orange-500/40',
    },
    {
      status: 'ready',
      title: t.statusReady,
      accentColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/20',
      borderColor: 'border-emerald-500/40',
    },
    {
      status: 'delivered',
      title: t.statusDelivered,
      accentColor: 'text-zinc-400',
      bgColor: 'bg-zinc-900/40',
      borderColor: 'border-zinc-800',
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

  return (
    <div className="flex-1 overflow-x-auto p-4 min-h-0">
      <div className="flex items-start gap-4 min-w-[1100px] h-full">
        {columns.map(col => {
          const colOrders = filteredOrders.filter(o => o.status === col.status);

          return (
            <div
              key={col.status}
              className={`flex-1 flex flex-col rounded-2xl border ${col.borderColor} ${col.bgColor} max-h-full overflow-hidden shadow-sm`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/80">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.status === 'pending' ? 'bg-amber-400 animate-ping' : col.status === 'preparing' ? 'bg-orange-500 animate-pulse' : col.status === 'ready' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${col.accentColor}`}>
                    {col.title}
                  </h3>
                </div>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
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
                        className={`bg-zinc-900/95 rounded-xl border p-3 space-y-2.5 shadow-md transition-all ${
                          isLate
                            ? 'border-red-500/80 ring-2 ring-red-500/20 shadow-red-950/30'
                            : order.status === 'pending'
                            ? 'border-amber-500/50 ring-1 ring-amber-500/20'
                            : 'border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {/* Top: Order number & Type badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-amber-400 font-mono">
                              {order.orderNumber}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                                order.type === 'delivery'
                                  ? 'bg-orange-950/70 text-orange-300 border border-orange-500/30'
                                  : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
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
                          </div>

                          {/* Time elapsed timer */}
                          <div
                            className={`flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isLate
                                ? 'bg-red-950 text-red-400 border border-red-500/40 animate-pulse'
                                : 'text-zinc-400 bg-zinc-800'
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
                              <span className="font-bold text-zinc-100 truncate">
                                {order.customerName}
                              </span>
                              <a
                                href={`tel:${order.customerPhone}`}
                                className="text-orange-400 hover:underline flex items-center gap-1 text-[11px] font-mono"
                              >
                                <Phone className="w-3 h-3" />
                                <span dir="ltr">{order.customerPhone}</span>
                              </a>
                            </div>

                            {order.deliveryAddress && (
                              <div className="flex items-start gap-1 text-[11px] text-zinc-400 leading-snug">
                                <MapPin className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                  {order.deliveryAddress.address}, {order.deliveryAddress.commune}
                                  {order.deliveryAddress.landmark ? ` (${order.deliveryAddress.landmark})` : ''}
                                </span>
                              </div>
                            )}

                            {order.pickupTimeSlot && (
                              <div className="text-[11px] text-emerald-400 font-medium">
                                {isArabic ? 'موعد الاستلام :' : 'Créneau :'} {order.pickupTimeSlot}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Simplified view for Cook: Big item tags */
                          <div className="text-xs font-bold text-zinc-400">
                            {isArabic ? `طلب ${order.orderNumber}` : `Commande #${order.orderNumber.replace('#', '')}`}
                          </div>
                        )}

                        {/* Order Items */}
                        <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80 space-y-1 text-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between items-baseline text-zinc-200">
                              <span className="font-bold">
                                <span className="text-amber-400 text-sm">{it.quantity}x</span> {isArabic ? it.nameAr : it.nameFr}
                              </span>
                              {!isCook && (
                                <span className="text-zinc-400 text-[10px] font-mono">
                                  {(it.price * it.quantity).toLocaleString()} {isArabic ? 'دج' : 'DA'}
                                </span>
                              )}
                            </div>
                          ))}

                          {order.kitchenNotes && (
                            <div className="pt-1 mt-1 border-t border-zinc-800 text-[11px] text-amber-300 font-semibold bg-amber-950/30 p-1.5 rounded">
                              👉 {order.kitchenNotes}
                            </div>
                          )}
                        </div>

                        {/* Total price (hidden for cook) */}
                        {!isCook && (
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <span className="text-zinc-400">{isArabic ? 'المجموع :' : 'Total :'}</span>
                            <span className="font-extrabold text-white text-sm">
                              {order.total.toLocaleString()} {isArabic ? 'دج' : 'DA'}
                            </span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                          {/* Print ticket */}
                          <button
                            onClick={() => onPrintTicket(order)}
                            title={isArabic ? 'طباعة التذكرة' : 'Imprimer ticket cuisine 80mm'}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Cancel button */}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button
                              onClick={() => onCancelOrder(order)}
                              title={isArabic ? 'إلغاء الطلب' : 'Annuler la commande'}
                              className="p-2 rounded-lg bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Advance Status Button */}
                          {next && (
                            <button
                              onClick={() => updateOrderStatus(order.id, next)}
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
  );
};
