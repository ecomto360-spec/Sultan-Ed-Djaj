import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { UserRole } from '../../types';
import { CommercialBackOffice } from './CommercialBackOffice';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  Lock,
  Delete,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import {
  getAdminToken,
  loginAdminByPin,
  onAuthLogout,
} from '../../services/authService';

interface AdminAppProps {
  /**
   * When true, renders the Back-Office inside the /conception layout below HeaderBar.
   * When false or omitted (route /admin), renders full-screen standalone Back-Office.
   */
  embedded?: boolean;
}

export const AdminApp: React.FC<AdminAppProps> = ({ embedded = false }) => {
  const { language, setLanguage, setUserRole, setAuthenticatedRole } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // PIN lock state: unlocked only if a valid session token exists
  const [isPinLocked, setIsPinLocked] = useState<boolean>(() => !getAdminToken());

  // Input & Feedback state
  const [pinInput, setPinInput] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Anti-brute-force rate limiting countdown
  const [blockCountdown, setBlockCountdown] = useState<number>(0);

  // Hidden input ref for native keyboard input support
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Auto-logout on 401 Unauthorized
  useEffect(() => {
    const unsubscribe = onAuthLogout(() => {
      setIsPinLocked(true);
      setErrorMessage(
        isArabic
          ? 'انتهت الجلسة أو غير مصرح بها. يرجى إعادة إدخال رمز PIN.'
          : 'Session expirée. Veuillez saisir votre code PIN.'
      );
    });
    return unsubscribe;
  }, [isArabic]);

  // Anti-brute-force countdown timer effect
  useEffect(() => {
    if (blockCountdown <= 0) return;
    const interval = setInterval(() => {
      setBlockCountdown(prev => {
        if (prev <= 1) {
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [blockCountdown]);

  // Inject <meta name="robots" content="noindex, nofollow" /> on /admin route
  useEffect(() => {
    if (embedded || typeof document === 'undefined') return;

    const prevTitle = document.title;
    document.title = 'Sultan Ed-Djaj – Administration (Back-Office)';

    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const createdMeta = !robotsMeta;
    const prevContent = robotsMeta?.content || '';

    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, nofollow';

    return () => {
      document.title = prevTitle;
      if (robotsMeta) {
        if (createdMeta) {
          robotsMeta.remove();
        } else {
          robotsMeta.content = prevContent;
        }
      }
    };
  }, [embedded]);

  // Focus input automatically on mount
  useEffect(() => {
    if (isPinLocked) {
      setTimeout(() => hiddenInputRef.current?.focus(), 100);
    }
  }, [isPinLocked]);

  const submitPinLogin = async (pinToVerify: string) => {
    const cleanPin = pinToVerify.trim();
    if (isLoading || blockCountdown > 0 || cleanPin.length < 4) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsShaking(false);

    try {
      const res = await loginAdminByPin(cleanPin, rememberMe);
      setIsSuccess(true);
      setAuthenticatedRole(res.role);
      setUserRole(res.role);

      setTimeout(() => {
        setIsPinLocked(false);
        setIsSuccess(false);
        setPinInput('');
      }, 400);
    } catch (err: any) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      if (err.retryAfter && err.retryAfter > 0) {
        setBlockCountdown(err.retryAfter);
        setErrorMessage(
          isArabic
            ? `تم حظر الدخول مؤقتاً بعد عدة محاولات خاطئة. يرجى الانتظار ${err.retryAfter} ثانية.`
            : `Accès temporairement bloqué suite à plusieurs échecs. Veuillez patienter ${err.retryAfter}s.`
        );
      } else {
        setErrorMessage(
          err.message || (isArabic ? 'رمز PIN غير صحيح' : 'Code PIN incorrect.')
        );
      }
      setPinInput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigitPress = (digit: string) => {
    if (isLoading || blockCountdown > 0 || isSuccess) return;
    if (pinInput.length >= 6) return;

    const next = pinInput + digit;
    setPinInput(next);
    setErrorMessage(null);

    // Auto-submit on 4 digits (standard PIN length)
    if (next.length === 4) {
      submitPinLogin(next);
    }
  };

  const handleClear = () => {
    if (isLoading || blockCountdown > 0) return;
    setPinInput('');
    setErrorMessage(null);
    hiddenInputRef.current?.focus();
  };

  const handleBackspace = () => {
    if (isLoading || blockCountdown > 0) return;
    setPinInput(prev => prev.slice(0, -1));
    setErrorMessage(null);
    hiddenInputRef.current?.focus();
  };

  // Physical computer keyboard support (0-9, Backspace, Delete, Enter)
  useEffect(() => {
    if (!isPinLocked || blockCountdown > 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        target !== hiddenInputRef.current
      ) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pinInput.length >= 4) {
          submitPinLogin(pinInput);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinLocked, pinInput, isLoading, blockCountdown]);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (isLoading || blockCountdown > 0) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length >= 4) {
      setPinInput(pasted);
      submitPinLogin(pasted);
    }
  };

  if (embedded && !isPinLocked) {
    return <CommercialBackOffice isStandaloneAdmin={false} />;
  }

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className={`min-h-dvh h-dvh w-full flex flex-col bg-[#f4f2ec] dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 font-sans overflow-hidden transition-colors ${
        isArabic ? 'font-arabic' : ''
      }`}
    >
      {isPinLocked ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#f8f7f4] dark:bg-[#0b0b0e] relative transition-colors overflow-y-auto min-h-dvh">
          {/* Top-right theme & language bar */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <ThemeToggle />
            <button
              onClick={() => setLanguage(isArabic ? 'fr' : 'ar')}
              className="flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-800 shadow-xs transition active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              <span>{isArabic ? 'FR' : 'عربي'}</span>
            </button>
          </div>

          {/* Main Centered Login Card (Max Width 380px) */}
          <div
            onClick={() => hiddenInputRef.current?.focus()}
            onPaste={handlePaste}
            className={`w-full max-w-[380px] bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 transition-colors my-auto ${
              isShaking ? 'animate-shake' : ''
            }`}
          >
            {/* Header: Logo + Name + Badge */}
            <div className="flex flex-col items-center text-center space-y-2">
              <BrandLogo size="md" isArabic={isArabic} />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 text-[11px] font-bold">
                <Lock className="w-3 h-3" />
                <span>{isArabic ? 'الدخول الآمن إلى الإدارة' : 'Connexion Sécurisée Back-Office'}</span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white tracking-tight">
                {isArabic ? 'أدخل رمز PIN للدخول' : 'Saisissez votre code PIN'}
              </h1>
            </div>

            {/* Hidden Input for Native Keyboards */}
            <input
              ref={hiddenInputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={6}
              value={pinInput}
              onChange={e => {
                if (blockCountdown > 0 || isLoading) return;
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPinInput(val);
                setErrorMessage(null);
                if (val.length === 4) {
                  submitPinLogin(val);
                }
              }}
              className="opacity-0 absolute -z-10 w-0 h-0"
              aria-label="Code PIN"
            />

            {/* Visual PIN Slots (4 to 6 slots) */}
            <div className="space-y-2">
              <div className="flex justify-center gap-2.5 py-1">
                {Array.from({ length: Math.max(4, pinInput.length) }).map((_, idx) => {
                  const filled = pinInput.length > idx;
                  const isCurrent = pinInput.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-2xl border-2 flex items-center justify-center text-lg font-black font-mono transition-all duration-200 ${
                        isSuccess
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500 scale-105'
                          : errorMessage
                          ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400'
                          : isCurrent
                          ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-500/10'
                          : filled
                          ? 'border-orange-500 bg-orange-500/15 text-zinc-900 dark:text-white'
                          : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 text-zinc-400'
                      }`}
                    >
                      {isLoading && isCurrent ? (
                        <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : filled ? (
                        '●'
                      ) : (
                        ''
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Error Message or Countdown Notice */}
              {errorMessage && (
                <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                  <p className="flex-1 leading-tight">{errorMessage}</p>
                </div>
              )}

              {/* Anti-brute-force Block Countdown */}
              {blockCountdown > 0 && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs text-center font-bold space-y-1">
                  <p>
                    {isArabic
                      ? `تم حظر الدخول مؤقتاً: الانتظار ${blockCountdown} ثانية`
                      : `Saisie bloquée : réessayez dans ${blockCountdown}s`}
                  </p>
                  <div className="w-full bg-amber-500/20 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-1000"
                      style={{ width: `${(blockCountdown / 60) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Touch On-Screen Numeric Keypad (Big Touch Targets ≥ 56px) */}
            <div className="grid grid-cols-3 gap-2 pt-1" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  type="button"
                  disabled={isLoading || blockCountdown > 0 || isSuccess}
                  onClick={() => handleDigitPress(digit)}
                  className="h-14 sm:h-[56px] rounded-2xl bg-zinc-100 hover:bg-orange-500/10 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 active:scale-95 disabled:opacity-40 border border-zinc-200/80 dark:border-zinc-700/60 text-lg font-black text-zinc-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/50 transition shadow-xs flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}

              {/* Clear button */}
              <button
                type="button"
                disabled={isLoading || blockCountdown > 0 || isSuccess}
                onClick={handleClear}
                className="h-14 sm:h-[56px] rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 active:scale-95 disabled:opacity-40 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-extrabold text-zinc-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 transition flex items-center justify-center"
                title="Effacer tout"
              >
                <span>Effacer</span>
              </button>

              {/* Zero */}
              <button
                type="button"
                disabled={isLoading || blockCountdown > 0 || isSuccess}
                onClick={() => handleDigitPress('0')}
                className="h-14 sm:h-[56px] rounded-2xl bg-zinc-100 hover:bg-orange-500/10 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 active:scale-95 disabled:opacity-40 border border-zinc-200/80 dark:border-zinc-700/60 text-lg font-black text-zinc-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 hover:border-orange-500/50 transition shadow-xs flex items-center justify-center"
              >
                0
              </button>

              {/* Backspace button */}
              <button
                type="button"
                disabled={isLoading || blockCountdown > 0 || isSuccess}
                onClick={handleBackspace}
                className="h-14 sm:h-[56px] rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 active:scale-95 disabled:opacity-40 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 transition flex items-center justify-center"
                aria-label="Effacer un chiffre"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Remember me option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 dark:text-zinc-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-orange-600 focus:ring-orange-500"
                />
                <span>{isArabic ? 'تذكرني على هذا الجهاز' : 'Rester connecté sur cet appareil'}</span>
              </label>
            </div>

            {/* Discrete Secondary Link to Smartphone Client View */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 text-center">
              <a
                href="/client"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 transition hover:underline"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isArabic ? 'فتح تطبيق الزبائن ➔' : 'Ouvrir l\'application client ➔'}</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <CommercialBackOffice isStandaloneAdmin={!embedded} />
      )}
    </div>
  );
};
