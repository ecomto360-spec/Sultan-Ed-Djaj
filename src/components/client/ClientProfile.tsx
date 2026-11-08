import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ThemeToggle } from '../common/ThemeToggle';
import { isValidClientPhone } from '../../services/customerService';
import {
  User,
  Phone,
  MapPin,
  Globe,
  LogOut,
  Check,
  Navigation,
  ExternalLink,
  Loader2,
  KeyRound,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

const RETURN_TO_CART_FLAG = 'sultan_profile_return_cart';

// Profil client de cet appareil : formulaire VIDE au premier achat (aucune
// donnée d'un autre visiteur), affichage du profil enregistré ensuite, et
// récupération par téléphone + code personnel si l'appareil change.
export const ClientProfile: React.FC = () => {
  const {
    currentCustomer,
    customerProfileLoading,
    customerHasRecoveryCode,
    saveCustomerProfile,
    recoverCustomerProfile,
    eraseCustomerProfile,
    setClientTab,
    language,
    setLanguage,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const hasProfile = Boolean(currentCustomer);
  const [isEditing, setIsEditing] = useState(!hasProfile);

  const [name, setName] = useState(currentCustomer?.name || '');
  const [phone, setPhone] = useState(currentCustomer?.phone || '');
  const [address, setAddress] = useState(currentCustomer?.address || '');
  const [landmark, setLandmark] = useState(currentCustomer?.landmark || '');
  const [mapUrl, setMapUrl] = useState(currentCustomer?.mapUrl || '');
  const [latitude, setLatitude] = useState<number | undefined>(currentCustomer?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(currentCustomer?.longitude);
  const [recoveryCode, setRecoveryCode] = useState('');

  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverPhone, setRecoverPhone] = useState('');
  const [recoverCode, setRecoverCode] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverError, setRecoverError] = useState('');

  const [confirmErase, setConfirmErase] = useState(false);
  const [isRemovingRecent, setIsRemovingRecent] = useState(false);

  // Supprime une adresse récente du profil (les autres sont conservées).
  const handleRemoveRecentAddress = async (addressToRemove: string) => {
    if (!currentCustomer) return;
    setIsRemovingRecent(true);
    try {
      const remaining = (currentCustomer.recentAddresses || [])
        .filter(recent => recent.address !== addressToRemove)
        .slice(0, 3);
      await saveCustomerProfile({
        name: currentCustomer.name,
        phone: currentCustomer.phone,
        wilaya: currentCustomer.wilaya,
        commune: currentCustomer.commune,
        address: currentCustomer.address,
        landmark: currentCustomer.landmark || undefined,
        mapUrl: currentCustomer.mapUrl || undefined,
        latitude: currentCustomer.latitude,
        longitude: currentCustomer.longitude,
        recentAddresses: remaining,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setFormError(err?.message || (isArabic ? 'فشل حذف العنوان.' : 'La suppression de l’adresse a échoué.'));
    } finally {
      setIsRemovingRecent(false);
    }
  };

  useEffect(() => {
    if (currentCustomer) {
      setName(currentCustomer.name || '');
      setPhone(currentCustomer.phone || '');
      setAddress(currentCustomer.address || '');
      setLandmark(currentCustomer.landmark || '');
      setMapUrl(currentCustomer.mapUrl || '');
      setLatitude(currentCustomer.latitude);
      setLongitude(currentCustomer.longitude);
    }
  }, [currentCustomer]);

  const handleGetGeolocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setMapUrl(`https://maps.google.com/?q=${lat},${lng}`);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const returnToCartIfRequested = () => {
    try {
      if (sessionStorage.getItem(RETURN_TO_CART_FLAG) === '1') {
        sessionStorage.removeItem(RETURN_TO_CART_FLAG);
        setClientTab('cart');
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSavedSuccess(false);

    if (name.trim().length < 2) {
      setFormError(isArabic ? 'يرجى إدخال الاسم الكامل.' : 'Veuillez saisir votre nom complet.');
      return;
    }
    if (!isValidClientPhone(phone)) {
      setFormError(
        isArabic
          ? 'رقم الهاتف يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 8 أرقام.'
          : 'Le téléphone doit commencer par 05, 06 ou 07 et contenir 8 chiffres.'
      );
      return;
    }
    if (recoveryCode.trim() && !/^\d{4}$/.test(recoveryCode.trim())) {
      setFormError(
        isArabic ? 'رمز الاستعادة يجب أن يتكون من 4 أرقام.' : 'Le code de récupération doit contenir 4 chiffres.'
      );
      return;
    }

    setIsSaving(true);
    try {
      await saveCustomerProfile({
        name: name.trim(),
        phone: phone.trim(),
        // Wilaya/commune ne sont plus saisies (Tâche C) : on conserve la
        // valeur du profil, le serveur applique ses défauts sinon.
        wilaya: currentCustomer?.wilaya,
        commune: currentCustomer?.commune,
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        mapUrl: mapUrl.trim() || undefined,
        latitude,
        longitude,
        // recentAddresses non envoyé : le serveur préserve la liste existante.
        recoveryCode: recoveryCode.trim() || undefined,
      });
      setRecoveryCode('');
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      returnToCartIfRequested();
    } catch (err: any) {
      setFormError(err?.message || (isArabic ? 'فشل حفظ الملف الشخصي.' : 'L’enregistrement du profil a échoué.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverError('');
    if (!isValidClientPhone(recoverPhone)) {
      setRecoverError(
        isArabic
          ? 'رقم الهاتف يجب أن يبدأ بـ 05 أو 06 أو 07 ويتكون من 8 أرقام.'
          : 'Le téléphone doit commencer par 05, 06 ou 07 et contenir 8 chiffres.'
      );
      return;
    }
    if (!/^\d{4}$/.test(recoverCode.trim())) {
      setRecoverError(isArabic ? 'الرمز يجب أن يتكون من 4 أرقام.' : 'Le code doit contenir 4 chiffres.');
      return;
    }

    setIsRecovering(true);
    try {
      await recoverCustomerProfile(recoverPhone.trim(), recoverCode.trim());
      setShowRecovery(false);
      setRecoverPhone('');
      setRecoverCode('');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      returnToCartIfRequested();
    } catch (err: any) {
      setRecoverError(err?.message || (isArabic ? 'فشلت عملية الاستعادة.' : 'La récupération a échoué.'));
    } finally {
      setIsRecovering(false);
    }
  };

  const handleErase = async () => {
    setFormError('');
    try {
      await eraseCustomerProfile();
      setConfirmErase(false);
      setIsEditing(true);
      setName('');
      setPhone('');
      setAddress('');
      setLandmark('');
      setMapUrl('');
      setLatitude(undefined);
      setLongitude(undefined);
      setRecoveryCode('');
    } catch (err: any) {
      setFormError(err?.message || (isArabic ? 'فشل حذف البيانات.' : 'La suppression a échoué.'));
    }
  };

  const inputClass =
    'w-full bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:border-amber-500';
  const labelClass = 'text-[10px] text-zinc-600 dark:text-zinc-400';

  return (
    <div className="flex-1 overflow-y-auto p-3.5 pb-24 space-y-4">
      {/* Chargement initial du profil */}
      {customerProfileLoading && !hasProfile && (
        <div className="flex items-center justify-center py-6 text-zinc-400 dark:text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      )}

      {/* Carte profil : infos enregistrées ou formulaire vide */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-4 border border-zinc-250 dark:border-zinc-800 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-orange-400 flex items-center justify-center font-bold text-base">
              {currentCustomer?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                {hasProfile ? currentCustomer?.name : (isArabic ? 'ملفي الشخصي' : 'Mon profil')}
              </h3>
              {hasProfile ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono" dir="ltr">
                  {currentCustomer?.phone}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isArabic
                    ? 'أكمل معلوماتك لتأكيد طلبك الأول'
                    : 'Complétez vos informations pour votre première commande'}
                </p>
              )}
            </div>
          </div>

          {hasProfile && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[11px] font-semibold text-amber-700 dark:text-orange-400 hover:underline px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              {isEditing ? (isArabic ? 'إلغاء' : 'Annuler') : (isArabic ? 'تعديل' : 'Modifier')}
            </button>
          )}
        </div>

        {savedSuccess && (
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تم حفظ التعديلات بنجاح' : 'Coordonnées enregistrées avec succès'}</span>
          </div>
        )}

        {/* Affichage des infos enregistrées */}
        {hasProfile && !isEditing ? (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <span>
                {currentCustomer?.address || (isArabic ? 'لم يتم تسجيل عنوان' : 'Aucune adresse enregistrée')}
                {currentCustomer?.landmark ? ` (${currentCustomer.landmark})` : ''}
              </span>
            </div>
            {currentCustomer?.mapUrl && (
              <div className="flex items-center gap-2 pt-0.5">
                <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <a
                  href={currentCustomer.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                >
                  <span>{isArabic ? 'موقع GPS مسجل' : 'Position GPS enregistrée'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1 text-[11px]">
              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
              <span className={customerHasRecoveryCode ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}>
                {customerHasRecoveryCode
                  ? (isArabic ? 'رمز استعادة محدد' : 'Code de récupération défini')
                  : (isArabic ? 'لا يوجد رمز استعادة (اختياري)' : 'Aucun code de récupération (optionnel)')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
              <span>{t.ordersCount}: <strong className="text-zinc-900 dark:text-zinc-200">{currentCustomer?.orderCount || 0}</strong></span>
              <span>{t.totalSpent}: <strong className="text-amber-700 dark:text-amber-400">{currentCustomer?.totalSpent?.toLocaleString() || 0} {t.currency}</strong></span>
            </div>
          </div>
        ) : null}

        {/* Adresses récentes (max 3) : issues des « Autre adresse » utilisées
            lors de commandes précédentes ; supprimables une par une. */}
        {hasProfile && !isEditing && (currentCustomer?.recentAddresses?.length || 0) > 0 && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {isArabic ? 'العناوين الأخيرة :' : 'Adresses récentes :'}
            </span>
            {currentCustomer?.recentAddresses?.slice(0, 3).map((recent, index) => (
              <div
                key={`${recent.address}-${index}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400 shrink-0" />
                <span className="flex-1 text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug break-words">
                  {recent.address}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRemoveRecentAddress(recent.address)}
                  disabled={isRemovingRecent}
                  className="shrink-0 w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition disabled:opacity-50"
                  aria-label={isArabic ? 'حذف العنوان' : 'Supprimer cette adresse'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {(!hasProfile || isEditing) && (
          <form onSubmit={handleSaveProfile} className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
            <div>
              <label className={labelClass}>{t.fullName} *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.phoneNumber} *</label>
              <input
                type="tel"
                inputMode="tel"
                dir="ltr"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="05 / 06 / 07 + 8 chiffres"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>{isArabic ? 'العنوان (اختياري)' : 'Adresse (optionnelle)'}</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder={isArabic ? 'مثال: حي البساتين، الشارع الرئيسي' : 'Ex: Quartier Les Vergers, Rue principale'}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t.landmark}</label>
              <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} className={inputClass} />
            </div>

            {/* Code de récupération optionnel (4 chiffres) */}
            <div className="space-y-1 pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
              <label className={`${labelClass} flex items-center gap-1`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isArabic ? 'رمز الاستعادة (اختياري، 4 أرقام)' : 'Code de récupération (optionnel, 4 chiffres)'}
                </span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                dir="ltr"
                value={recoveryCode}
                onChange={e => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                placeholder={customerHasRecoveryCode ? '••••' : '0000'}
                className={`${inputClass} font-mono tracking-[0.4em]`}
              />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
                {isArabic
                  ? 'يُستخدم لاستعادة ملفك عند تغيير الهاتف. لا تشاركه مع أحد.'
                  : 'Sert à retrouver votre profil sur un autre appareil. Ne le partagez pas.'}
              </p>
            </div>

            <div className="space-y-1 pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
              <label className={`${labelClass} flex items-center gap-1`}>
                <Navigation className="w-3.5 h-3.5 text-amber-600 dark:text-orange-400" />
                <span>{t.gpsLocationLabel}</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGetGeolocation}
                  disabled={isLocating}
                  className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-amber-700 dark:text-orange-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-zinc-300 dark:border-zinc-700 shrink-0"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t.gettingLocation}</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'تحديد GPS' : 'Localiser GPS'}</span>
                    </>
                  )}
                </button>
                <input
                  type="url"
                  value={mapUrl}
                  onChange={e => setMapUrl(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>

            {formError && (
              <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold leading-relaxed">{formError}</p>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-60 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {language === 'ar' ? 'حفظ التعديلات' : 'Enregistrer'}
            </button>
          </form>
        )}
      </div>

      {/* J'ai déjà commandé : récupération par téléphone + code */}
      {!showRecovery ? (
        <button
          onClick={() => setShowRecovery(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-amber-700 dark:text-orange-400 bg-amber-500/10 border border-amber-500/25 rounded-2xl hover:bg-amber-500/15 transition"
        >
          <KeyRound className="w-4 h-4" />
          {isArabic ? 'لقد طلبت سابقاً من هاتف آخر' : 'J’ai déjà commandé (autre appareil)'}
        </button>
      ) : (
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-4 border border-zinc-250 dark:border-zinc-800 space-y-2.5 shadow-sm transition-colors text-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-orange-400" />
              {isArabic ? 'استعادة الملف الشخصي' : 'Récupérer mon profil'}
            </h3>
            <button
              onClick={() => { setShowRecovery(false); setRecoverError(''); }}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label={isArabic ? 'إغلاق' : 'Fermer'}
            >
              {isArabic ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isArabic
              ? 'أدخل رقم هاتفك والرمز الشخصي الذي حددته عند تسجيلك الأول لربط هذا الجهاز بملفك.'
              : 'Saisissez votre numéro et le code personnel défini lors de votre première inscription pour rattacher cet appareil à votre profil.'}
          </p>
          <form onSubmit={handleRecover} className="space-y-2.5">
            <div>
              <label className={labelClass}>{t.phoneNumber}</label>
              <input
                type="tel"
                dir="ltr"
                value={recoverPhone}
                onChange={e => setRecoverPhone(e.target.value)}
                placeholder="05 / 06 / 07 + 8 chiffres"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>{isArabic ? 'الرمز الشخصي (4 أرقام)' : 'Code personnel (4 chiffres)'}</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                dir="ltr"
                value={recoverCode}
                onChange={e => setRecoverCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className={`${inputClass} font-mono tracking-[0.4em]`}
              />
            </div>
            {recoverError && (
              <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold leading-relaxed">{recoverError}</p>
            )}
            <button
              type="submit"
              disabled={isRecovering}
              className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-60 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              {isRecovering && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isArabic ? 'استعادة' : 'Récupérer'}
            </button>
          </form>
        </div>
      )}

      {/* Effacer mes données */}
      {hasProfile && (
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-4 border border-zinc-250 dark:border-zinc-800 space-y-2 shadow-sm transition-colors text-xs">
          {!confirmErase ? (
            <button
              onClick={() => setConfirmErase(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-500/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            >
              <Trash2 className="w-4 h-4" />
              {isArabic ? 'حذف بياناتي' : 'Effacer mes données'}
            </button>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-red-700 dark:text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-semibold">
                  {isArabic
                    ? 'سيتم حذف ملفك الشخصي نهائياً من هذا الجهاز والخادم. هل تريد المتابعة؟'
                    : 'Votre profil sera définitivement supprimé de cet appareil et du serveur. Continuer ?'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmErase(false)}
                  className="flex-1 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  {isArabic ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  onClick={handleErase}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition"
                >
                  {isArabic ? 'نعم، احذف' : 'Oui, effacer'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Theme Preference Settings Card */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-4 border border-zinc-250 dark:border-zinc-800 space-y-2 shadow-sm transition-colors">
        <ThemeToggle variant="full" />
      </div>

      {/* PWA In-App Install Prompt Card */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-250 dark:border-zinc-800 space-y-2 shadow-sm transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-600 dark:text-orange-400" />
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {isArabic ? 'اللغة' : 'Langue'}
            </span>
          </div>
          <button
            onClick={() => setLanguage(isArabic ? 'fr' : 'ar')}
            className="px-3 py-1.5 text-[11px] font-bold text-amber-700 dark:text-orange-400 bg-amber-500/10 border border-amber-500/25 rounded-lg hover:bg-amber-500/15 transition"
          >
            {isArabic ? 'Français' : 'العربية'}
          </button>
        </div>
      </div>

      {/* PWA install / iOS hint */}
      {!isInstalled && (isInstallable || isIOS) && (
        <div className="bg-white dark:bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-250 dark:border-zinc-800 shadow-sm transition-colors">
          {isIOS ? (
            <button onClick={() => setShowIOSModal(true)} className="text-xs font-bold text-amber-700 dark:text-orange-400">
              {isArabic ? 'إضافة إلى الشاشة الرئيسية (iPhone)' : 'Ajouter à l’écran d’accueil (iPhone)'}
            </button>
          ) : (
            <button onClick={install} className="text-xs font-bold text-amber-700 dark:text-orange-400">
              {isArabic ? 'تثبيت التطبيق' : 'Installer l’application'}
            </button>
          )}
        </div>
      )}

      {showIOSModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowIOSModal(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 max-w-[320px] space-y-2 text-xs text-zinc-800 dark:text-zinc-200" onClick={e => e.stopPropagation()}>
            <h4 className="font-bold text-sm">{isArabic ? 'إضافة إلى الشاشة الرئيسية' : 'Ajouter à l’écran d’accueil'}</h4>
            <p className="leading-relaxed">
              {isArabic
                ? '١. اضغط على زر المشاركة في سفاري · ٢. اختر «إضافة إلى الشاشة الرئيسية»'
                : '1. Touchez le bouton Partager dans Safari · 2. Choisissez « Sur l’écran d’accueil »'}
            </p>
            <button onClick={() => setShowIOSModal(false)} className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold">
              {isArabic ? 'فهمت' : 'Compris'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
