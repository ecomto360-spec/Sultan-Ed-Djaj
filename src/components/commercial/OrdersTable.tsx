import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  Search,
  Printer,
  XCircle,
  ArrowRight,
  Phone,
  Clock,
  Motorbike,
  Store,
  Eye,
  Calendar,
  MessageCircle,
  Check,
} from 'lucide-react';
import { getAlgiersDateString } from '../../services/dayService';
import { DeliverOrderModal } from './DeliverOrderModal';
import { WhatsAppPreviewModal } from './WhatsAppPreviewModal';

interface OrdersTableProps {
  onPrintTicket: (order: Order) => void;
  onCancelOrder: (order: Order) => void;
  onViewOrder: (order: Order) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  onPrintTicket,
  onCancelOrder,
  onViewOrder,
}) => {
  const { orders, days, currentDay, updateOrderStatus, language, userRole } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isCook = userRole === 'cuisinier';

  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('current');
  const [deliverModalOrder, setDeliverModalOrder] = useState<Order | null>(null);
  const [whatsAppModalOrder, setWhatsAppModalOrder] = useState<Order | null>(null);

  // Orders matching the selected day/date filter
  const dayFilteredOrders = orders.filter(o => {
    if (selectedDayFilter === 'all') return true;
    const isOngoing = o.status === 'pending' || o.status === 'preparing' || o.status === 'ready';
    if (selectedDayFilter === 'current') {
      if (isOngoing) return true;
      if (!currentDay) return false;
      return (
        o.dayId === currentDay.id ||
        (!o.dayId && getAlgiersDateString(o.createdAt) === currentDay.date)
      );
    }
    const targetDay = days.find(d => d.id === selectedDayFilter);
    if (!targetDay) return true;
    return (
      o.dayId === targetDay.id ||
      (!o.dayId && getAlgiersDateString(o.createdAt) === targetDay.date)
    );
  });

  // Counts for tabs (scoped to selected day filter)
  const countAll = dayFilteredOrders.length;
  const countPending = dayFilteredOrders.filter(o => o.status === 'pending').length;
  const countPreparing = dayFilteredOrders.filter(o => o.status === 'preparing').length;
  const countReady = dayFilteredOrders.filter(o => o.status === 'ready').length;
  const countDelivered = dayFilteredOrders.filter(o => o.status === 'delivered').length;
  const countCancelled = dayFilteredOrders.filter(o => o.status === 'cancelled').length;

  const tabs: { key: 'all' | OrderStatus; label: string; count: number }[] = [
    { key: 'all', label: t.tabAll, count: countAll },
    { key: 'pending', label: t.statusPending, count: countPending },
    { key: 'preparing', label: t.statusPreparing, count: countPreparing },
    { key: 'ready', label: t.statusReady, count: countReady },
    { key: 'delivered', label: t.statusDelivered, count: countDelivered },
    { key: 'cancelled', label: t.statusCancelled, count: countCancelled },
  ];

  const filteredOrders = dayFilteredOrders.filter(o => {
    const matchTab = activeTab === 'all' || o.status === activeTab;
    const matchType = filterType === 'all' || o.type === filterType;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q);
    return matchTab && matchType && matchSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 animate-pulse">
            {t.statusPending}
          </span>
        );
      case 'preparing':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-500/40">
            {t.statusPreparing}
          </span>
        );
      case 'ready':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
            {t.statusReady}
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            {t.statusDelivered}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-500/40">
            {t.statusCancelled}
          </span>
        );
    }
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    if (current === 'pending') return 'preparing';
    if (current === 'preparing') return 'ready';
    if (current === 'ready') return 'delivered';
    return null;
  };

  const getElapsed = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return isArabic ? 'الآن' : 'À l\'instant';
    if (mins < 60) return isArabic ? `منذ ${mins} د` : `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    return isArabic ? `منذ ${hours} سا و${mins % 60} د` : `Il y a ${hours}h ${mins % 60}m`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
      {/* Top Filter Tabs: WooCommerce style counters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-zinc-250 dark:border-zinc-800 transition-colors">
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => setActiveTab(tb.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === tb.key
                ? 'bg-white dark:bg-zinc-800 text-amber-700 dark:text-orange-400 border-b-2 border-amber-600 dark:border-orange-500 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <span>{tb.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tb.key
                  ? 'bg-amber-100 dark:bg-orange-500/20 text-amber-800 dark:text-orange-300'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
              }`}
            >
              {tb.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isArabic ? 'البحث برقم الطلب، الزبون، الهاتف...' : 'Rechercher par N° commande, client, téléphone...'}
            className={`w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700/80 ${isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400" />
            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{isArabic ? 'اليوم :' : 'Journée :'}</span>
            <select
              value={selectedDayFilter}
              onChange={e => setSelectedDayFilter(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="current">
                {currentDay
                  ? `${isArabic ? 'اليوم الحالي' : 'Journée en cours'} (${currentDay.date})`
                  : isArabic
                  ? 'اليوم الحالي (مغلق)'
                  : 'Journée en cours (Fermée)'}
              </option>
              <option value="all">
                {isArabic ? 'جميع الأيام (السجل الكامل)' : 'Toutes les journées'}
              </option>
              {days.map(d => (
                <option key={d.id} value={d.id}>
                  {d.label || d.date} ({d.nbCommandes} cmd • {d.status === 'open' ? 'Ouverte' : 'Clôturée'})
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{isArabic ? 'النوع :' : 'Type :'}</span>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="all">{isArabic ? 'جميع الأنواع' : 'Tous les types'}</option>
            <option value="delivery">{isArabic ? 'توصيل منزلي' : 'Livraison à domicile'}</option>
            <option value="pickup">{isArabic ? 'استلام من المطعم' : 'Retrait au comptoir'}</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm transition-colors">
        <table className={`w-full min-w-[680px] ${isArabic ? 'text-right' : 'text-left'} text-xs border-collapse`}>
          <thead className="sticky top-0 bg-zinc-50 dark:bg-[#16161a] border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="p-3">{isArabic ? 'رقم الطلب' : 'N° Commande'}</th>
              <th className="p-3">{isArabic ? 'الزبون والهاتف' : 'Client & Téléphone'}</th>
              <th className="p-3">{isArabic ? 'الوقت / التاريخ' : 'Date / Délai'}</th>
              <th className="p-3">{isArabic ? 'النوع' : 'Mode'}</th>
              <th className="p-3">{isArabic ? 'الحالة' : 'Statut'}</th>
              {!isCook && <th className="p-3">{isArabic ? 'المجموع' : 'Total'}</th>}
              <th className={`p-3 ${isArabic ? 'text-left' : 'text-right'}`}>{isArabic ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-zinc-500 italic">
                  {isArabic ? 'لا توجد طلبات تطابق معايير البحث.' : 'Aucune commande ne correspond aux critères.'}
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const next = getNextStatus(order.status);
                const elapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                const isLate = order.status === 'pending' && elapsedMins >= 15;

                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition ${
                      isLate ? 'bg-red-50 dark:bg-red-950/20' : ''
                    }`}
                  >
                    {/* Order Number & Badges */}
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          onClick={() => onViewOrder(order)}
                          className="hover:underline flex items-center gap-1 font-mono font-bold text-amber-700 dark:text-amber-400"
                        >
                          <span>{order.orderNumber}</span>
                          <Eye className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                        </button>
                        <div className="flex items-center gap-1 flex-wrap">
                          {order.source && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                              {order.source === 'phone'
                                ? (isArabic ? '📞 هاتف' : '📞 Tél')
                                : order.source === 'counter'
                                ? (isArabic ? '🏪 منضدة' : '🏪 Comptoir')
                                : order.source === 'whatsapp'
                                ? '💬 WhatsApp'
                                : '📱 App'}
                            </span>
                          )}
                          {order.sentToWhatsApp && (
                            <span
                              title={`Envoyée au groupe ${order.sentAt ? new Date(order.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}`}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                            >
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                              <span>{isArabic ? 'واتساب' : 'WhatsApp'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="p-3">
                      <div className="font-bold text-zinc-900 dark:text-white">{order.customerName}</div>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-zinc-600 dark:text-zinc-400 hover:text-amber-700 dark:hover:text-orange-400 flex items-center gap-1 text-[11px] font-mono font-semibold"
                      >
                        <Phone className="w-3 h-3 text-amber-600 dark:text-orange-400" />
                        <span dir="ltr">{order.customerPhone}</span>
                      </a>
                    </td>

                    {/* Date */}
                    <td className="p-3">
                      <div className="text-zinc-700 dark:text-zinc-300 font-medium">{getElapsed(order.createdAt)}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Mode */}
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.type === 'delivery'
                            ? 'bg-orange-50 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30'
                            : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                        }`}
                      >
                        {order.type === 'delivery' ? <Motorbike className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                        <span>
                          {order.type === 'delivery'
                            ? (isArabic ? 'توصيل' : 'Livraison')
                            : (isArabic ? 'استلام' : 'Comptoir')}
                        </span>
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3">{getStatusBadge(order.status)}</td>

                    {/* Total */}
                    {!isCook && (
                      <td className="p-3 font-mono font-bold text-zinc-900 dark:text-white">
                        {order.total.toLocaleString()} {isArabic ? 'دج' : 'DA'}
                      </td>
                    )}

                    {/* Actions */}
                    <td className={`p-3 ${isArabic ? 'text-left' : 'text-right'}`}>
                      <div className={`flex items-center ${isArabic ? 'justify-start' : 'justify-end'} gap-1.5`}>
                        {/* Print */}
                        <button
                          onClick={() => onPrintTicket(order)}
                          title={isArabic ? 'طباعة التذكرة' : 'Imprimer ticket'}
                          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-250 dark:border-transparent transition"
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
                          className={`p-1.5 rounded-lg border transition ${
                            order.sentToWhatsApp
                              ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                              : 'bg-zinc-100 hover:bg-emerald-50 dark:bg-zinc-800 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-zinc-250 dark:border-transparent hover:border-emerald-500/40'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* Advance button */}
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
                            className="px-2 py-1 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition"
                          >
                            <span>
                              {order.status === 'pending'
                                ? t.actionAccept
                                : order.status === 'preparing'
                                ? t.actionReady
                                : t.actionDeliver}
                            </span>
                            <ArrowRight className={`w-3 h-3 ${isArabic ? 'rotate-180' : ''}`} />
                          </button>
                        )}

                        {/* Cancel */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => onCancelOrder(order)}
                            title={isArabic ? 'إلغاء' : 'Annuler'}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-red-100 dark:bg-zinc-800 dark:hover:bg-red-950/80 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 border border-zinc-250 dark:border-transparent transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
