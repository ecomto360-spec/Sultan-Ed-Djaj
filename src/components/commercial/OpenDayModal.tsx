import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Flame, Play, Calendar, ShieldAlert } from 'lucide-react';
import { getAlgiersDateString } from '../../services/dayService';

export const OpenDayModal: React.FC = () => {
  const { currentDay, lastClosedDayQuota, openDay, language } = useApp();
  const isArabic = language === 'ar';

  const [quotaInput, setQuotaInput] = useState<number>(lastClosedDayQuota || 100);

  useEffect(() => {
    setQuotaInput(lastClosedDayQuota || 100);
  }, [lastClosedDayQuota]);

  if (currentDay) {
    return null;
  }

  const todayAlgiers = getAlgiersDateString();
  const presets = [5, 30, 50, 80, 100, 120, 150, 200];

  const handleOpenDay = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = Math.max(1, Math.round(quotaInput));
    openDay(valid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#16161a] border border-amber-300 dark:border-orange-500/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 dark:from-orange-950/60 dark:via-zinc-900 dark:to-amber-950/50 flex items-center gap-3.5 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-orange-400 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🍗
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 border border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300 text-[10px] font-bold mb-1">
              <ShieldAlert className="w-3 h-3 text-red-600 dark:text-red-400" />
              <span>
                {isArabic ? 'الخدمة مغلقة حالياً' : 'Aucune journée ouverte • Restaurant affiché Fermé'}
              </span>
            </div>
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
              {isArabic ? 'افتتاح يوم العمل الجديد' : 'Ouvrir la journée'}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
              <Calendar className="w-3 h-3 text-amber-600 dark:text-orange-400" />
              <span>{todayAlgiers} (Africa/Algiers)</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleOpenDay} className="p-5 space-y-5">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {isArabic
              ? 'يرجى تحديد عدد الدجاج المتوفر لبدء خدمة اليوم. سيتم تصفير عدادات اليوم وفتح الطلبات للزبائن فور التأكيد.'
              : 'Définissez le quota de poulets pour démarrer la session du jour. Les compteurs du tableau de bord démarrent à zéro et le client verra le restaurant "Ouvert".'}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                {isArabic ? 'عدد الدجاج لليوم :' : 'Nombre de poulets :'}
              </label>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                {isArabic
                  ? `حصة الأمس: ${lastClosedDayQuota}`
                  : `Quota veille : ${lastClosedDayQuota} poulets`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuotaInput(prev => Math.max(1, prev - 5))}
                className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-extrabold rounded-xl border border-zinc-300 dark:border-zinc-700 transition"
              >
                -5
              </button>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={quotaInput}
                onChange={e => setQuotaInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border-2 border-amber-500/50 dark:border-orange-500/50 rounded-xl px-3 py-2.5 text-3xl font-black font-mono text-center text-amber-700 dark:text-orange-400 focus:outline-none focus:border-amber-600 dark:focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setQuotaInput(prev => prev + 5)}
                className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-sm font-extrabold rounded-xl border border-zinc-300 dark:border-zinc-700 transition"
              >
                +5
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">
              {isArabic ? 'اختيار سريع :' : 'Sélection rapide :'}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuotaInput(num)}
                  className={`py-1.5 rounded-lg text-xs font-black font-mono transition border ${
                    quotaInput === num
                      ? 'bg-amber-500/20 text-amber-800 dark:text-orange-400 border-amber-500/50'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-950/20 transition active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isArabic ? 'افتتاح اليوم وبدء الخدمة' : 'Ouvrir la journée'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
