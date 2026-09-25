import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { User, Phone, MapPin, Globe, Download, LogOut, RotateCcw, Check, Sparkles, Clock } from 'lucide-react';

export const ClientProfile: React.FC = () => {
  const {
    currentCustomer,
    registerOrLoginCustomer,
    logoutCustomer,
    orders,
    reorderPastOrder,
    setClientActiveOrder,
    setClientTab,
    language,
    setLanguage,
    settings,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Edit address state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentCustomer?.name || '');
  const [phone, setPhone] = useState(currentCustomer?.phone || '');
  const [commune, setCommune] = useState(currentCustomer?.commune || 'Birkhadem');
  const [address, setAddress] = useState(currentCustomer?.address || '');
  const [landmark, setLandmark] = useState(currentCustomer?.landmark || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const customerOrders = orders.filter(o => o.customerId === currentCustomer?.id || o.customerPhone === currentCustomer?.phone);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    registerOrLoginCustomer({
      name,
      phone,
      commune,
      address,
      landmark,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 pb-24 space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-base shadow-md">
            {currentCustomer?.name?.charAt(0) || 'S'}
          </div>
          <div className="space-y-0.5 flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">
              {currentCustomer?.name || (isArabic ? 'زبون سلطان الدجاج' : 'Client Sultan')}
            </h3>
            <p className="text-xs text-zinc-400 font-mono" dir="ltr">
              {currentCustomer?.phone || '+213 771 00 00 00'}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20"
          >
            {isEditing ? (isArabic ? 'إلغاء' : 'Annuler') : (isArabic ? 'تعديل' : 'Modifier')}
          </button>
        </div>

        {savedSuccess && (
          <div className="p-2 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تم حفظ التعديلات بنجاح' : 'Coordonnées enregistrées avec succès'}</span>
          </div>
        )}

        {/* Address Card or Edit Form */}
        {!isEditing ? (
          <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 text-xs text-zinc-300">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
              <span>
                {currentCustomer?.address || 'Birkhadem'}, {currentCustomer?.commune || 'Birkhadem'}
                {currentCustomer?.landmark ? ` (${currentCustomer.landmark})` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
              <span>{t.ordersCount}: <strong className="text-zinc-200">{currentCustomer?.orderCount || 0}</strong></span>
              <span>{t.totalSpent}: <strong className="text-amber-400">{currentCustomer?.totalSpent?.toLocaleString() || 0} {t.currency}</strong></span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="pt-2 border-t border-zinc-800 space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-zinc-400">{t.fullName}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400">{t.phoneNumber}</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400">{t.commune}</label>
                <input
                  type="text"
                  value={commune}
                  onChange={e => setCommune(e.target.value)}
                  className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400">{t.landmark}</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-400">{t.address}</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold"
            >
              {language === 'ar' ? 'حفظ التعديلات' : 'Enregistrer'}
            </button>
          </form>
        )}
      </div>

      {/* PWA In-App Install Prompt Card */}
      <div className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {isArabic ? 'تطبيق الهاتف المحمول (PWA)' : 'Application Mobile (PWA)'}
              </h4>
              <p className="text-[10px] text-zinc-400">
                {isArabic ? 'قابل للتثبيت مباشرة على شاشتك الرئيسية' : 'Installable directement sur votre écran d\'accueil'}
              </p>
            </div>
          </div>
        </div>

        {isInstalled ? (
          <div className="text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{t.installedPwa}</span>
          </div>
        ) : isInstallable ? (
          <button
            onClick={install}
            className="w-full py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            {t.installPwa}
          </button>
        ) : isIOS ? (
          <button
            onClick={() => setShowIOSModal(true)}
            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition"
          >
            {isArabic ? 'تثبيت على iPhone / iPad (iOS)' : 'Installer sur iPhone / iPad (iOS)'}
          </button>
        ) : (
          <p className="text-[10px] text-zinc-500 italic">
            {isArabic ? 'متوافق مع كروم، سفاري، أندرويد وآيفون' : 'Compatible Chrome, Safari, Android & iOS'}
          </p>
        )}
      </div>

      {/* Orders History & Reorder */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
          {t.orderHistory} ({customerOrders.length})
        </h4>

        {customerOrders.length === 0 ? (
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500">
            {t.noPastOrders}
          </div>
        ) : (
          <div className="space-y-2">
            {customerOrders.map(order => (
              <div
                key={order.id}
                className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">{order.orderNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === 'delivered'
                        ? 'bg-emerald-950 text-emerald-400'
                        : order.status === 'cancelled'
                        ? 'bg-red-950 text-red-400'
                        : 'bg-orange-950 text-orange-400 animate-pulse'
                    }`}
                  >
                    {order.status === 'delivered'
                      ? t.statusDelivered
                      : order.status === 'cancelled'
                      ? t.statusCancelled
                      : t.statusPreparing}
                  </span>
                </div>

                <div className="text-[11px] text-zinc-300">
                  {order.items.map(it => `${it.quantity}x ${isArabic ? it.nameAr : it.nameFr}`).join(', ')}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                  <span className="font-extrabold text-white">
                    {order.total.toLocaleString()} {t.currency}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setClientActiveOrder(order);
                        setClientTab('tracking');
                      }}
                      className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-[10px] hover:bg-zinc-700"
                    >
                      {t.viewTracking}
                    </button>
                    <button
                      onClick={() => reorderPastOrder(order)}
                      className="px-2.5 py-1 rounded bg-orange-600/90 hover:bg-orange-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t.reorder}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Language Switch */}
      <div className="bg-zinc-900/90 rounded-2xl p-3 border border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <Globe className="w-4 h-4 text-orange-400" />
          <span>{isArabic ? 'لغة التطبيق' : 'Langue de l\'application'}</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg border border-zinc-700">
          <button
            onClick={() => setLanguage('fr')}
            className={`px-2 py-1 rounded text-xs font-bold transition ${
              language === 'fr' ? 'bg-orange-600 text-white' : 'text-zinc-400'
            }`}
          >
            Français
          </button>
          <button
            onClick={() => setLanguage('ar')}
            className={`px-2 py-1 rounded text-xs font-bold transition ${
              language === 'ar' ? 'bg-orange-600 text-white' : 'text-zinc-400'
            }`}
          >
            عربي
          </button>
        </div>
      </div>

      {/* Restaurant Contact Details */}
      <div className="bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800 space-y-1.5 text-xs text-zinc-400">
        <h5 className="font-bold text-zinc-200">{isArabic ? 'سلطان الدجاج (Sultan Ed-Djaj)' : 'Sultan Ed-Djaj (سلطان الدجاج)'}</h5>
        <p>{isArabic ? 'حي البساتين، بئر خادم، الجزائر العاصمة' : 'Les Vergers, Birkhadem, Alger'}</p>
        <p>{isArabic ? 'مفتوح يومياً من 13:00 إلى 00:00' : 'Ouvert tous les jours de 13h00 à 00h00'}</p>
        <p className="text-orange-400 font-mono" dir="ltr">{settings.phone}</p>
      </div>

      {/* Logout button */}
      <button
        onClick={logoutCustomer}
        className="w-full py-2.5 rounded-xl border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>{t.logout}</span>
      </button>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xs bg-zinc-900 border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-3 text-start">
            <h4 className="text-sm font-bold text-white">
              {isArabic ? 'التثبيت على iPhone / iPad' : 'Installer sur iPhone / iPad'}
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {isArabic ? (
                <>
                  1. اضغط على زر <strong>مشاركة (Partager)</strong> <span className="text-blue-400">⎋</span> في شريط Safari.<br />
                  2. انزل للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Sur l'écran d'accueil)</strong>.
                </>
              ) : (
                <>
                  1. Appuyez sur le bouton <strong>Partager</strong> <span className="text-blue-400">⎋</span> dans la barre d'outils Safari.<br />
                  2. Faites défiler vers le bas et appuyez sur <strong>Sur l'écran d'accueil</strong>.
                </>
              )}
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl"
            >
              {isArabic ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
