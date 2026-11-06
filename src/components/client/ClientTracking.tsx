import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { OrderTrackingView } from './OrderTrackingView';
import {
  Clock,
  Receipt,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';

// « Mes commandes » : suivi de la commande en cours (timeline temps réel) en
// haut, puis l'historique des commandes de cet appareil (device_id) dessous.
export const ClientTracking: React.FC = () => {
  const {
    clientActiveOrder,
    orders,
    setClientActiveOrder,
    setClientTab,
    language,
    clearClientOrdersUnseen,
  } = useApp();

  const isArabic = language === 'ar';

  useEffect(() => {
    clearClientOrdersUnseen();
  }, [clearClientOrdersUnseen]);

  const order = clientActiveOrder || orders[0] || null;
  const isActive = (o: Order) => o.status !== 'delivered' && o.status !== 'cancelled';
  const historyOrders = orders.filter(o => o.id !== order?.id && !isActive(o)).slice(0, 20);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Clock className="w-12 h-12 text-zinc-400 dark:text-zinc-500" />
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
          {isArabic ? 'لا توجد طلبات بعد' : 'Aucune commande pour le moment'}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed">
          {isArabic
            ? 'ستجد هنا متابعة طلباتك الحالية وسجل طلباتك السابقة على هذا الجهاز.'
            : 'Retrouvez ici le suivi de vos commandes en cours et votre historique sur cet appareil.'}
        </p>
        <button
          onClick={() => setClientTab('menu')}
          className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
        >
          {isArabic ? 'استكشف القائمة' : 'Explorer le menu'}
        </button>
      </div>
    );
  }

  const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(isArabic ? 'ar-DZ' : 'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 pb-24 space-y-4">
      {/* Commande en cours */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          {isArabic ? 'الطلب الحالي' : 'Commande en cours'}
        </h2>
        {isActive(order) && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </div>

      <OrderTrackingView order={order} />

      {/* Historique */}
      {historyOrders.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-500" />
            {isArabic ? 'سجل الطلبات' : 'Historique'}
          </h3>
          <div className="space-y-2">
            {historyOrders.map(o => (
              <button
                key={o.id}
                onClick={() => setClientActiveOrder(o)}
                className="w-full flex items-center justify-between bg-white dark:bg-[#16161a] p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs transition active:scale-[0.98] text-start"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-amber-700 dark:text-orange-400 font-mono">
                      {o.orderNumber}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {formatDateTime(o.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    <ShoppingBag className="w-3 h-3" />
                    <span>
                      {o.items.reduce((acc, item) => acc + item.quantity, 0)} {isArabic ? 'منتجات' : 'articles'}
                    </span>
                    <span className="mx-1">·</span>
                    <span className="font-mono">{o.total.toLocaleString()} {isArabic ? 'دج' : 'DA'}</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-zinc-400 shrink-0 ${isArabic ? 'rotate-180' : ''}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
