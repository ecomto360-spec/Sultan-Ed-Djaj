import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { Order } from '../../types';
import { CommercialSidebar } from './CommercialSidebar';
import { CommercialTopStats } from './CommercialTopStats';
import { OrdersKanban } from './OrdersKanban';
import { OrdersTable } from './OrdersTable';
import { CommercialCatalog } from './CommercialCatalog';
import { CommercialClients } from './CommercialClients';
import { CommercialSettings } from './CommercialSettings';
import { KitchenReceiptPrintModal } from './KitchenReceiptPrintModal';
import { CancelOrderStockModal } from './CancelOrderStockModal';
import { ManualOrderModal } from './ManualOrderModal';
import { OrderDetailModal } from './OrderDetailModal';
import { StockModule } from './stock/StockModule';
import { RevenueModule } from './revenue/RevenueModule';
import { Columns3, Table, PlusCircle, Search, Filter } from 'lucide-react';

export const CommercialBackOffice: React.FC = () => {
  const { backOfficeTab, cancelOrder, language, userRole } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // Orders sub-view: kanban vs table
  const [ordersViewMode, setOrdersViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState<Order | null>(null);
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [viewDetailOrder, setViewDetailOrder] = useState<Order | null>(null);

  return (
    <div className="flex-1 flex w-full h-[calc(100vh-50px)] overflow-hidden bg-[#0d0d0f] text-zinc-100">
      {/* Sidebar */}
      <CommercialSidebar onOpenManualOrder={() => setIsManualOrderOpen(true)} />

      {/* Main Back-Office Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#121215]">
        {/* Top KPIs & Roles stats bar */}
        <CommercialTopStats />

        {/* Dynamic Section Content */}
        {backOfficeTab === 'orders' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Orders Sub-Header: Kanban vs Table switch & filters */}
            <div className="p-3 bg-zinc-900/70 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-300">{t.ordersDisplay}</span>
                <div className="flex items-center bg-zinc-800 p-0.5 rounded-xl border border-zinc-700">
                  <button
                    onClick={() => setOrdersViewMode('kanban')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                      ordersViewMode === 'kanban'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Columns3 className="w-3.5 h-3.5" />
                    <span>{t.modeKanban}</span>
                  </button>

                  <button
                    onClick={() => setOrdersViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                      ordersViewMode === 'table'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>{t.modeTable}</span>
                  </button>
                </div>
              </div>

              {/* Extra filter in kanban view */}
              {ordersViewMode === 'kanban' && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 ${isArabic ? 'right-2.5' : 'left-2.5'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t.filterOrdersPlaceholder}
                      className={`bg-zinc-800 rounded-lg py-1 text-xs text-white placeholder:text-zinc-500 border border-zinc-700 w-40 ${
                        isArabic ? 'pr-8 pl-2.5' : 'pl-8 pr-2.5'
                      }`}
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as any)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200"
                  >
                    <option value="all">{t.filterAllTypes}</option>
                    <option value="delivery">{t.deliveriesStat}</option>
                    <option value="pickup">{t.pickupsStat}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Kanban or Table View */}
            {ordersViewMode === 'kanban' ? (
              <OrdersKanban
                onPrintTicket={ord => setPrintOrder(ord)}
                onCancelOrder={ord => setCancelOrderTarget(ord)}
                filterType={filterType}
                searchQuery={searchQuery}
              />
            ) : (
              <OrdersTable
                onPrintTicket={ord => setPrintOrder(ord)}
                onCancelOrder={ord => setCancelOrderTarget(ord)}
                onViewOrder={ord => setViewDetailOrder(ord)}
              />
            )}
          </div>
        )}

        {backOfficeTab === 'catalog' && <CommercialCatalog />}
        {backOfficeTab === 'clients' && <CommercialClients />}
        {backOfficeTab === 'settings' && <CommercialSettings />}
        {backOfficeTab === 'stock' && <StockModule />}
        {backOfficeTab === 'revenue' && <RevenueModule />}
      </main>

      {/* Modals */}
      {printOrder && (
        <KitchenReceiptPrintModal
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}

      {cancelOrderTarget && (
        <CancelOrderStockModal
          order={cancelOrderTarget}
          onClose={() => setCancelOrderTarget(null)}
        />
      )}

      {isManualOrderOpen && (
        <ManualOrderModal
          onClose={() => setIsManualOrderOpen(false)}
        />
      )}

      {viewDetailOrder && (
        <OrderDetailModal
          order={viewDetailOrder}
          onClose={() => setViewDetailOrder(null)}
          onPrint={ord => {
            setViewDetailOrder(null);
            setPrintOrder(ord);
          }}
        />
      )}
    </div>
  );
};
