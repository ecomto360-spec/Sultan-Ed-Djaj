import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import {
  Settings,
  Power,
  Clock,
  Motorbike,
  Timer,
  RotateCcw,
  Check,
  Globe,
  Phone,
  MapPin,
  Volume2,
} from 'lucide-react';

export const CommercialSettings: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToSeedData,
    language,
    setLanguage,
    isStoreActuallyOpen,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee);
  const [estimatedPrepTime, setEstimatedPrepTime] = useState(settings.estimatedPrepTimeMinutes);
  const [phone, setPhone] = useState(settings.phone);
  const [openTime, setOpenTime] = useState(settings.openTime);
  const [closeTime, setCloseTime] = useState(settings.closeTime);
  const [dailyChickenQuota, setDailyChickenQuota] = useState(settings.dailyChickenQuota || 100);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      deliveryFee,
      estimatedPrepTimeMinutes: estimatedPrepTime,
      phone,
      openTime,
      closeTime,
      dailyChickenQuota: Math.max(0, Math.round(dailyChickenQuota)),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    if (confirm(t.resetConfirm)) {
      resetToSeedData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-white">{t.settingsPageTitle}</h2>
        <p className="text-xs text-zinc-400">
          {t.settingsPageSubtitle}
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{isArabic ? 'تم حفظ التعديلات بنجاح !' : 'Paramètres mis à jour avec succès !'}</span>
        </div>
      )}

      {resetSuccess && (
        <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          <span>{isArabic ? 'تمت استعادة البيانات الأصلية بنجاح !' : 'Données réinitialisées au jeu d\'essai d\'origine !'}</span>
        </div>
      )}

      {/* Manual Store Switch Open / Closed */}
      <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Power className={`w-4 h-4 ${settings.isOpen ? 'text-emerald-400' : 'text-red-400'}`} />
              <span>{t.storeOpenStatus}</span>
            </h3>
            <p className="text-xs text-zinc-400">
              {isArabic
                ? 'تحكم فوري: إمكانية فتح أو إغلاق استقبال طلبات الزبائن بنقرة واحدة.'
                : 'Contrôle immédiat : permet d\'ouvrir ou fermer les prises de commande en un clic.'}
            </p>
          </div>

          <button
            onClick={() => updateSettings({ isOpen: !settings.isOpen, manualOverride: true })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              settings.isOpen
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{settings.isOpen ? (isArabic ? 'مفتوح حالياً' : 'Actuellement OUVERT') : (isArabic ? 'مغلق حالياً' : 'Actuellement FERMÉ')}</span>
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
          {isArabic ? 'الوضع الفعلي للزبائن : ' : 'Statut effectif : '}
          <strong className={isStoreActuallyOpen ? 'text-emerald-400' : 'text-red-400'}>
            {isStoreActuallyOpen
              ? (isArabic ? 'استقبال الطلبات مفعل' : 'Le client peut commander')
              : (isArabic ? 'الطلبات متوقفة حالياً' : 'Commandes bloquées')}
          </strong>{' '}
          {isArabic ? '(بناءً على التحكم وساعات العمل 13:00 - 00:00)' : '(basé sur le commutateur et les horaires 13h–00h).'}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-orange-400" />
          <span>{isArabic ? 'أوقات العمل والتوصيل' : 'Horaires & Opérations'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Horaires */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.scheduledHours}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-zinc-400">{t.openingHour} :</span>
                <input
                  type="time"
                  value={openTime}
                  onChange={e => setOpenTime(e.target.value)}
                  className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-0.5"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400">{t.closingHour} :</span>
                <input
                  type="time"
                  value={closeTime}
                  onChange={e => setCloseTime(e.target.value)}
                  className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-0.5"
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-400">
              {isArabic ? 'ساعات عمل سلطان الدجاج: 24 سا / 24 سا (7 أيام / 7).' : 'Horaires de Sultan Ed-Djaj : 24h / 24h (7j/7).'}
            </p>
          </div>

          {/* Delivery fee */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Motorbike className="w-3.5 h-3.5 text-orange-400" />
              <span>{t.standardDeliveryFee}</span>
            </label>
            <input
              type="number"
              value={deliveryFee}
              onChange={e => setDeliveryFee(Number(e.target.value))}
              className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 font-mono"
            />
            <p className="text-[10px] text-zinc-400">
              {isArabic ? 'تطبق تلقائياً على طلبات التوصيل (افتراضياً 200 د.ج).' : 'Appliqués aux commandes livraison (défaut 200 DA).'}
            </p>
          </div>

          {/* Estimated prep time */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.avgPrepTime}</span>
            </label>
            <input
              type="number"
              value={estimatedPrepTime}
              onChange={e => setEstimatedPrepTime(Number(e.target.value))}
              className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 font-mono"
            />
            <p className="text-[10px] text-zinc-400">
              {isArabic ? 'يظهر في صفحة تتبع الطلب لدى الزبون (مثال: ~25 دقيقة).' : 'Affiché sur le tracker en direct du client (ex: ~25 min).'}
            </p>
          </div>

          {/* Contact phone */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-400" />
              <span>{isArabic ? 'رقم هاتف المطعم الرسمي' : 'Numéro de téléphone du restaurant'}</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 font-mono"
            />
            <p className="text-[10px] text-zinc-400">
              {isArabic ? 'الرقم الرسمي: 33 20 01 771 213+' : 'Numéro officiel : +213 771 01 20 33.'}
            </p>
          </div>

          {/* Daily Chicken Quota */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <span className="text-sm">🍗</span>
              <span>{isArabic ? 'حصة الدجاج اليومية التلقائية (عدد الدجاج/يوم)' : 'Quota quotidien automatique (nombre de poulets/jour)'}</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={dailyChickenQuota}
              onChange={e => setDailyChickenQuota(Number(e.target.value))}
              className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 font-mono font-bold text-orange-400"
            />
            <p className="text-[10px] text-zinc-400">
              {isArabic
                ? 'يتم تجديد هذا العدد تلقائياً كل يوم عند بداية الخدمة (مثال: 100 دجاجة). هذا العدد لا يظهر للزبون.'
                : 'Ce quota est réinitialisé automatiquement chaque jour (ex: 100 poulets). Ce nombre reste confidentiel et ne s\'affiche pas au client.'}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-md"
          >
            {isArabic ? 'حفظ التغييرات' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>

      {/* Language & Sound Preferences */}
      <div className="bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 space-y-3 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span>{isArabic ? 'اللغة وإعدادات الصوت' : 'Langue & Préférences Audio'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
            <div>
              <span className="font-bold text-zinc-200">{isArabic ? 'لغة الواجهة' : 'Langue de l\'interface'}</span>
              <p className="text-[10px] text-zinc-400">{isArabic ? 'دعم كامل للغة العربية من اليمين إلى اليسار (RTL)' : 'Support complet RTL en Arabe'}</p>
            </div>
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  language === 'fr' ? 'bg-orange-600 text-white' : 'text-zinc-400'
                }`}
              >
                Français
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${
                  language === 'ar' ? 'bg-orange-600 text-white' : 'text-zinc-400'
                }`}
              >
                عربي
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
            <div>
              <span className="font-bold text-zinc-200">{t.soundAlertsTitle}</span>
              <p className="text-[10px] text-zinc-400">{t.enableSoundNotice}</p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                settings.soundEnabled
                  ? 'bg-orange-600/20 text-orange-400 border-orange-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {settings.soundEnabled ? (isArabic ? 'الصوت مفعّل' : 'Son Activé') : (isArabic ? 'الصوت صامت' : 'Son Muet')}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Seed Data */}
      <div className="bg-zinc-900/90 rounded-2xl p-4 border border-red-900/30 space-y-2 text-xs">
        <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          <span>{t.dangerZone}</span>
        </h3>
        <p className="text-zinc-400">
          {t.resetAllDataDesc}
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 font-bold rounded-xl border border-red-700/50 transition mt-1"
        >
          {t.resetAllData}
        </button>
      </div>
    </div>
  );
};
