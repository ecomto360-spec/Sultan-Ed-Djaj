import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { TRANSLATIONS } from '../../../i18n/translations';
import { Lock, Delete, ArrowRight, ShieldAlert } from 'lucide-react';

interface PinProtectionModalProps {
  onSuccess?: () => void;
}

export const PinProtectionModal: React.FC<PinProtectionModalProps> = ({ onSuccess }) => {
  const { unlockRevenue, setBackOfficeTab, language } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [pin, setPin] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setHasError(false);

    if (nextPin.length === 4) {
      // Auto submit
      const ok = unlockRevenue(nextPin);
      if (ok) {
        onSuccess?.();
      } else {
        setHasError(true);
        setTimeout(() => {
          setPin('');
          setHasError(false);
        }, 800);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setHasError(false);
  };

  const handleClear = () => {
    setPin('');
    setHasError(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-6 bg-[#0c0c0e] overflow-y-auto min-h-0">
      <div className="bg-[#141418] border border-zinc-800 rounded-3xl p-5 sm:p-7 max-w-sm w-full text-center space-y-4 sm:space-y-6 shadow-2xl animate-fadeIn my-auto">
        {/* Lock Icon */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h3 className="text-lg font-black text-white">{t.pinModalTitle}</h3>
          <p className="text-xs text-zinc-400">{t.pinModalSubtitle}</p>
        </div>

        {/* PIN Circles Display */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map(idx => {
            const filled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasError
                    ? 'bg-red-500 border-red-500 scale-110 animate-bounce'
                    : filled
                    ? 'bg-orange-500 scale-125 shadow-lg shadow-orange-500/50'
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {hasError && (
          <div className="text-xs font-bold text-red-400 flex items-center justify-center gap-1.5 animate-pulse">
            <ShieldAlert className="w-4 h-4" />
            <span>{t.pinErrorMsg}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-xl font-black text-white active:scale-95 transition shadow-sm"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 text-xs font-bold text-zinc-400 active:scale-95 transition"
          >
            {isArabic ? 'مسح' : 'Effacer'}
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-xl font-black text-white active:scale-95 transition shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-zinc-900/40 hover:bg-zinc-850 text-zinc-400 flex items-center justify-center active:scale-95 transition"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Default hint for user */}
        <div className="pt-2 text-[11px] text-zinc-500 border-t border-zinc-800/60 flex items-center justify-between">
          <span>{isArabic ? 'الرمز الافتراضي: 0000' : 'PIN par défaut : 0000'}</span>
          <button
            onClick={() => setBackOfficeTab('orders')}
            className="text-orange-400 hover:underline font-semibold"
          >
            {isArabic ? 'الرجوع للطلبات' : 'Retour aux commandes'}
          </button>
        </div>
      </div>
    </div>
  );
};
