import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { OrderType } from '../../types';
import { soundService } from '../../services/sound';
import { isValidClientPhone } from '../../services/customerService';
import { GeolocationPicker, DeliveryAddressData } from './GeolocationPicker';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageSquare,
  Loader2,
  User,
  Phone,
} from 'lucide-react';

export const ClientCart: React.FC = () => {
  const {
    cart,
    cartTotal,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
    saveCustomerProfile,
    settings,
    currentCustomer,
    language,
    isStoreActuallyOpen,
    setClientTab,
  } = useApp();
  const navigate = useNavigate();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [kitchenNotes, setKitchenNotes] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState(t.asap);

  // Coordonnées client (Tâche C) : saisies ici, pré-remplies depuis le profil.
  const [customerName, setCustomerName] = useState(currentCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentCustomer?.phone || '');

  // Pré-remplissage / synchronisation : au chargement du profil ou quand il
  // CHANGE (récupération sur autre appareil), sans jamais écraser la saisie
  // en cours du même profil.
  const lastProfileIdRef = useRef<string | null>(currentCustomer?.id || null);
  useEffect(() => {
    if (!currentCustomer) {
      lastProfileIdRef.current = null;
      return;
    }
    if (lastProfileIdRef.current === currentCustomer.id) return;
    lastProfileIdRef.current = currentCustomer.id;
    setCustomerName(currentCustomer.name || '');
    setCustomerPhone(currentCustomer.phone || '');
  }, [currentCustomer]);

  // Adresse de livraison fournie par GeolocationPicker (GPS, profil ou autre).
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddressData>({
    address: currentCustomer?.address || '',
    landmark: currentCustomer?.landmark || '',
    latitude: currentCustomer?.latitude,
    longitude: currentCustomer?.longitude,
    otherAddressUsed: false,
  });

  // Validation champ par champ : message affiché SOUS le champ concerné.
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const addressCardRef = useRef<HTMLDivElement>(null);

  const trimmedName = customerName.trim();
  const normalizedPhone = customerPhone.replace(/[\s.-]/g, '');
  const profileComplete = trimmedName.length >= 2 && isValidClientPhone(normalizedPhone);

  const deliveryFee = orderType === 'delivery' ? settings.deliveryFee : 0;
  const grandTotal = cartTotal + deliveryFee;

  const pickupSlots = [
    t.asap,
    'Dans 15-20 min',
    'Dans 30-40 min',
    'Dans 1 heure',
    'Ce midi (12h30 - 13h30)',
    'Ce soir (19h30 - 21h00)',
  ];

  const createUuid = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
      const random = Math.floor(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  };

  const getCheckoutAttempt = () => {
    const fingerprint = JSON.stringify({
      cart,
      orderType,
      selectedAddress,
      pickupTimeSlot,
      kitchenNotes: kitchenNotes.trim(),
      customerName: trimmedName,
      customerPhone: normalizedPhone,
    });
    const storageKey = 'sultan_checkout_attempt_v1';

    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.fingerprint === fingerprint &&
          parsed?.clientRequestId &&
          parsed?.accessToken
        ) {
          return {
            clientRequestId: parsed.clientRequestId as string,
            accessToken: parsed.accessToken as string,
          };
        }
      }
    } catch {
      // Un nouvel identifiant en mémoire reste préférable à un blocage.
    }

    const attempt = {
      fingerprint,
      clientRequestId: createUuid(),
      accessToken: `${createUuid()}${createUuid()}`,
    };

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(attempt));
    } catch {
      // ignore
    }

    return {
      clientRequestId: attempt.clientRequestId,
      accessToken: attempt.accessToken,
    };
  };

  const clearCheckoutAttempt = () => {
    try {
      sessionStorage.removeItem('sultan_checkout_attempt_v1');
    } catch {
      // ignore
    }
  };

  // Réception de l'adresse du picker : efface l'erreur dès qu'elle est valide.
  const handleAddressSelect = (data: DeliveryAddressData) => {
    setSelectedAddress(data);
    if (data.address.trim()) setAddressError(null);
  };

  // « Compléter » : défile jusqu'au champ manquant et lui donne le focus.
  const handleCompleteProfile = () => {
    if (trimmedName.length < 2) {
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInputRef.current?.focus();
    } else if (!isValidClientPhone(normalizedPhone)) {
      phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      phoneInputRef.current?.focus();
    }
  };

  // Enregistrement automatique du profil après une commande réussie :
  // nom, téléphone et adresse principale (GPS) ; « Autre adresse » ne remplace
  // PAS l'adresse principale, elle alimente la liste « Adresses récentes ».
  const persistProfileAfterOrder = async () => {
    try {
      const profile = currentCustomer || null;
      const usedOther = selectedAddress.otherAddressUsed;
      const mapUrl =
        selectedAddress.latitude != null && selectedAddress.longitude != null
          ? `https://maps.google.com/?q=${selectedAddress.latitude},${selectedAddress.longitude}`
          : undefined;

      const mainAddress = usedOther
        ? {
            address: profile?.address || '',
            landmark: profile?.landmark || undefined,
            mapUrl: profile?.mapUrl,
            latitude: profile?.latitude,
            longitude: profile?.longitude,
          }
        : {
            address: selectedAddress.address.trim() || profile?.address || '',
            landmark: selectedAddress.landmark || profile?.landmark || undefined,
            mapUrl,
            latitude: selectedAddress.latitude ?? profile?.latitude,
            longitude: selectedAddress.longitude ?? profile?.longitude,
          };

      const previousRecent = profile?.recentAddresses || [];
      const otherText = usedOther ? selectedAddress.address.trim() : '';
      const recentAddresses = otherText
        ? [
            {
              address: otherText,
              landmark: selectedAddress.landmark || null,
              mapUrl: mapUrl || null,
              latitude: selectedAddress.latitude ?? null,
              longitude: selectedAddress.longitude ?? null,
            },
            ...previousRecent.filter(r => r.address !== otherText),
          ].slice(0, 3)
        : previousRecent;

      await saveCustomerProfile({
        name: trimmedName,
        phone: normalizedPhone,
        wilaya: profile?.wilaya,
        commune: profile?.commune,
        ...mainAddress,
        recentAddresses,
      });
    } catch {
      // La commande est déjà enregistrée : l'échec du profil ne doit jamais
      // bloquer la redirection vers le suivi. La prochaine commande réessayera.
    }
  };

  const handleConfirmOrder = async () => {
    if (submitLockRef.current) return;

    setFormError(null);
    setSubmitFailed(false);
    setNameError(null);
    setPhoneError(null);
    setAddressError(null);

    // Débloque l'audio sur ce geste utilisateur : les navigateurs bloquent la
    // lecture tant qu'aucune interaction n'a eu lieu (sonneries de suivi).
    soundService.unlockAudio();

    if (!isStoreActuallyOpen) {
      setFormError(t.storeClosedCannotOrder);
      return;
    }

    if (cart.length === 0) return;

    // Validation champ par champ : le premier champ invalide reçoit le focus.
    if (trimmedName.length < 2) {
      setNameError(
        isArabic ? 'يرجى إدخال الاسم واللقب (حرفان على الأقل).' : 'Veuillez saisir votre nom et prénom (2 caractères minimum).'
      );
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInputRef.current?.focus();
      return;
    }

    if (!isValidClientPhone(normalizedPhone)) {
      setPhoneError(
        isArabic ? 'رقم هاتف غير صحيح : 05 أو 06 أو 07 متبوعاً بـ 8 أرقام.' : 'Téléphone invalide : 05, 06 ou 07 suivi de 8 chiffres.'
      );
      phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      phoneInputRef.current?.focus();
      return;
    }

    if (orderType === 'delivery' && !selectedAddress.address.trim()) {
      setAddressError(
        isArabic
          ? 'يرجى تحديد موقعك أو إدخال عنوان التوصيل.'
          : 'Utilisez votre position, une adresse récente, ou cochez « Autre adresse ».'
      );
      addressCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const attempt = getCheckoutAttempt();
    const itemsSnapshot = [...cart];
    const addressSnapshot = { ...selectedAddress };

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const order = await placeOrder({
        type: orderType,
        items: itemsSnapshot,
        clientRequestId: attempt.clientRequestId,
        accessToken: attempt.accessToken,
        customerName: trimmedName,
        customerPhone: normalizedPhone,
        deliveryAddress:
          orderType === 'delivery'
            ? {
                wilaya: currentCustomer?.wilaya || 'Alger',
                commune: currentCustomer?.commune || 'Birkhadem',
                address: addressSnapshot.address.trim(),
                landmark: addressSnapshot.landmark,
                mapUrl:
                  addressSnapshot.latitude != null && addressSnapshot.longitude != null
                    ? `https://maps.google.com/?q=${addressSnapshot.latitude},${addressSnapshot.longitude}`
                    : undefined,
                latitude: addressSnapshot.latitude,
                longitude: addressSnapshot.longitude,
              }
            : undefined,
        pickupTimeSlot: orderType === 'pickup' ? pickupTimeSlot : undefined,
        kitchenNotes: kitchenNotes.trim() || undefined,
      });

      if (!order) {
        throw new Error(
          isArabic
            ? 'لم يتم تأكيد الطلب من طرف الخادم.'
            : 'La confirmation du serveur n’a pas été reçue.'
        );
      }

      clearCheckoutAttempt();

      // Sauvegarde automatique du profil (nom, téléphone, adresse principale,
      // adresses récentes) — sans jamais bloquer le suivi de la commande.
      void persistProfileAfterOrder();

      // Redirection automatique vers la page de suivi de la commande.
      try {
        navigate(`/commande/${encodeURIComponent(order.id)}`);
      } catch {
        setConfirmedOrderNumber(order.orderNumber);
      }
    } catch (err: any) {
      setSubmitFailed(true);
      setFormError(
        isArabic
          ? 'فشل إرسال الطلب. تم الاحتفاظ بسلة المشتريات، يرجى التحقق من الاتصال ثم إعادة المحاولة.'
          : (err?.message || 'L’envoi de la commande a échoué. Votre panier est conservé, vérifiez votre connexion puis réessayez.')
      );
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (confirmedOrderNumber) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">
            {isArabic ? 'تم تأكيد الطلب' : 'Commande confirmée'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isArabic ? 'رقم الطلب :' : 'Numéro de commande :'}
          </p>
          <p className="text-lg font-black text-orange-600 dark:text-orange-400 font-mono">
            {confirmedOrderNumber}
          </p>
        </div>
        <button
          onClick={() => setClientTab('tracking')}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black rounded-2xl shadow-md shadow-orange-950/20 transition active:scale-95"
        >
          {isArabic ? 'تابع طلبي' : 'Suivre ma commande'}
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">{t.cartEmpty}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[260px] leading-relaxed">
            {t.cartEmptySubtitle}
          </p>
        </div>
        <button
          onClick={() => setClientTab('menu')}
          className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black rounded-2xl shadow-md shadow-orange-950/20 transition active:scale-95"
        >
          {t.exploreMenu}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3.5 pb-28 space-y-4 text-zinc-900 dark:text-zinc-100">
      {/* Title & Clear Cart */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-orange-500" />
          <span>{t.cartTitle} ({cart.length})</span>
        </h2>

        <button
          onClick={clearCart}
          className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isArabic ? 'تفريغ' : 'Vider'}</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="space-y-2">
        {cart.map(item => (
          <div
            key={item.productId}
            className="flex items-center justify-between bg-white dark:bg-[#16161a] p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs"
          >
            <div className="space-y-0.5 flex-1 min-w-0 pr-2">
              <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate">
                {isArabic ? item.nameAr : item.nameFr}
              </h4>
              <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                {item.price.toLocaleString()} {t.currency}
              </p>
              {item.notes && (
                <p className="text-[10px] text-zinc-500 italic truncate">
                  « {item.notes} »
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    if (item.quantity === 1) {
                      removeFromCart(item.productId);
                    } else {
                      updateCartQuantity(item.productId, item.quantity - 1);
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition active:scale-95"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <span className="w-6 text-center text-xs font-black text-zinc-900 dark:text-zinc-100">
                  {item.quantity}
                </span>

                <button
                  type="button"
                  onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <span className="text-xs font-black min-w-[60px] text-end">
                {(item.price * item.quantity).toLocaleString()} {t.currency}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Carte « Profil incomplet » : uniquement si nom ou téléphone manquant */}
      {!profileComplete && (
        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-300 dark:border-amber-500/40 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-orange-400 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-amber-800 dark:text-amber-400 truncate">
                  {isArabic ? 'المعلومات ناقصة' : 'Profil incomplet'}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-500/90">
                  {isArabic ? 'الاسم ورقم الهاتف مطلوبان لإتمام الطلب' : 'Nom et téléphone requis pour finaliser'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCompleteProfile}
              className="shrink-0 text-[11px] font-bold text-amber-800 dark:text-amber-400 hover:underline px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30"
            >
              {isArabic ? 'إكمال' : 'Compléter'}
            </button>
          </div>
        </div>
      )}

      {/* Vos coordonnées : Nom & Prénom + Téléphone (toujours visibles) */}
      <div className="bg-white dark:bg-[#16161a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5">
        <label className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
          <User className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{isArabic ? 'معلوماتك :' : 'Vos coordonnées :'}</span>
        </label>

        <div>
          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
            {isArabic ? 'الاسم واللقب *' : 'Nom & Prénom *'}
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={customerName}
            onChange={e => {
              setCustomerName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder={isArabic ? 'مثال: محمد بن عمر' : 'Ex: Amine Benali'}
            autoComplete="name"
            className={`w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition ${
              nameError
                ? 'border-red-400 dark:border-red-500/60'
                : 'border-zinc-300 dark:border-zinc-700'
            }`}
          />
          {nameError && (
            <p className="mt-1 text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {nameError}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
            {isArabic ? 'رقم الهاتف *' : 'Téléphone *'}
          </label>
          <input
            ref={phoneInputRef}
            type="tel"
            inputMode="tel"
            dir="ltr"
            value={customerPhone}
            onChange={e => {
              setCustomerPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            placeholder="05 XX XX XX XX"
            autoComplete="tel"
            className={`w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition ${
              phoneError
                ? 'border-red-400 dark:border-red-500/60'
                : 'border-zinc-300 dark:border-zinc-700'
            }`}
          />
          {phoneError && (
            <p className="mt-1 text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {phoneError}
            </p>
          )}
        </div>
      </div>

      {/* Mode Toggle: Livraison vs À emporter */}
      <div className="bg-white dark:bg-[#16161a] p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
          {isArabic ? 'نوع الطلب :' : 'Mode de commande :'}
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOrderType('delivery')}
            className={`h-11 px-3 rounded-xl border font-black text-xs flex items-center justify-center gap-2 transition ${
              orderType === 'delivery'
                ? 'bg-orange-500/10 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400'
                : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{isArabic ? 'توصيل للمنزل' : 'Livraison'}</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('pickup')}
            className={`h-11 px-3 rounded-xl border font-black text-xs flex items-center justify-center gap-2 transition ${
              orderType === 'pickup'
                ? 'bg-orange-500/10 dark:bg-orange-950/40 border-orange-500 text-orange-600 dark:text-orange-400'
                : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{isArabic ? 'استلام من المطعم' : 'À emporter'}</span>
          </button>
        </div>
      </div>

      {/* CONDITIONAL STEP: Livraison → adresse (GPS / récente / autre) ; À emporter → créneau */}
      {orderType === 'delivery' ? (
        <div ref={addressCardRef} className="space-y-2">
          <GeolocationPicker
            key={currentCustomer?.id || 'anonymous'}
            initialAddress={{
              address: currentCustomer?.address || '',
              landmark: currentCustomer?.landmark || '',
              latitude: currentCustomer?.latitude,
              longitude: currentCustomer?.longitude,
            }}
            recentAddresses={currentCustomer?.recentAddresses || []}
            onAddressSelect={handleAddressSelect}
          />
          {addressError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{addressError}</span>
            </div>
          )}
        </div>
      ) : (
        /* À emporter (Pickup) Slot Selector */
        <div className="bg-white dark:bg-[#16161a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5">
          <label className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-orange-500 shrink-0" />
            <span>{isArabic ? 'وقت الاستلام المحدد :' : "Heure d'enlèvement souhaitée :"}</span>
          </label>

          <select
            value={pickupTimeSlot}
            onChange={e => setPickupTimeSlot(e.target.value)}
            className="w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
          >
            {pickupSlots.map((slot, idx) => (
              <option key={idx} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kitchen Notes */}
      <div className="bg-white dark:bg-[#16161a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-orange-500 shrink-0" />
          <span>{isArabic ? 'ملاحظات خاصة للمطبخ :' : 'Instructions particulières :'}</span>
        </label>
        <input
          type="text"
          value={kitchenNotes}
          onChange={e => setKitchenNotes(e.target.value)}
          placeholder={isArabic ? 'مثال: بدون صلصة، طهي محمر جيدا...' : 'Ex: Bien rôti, sans piquant...'}
          className="w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
        />
      </div>

      {/* Total & Checkout Summary */}
      <div className="bg-white dark:bg-[#16161a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2 text-xs">
        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>{isArabic ? 'مجموع المنتجات :' : 'Sous-total :'}</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">{cartTotal.toLocaleString()} {t.currency}</span>
        </div>

        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>{isArabic ? 'رسوم التوصيل :' : 'Frais de livraison :'}</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {orderType === 'delivery' ? `${deliveryFee.toLocaleString()} ${t.currency}` : (isArabic ? 'مجاني (في المطعم)' : 'Gratuit')}
          </span>
        </div>

        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-baseline font-black text-sm text-zinc-900 dark:text-white">
          <span>{isArabic ? 'المجموع الإجمالي :' : 'Total à payer :'}</span>
          <span className="text-base text-orange-600 dark:text-orange-400">
            {grandTotal.toLocaleString()} {t.currency}
          </span>
        </div>
      </div>

      {/* Form Error alert */}
      {formError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="flex-1">{formError}</span>
          {submitFailed && (
            <button
              type="button"
              onClick={() => void handleConfirmOrder()}
              disabled={isSubmitting || !isStoreActuallyOpen}
              className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-black transition active:scale-95"
            >
              {isArabic ? 'إعادة المحاولة' : 'Réessayer'}
            </button>
          )}
        </div>
      )}

      {/* Place Order Button */}
      <button
        type="button"
        onClick={() => void handleConfirmOrder()}
        disabled={isSubmitting}
        className="w-full h-13 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-60 disabled:cursor-wait text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-950/30 transition active:scale-[0.98] cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{isArabic ? 'جارٍ الإرسال...' : 'Envoi en cours...'}</span>
          </>
        ) : (
          <>
            <span>{submitFailed ? (isArabic ? 'إعادة المحاولة' : 'Réessayer') : (isArabic ? 'تأكيد وإرسال الطلب' : 'Valider la commande')}</span>
            <ArrowRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
    </div>
  );
};
