import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { BrandLogo } from '../common/BrandLogo';
import { ShieldCheck, Phone, User, Lock, MapPin, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';

export const ClientAuthModal: React.FC = () => {
  const { registerOrLoginCustomer, language, customers } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [mode, setMode] = useState<'splash' | 'register' | 'otp' | 'login'>('splash');
  
  // Registration fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('0770');
  const [password, setPassword] = useState('123456');
  const [commune, setCommune] = useState('Birkhadem');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  
  // Login fields
  const [loginPhone, setLoginPhone] = useState('0550123456');
  const [loginPassword, setLoginPassword] = useState('123456');

  // OTP simulation
  const [otpCode, setOtpCode] = useState('1234');
  const [otpError, setOtpError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStartRegister = () => {
    setMode('register');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setErrorMsg('');
    setMode('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim() === '1234') {
      registerOrLoginCustomer({
        name,
        phone,
        commune,
        address,
        landmark,
      });
    } else {
      setOtpError(true);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = customers.find(c => c.phone.includes(loginPhone.trim()));
    if (existing) {
      registerOrLoginCustomer({
        name: existing.name,
        phone: existing.phone,
        commune: existing.commune,
        address: existing.address,
        landmark: existing.landmark,
      });
    } else {
      // Auto-create for seamless prototyping experience
      registerOrLoginCustomer({
        name: 'Client ' + loginPhone.slice(-4),
        phone: loginPhone,
        commune: 'Birkhadem',
        address: 'Centre ville Birkhadem',
      });
    }
  };

  const handleFastDemoAccount = (demoCust: typeof customers[0]) => {
    registerOrLoginCustomer({
      name: demoCust.name,
      phone: demoCust.phone,
      commune: demoCust.commune,
      address: demoCust.address,
      landmark: demoCust.landmark,
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 bg-[#141417] text-zinc-100 overflow-y-auto">
      {/* Splash Screen */}
      {mode === 'splash' && (
        <div className="flex-1 flex flex-col justify-between py-6 text-center space-y-6 animate-fade-in">
          <div className="space-y-4 pt-8">
            <div className="flex justify-center">
              <BrandLogo size="lg" isArabic={isArabic} />
            </div>

            <div className="space-y-1.5 px-4">
              <h1 className="text-xl font-extrabold text-white tracking-tight font-serif">
                {isArabic ? 'سلطان الدجاج' : 'Sultan Ed-Djaj'}
              </h1>
              <p className="text-xs text-orange-400 font-semibold tracking-wide">
                {isArabic ? 'أشهى دجاج محمر ومشوي على الجمر في الجزائر' : 'Spécialité Poulet Braisé & Rôti • Birkhadem'}
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed pt-2 max-w-[280px] mx-auto">
                {isArabic
                  ? 'طلب وتوصيل سريع إلى منزلك أو استلام مباشر من المحل. نكهة لا تقاوم.'
                  : 'Commandez en quelques clics pour livraison à domicile ou retrait express au comptoir.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 px-2">
            <button
              onClick={handleStartRegister}
              className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-950/50 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <span>{isArabic ? 'ابدأ الآن / تسجيل حساب' : 'Commencer / Créer un compte'}</span>
              {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMode('login')}
              className="w-full h-11 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 rounded-xl font-bold text-xs border border-zinc-700 transition"
            >
              {t.submitLogin}
            </button>

            {/* Quick Demo Access Pills */}
            <div className="pt-3 border-t border-zinc-800/80 text-start">
              <p className="text-[10px] text-zinc-400 font-semibold mb-1.5 text-center">
                {isArabic ? 'أو اختر حساباً تجريبياً جاهزاً :' : 'Ou accès rapide avec compte test :'}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {customers.slice(0, 4).map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleFastDemoAccount(c)}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 text-start truncate transition"
                  >
                    👤 {c.name.split(' ')[0]} ({c.commune})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      {mode === 'register' && (
        <div className="flex-1 flex flex-col justify-between py-2 space-y-4 animate-fade-in text-start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">{t.registerTitle}</h2>
              <button
                onClick={() => setMode('splash')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ← {isArabic ? 'رجوع' : 'Retour'}
              </button>
            </div>
            <p className="text-xs text-zinc-400">{t.registerSubtitle}</p>

            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-500/20">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">{t.fullName} *</label>
                <div className="relative mt-1">
                  <User className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 ${isArabic ? 'right-2.5' : 'left-2.5'}`} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Karim Bouzid"
                    className={`w-full h-10 bg-zinc-900 rounded-xl border border-zinc-700 text-white placeholder:text-zinc-500 ${
                      isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300">{t.phoneNumber} (+213) *</label>
                <div className="relative mt-1">
                  <Phone className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 ${isArabic ? 'right-2.5' : 'left-2.5'}`} />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0770 12 34 56"
                    className={`w-full h-10 bg-zinc-900 rounded-xl border border-zinc-700 text-white placeholder:text-zinc-500 font-mono ${
                      isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300">{t.password} *</label>
                <div className="relative mt-1">
                  <Lock className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 ${isArabic ? 'right-2.5' : 'left-2.5'}`} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••"
                    className={`w-full h-10 bg-zinc-900 rounded-xl border border-zinc-700 text-white placeholder:text-zinc-500 ${
                      isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300">{t.wilaya}</label>
                  <input
                    type="text"
                    disabled
                    value="Alger (16)"
                    className="w-full h-9 bg-zinc-800/80 rounded-xl border border-zinc-700/60 text-zinc-400 px-3 cursor-not-allowed mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300">{t.commune} *</label>
                  <input
                    type="text"
                    required
                    value={commune}
                    onChange={e => setCommune(e.target.value)}
                    placeholder="Birkhadem"
                    className="w-full h-9 bg-zinc-900 rounded-xl border border-zinc-700 text-white px-3 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300">{t.address} *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Cité 200 logts, Bâtiment B, Apt 14"
                  className="w-full h-10 bg-zinc-900 rounded-xl border border-zinc-700 text-white px-3 mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300">{t.landmark}</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="En face de la pharmacie"
                  className="w-full h-10 bg-zinc-900 rounded-xl border border-zinc-700 text-white px-3 mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold text-xs shadow-md mt-2"
              >
                {isArabic ? 'متابعة وتأكيد الهاتف (OTP)' : 'Continuer vers validation OTP'}
              </button>
            </form>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => setMode('login')}
              className="text-xs text-orange-400 hover:underline"
            >
              {t.haveAccount}
            </button>
          </div>
        </div>
      )}

      {/* Simulated OTP Screen */}
      {mode === 'otp' && (
        <div className="flex-1 flex flex-col justify-between py-6 text-center space-y-6 animate-fade-in">
          <div className="space-y-4 pt-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 text-orange-400 mx-auto flex items-center justify-center border border-orange-500/30">
              <KeyRound className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 px-4">
              <h2 className="text-base font-bold text-white">{t.simulatedOtpTitle}</h2>
              <p className="text-xs text-zinc-400">
                {t.simulatedOtpInfo} <strong className="text-white font-mono">{phone}</strong>
              </p>
              <div className="inline-block p-2 bg-amber-950/40 border border-amber-500/30 rounded-lg text-amber-300 text-xs font-semibold">
                {isArabic ? 'الرمز التجريبي هو: 1234' : 'Code SMS simulé : 1234'}
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4 max-w-[220px] mx-auto">
              <input
                type="text"
                maxLength={4}
                value={otpCode}
                onChange={e => {
                  setOtpCode(e.target.value);
                  setOtpError(false);
                }}
                className="w-full text-center text-2xl font-mono font-extrabold tracking-widest h-14 rounded-2xl bg-zinc-900 border-2 border-orange-500 text-white focus:outline-none"
              />

              {otpError && (
                <p className="text-xs text-red-400">
                  {isArabic ? 'رمز غير صحيح! أدخل 1234' : 'Code incorrect ! Entrez 1234'}
                </p>
              )}

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold text-xs shadow-md"
              >
                {t.verifyOtp}
              </button>
            </form>
          </div>

          <div>
            <button
              onClick={() => setMode('register')}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ← {isArabic ? 'تعديل رقم الهاتف' : 'Modifier le numéro'}
            </button>
          </div>
        </div>
      )}

      {/* Login Screen */}
      {mode === 'login' && (
        <div className="flex-1 flex flex-col justify-between py-4 space-y-4 animate-fade-in text-start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">{t.loginTitle}</h2>
              <button
                onClick={() => setMode('splash')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ← {isArabic ? 'رجوع' : 'Retour'}
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-300">{t.phoneNumber}</label>
                <input
                  type="tel"
                  required
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="0550123456"
                  className="w-full h-10 bg-zinc-900 rounded-xl border border-zinc-700 text-white px-3 mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300">{t.password}</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full h-10 bg-zinc-900 rounded-xl border border-zinc-700 text-white px-3 mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold text-xs shadow-md mt-2"
              >
                {t.submitLogin}
              </button>
            </form>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setMode('register')}
              className="text-xs text-orange-400 hover:underline"
            >
              {t.noAccount}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
