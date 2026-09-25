import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../i18n/translations';
import {
  StockItem,
  StockCategory,
  StockMovementType,
  UserRole,
  InventoryDiscrepancy,
} from '../../../types';
import {
  calculateSpecialChickenAutonomy,
  generateSupplierPurchaseList,
  generateWhatsAppOrderMessage,
} from '../../../services/stockService';
import { StockItemEditModal } from './StockItemEditModal';
import { QuickRestockModal } from './QuickRestockModal';
import { DeclareWasteModal } from './DeclareWasteModal';
import {
  Package,
  AlertTriangle,
  History,
  ShoppingCart,
  ClipboardList,
  Plus,
  PlusCircle,
  Flame,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
  BellRing,
  Edit2,
  Trash2,
  Filter,
} from 'lucide-react';

type StockSubTab = 'articles' | 'movements' | 'purchases' | 'inventory';

export const StockModule: React.FC = () => {
  const {
    stockItems,
    deleteStockItem,
    stockMovements,
    orders,
    compositions,
    userRole,
    language,
    reportLowStock,
    applyInventoryDiscrepancies,
    receivePurchaseGroup,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';
  const isCook = userRole === 'cuisinier';

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<StockSubTab>('articles');

  // Modals
  const [editingItem, setEditingItem] = useState<StockItem | null | undefined>(undefined);
  const [restockItem, setRestockItem] = useState<StockItem | null | undefined>(undefined);
  const [wasteItem, setWasteItem] = useState<StockItem | null | undefined>(undefined);

  // Articles filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Movements filters
  const [movTypeFilter, setMovTypeFilter] = useState<string>('all');
  const [movAuthorFilter, setMovAuthorFilter] = useState<string>('all');
  const [movSearch, setMovSearch] = useState<string>('');

  // Inventory count state
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});
  const [inventoryAppliedSuccess, setInventoryAppliedSuccess] = useState<boolean>(false);

  // WhatsApp copy feedback state
  const [copiedSupplier, setCopiedSupplier] = useState<string | null>(null);

  // Autonomy calculations
  const chickenAutonomy = useMemo(() => {
    return calculateSpecialChickenAutonomy(stockItems, orders);
  }, [stockItems, orders]);

  // Purchases list
  const purchaseGroups = useMemo(() => {
    return generateSupplierPurchaseList(stockItems);
  }, [stockItems]);

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return stockItems.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.nameFr.toLowerCase().includes(q) || item.nameAr.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [stockItems, selectedCategory, searchQuery]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return stockMovements.filter(mov => {
      const matchType = movTypeFilter === 'all' || mov.type === movTypeFilter;
      const matchAuthor = movAuthorFilter === 'all' || mov.authorRole === movAuthorFilter;
      const q = movSearch.toLowerCase();
      const matchSearch =
        mov.stockItemName.toLowerCase().includes(q) ||
        mov.reason.toLowerCase().includes(q) ||
        (mov.orderId && mov.orderId.toLowerCase().includes(q));
      return matchType && matchAuthor && matchSearch;
    });
  }, [stockMovements, movTypeFilter, movAuthorFilter, movSearch]);

  // Live Inventory discrepancies
  const inventoryDiscrepancies: InventoryDiscrepancy[] = useMemo(() => {
    return stockItems.map(item => {
      const counted =
        inventoryCounts[item.id] !== undefined ? inventoryCounts[item.id] : item.currentStock;
      const diff = Math.round((counted - item.currentStock) * 100) / 100;
      return {
        stockItemId: item.id,
        nameFr: item.nameFr,
        nameAr: item.nameAr,
        unit: item.unit,
        theoreticalStock: item.currentStock,
        countedStock: counted,
        difference: diff,
        costDifferenceDA: Math.round(diff * item.unitCostDA),
      };
    });
  }, [stockItems, inventoryCounts]);

  const handleApplyInventory = () => {
    applyInventoryDiscrepancies(inventoryDiscrepancies, userRole);
    setInventoryAppliedSuccess(true);
    setTimeout(() => setInventoryAppliedSuccess(false), 3000);
  };

  const handleCopyWhatsApp = (supplierName: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSupplier(supplierName);
    setTimeout(() => setCopiedSupplier(null), 2500);
  };

  const categoriesList: { id: string; labelFr: string; labelAr: string }[] = [
    { id: 'all', labelFr: 'Tous les rayons', labelAr: 'جميع الأقسام' },
    { id: 'poulet', labelFr: 'Poulet & Viandes', labelAr: 'دجاج ولحوم' },
    { id: 'epices_sauces', labelFr: 'Épices & Sauces', labelAr: 'توابل وصلصات' },
    { id: 'boissons', labelFr: 'Boissons', labelAr: 'مشروبات' },
    { id: 'emballages', labelFr: 'Emballages', labelAr: 'تغليف وأكياس' },
    { id: 'combustible', labelFr: 'Charbon & Gaz', labelAr: 'فحم وغاز' },
    { id: 'autre', labelFr: 'Autres', labelAr: 'مواد أخرى' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0c0e]">
      {/* Chicken Autonomy Headline Banner */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/40">
        <div
          className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
            chickenAutonomy.statusColor === 'red'
              ? 'bg-red-950/20 border-red-500/40 text-red-300'
              : chickenAutonomy.statusColor === 'orange'
              ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
              : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl border ${
                chickenAutonomy.statusColor === 'red'
                  ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                  : chickenAutonomy.statusColor === 'orange'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              🍗
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {t.stockChickenAutonomy}
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    chickenAutonomy.statusColor === 'red'
                      ? 'bg-red-500 text-white animate-pulse'
                      : chickenAutonomy.statusColor === 'orange'
                      ? 'bg-amber-500 text-black'
                      : 'bg-emerald-500 text-black'
                  }`}
                >
                  {chickenAutonomy.statusColor === 'red'
                    ? t.stockStatusCritical
                    : chickenAutonomy.statusColor === 'orange'
                    ? t.stockStatusAlert
                    : t.stockStatusOk}
                </span>
              </div>
              <div className="text-lg font-black text-white flex items-baseline gap-2 mt-0.5">
                <span>
                  ≈ {chickenAutonomy.chickenPieces} {t.stockChickenPiecesRemaining}
                </span>
                <span className="text-sm font-semibold text-zinc-400">
                  (≈ {chickenAutonomy.hoursRemaining}h {chickenAutonomy.minutesRemaining}min {t.stockChickenHoursRemaining})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => setRestockItem(stockItems.find(s => s.id === 'stk-poulet') || null)}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-orange-950/40 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.stockQuickRestock}</span>
            </button>
            <button
              onClick={() => setWasteItem(stockItems.find(s => s.id === 'stk-poulet') || null)}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <Flame className="w-4 h-4" />
              <span>{t.stockDeclareLoss}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="px-5 pt-3 border-b border-zinc-800 flex items-center justify-between bg-[#111114]">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveSubTab('articles')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'articles'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t.stockTabArticles}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-800 text-zinc-300">
              {stockItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('movements')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'movements'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t.stockTabMovements}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('purchases')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'purchases'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t.stockTabPurchases}</span>
            {purchaseGroups.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-extrabold">
                {purchaseGroups.reduce((acc, g) => acc + g.items.length, 0)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'inventory'
                ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>{t.stockTabInventory}</span>
          </button>
        </div>

        {/* Action Button: Add Item (Gérant) or Quick Declare */}
        {!isCook && activeSubTab === 'articles' && (
          <button
            onClick={() => setEditingItem(null)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 mb-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-md shadow-orange-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>{t.stockAddItem}</span>
          </button>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* TAB 1: ARTICLES */}
        {activeSubTab === 'articles' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                {categoriesList.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat.id
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {isArabic ? cat.labelAr : cat.labelFr}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? 'بحث عن مادة...' : 'Rechercher un article...'}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Articles Table */}
            <div className="bg-[#141418] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-4">{t.stockItemName}</th>
                      <th className="py-3 px-4">{t.stockCurrent}</th>
                      <th className="py-3 px-4">{t.stockAlert} / {t.stockCritical}</th>
                      <th className="py-3 px-4">{t.stockAutonomyRemaining}</th>
                      {!isCook && <th className="py-3 px-4">{t.stockUnitCost}</th>}
                      {!isCook && <th className="py-3 px-4">{isArabic ? 'المورّد' : 'Fournisseur'}</th>}
                      <th className="py-3 px-4 text-right">{isArabic ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {filteredArticles.map(item => {
                      const isCritical = item.currentStock <= item.criticalThreshold;
                      const isAlert = !isCritical && item.currentStock <= item.alertThreshold;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-zinc-800/30 transition group"
                        >
                          {/* Name & Category */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">
                              {isArabic ? item.nameAr : item.nameFr}
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                              <span>{item.location || 'Cuisine'}</span>
                              <span>•</span>
                              <span>{item.category}</span>
                            </div>
                          </td>

                          {/* Current Stock */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-base font-extrabold font-mono ${
                                  isCritical
                                    ? 'text-red-400'
                                    : isAlert
                                    ? 'text-amber-400'
                                    : 'text-white'
                                }`}
                              >
                                {item.currentStock}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-medium">
                                {item.unit}
                              </span>
                            </div>
                          </td>

                          {/* Thresholds */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-mono">
                                {item.alertThreshold}
                              </span>
                              <span className="text-zinc-600">/</span>
                              <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 font-mono">
                                {item.criticalThreshold}
                              </span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{t.stockStatusCritical}</span>
                              </span>
                            ) : isAlert ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{t.stockStatusAlert}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{t.stockStatusOk}</span>
                              </span>
                            )}
                          </td>

                          {/* Unit cost (Gerant only) */}
                          {!isCook && (
                            <td className="py-3.5 px-4 font-mono font-semibold text-zinc-300">
                              {item.unitCostDA} DA
                            </td>
                          )}

                          {/* Supplier (Gerant only) */}
                          {!isCook && (
                            <td className="py-3.5 px-4 text-[11px] text-zinc-400">
                              {item.supplierName ? (
                                <div>
                                  <div className="font-semibold text-zinc-200">{item.supplierName}</div>
                                  <div className="text-[10px] text-zinc-500">{item.supplierPhone}</div>
                                </div>
                              ) : (
                                <span className="text-zinc-600">—</span>
                              )}
                            </td>
                          )}

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick restock button */}
                              <button
                                onClick={() => setRestockItem(item)}
                                title={t.stockQuickRestock}
                                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>

                              {/* Declare waste */}
                              <button
                                onClick={() => setWasteItem(item)}
                                title={t.stockDeclareLoss}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition"
                              >
                                <Flame className="w-4 h-4" />
                              </button>

                              {/* Cook: Report low stock to manager */}
                              {isCook && (
                                <button
                                  onClick={() => reportLowStock(item.id)}
                                  title={t.stockSignalLowStock}
                                  className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[11px] font-bold flex items-center gap-1 transition"
                                >
                                  <BellRing className="w-3.5 h-3.5" />
                                  <span>{t.stockSignalLowStock}</span>
                                </button>
                              )}

                              {/* Manager: Edit & Delete */}
                              {!isCook && (
                                <>
                                  <button
                                    onClick={() => setEditingItem(item)}
                                    title={isArabic ? 'تعديل' : 'Modifier'}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(isArabic ? 'حذف هذه المادة ؟' : 'Supprimer cet article ?')) {
                                        deleteStockItem(item.id);
                                      }
                                    }}
                                    title={isArabic ? 'حذف' : 'Supprimer'}
                                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MOVEMENTS JOURNAL */}
        {activeSubTab === 'movements' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141418] p-3 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
                {/* Movement Type Filter */}
                <select
                  value={movTypeFilter}
                  onChange={e => setMovTypeFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="all">{isArabic ? 'جميع أنواع الحركات' : 'Tous les types'}</option>
                  <option value="in">{t.stockMovIn}</option>
                  <option value="out_auto">{t.stockMovOutAuto}</option>
                  <option value="out_manual">{t.stockMovOutManual}</option>
                  <option value="waste">{t.stockMovWaste}</option>
                  <option value="adjustment">{t.stockMovAdjustment}</option>
                </select>

                {/* Author Filter */}
                <select
                  value={movAuthorFilter}
                  onChange={e => setMovAuthorFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="all">{isArabic ? 'جميع المستخدمين' : 'Tous les auteurs'}</option>
                  <option value="gerant">{t.roleGerant}</option>
                  <option value="cuisinier">{t.roleCuisinier}</option>
                  <option value="caissier">{t.roleCaissier}</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative w-64">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={movSearch}
                  onChange={e => setMovSearch(e.target.value)}
                  placeholder={isArabic ? 'بحث في السجل...' : 'Recherche dans le journal...'}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Movements Table */}
            <div className="bg-[#141418] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-4">{t.stockMovementDate}</th>
                      <th className="py-3 px-4">{t.stockItemName}</th>
                      <th className="py-3 px-4">{t.stockMovementType}</th>
                      <th className="py-3 px-4">{t.stockMovementQty}</th>
                      <th className="py-3 px-4">{t.stockMovementBalance}</th>
                      <th className="py-3 px-4">{t.stockMovementAuthor}</th>
                      <th className="py-3 px-4">{t.stockMovementReason}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          {isArabic ? 'لا توجد حركات مخزون مسجلة.' : 'Aucun mouvement enregistré.'}
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map(mov => {
                        const isPositive = mov.quantity > 0;
                        const isZero = mov.quantity === 0;

                        return (
                          <tr key={mov.id} className="hover:bg-zinc-800/30 transition">
                            {/* Date */}
                            <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                              {new Date(mov.timestamp).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>

                            {/* Item name */}
                            <td className="py-3 px-4 font-bold text-white">
                              {mov.stockItemName}
                            </td>

                            {/* Movement type badge */}
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  mov.type === 'in'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : mov.type === 'waste'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : mov.type === 'out_auto'
                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}
                              >
                                {mov.type === 'in'
                                  ? t.stockMovIn
                                  : mov.type === 'waste'
                                  ? t.stockMovWaste
                                  : mov.type === 'out_auto'
                                  ? t.stockMovOutAuto
                                  : mov.type === 'adjustment'
                                  ? t.stockMovAdjustment
                                  : t.stockMovOutManual}
                              </span>
                            </td>

                            {/* Quantity */}
                            <td className="py-3 px-4 font-mono font-bold">
                              <span
                                className={
                                  isZero
                                    ? 'text-zinc-500'
                                    : isPositive
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                                }
                              >
                                {isPositive ? `+${mov.quantity}` : mov.quantity}
                              </span>
                            </td>

                            {/* Balance after */}
                            <td className="py-3 px-4 font-mono text-zinc-300">
                              {mov.balanceAfter}
                            </td>

                            {/* Author */}
                            <td className="py-3 px-4 text-zinc-400">
                              <span className="capitalize">{mov.authorRole}</span>
                            </td>

                            {/* Reason */}
                            <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">
                              {mov.reason}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PURCHASES & SUPPLIER REORDER */}
        {activeSubTab === 'purchases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{t.stockShoppingListTitle}</h3>
                <p className="text-xs text-zinc-400">
                  {isArabic
                    ? 'توليد تلقائي لقوائم الشراء حسب المواد التي بلغت عتبة التنبيه'
                    : 'Génération automatique des réapprovisionnements groupés par fournisseur'}
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
              >
                <Printer className="w-4 h-4" />
                <span>{t.stockPrintPurchaseOrder}</span>
              </button>
            </div>

            {purchaseGroups.length === 0 ? (
              <div className="p-8 text-center bg-[#141418] border border-zinc-800 rounded-2xl text-zinc-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="font-bold text-white text-sm">
                  {isArabic ? 'جميع المواد في المستوى الآمن !' : 'Tous les stocks sont à niveau !'}
                </p>
                <p className="text-xs text-zinc-500">
                  {isArabic
                    ? 'لا توجد أي مادة بلغت عتبة التنبيه حالياً.'
                    : 'Aucun article n\'a atteint son seuil d\'alerte.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {purchaseGroups.map(group => {
                  const waMessage = generateWhatsAppOrderMessage(group);
                  const isCopied = copiedSupplier === group.supplierName;

                  return (
                    <div
                      key={group.supplierName}
                      className="bg-[#141418] border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-xl flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Supplier Header */}
                        <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                          <div>
                            <h4 className="font-bold text-white text-sm">
                              {group.supplierName}
                            </h4>
                            <p className="text-xs text-zinc-400 font-mono mt-0.5">
                              {group.supplierPhone || 'Sans téléphone'}
                            </p>
                          </div>
                          {!isCook && (
                            <div className="text-right">
                              <span className="text-[11px] text-zinc-400">Total estimé</span>
                              <div className="text-sm font-black text-amber-400 font-mono">
                                {group.totalCost.toLocaleString()} DA
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Items to buy */}
                        <div className="space-y-2">
                          {group.items.map(pItem => (
                            <div
                              key={pItem.stockItem.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs"
                            >
                              <div>
                                <span className="font-bold text-white">
                                  {isArabic ? pItem.stockItem.nameAr : pItem.stockItem.nameFr}
                                </span>
                                <div className="text-[11px] text-zinc-500">
                                  Actuel: {pItem.stockItem.currentStock} {pItem.stockItem.unit} (Seuil: {pItem.stockItem.alertThreshold})
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-orange-400 font-mono text-sm">
                                  +{pItem.neededQuantity} {pItem.stockItem.unit}
                                </span>
                                {!isCook && (
                                  <div className="text-[10px] text-zinc-400 font-mono">
                                    {pItem.estimatedCostDA.toLocaleString()} DA
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleCopyWhatsApp(group.supplierName, waMessage)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex-1 justify-center"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>
                            {isCopied
                              ? isArabic ? 'تم النسخ !' : 'Copié !'
                              : t.stockWhatsAppOrder}
                          </span>
                        </button>

                        <button
                          onClick={() => receivePurchaseGroup(group)}
                          className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-md shadow-orange-950/40"
                        >
                          {t.stockReceiveOrder}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INVENTORY SERVICE COUNT */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">{t.stockInventoryCountTitle}</h3>
                <p className="text-xs text-zinc-400">
                  {isArabic
                    ? 'جرد المخزون الفعلي (بداية أو نهاية الخدمة) وحساب الفروقات آلياً'
                    : 'Comptage physique des matières premières pour détection d\'écarts'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {inventoryAppliedSuccess && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 animate-fadeIn">
                    <Check className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'تم ضبط المخزون بنجاح !' : 'Ajustements enregistrés !'}</span>
                  </span>
                )}
                <button
                  onClick={handleApplyInventory}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition shadow-lg shadow-orange-950/40 flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.stockInventoryValidate}</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-[#141418] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-3 px-4">{t.stockItemName}</th>
                      <th className="py-3 px-4">{t.stockInventoryTheoretical}</th>
                      <th className="py-3 px-4 w-40">{t.stockInventoryCounted}</th>
                      <th className="py-3 px-4">{t.stockInventoryDifference}</th>
                      {!isCook && <th className="py-3 px-4">{t.stockInventoryCostDiff}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {inventoryDiscrepancies.map(disc => {
                      const hasDiscrepancy = disc.difference !== 0;

                      return (
                        <tr
                          key={disc.stockItemId}
                          className="hover:bg-zinc-800/30 transition"
                        >
                          {/* Name */}
                          <td className="py-3.5 px-4 font-bold text-white">
                            {isArabic ? disc.nameAr : disc.nameFr}
                          </td>

                          {/* Theoretical */}
                          <td className="py-3.5 px-4 font-mono text-zinc-300">
                            {disc.theoreticalStock} {disc.unit}
                          </td>

                          {/* Counted Input */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.1"
                                value={
                                  inventoryCounts[disc.stockItemId] !== undefined
                                    ? inventoryCounts[disc.stockItemId]
                                    : disc.theoreticalStock
                                }
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setInventoryCounts(prev => ({
                                    ...prev,
                                    [disc.stockItemId]: val,
                                  }));
                                }}
                                className="w-24 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white text-center focus:outline-none focus:border-orange-500"
                              />
                              <span className="text-zinc-500 text-[11px]">{disc.unit}</span>
                            </div>
                          </td>

                          {/* Difference */}
                          <td className="py-3.5 px-4 font-mono font-bold">
                            {hasDiscrepancy ? (
                              <span
                                className={
                                  disc.difference > 0 ? 'text-emerald-400' : 'text-red-400'
                                }
                              >
                                {disc.difference > 0 ? `+${disc.difference}` : disc.difference}{' '}
                                {disc.unit}
                              </span>
                            ) : (
                              <span className="text-zinc-500">0</span>
                            )}
                          </td>

                          {/* Cost Diff (Gérant) */}
                          {!isCook && (
                            <td className="py-3.5 px-4 font-mono">
                              {hasDiscrepancy ? (
                                <span
                                  className={
                                    disc.costDifferenceDA > 0
                                      ? 'text-emerald-400 font-bold'
                                      : 'text-red-400 font-bold'
                                  }
                                >
                                  {disc.costDifferenceDA > 0
                                    ? `+${disc.costDifferenceDA}`
                                    : disc.costDifferenceDA}{' '}
                                  DA
                                </span>
                              ) : (
                                <span className="text-zinc-600">0 DA</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editingItem !== undefined && (
        <StockItemEditModal
          itemToEdit={editingItem}
          onClose={() => setEditingItem(undefined)}
        />
      )}

      {restockItem !== undefined && (
        <QuickRestockModal
          stockItem={restockItem}
          onClose={() => setRestockItem(undefined)}
        />
      )}

      {wasteItem !== undefined && (
        <DeclareWasteModal
          stockItem={wasteItem}
          onClose={() => setWasteItem(undefined)}
        />
      )}
    </div>
  );
};
