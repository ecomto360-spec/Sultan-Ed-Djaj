import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Customer, Order } from '../../types';
import { Search, Phone, MapPin, ShoppingBag, DollarSign, Calendar, Eye, X } from 'lucide-react';

export const CommercialClients: React.FC = () => {
  const { customers, orders, language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.commune.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  const getCustomerOrders = (customer: Customer): Order[] => {
    return orders.filter(o => o.customerId === customer.id || o.customerPhone === customer.phone);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{t.clientsTitle}</h2>
          <p className="text-xs text-zinc-400">
            {t.clientsSubtitle}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 ${isArabic ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchClientPlaceholder}
            className={`w-full bg-zinc-900 rounded-xl border border-zinc-700/80 py-2 text-xs text-white placeholder:text-zinc-500 ${
              isArabic ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/60 shadow-inner">
        <table className={`w-full text-xs border-collapse ${isArabic ? 'text-right' : 'text-left'}`}>
          <thead className="sticky top-0 bg-[#16161a] border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="p-3">{t.clientNameCol}</th>
              <th className="p-3">{t.clientPhoneCol}</th>
              <th className="p-3">{t.clientAddressCol}</th>
              <th className="p-3 text-center">{t.clientOrdersCol}</th>
              <th className={`p-3 ${isArabic ? 'text-left' : 'text-right'}`}>{t.clientSpentCol}</th>
              <th className={`p-3 ${isArabic ? 'text-left' : 'text-right'}`}>{t.actionsCol}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500 italic">
                  {t.noClientsFound}
                </td>
              </tr>
            ) : (
              filteredCustomers.map(customer => {
                const customerOrdersList = getCustomerOrders(customer);
                const actualOrderCount = Math.max(customer.orderCount, customerOrdersList.length);
                const actualSpent = customerOrdersList.reduce((acc, o) => acc + (o.status !== 'cancelled' ? o.total : 0), 0) || customer.totalSpent;

                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-zinc-800/40 transition cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    {/* Name */}
                    <td className="p-3">
                      <div className="font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/30">
                          {customer.name.charAt(0)}
                        </div>
                        <span>{customer.name}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-3">
                      <a
                        href={`tel:${customer.phone}`}
                        onClick={e => e.stopPropagation()}
                        className="text-zinc-300 hover:text-orange-400 font-mono font-semibold flex items-center gap-1.5"
                      >
                        <Phone className="w-3 h-3 text-orange-400" />
                        <span dir="ltr">{customer.phone}</span>
                      </a>
                    </td>

                    {/* Address */}
                    <td className="p-3">
                      <div className="text-zinc-300 font-medium">{customer.commune}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-xs">
                        {customer.address} {customer.landmark ? `(${customer.landmark})` : ''}
                      </div>
                    </td>

                    {/* Orders count */}
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-200">
                        {actualOrderCount}
                      </span>
                    </td>

                    {/* Total spent */}
                    <td className={`p-3 font-mono font-bold text-amber-400 ${isArabic ? 'text-left' : 'text-right'}`}>
                      {actualSpent.toLocaleString()} {t.currency}
                    </td>

                    {/* Actions */}
                    <td className={`p-3 ${isArabic ? 'text-left' : 'text-right'}`}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedCustomer(customer);
                        }}
                        className={`px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center gap-1 ${
                          isArabic ? 'mr-auto' : 'ml-auto'
                        }`}
                      >
                        <Eye className="w-3 h-3 text-orange-400" />
                        <span>{isArabic ? 'التفاصيل' : 'Détails'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedCustomer.name}</h3>
                  <a
                    href={`tel:${selectedCustomer.phone}`}
                    className="text-xs text-orange-400 font-mono hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span dir="ltr">{selectedCustomer.phone}</span>
                  </a>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Address summary */}
            <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-700/60 space-y-1 text-xs">
              <span className="text-zinc-400 block font-semibold">{isArabic ? 'عنوان التوصيل المسجل :' : 'Adresse de livraison enregistrée :'}</span>
              <div className="text-zinc-200">
                {selectedCustomer.address}, {selectedCustomer.commune}
              </div>
              {selectedCustomer.landmark && (
                <div className="text-[11px] text-amber-300/80">
                  {isArabic ? 'نقطة دالة :' : 'Repère :'} {selectedCustomer.landmark}
                </div>
              )}
            </div>

            {/* Past orders list */}
            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              <h4 className="font-bold text-zinc-300">
                {isArabic ? `سجل الطلبات (${getCustomerOrders(selectedCustomer).length})` : `Historique des commandes (${getCustomerOrders(selectedCustomer).length})`}
              </h4>
              {getCustomerOrders(selectedCustomer).length === 0 ? (
                <p className="text-zinc-500 italic text-[11px]">{isArabic ? 'لا توجد طلبات مسجلة في هذه الجلسة.' : 'Aucune commande passée dans la session.'}</p>
              ) : (
                getCustomerOrders(selectedCustomer).map(ord => (
                  <div
                    key={ord.id}
                    className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-400 font-mono">{ord.orderNumber}</span>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-zinc-300 text-[11px]">
                      {ord.items.map(it => `${it.quantity}x ${isArabic ? it.nameAr : it.nameFr}`).join(', ')}
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-zinc-900 text-xs font-bold">
                      <span className="text-zinc-400">
                        {ord.type === 'delivery' ? t.typeDeliveryShort : t.typePickupShort}
                      </span>
                      <span className="text-white">{ord.total.toLocaleString()} {t.currency}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={`pt-2 border-t border-zinc-800 ${isArabic ? 'text-left' : 'text-right'}`}>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
              >
                {isArabic ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
