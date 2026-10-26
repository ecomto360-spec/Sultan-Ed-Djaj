import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Day } from '../../types';
import {
  X,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Motorbike,
  Store,
  XCircle,
  Archive,
  Banknote,
  Receipt,
} from 'lucide-react';
import { getAlgiersDateString, getOrderChickenCount } from '../../services/dayService';
import { calculateSalesMetrics, calculateTheoreticalCash } from '../../services/salesService';
import { verifyManagerPinServer } from '../../services/authService';

interface CloseDayModalProps {
  targetDay?: Day;
  onClose: () => void;
}

export const CloseDayModal: React.FC<CloseDayModalProps> = ({ targetDay, onClose }) => {
  const {
    currentDay,
    orders,
    closeDay,
    settings,
    language,
    expenses,
    compositions,
    stockMovements,
  } = useApp();
  const isArabic = language === 'ar';

  const dayToClose = targetDay || currentDay;

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isPinVerified, setIsPinVerified] = useState<boolean>(() => {
    return !settings.requireAdminPin;
  });

  const [activeResolution, setActiveResolution] = useState<'delivered' | 'cancelled'>('delivered');

  if (!dayToClose) return null;

  // Orders belonging to this day
  const dayOrders = orders.filter(
    o =>
      o.dayId === dayToClose.id ||
      (!o.dayId && getAlgiersDateString(o.createdAt) === dayToClose.date)
  );

  // Active (non-finished) orders in this day
  const activeOrders = dayOrders.filter(
    o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
  );

  // Calculate preview stats based on chosen resolution if there are active orders
  const simulatedOrders = dayOrders.map(o => {
    if (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready') {
      return { ...o, status: activeResolution };
    }
    return o;
  });

  // Single source of truth calculation via salesService
  const previewMetrics = calculateSalesMetrics(simulatedOrders);
  const dayExpenses = expenses.filter(e => e.date === dayToClose.date);
  const cashCalc = calculateTheoreticalCash(simulatedOrders, dayExpenses);
  const theoreticalCash = cashCalc.theoreticalCash;

  const [countedCashInput, setCountedCashInput] = useState<number>(() => theoreticalCash);
  const [cashNoteInput, setCashNoteInput] = useState<string>('');

  const cashDifference = countedCashInput - theoreticalCash;

  // Poulets vendus & restants
  const validOrders = simulatedOrders.filter(o => o.status !== 'cancelled');
  let previewPouletsVendus = 0;
  for (const o of validOrders) {
    previewPouletsVendus += getOrderChickenCount(o, compositions);
  }
  previewPouletsVendus = Math.round(previewPouletsVendus * 10) / 10;

  const adjustmentsSum = (dayToClose.quotaAdjustments || []).reduce(
    (sum, adj) => (adj.mode === 'add' ? sum + adj.delta : sum),
    0
  );
  const effectiveQuota = (dayToClose.quotaInitial || 0) + adjustmentsSum;
  const previewPouletsRestants = Math.max(0, effectiveQuota - previewPouletsVendus);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await verifyManagerPinServer(pinInput.trim());
    if (isValid) {
      setIsPinVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleConfirmClose = () => {
    closeDay({
      activeOrdersResolution: activeOrders.length > 0 ? activeResolution : undefined,
      dayId: targetDay?.id,
      countedCash: countedCashInput,
      cashClosingNote: cashNoteInput,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#16161a] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-red-50 via-zinc-50 to-amber-50 dark:from-red-950/40 dark:via-zinc-900 dark:to-orange-950/30 flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-500/30 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                {isArabic ? 'إغلاق وأرشفة اليوم' : 'Clôturer la journée'}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                {isArabic ? `تاريخ اليوم : ${dayToClose.date}` : `Journée du ${dayToClose.date}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs text-zinc-800 dark:text-zinc-200">
          {!isPinVerified ? (
            <form onSubmit={handleVerifyPin} className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold">
                    {isArabic ? 'مطلوب رمز PIN الخاص بالمدير' : 'Code PIN Gérant requis'}
                  </p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    {isArabic
                      ? 'يرجى إدخال رمز PIN لتأكيد إغلاق اليوم.'
                      : 'Veuillez saisir le code PIN Gérant pour autoriser la clôture.'}
                  </p>
                </div>
              </div>

              <div>
                <input
                  type="password"
                  maxLength={8}
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="• • • •"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-center text-xl font-mono font-black tracking-widest text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {pinError && (
                  <p className="text-red-600 dark:text-red-400 text-[11px] font-bold text-center mt-1.5">
                    {isArabic ? 'رمز PIN غير صحيح' : 'Code PIN incorrect'}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold"
                >
                  {isArabic ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold shadow-md transition"
                >
                  {isArabic ? 'تحقق' : 'Valider PIN'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Warning if there are pending/preparing/ready orders */}
              {activeOrders.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 space-y-2.5">
                  <div className="flex items-start gap-2.5 text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold">
                        {isArabic
                          ? `تنبيه: يوجد ${activeOrders.length} طلب غير مكتمل!`
                          : `Attention : ${activeOrders.length} commande(s) encore en cours (En attente / En cours / Prête)`}
                      </p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5">
                        {isArabic
                          ? 'كيف تريد معالجة هذه الطلبات قبل إغلاق اليوم؟'
                          : 'Choisissez comment clôturer ces commandes en cours avant de figer la journée :'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveResolution('delivered')}
                      className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                        activeResolution === 'delivered'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        {isArabic ? 'تحويل الكل إلى "تم التسليم"' : 'Passer en "Livrée"'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveResolution('cancelled')}
                      className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                        activeResolution === 'cancelled'
                          ? 'bg-red-50 dark:bg-red-950/60 border-red-400 dark:border-red-500 text-red-800 dark:text-red-300 font-bold'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                      <span>
                        {isArabic ? 'تحويل الكل إلى "ملغاة"' : 'Passer en "Annulée"'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Summary Screen before validation */}
              <div className="space-y-3">
                <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px]">
                  {isArabic ? 'ملخص اليوم قبل الإغلاق النهائي' : 'Récapitulatif des ventes avant validation'}
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-0.5 shadow-sm">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-amber-600 dark:text-orange-400" />
                      <span>{isArabic ? 'الطلبات المسلمة' : 'Commandes livrées'}</span>
                    </span>
                    <div className="text-lg font-black text-zinc-900 dark:text-white font-mono">
                      {previewMetrics.nbCommandes}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-0.5 shadow-sm">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>{isArabic ? 'رقم أعمال المنتجات' : 'CA Produits'}</span>
                    </span>
                    <div className="text-base font-black text-amber-700 dark:text-amber-400 font-mono">
                      {previewMetrics.caProduits.toLocaleString()} DA
                    </div>
                    {previewMetrics.fraisLivraison > 0 && (
                      <div className="text-[10px] text-zinc-500 font-mono">
                        +{previewMetrics.fraisLivraison.toLocaleString()} DA livr.
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-0.5 shadow-sm">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>{isArabic ? 'متوسط السلة' : 'Panier moyen'}</span>
                    </span>
                    <div className="text-base font-black text-zinc-800 dark:text-zinc-100 font-mono">
                      {previewMetrics.panierMoyen.toLocaleString()} DA
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {isArabic ? 'لكل طلب مسلم' : '/ commande livrée'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-0.5 shadow-sm">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      🍗 {isArabic ? 'الدجاج المباع / المتبقي' : 'Poulets vendus / restants'}
                    </span>
                    <div className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                      {previewPouletsVendus} vendus{' '}
                      <span className="text-zinc-400 dark:text-zinc-500">/</span>{' '}
                      <span className="text-zinc-700 dark:text-zinc-300">{previewPouletsRestants} rest.</span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Quota: {effectiveQuota}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-0.5 shadow-sm">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Motorbike className="w-3 h-3 text-amber-600 dark:text-orange-400" />
                      <span>{isArabic ? 'توصيل / كاونتر' : 'Livraison / Comptoir'}</span>
                    </span>
                    <div className="text-sm font-bold font-mono text-zinc-800 dark:text-zinc-200">
                      <span className="text-amber-700 dark:text-orange-400">{previewMetrics.nbLivraison} Liv.</span> /{' '}
                      <span className="text-emerald-700 dark:text-emerald-400">{previewMetrics.nbComptoir} Cpt.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-0.5 shadow-sm">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                      <span>{isArabic ? 'الملغاة' : 'Annulées'}</span>
                    </span>
                    <div className="text-base font-black font-mono text-red-600 dark:text-red-400">
                      {previewMetrics.annulations.count}
                    </div>
                    {previewMetrics.annulations.valeurPerdue > 0 && (
                      <div className="text-[10px] text-red-500 dark:text-red-400/80 font-mono">
                        -{previewMetrics.annulations.valeurPerdue.toLocaleString()} DA
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Fusionnée : Clôture de Caisse (Espèces) */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-orange-500/10 dark:from-zinc-900/90 dark:to-zinc-900/50 border border-amber-500/20 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>{isArabic ? 'قفل الصندوق (تسوية النقد)' : 'Clôture de Caisse (Espèces)'}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                      {isArabic ? 'مقارنة النظري بالفعلي' : 'Contrôle caisse'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Espèces théoriques */}
                    <div className="bg-white/80 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-0.5">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold block">
                        {isArabic ? 'النقد النظري (المبيعات - المصاريف)' : 'Espèces théoriques'}
                      </span>
                      <div className="text-base font-black text-amber-700 dark:text-amber-400 font-mono">
                        {theoreticalCash.toLocaleString()} DA
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        {isArabic
                          ? `كاش: ${cashCalc.cashIn} دج | مصاريف: -${cashCalc.cashOut} دج`
                          : `Ventes: ${cashCalc.cashIn} DA - Dép: ${cashCalc.cashOut} DA`}
                      </div>
                    </div>

                    {/* Espèces comptées */}
                    <div className="bg-white/80 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                      <label className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold block">
                        {isArabic ? 'النقد الفعلي في الدرج (دج) *' : 'Espèces comptées (DA) *'}
                      </label>
                      <input
                        type="number"
                        step="50"
                        min="0"
                        value={countedCashInput}
                        onChange={e => setCountedCashInput(parseFloat(e.target.value) || 0)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm font-black text-zinc-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Écart */}
                    <div className="bg-white/80 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-0.5">
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold block">
                        {isArabic ? 'فارق الصندوق' : 'Écart de caisse'}
                      </span>
                      <div
                        className={`text-base font-black font-mono ${
                          cashDifference === 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : cashDifference > 0
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {cashDifference > 0 ? `+${cashDifference}` : cashDifference} DA
                      </div>
                      <div className="text-[9px] text-zinc-500">
                        {cashDifference === 0
                          ? (isArabic ? 'مطابق تماماً' : 'Concordance parfaite')
                          : cashDifference > 0
                          ? (isArabic ? 'فائض في الصندوق' : 'Excédent en caisse')
                          : (isArabic ? 'عجز في الصندوق' : 'Déficit en caisse')}
                      </div>
                    </div>
                  </div>

                  {/* Observations de caisse */}
                  <div>
                    <input
                      type="text"
                      value={cashNoteInput}
                      onChange={e => setCashNoteInput(e.target.value)}
                      placeholder={
                        isArabic
                          ? 'ملاحظات الصندوق (مثال: تم خصم رصيد البداية 5000 دج، كل شيء متطابق)'
                          : 'Observations de caisse (Ex: Fond de caisse 5000 DA déduit, conforme)'
                      }
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400">
                {isArabic
                  ? 'عند التأكيد، سيتم تجميد وحفظ إحصائيات هذا اليوم وتسوية الصندوق في السجل التاريخي، وإعادة العدادات إلى الصفر تحضيراً لليوم الموالي.'
                  : "En validant, cette journée et la clôture de caisse seront figées et archivées dans l'Historique. Aucune commande n'est supprimée. Les compteurs seront remis à zéro."}
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold transition"
                >
                  {isArabic ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold flex items-center gap-1.5 shadow-lg shadow-red-950/20 transition active:scale-95"
                >
                  <Archive className="w-4 h-4" />
                  <span>
                    {isArabic ? 'تأكيد إغلاق اليوم' : 'Valider et clôturer la journée'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
