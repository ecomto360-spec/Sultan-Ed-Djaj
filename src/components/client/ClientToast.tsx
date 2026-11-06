import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCircle2, X, AlertCircle, ChefHat } from 'lucide-react';

// Bannière d'annonce des changements d'état de commande (FR/AR), affichée en
// haut de l'écran client pendant 6 s. Le son et la vibration sont déclenchés
// par le contexte ; ce composant ne gère que l'affichage.
export const ClientToast: React.FC = () => {
  const { clientToast, dismissClientToast, language } = useApp();
  const isArabic = language === 'ar';

  if (!clientToast) return null;

  const toneClasses =
    clientToast.tone === 'success'
      ? 'bg-emerald-600/95 border-emerald-400/40'
      : clientToast.tone === 'alert'
        ? 'bg-red-600/95 border-red-400/40'
        : 'bg-zinc-900/95 border-amber-400/40';

  const Icon =
    clientToast.tone === 'success'
      ? CheckCircle2
      : clientToast.tone === 'alert'
        ? AlertCircle
        : clientToast.statusKey === 'preparing'
          ? ChefHat
          : Bell;

  return (
    <div className="fixed top-3 inset-x-3 z-[70] pointer-events-none">
      <div
        dir={isArabic ? 'rtl' : 'ltr'}
        className={`pointer-events-auto max-w-[440px] mx-auto ${toneClasses} text-white rounded-2xl border shadow-xl shadow-black/25 px-4 py-3 flex items-center gap-3`}
        role="status"
      >
        <Icon className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-snug">{clientToast.message}</p>
          {clientToast.statusKey === 'cancelled' && clientToast.reason && (
            <p className="text-[11px] text-white/80 mt-0.5 leading-snug">
              {isArabic ? 'السبب' : 'Motif'} : {clientToast.reason}
            </p>
          )}
        </div>
        <button
          onClick={dismissClientToast}
          className="shrink-0 w-7 h-7 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
          aria-label={isArabic ? 'إغلاق' : 'Fermer'}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
