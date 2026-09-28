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
import {
  Columns3,
  Table,
  PlusCircle,
  Search,
  Filter,
  ShoppingBag,
  Package,
  TrendingUp,
  Menu,
} from 'lucide-react';

export const CommercialBackOffice: React.FC = () => {
  const {
    backOfficeTab,
    setBackOfficeTab,
    cancelOrder,
    language,
    userRole,
    unreadAlertCount,
    activeStockAlertsCount,
    toggleMobileSidebar,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isCook = userRole === 'cuisinier';
  const isCashier = userRole === 'caissier';
  const isManager = userRole === 'gerant';

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
    <div className="relative flex-1 flex w-full h-[calc(100dvh-48px)] sm:h-[calc(100dvh-52px)] overflow-hidden bg-[#0d0d0f] text-zinc-100">
      {/* Sidebar (Desktop static & Mobile drawer) */}
      <CommercialSidebar onOpenManualOrder={() => setIsManualOrderOpen(true)} />

      {/* Main Back-Office Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#121215] pb-16 lg:pb-0">
        {/* Top KPIs & Roles stats bar */}
        <CommercialTopStats />

        {/* Dynamic Section Content */}
        {backOfficeTab === 'orders' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Orders Sub-Header: Kanban vs Table switch & filters */}
            <div className="p-2.5 sm:p-3 bg-zinc-900/70 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs font-bold text-zinc-300">{t.ordersDisplay}</span>
                <div className="flex items-center bg-zinc-800 p-0.5 rounded-xl border border-zinc-700">
                  <button
                    onClick={() => setOrdersViewMode('kanban')}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
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
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition ${
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
                <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 ${isArabic ? 'right-2.5' : 'left-2.5'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t.filterOrdersPlaceholder}
                      className={`bg-zinc-800 rounded-lg py-1 text-xs text-white placeholder:text-zinc-500 border border-zinc-700 w-full sm:w-40 ${
                        isArabic ? 'pr-8 pl-2.5' : 'pl-8 pr-2.5'
                      }`}
                    />
                  </div>

                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value as any)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-200 shrink-0"
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

      {/* Mobile / Tablet Bottom Navigation Bar (Screens < lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#131317]/95 border-t border-zinc-800 px-3 py-1.5 flex items-center justify-between shadow-2xl backdrop-blur-md">
        {/* Commandes */}
        <button
          onClick={() => setBackOfficeTab('orders')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold transition relative ${
            backOfficeTab === 'orders' ? 'text-orange-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <span>{t.tabOrders}</span>
        </button>

        {/* Stock (Gerant & Cuisinier) */}
        {!isCashier && (
          <button
            onClick={() => setBackOfficeTab('stock')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold transition relative ${
              backOfficeTab === 'stock' ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Package className="w-5 h-5" />
              {activeStockAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-red-500 text-[8px] text-white rounded-full font-black">
                  {activeStockAlertsCount}
                </span>
              )}
            </div>
            <span>{t.tabStock}</span>
          </button>
        )}

        {/* Quick Add Order Floating Button (Center) */}
        {!isCook && (
          <button
            onClick={() => setIsManualOrderOpen(true)}
            className="flex flex-col items-center justify-center -mt-5 w-11 h-11 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-950/70 active:scale-95 transition ring-2 ring-zinc-900"
            title={t.addManualOrder}
            aria-label={t.addManualOrder}
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        )}

        {/* Recettes (Gerant only) */}
        {isManager && (
          <button
            onClick={() => setBackOfficeTab('revenue')}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold transition relative ${
              backOfficeTab === 'revenue' ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>{t.tabRevenue}</span>
          </button>
        )}

        {/* Menu (Opens Full Drawer) */}
        <button
          onClick={toggleMobileSidebar}
          className="flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>

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
