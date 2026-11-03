import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { X, Check, RotateCcw, Plus, Flame, Sparkles, Shield, Info } from 'lucide-react';

interface DailyChickenModalProps {
  onClose: () => void;
}

export const DailyChickenModal: React.FC<DailyChickenModalProps> = ({ onClose }) => {
  const {
    settings,
    dailyChickenInitial,
    dailyChickenRemaining,
    dailyChickenSold,
    setTodayChickenCount,
    resetTodayChickenBatch,
    updateSettings,
    language,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [countInput, setCountInput] = useState<number>(dailyChickenInitial || settings.dailyChickenQuota || 100);
  const [addInput, setAddInput] = useState<number>(20);
  const [mode, setMode] = useState<'replace' | 'add'>('replace');
  const [saveAsDefaultQuota, setSaveAsDefaultQuota] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const presets = [80, 100, 120, 150, 180, 200];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'replace') {
      const val = Math.max(0, countInput);
      setTodayChickenCount(val, 'set_initial');
      if (saveAsDefaultQuota) {
        updateSettings({ dailyChickenQuota: val });
      }
      setSuccessMsg(
        isArabic
          ? `تم ضبط حصة اليوم على ${val} دجاجة.`
          : `Quota du jour défini à ${val} poulets.`
      );
    } else {
      const val = Math.max(1, addInput);
      setTodayChickenCount(val, 'add');
      setSuccessMsg(
        isArabic
          ? `تمت إضافة +${val} دجاجة إلى مخزون اليوم.`
          : `+${val} poulets ajoutés au stock du jour.`
      );
    }

    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleQuickReset = () => {
    const defaultQuota = settings.dailyChickenQuota || 100;
    resetTodayChickenBatch(defaultQuota);
    setCountInput(defaultQuota);
    setSuccessMsg(
      isArabic
        ? `تمت إعادة ضبط حصة اليوم على ${defaultQuota} دجاجة.`
        : `Stock du jour réinitialisé à ${defaultQuota} poulets.`
    );
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const todayFormatted = new Date().toLocaleDateString(
    language === 'ar' ? 'ar-DZ' : 'fr-DZ',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-[#18181c] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/30 text-xl font-black">
              🍗
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t.dailyChickenModalTitle}</h3>
              <p className="text-[11px] text-zinc-400 capitalize">{todayFormatted}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Live Status Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-0.5">
              <span className="text-[10px] text-zinc-400 font-semibold block">
                {isArabic ? 'الحصة الإجمالية' : 'Quota total'}
              </span>
              <div className="text-base sm:text-lg font-black text-white font-mono">
                {dailyChickenInitial}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-0.5">
              <span className="text-[10px] text-zinc-400 font-semibold block">
                {isArabic ? 'تم بيعها' : 'Vendus'}
              </span>
              <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
                {dailyChickenSold}
              </div>
            </div>

            <div
              className={`p-2.5 rounded-xl border text-center space-y-0.5 ${
                dailyChickenRemaining <= 0
                  ? 'bg-red-950/40 border-red-500/40 text-red-400'
                  : dailyChickenRemaining <= 15
                  ? 'bg-orange-950/40 border-orange-500/40 text-orange-400'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              }`}
            >
              <span className="text-[10px] font-semibold block opacity-80">
                {isArabic ? 'المتبقي الحالي' : 'Restants'}
              </span>
              <div className="text-base sm:text-lg font-black font-mono">
                {dailyChickenRemaining}
              </div>
            </div>
          </div>

          {/* Privacy Note: Client Never Sees the Number */}
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-start gap-2.5 text-[11px] text-zinc-400">
            <Shield className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <p>
              {isArabic
                ? '🔒 هذا العدد سري خاص بالإدارة والمطبخ ولا يظهر للزبون. الزبون يرى فقط إذا كان الطبق متوفراً أو نفد لليوم.'
                : '🔒 Ce nombre est strictement confidentiel pour l\'équipe et ne s\'affiche jamais au client. Le client voit uniquement "En stock" ou "Épuisé pour aujourd\'hui".'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 gap-1">
            <button
              type="button"
              onClick={() => setMode('replace')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'replace'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.dailyChickenReplaceAll}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('add')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                mode === 'add'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.dailyChickenAddMore}</span>
            </button>
          </div>

          <form onSubmit={handleApply} className="space-y-4">
            {mode === 'replace' ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300">
                      {t.dailyChickenInputLabel}
                    </label>
                    <span className="text-[11px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                      {isArabic ? 'حساب بالدجاجة الكاملة' : 'Décompte par poulet'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCountInput(prev => Math.max(0, prev - 10))}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-xl border border-zinc-750 transition"
                    >
                      -10
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={countInput}
                      onChange={e => setCountInput(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-2xl font-black font-mono text-center text-orange-400 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setCountInput(prev => prev + 10)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-xl border border-zinc-750 transition"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-zinc-400 font-semibold">{t.dailyChickenQuickSet}</span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {presets.map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setCountInput(num)}
                        className={`py-1.5 rounded-lg text-xs font-black font-mono transition border ${
                          countInput === num
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save as default daily quota checkbox */}
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveAsDefaultQuota}
                    onChange={e => setSaveAsDefaultQuota(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-orange-500 focus:ring-orange-500"
                  />
                  <span>
                    {isArabic
                      ? `حفظ كحصة يومية افتراضية تبدأ بها الخدمة كل صباح (${countInput} دجاجة)`
                      : `Enregistrer aussi comme quota par défaut chaque matin (${countInput} poulets)`}
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    {isArabic ? 'الكمية الإضافية المراد زيادتها (+):' : 'Quantité à ajouter au stock (+):'}
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAddInput(prev => Math.max(1, prev - 10))}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-xl border border-zinc-750 transition"
                    >
                      -10
                    </button>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={addInput}
                      onChange={e => setAddInput(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-2xl font-black font-mono text-center text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAddInput(prev => prev + 10)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-bold rounded-xl border border-zinc-750 transition"
                    >
                      +10
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[10, 20, 30, 50].map(addVal => (
                    <button
                      key={addVal}
                      type="button"
                      onClick={() => setAddInput(addVal)}
                      className={`py-1.5 rounded-lg text-xs font-bold font-mono transition border ${
                        addInput === addVal
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border-zinc-800'
                      }`}
                    >
                      +{addVal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleQuickReset}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.dailyChickenResetBtn} ({settings.dailyChickenQuota || 100})</span>
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition shadow-md shadow-orange-950/40 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.save}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
