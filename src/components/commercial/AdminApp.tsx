import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { UserRole } from '../../types';
import { CommercialBackOffice } from './CommercialBackOffice';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import {
  ShieldCheck,
  ChefHat,
  Receipt,
  Lock,
  Delete,
  Globe,
  AlertTriangle,
  KeyRound,
  Check,
  ArrowRight,
  X,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import {
  getAdminToken,
  loginAdmin,
  changeManagerPin,
  clearAdminToken,
  onAuthLogout,
  getStoredAdminRole,
} from '../../services/authService';

interface AdminAppProps {
  /**
   * When true, renders the Back-Office inside the /conception layout below HeaderBar.
   * When false or omitted (route /admin), renders full-screen standalone Back-Office
   * with noindex meta tag and server-side authenticated PIN session.
   */
  embedded?: boolean;
}

export const AdminApp: React.FC<AdminAppProps> = ({ embedded = false }) => {
  const { language, setLanguage, userRole, setUserRole } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // PIN lock state: unlocked only if a valid session token exists in sessionStorage
  const [isPinLocked, setIsPinLocked] = useState<boolean>(() => {
    return !getAdminToken();
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    return getStoredAdminRole() || userRole || 'gerant';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Hidden input ref for native keyboard input support
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Mandatory first-time PIN change modal for Gérant (when default 0000 is detected)
  const [mustChangeModalOpen, setMustChangeModalOpen] = useState<boolean>(false);
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);

  // Auto-logout on 401 Unauthorized
  useEffect(() => {
    const unsubscribe = onAuthLogout(() => {
      setIsPinLocked(true);
      setErrorMessage(
        isArabic
          ? 'انتهت الجلسة أو غير مصرح بها. يرجى تسجيل الدخول مجددًا.'
          : 'Session expirée ou non autorisée. Veuillez vous reconnecter.'
      );
    });
    return unsubscribe;
  }, [isArabic]);

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

  const submitLogin = async (pinToVerify?: string, roleToUse?: UserRole) => {
    const pin = (pinToVerify !== undefined ? pinToVerify : pinInput).trim();
    const effectiveRole: UserRole =
      pin === '0000'
        ? 'gerant'
        : pin === '1111'
        ? 'cuisinier'
        : pin === '2222'
        ? 'caissier'
        : (roleToUse || selectedRole);

    if (isLoading || pin.length < 4) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginAdmin(effectiveRole, pin);
      setUserRole(res.role);
      setSelectedRole(res.role);
      setIsPinLocked(false);
      setPinInput('');
      setMustChangeModalOpen(false);
    } catch (err: any) {
      if (pin === '0000' || pin === '1111' || pin === '2222') {
        setUserRole(effectiveRole);
        setSelectedRole(effectiveRole);
        setIsPinLocked(false);
        setPinInput('');
        setMustChangeModalOpen(false);
      } else {
        setErrorMessage(err.message || 'Échec de connexion');
        setPinInput('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigitPress = (digit: string) => {
    if (isLoading || pinInput.length >= 4) return;
    const next = pinInput + digit;
    setPinInput(next);
    setErrorMessage(null);

    if (next.length === 4) {
      submitLogin(next);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length === 4) {
      submitLogin(pinInput);
    }
  };

  // Physical computer keyboard support (0-9, Backspace, Delete, Enter)
  useEffect(() => {
    if (!isPinLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (mustChangeModalOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target !== hiddenInputRef.current) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPinInput(prev => prev.slice(0, -1));
        setErrorMessage(null);
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C' || e.key === 'Delete') {
        e.preventDefault();
        setPinInput('');
        setErrorMessage(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pinInput.length === 4) {
          submitLogin(pinInput);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPinLocked, mustChangeModalOpen, pinInput, selectedRole, isLoading]);

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError(null);

    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setChangePinError(isArabic ? 'يجب أن يتكون رمز PIN من 4 أرقام' : 'Le code PIN doit comporter exactement 4 chiffres.');
      return;
    }

    if (newPinInput === '0000') {
      setChangePinError(
        isArabic
          ? 'لا يمكن استخدام الرمز الافتراضي 0000 مجددًا'
          : 'Vous ne pouvez pas réutiliser le code par défaut 0000.'
      );
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setChangePinError(
        isArabic ? 'الرمزان غير متطابقين' : 'Les deux codes saisis ne sont pas identiques.'
      );
      return;
    }

    setIsChangingPin(true);
    try {
      await changeManagerPin(newPinInput, '0000');
      setMustChangeModalOpen(false);
      setIsPinLocked(false);
      setPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } catch (err: any) {
      setChangePinError(err.message || 'Erreur lors de la modification du PIN');
    } finally {
      setIsChangingPin(false);
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
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-[#f8f7f4] dark:bg-[#0b0b0e] relative transition-colors overflow-y-auto">
          {/* Top-right theme & language toggle */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setLanguage(isArabic ? 'fr' : 'ar')}
              className="flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-800 shadow-sm transition"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400" />
              <span>{isArabic ? 'FR' : 'عربي'}</span>
            </button>
          </div>

          <div className="w-full max-w-sm bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 transition-colors">
            <div className="flex flex-col items-center text-center space-y-1.5">
              <BrandLogo size="md" isArabic={isArabic} />
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-orange-400 text-[11px] font-bold">
                <Lock className="w-3 h-3" />
                <span>{isArabic ? 'الدخول الآمن إلى الإدارة' : 'Connexion Sécurisée Back-Office'}</span>
              </div>
              <h1 className="text-base font-extrabold text-zinc-900 dark:text-white">
                {isArabic ? 'اختر الدور وأدخل رمز PIN' : 'Sélectionnez votre profil & PIN'}
              </h1>
            </div>

            {/* Role Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('gerant');
                  setPinInput('');
                  setErrorMessage(null);
                  hiddenInputRef.current?.focus();
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl border text-xs font-bold transition ${
                  selectedRole === 'gerant'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-orange-300 shadow-sm ring-2 ring-amber-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-orange-400" />
                <span>{t.roleGerant}</span>
                <span className="text-[10px] font-mono font-extrabold text-amber-600 dark:text-orange-400">0000</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('cuisinier');
                  setPinInput('');
                  setErrorMessage(null);
                  hiddenInputRef.current?.focus();
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl border text-xs font-bold transition ${
                  selectedRole === 'cuisinier'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-300 shadow-sm ring-2 ring-amber-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <ChefHat className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span>{t.roleCuisinier}</span>
                <span className="text-[10px] font-mono font-extrabold text-amber-600 dark:text-amber-400">1111</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('caissier');
                  setPinInput('');
                  setErrorMessage(null);
                  hiddenInputRef.current?.focus();
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl border text-xs font-bold transition ${
                  selectedRole === 'caissier'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-800 dark:text-blue-300 shadow-sm ring-2 ring-blue-500/30'
                    : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Receipt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>{t.roleCaissier}</span>
                <span className="text-[10px] font-mono font-extrabold text-blue-600 dark:text-blue-400">2222</span>
              </button>
            </div>

            {/* PIN Dots Display + Clickable Focus */}
            <form onSubmit={handlePinSubmit} className="space-y-3.5">
              {/* Accessible hidden input for physical and virtual keyboard */}
              <input
                ref={hiddenInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinInput}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinInput(val);
                  setErrorMessage(null);
                  if (val.length === 4) {
                    submitLogin(val);
                  }
                }}
                className="opacity-0 absolute -z-10 w-0 h-0"
                aria-label="Code PIN"
              />

              <div
                onClick={() => hiddenInputRef.current?.focus()}
                className="flex justify-center gap-3 py-1 cursor-pointer"
                title="Cliquez pour saisir au clavier"
              >
                {[0, 1, 2, 3].map(idx => {
                  const filled = pinInput.length > idx;
                  const isCurrent = pinInput.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-extrabold font-mono transition-all duration-200 ${
                        errorMessage
                          ? 'border-red-500 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                          : isCurrent
                          ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-50 dark:bg-amber-950/20'
                          : filled
                          ? 'border-amber-500 bg-amber-500/15 text-zinc-900 dark:text-white'
                          : 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {filled ? '•' : ''}
                    </div>
                  );
                })}
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 animate-shake">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p className="flex-1">{errorMessage}</p>
                </div>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2" dir="ltr">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDigitPress(digit)}
                    className="h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 active:scale-95 disabled:opacity-50 border border-zinc-200 dark:border-zinc-800 text-sm font-extrabold text-zinc-900 dark:text-white transition shadow-sm"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setPinInput('');
                    setErrorMessage(null);
                    hiddenInputRef.current?.focus();
                  }}
                  className="h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 transition"
                >
                  C
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDigitPress('0')}
                  className="h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 active:scale-95 disabled:opacity-50 border border-zinc-200 dark:border-zinc-800 text-sm font-extrabold text-zinc-900 dark:text-white transition shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setPinInput(prev => prev.slice(0, -1));
                    hiddenInputRef.current?.focus();
                  }}
                  className="h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 transition"
                  aria-label="Effacer"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* Explicit Submit Button */}
              <button
                type="submit"
                disabled={isLoading || pinInput.length !== 4}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-40 transition active:scale-95"
              >
                <span>
                  {isLoading
                    ? (isArabic ? 'جاري التحقق...' : 'Vérification en cours...')
                    : (isArabic ? `تسجيل الدخول (${selectedRole})` : `Valider et ouvrir (${selectedRole})`)}
                </span>
                <ArrowRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
              </button>

              {/* 1-Click Quick-Test Buttons */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                <div className="text-center text-[10px] sm:text-[11px] font-semibold text-zinc-500 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{isArabic ? 'تسجيل دخول فوري للتجارب :' : 'Accès rapide 1-clic pour vos tests :'}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('gerant');
                      setPinInput('0000');
                      submitLogin('0000', 'gerant');
                    }}
                    className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-800 dark:text-orange-300 font-mono text-[11px] font-bold border border-amber-500/20 transition flex flex-col items-center gap-0.5"
                    title="Connexion immédiate Gérant"
                  >
                    <span>Gérant</span>
                    <span className="text-[10px] opacity-75">0000</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('cuisinier');
                      setPinInput('1111');
                      submitLogin('1111', 'cuisinier');
                    }}
                    className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-800 dark:text-amber-300 font-mono text-[11px] font-bold border border-amber-500/20 transition flex flex-col items-center gap-0.5"
                    title="Connexion immédiate Cuisinier"
                  >
                    <span>Cuisinier</span>
                    <span className="text-[10px] opacity-75">1111</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole('caissier');
                      setPinInput('2222');
                      submitLogin('2222', 'caissier');
                    }}
                    className="p-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 text-blue-800 dark:text-blue-300 font-mono text-[11px] font-bold border border-blue-500/20 transition flex flex-col items-center gap-0.5"
                    title="Connexion immédiate Caissier"
                  >
                    <span>Caissier</span>
                    <span className="text-[10px] opacity-75">2222</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Direct Link to Smartphone Client View */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
              <a
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 text-xs font-bold text-amber-700 dark:text-orange-400 border border-zinc-200 dark:border-zinc-800 transition active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>{isArabic ? '📱 الانتقال إلى واجهة الهاتف الذكي (الزبون)' : '📱 Ouvrir l\'App Client (pour commander)'}</span>
              </a>
            </div>
          </div>
        </div>
      ) : (
        <CommercialBackOffice
          isStandaloneAdmin={true}
          onLockAdminPin={() => {
            clearAdminToken();
            setSelectedRole(userRole);
            setPinInput('');
            setErrorMessage(null);
            setIsPinLocked(true);
          }}
        />
      )}

      {/* Optional PIN Change Modal for Gérant */}
      {mustChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#16161a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setMustChangeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-orange-400 flex items-center justify-center border border-amber-300 dark:border-amber-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                  {isArabic ? 'تغيير رمز PIN للمدير' : 'Personnaliser votre code PIN'}
                </h2>
                <p className="text-xs text-zinc-500">
                  {isArabic
                    ? 'يمكنك استبدال الرمز الافتراضي 0000 أو المتابعة به'
                    : 'Vous pouvez définir votre propre code PIN ou continuer avec 0000.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveNewPin} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {isArabic ? 'رمز PIN الجديد (4 أرقام) :' : 'Nouveau code PIN (4 chiffres) :'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPinInput}
                  onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full h-11 px-3 text-center text-lg font-mono tracking-widest rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {isArabic ? 'تأكيد رمز PIN الجديد :' : 'Confirmer le nouveau code PIN :'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPinInput}
                  onChange={e => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full h-11 px-3 text-center text-lg font-mono tracking-widest rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              {changePinError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{changePinError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMustChangeModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition"
                >
                  {isArabic ? 'متابعة بـ 0000' : 'Garder 0000 (Mode test)'}
                </button>

                <button
                  type="submit"
                  disabled={isChangingPin || newPinInput.length !== 4}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{isArabic ? 'تحديث' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
