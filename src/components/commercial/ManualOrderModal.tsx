import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { OrderType, OrderItem, PaymentMethod, OrderSource, Product, Customer } from '../../types';
import {
  PlusCircle,
  X,
  Plus,
  Minus,
  Motorbike,
  Store,
  Banknote,
  ShoppingBag,
  Phone,
  CreditCard,
  Smartphone,
  MessageCircle,
  Search,
  Check,
  Send,
  Clock,
  MapPin,
  Flame,
} from 'lucide-react';
import { sendToWhatsApp } from '../../services/whatsappService';

interface ManualOrderModalProps {
  onClose: () => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ onClose }) => {
  const {
    products,
    customers,
    addManualOrder,
    settings,
    language,
    currentDay,
    dailyChickenRemaining,
  } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  // Client info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('0770');
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);

  // Type & Source
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [source, setSource] = useState<OrderSource>('phone');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  // Delivery details
  const [customDeliveryFee, setCustomDeliveryFee] = useState<number>(settings.deliveryFee);
  const [commune, setCommune] = useState('Birkhadem');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverFee, setDriverFee] = useState('');

  // Comptoir details
  const [pickupTimeSlotType, setPickupTimeSlotType] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledPickupTime, setScheduledPickupTime] = useState('');

  // Articles & Notes
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [kitchenNotes, setKitchenNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  // Autocomplete suggestions based on customer phone
  const phoneSuggestions = useMemo(() => {
    const clean = customerPhone.replace(/\s+/g, '');
    if (clean.length < 3) return [];
    return customers.filter(c => c.phone.replace(/\s+/g, '').includes(clean)).slice(0, 5);
  }, [customers, customerPhone]);

  const handleSelectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    if (c.commune) setCommune(c.commune);
    if (c.address && c.address !== 'Au comptoir') setAddress(c.address);
    if (c.landmark) setLandmark(c.landmark);
    if (c.mapUrl) setMapUrl(c.mapUrl);
    setIsPhoneDropdownOpen(false);
  };

  const setQty = (id: string, delta: number) => {
    const cur = quantities[id] || 0;
    const next = Math.max(0, cur + delta);
    setQuantities(prev => ({ ...prev, [id]: next }));
  };

  const selectedItems: OrderItem[] = products
    .filter(p => (quantities[p.id] || 0) > 0)
    .map(p => ({
      productId: p.id,
      nameFr: p.nameFr,
      nameAr: p.nameAr,
      price: p.price,
      quantity: quantities[p.id],
    }));

  const subtotal = selectedItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const effectiveDeliveryFee = orderType === 'delivery' ? Math.max(0, customDeliveryFee) : 0;
  const grandTotal = subtotal + effectiveDeliveryFee;

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      p =>
        p.nameFr.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q) ||
        (p.descriptionFr && p.descriptionFr.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  // Validation function
  const validateForm = (): boolean => {
    if (!currentDay) {
      setErrorMsg(
        isArabic
          ? 'لا يوجد يوم مفتوح حالياً. يرجى فتح اليوم أولاً.'
          : 'Aucune journée ouverte. Veuillez ouvrir la journée avant de créer une commande.'
      );
      return false;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg(
        isArabic
          ? 'يرجى إدخال اسم وهاتف الزبون.'
          : 'Veuillez renseigner le nom et le téléphone du client.'
      );
      return false;
    }
    if (selectedItems.length === 0) {
      setErrorMsg(
        isArabic ? 'يرجى اختيار منتج واحد على الأقل.' : 'Veuillez ajouter au moins un produit.'
      );
      return false;
    }
    const requestedChickens = selectedItems.reduce((sum, it) => {
      if (it.productId === 'prod-1' || it.productId === 'prod-2') {
        return sum + it.quantity;
      }
      return sum;
    }, 0);
    if (requestedChickens > 0 && requestedChickens > dailyChickenRemaining) {
      setErrorMsg(
        isArabic
          ? `الكمية المتبقية من الدجاج (${dailyChickenRemaining}) غير كافية لهذا الطلب.`
          : `Stock de poulets insuffisant (${dailyChickenRemaining} restant(s) pour aujourd'hui).`
      );
      return false;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setErrorMsg(
        isArabic ? 'يرجى إدخال عنوان التوصيل.' : "Veuillez renseigner l'adresse de livraison."
      );
      return false;
    }
    setErrorMsg('');
    return true;
  };

  // Helper to submit with different action targets
  const handleCreateOrder = (action: 'create' | 'create_and_whatsapp' | 'create_and_accept') => {
    if (!validateForm()) return;

    const feeNum = driverFee ? parseFloat(driverFee) : undefined;
    const slot =
      orderType === 'pickup'
        ? pickupTimeSlotType === 'asap'
          ? 'Dès que possible'
          : scheduledPickupTime || 'Dès que possible'
        : undefined;

    const initialStatus = action === 'create_and_accept' ? 'preparing' : 'pending';
    const sentToWhatsApp = action === 'create_and_whatsapp';
    const nowIso = new Date().toISOString();

    const newOrder = addManualOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      type: orderType,
      status: initialStatus,
      source,
      paymentMethod,
      driverName: orderType === 'delivery' && driverName.trim() ? driverName.trim() : undefined,
      driverFee: orderType === 'delivery' && feeNum !== undefined ? feeNum : undefined,
      items: selectedItems,
      deliveryFee: effectiveDeliveryFee,
      deliveryAddress:
        orderType === 'delivery'
          ? {
              wilaya: 'Alger',
              commune: commune.trim() || 'Birkhadem',
              address: address.trim(),
              landmark: landmark.trim() || undefined,
              mapUrl: mapUrl.trim() || undefined,
            }
          : undefined,
      pickupTimeSlot: slot,
      kitchenNotes: kitchenNotes.trim() || undefined,
      sentToWhatsApp,
      sentAt: sentToWhatsApp ? nowIso : undefined,
    });

    if (action === 'create_and_whatsapp' && newOrder) {
      // Trigger WhatsApp open
      try {
        sendToWhatsApp(newOrder);
      } catch (err) {
        console.warn('Erreur ouverture WhatsApp:', err);
      }
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        dir={isArabic ? 'rtl' : 'ltr'}
        className="bg-zinc-900 border border-zinc-700 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94dvh] text-zinc-100 animate-scaleUp"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t.addManualOrder} ({isArabic ? 'هاتف / منضدة' : 'Téléphone / Comptoir'})
              </h3>
              <p className="text-[10px] text-zinc-400">
                {isArabic
                  ? 'تسجيل طلب سريع مع حساب فوري وتحديث حصة الدجاج'
                  : 'Saisie rapide avec décrémentation automatique du quota journalier'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl font-medium animate-fadeIn">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* 1. Mode de service & Origine (Segmenté) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Mode: Livraison vs Comptoir */}
            <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/80 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 block">
                {isArabic ? 'نوع الطلب :' : 'Type de commande :'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('delivery');
                    if (source === 'counter') setSource('phone');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition ${
                    orderType === 'delivery'
                      ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-950/40'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Motorbike className="w-4 h-4" />
                  <span>{isArabic ? 'توصيل' : 'Livraison'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType('pickup');
                    if (source === 'phone') setSource('counter');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition ${
                    orderType === 'pickup'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>{isArabic ? 'استلام (منضدة)' : 'Comptoir'}</span>
                </button>
              </div>
            </div>

            {/* Source de la commande */}
            <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/80 space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 block">
                {isArabic ? 'مصدر الطلب :' : 'Origine de la commande :'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSource('phone')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-[11px] transition ${
                    source === 'phone'
                      ? 'bg-orange-600/25 border-orange-500 text-orange-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'هاتف' : 'Téléphone'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSource('counter')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-[11px] transition ${
                    source === 'counter'
                      ? 'bg-amber-600/25 border-amber-500 text-amber-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'منضدة' : 'Comptoir'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSource('whatsapp')}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-[11px] transition ${
                    source === 'whatsapp'
                      ? 'bg-emerald-600/25 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Client & Téléphone avec Autocomplétion */}
          <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/80 space-y-2.5 relative">
            <h4 className="font-bold text-zinc-200 flex items-center justify-between">
              <span>{isArabic ? 'بيانات الزبون' : 'Coordonnées du client'}</span>
              <span className="text-[10px] font-normal text-zinc-400">
                {isArabic
                  ? 'البحث التلقائي في قاعدة الزبائن'
                  : 'Autocomplétion intelligente par numéro'}
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Téléphone */}
              <div className="relative">
                <label className="text-[11px] text-zinc-400">{isArabic ? 'الهاتف *' : 'Téléphone *'}</label>
                <div className="relative mt-1">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={e => {
                      setCustomerPhone(e.target.value);
                      setIsPhoneDropdownOpen(true);
                    }}
                    onFocus={() => setIsPhoneDropdownOpen(true)}
                    placeholder="0770 00 00 00"
                    className="w-full bg-zinc-900 rounded-lg p-2 text-white border border-zinc-700 font-mono text-xs focus:border-orange-500 focus:outline-none"
                    dir="ltr"
                  />
                  <Phone className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-2.5" />
                </div>

                {/* Suggestions Dropdown */}
                {isPhoneDropdownOpen && phoneSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    <div className="p-1.5 bg-zinc-800/80 text-[10px] font-semibold text-zinc-400 border-b border-zinc-700">
                      {isArabic ? 'زبائن مطابقون :' : 'Clients existants trouvés :'}
                    </div>
                    {phoneSuggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left px-3 py-2 hover:bg-orange-600/20 text-zinc-200 hover:text-white flex items-center justify-between border-b border-zinc-800 last:border-0 transition"
                      >
                        <div>
                          <div className="font-bold text-xs text-white">{c.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono" dir="ltr">
                            {c.phone}
                          </div>
                        </div>
                        {c.commune && (
                          <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                            {c.commune}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nom */}
              <div>
                <label className="text-[11px] text-zinc-400">
                  {isArabic ? 'الاسم واللقب *' : 'Nom & Prénom *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={isArabic ? 'مثال: كريم بوزيد' : 'Ex: Karim Bouzid'}
                  className="w-full bg-zinc-900 rounded-lg p-2 text-white border border-zinc-700 mt-1 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Détails Livraison OU Retrait Comptoir */}
          {orderType === 'delivery' ? (
            <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/80 space-y-2.5 animate-fadeIn">
              <h4 className="font-bold text-zinc-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  <span>{isArabic ? 'عنوان التوصيل' : 'Adresse de livraison'}</span>
                </span>
                <span className="text-[10px] text-zinc-400">Alger & communes limitrophes</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-400">{isArabic ? 'البلدية' : 'Commune'}</label>
                  <input
                    type="text"
                    value={commune}
                    onChange={e => setCommune(e.target.value)}
                    placeholder="Birkhadem"
                    className="w-full bg-zinc-900 rounded-lg p-2 text-white border border-zinc-700 mt-0.5 text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] text-zinc-400">
                    {isArabic ? 'العنوان الدقيق *' : 'Adresse exacte (Cité, Bât, Apt) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder={
                      isArabic
                        ? 'حي 200 مسكن، عمارة C، شقة 14'
                        : 'Cité 200 Logements, Bât C, Apt 14'
                    }
                    className="w-full bg-zinc-900 rounded-lg p-2 text-white border border-zinc-700 mt-0.5 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400">
                    {isArabic ? 'علامة مميزة' : 'Point de repère (optionnel)'}
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder={isArabic ? 'بجانب الصيدلية' : 'Ex: En face de la mosquée'}
                    className="w-full bg-zinc-900 rounded-lg p-2 text-white border border-zinc-700 mt-0.5 text-xs"
                  />
                </div>

                {/* Frais de livraison (préremplis selon la zone, modifiables) */}
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold text-orange-400">
                    {isArabic ? 'فrais التوصيل (دج)' : 'Frais livraison (DA, modifiables)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={customDeliveryFee}
                    onChange={e => setCustomDeliveryFee(Number(e.target.value))}
                    className="w-full bg-zinc-900 rounded-lg p-2 text-white border border-orange-500/50 font-mono font-bold mt-0.5 text-xs text-orange-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400">
                    {isArabic ? 'رابط خريطة GPS (اختياري)' : 'Lien Maps / GPS'}
                  </label>
                  <input
                    type="url"
                    value={mapUrl}
                    onChange={e => setMapUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full bg-zinc-900 rounded-lg p-2 text-white border border-zinc-700 font-mono text-[11px] mt-0.5"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/80 space-y-2 animate-fadeIn">
              <h4 className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{isArabic ? 'موعد الاستلام بالمنضدة' : 'Créneau de retrait au comptoir'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPickupTimeSlotType('asap')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition text-xs ${
                    pickupTimeSlotType === 'asap'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{isArabic ? 'في أقرب وقت (~20-25 د)' : 'Dès que possible (~20-25 min)'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickupTimeSlotType('scheduled')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition text-xs shrink-0 ${
                      pickupTimeSlotType === 'scheduled'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <span>{isArabic ? 'تحديد ساعة :' : 'Heure précise :'}</span>
                  </button>
                  <input
                    type="time"
                    disabled={pickupTimeSlotType !== 'scheduled'}
                    value={scheduledPickupTime}
                    onChange={e => {
                      setScheduledPickupTime(e.target.value);
                      setPickupTimeSlotType('scheduled');
                    }}
                    className="flex-1 bg-zinc-900 rounded-xl p-2 text-white border border-zinc-700 font-mono text-xs disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Sélection des Articles du Catalogue & Recherche */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>{isArabic ? 'اختيار الأطباق :' : 'Articles du catalogue :'}</span>
              </h4>
              <span className="text-[11px] font-mono font-bold text-orange-400">
                {isArabic
                  ? `دجاج متاح اليوم: ${dailyChickenRemaining}`
                  : `Poulets dispo aujourd'hui : ${dailyChickenRemaining}`}
              </span>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isArabic ? 'بحث عن طبق أو مشروب...' : 'Rechercher un plat, accompagnement...'}
                className="w-full bg-zinc-800/80 rounded-xl pl-9 pr-3 py-2 text-white border border-zinc-700 text-xs focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Grille du catalogue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-zinc-800 rounded-xl bg-zinc-950/40">
              {filteredProducts.map((product: Product) => {
                const qty = quantities[product.id] || 0;
                const isChicken = product.id === 'prod-1' || product.id === 'prod-2';
                return (
                  <div
                    key={product.id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition ${
                      qty > 0
                        ? 'bg-orange-600/10 border-orange-500/50'
                        : 'bg-zinc-850/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-white truncate text-xs">
                        {isArabic ? product.nameAr : product.nameFr}
                      </p>
                      <p className="text-amber-400 font-semibold text-[11px] font-mono">
                        {product.price.toLocaleString()} {isArabic ? 'دج' : 'DA'}
                        {isChicken && (
                          <span className="text-[10px] text-zinc-400 ml-1.5 font-normal">
                            (🍗 1 poulet)
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-700 p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQty(product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-white text-xs">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Note libre pour la cuisine */}
          <div>
            <label className="text-[11px] text-zinc-400">
              {isArabic ? 'ملاحظة للمطبخ (اختياري)' : 'Note spéciale pour la cuisine'}
            </label>
            <input
              type="text"
              value={kitchenNotes}
              onChange={e => setKitchenNotes(e.target.value)}
              placeholder={
                isArabic
                  ? 'مثال: نضج جيد، حار، ليمون إضافي...'
                  : 'Ex: Bien cuit, sauce piquante à part, citron svp...'
              }
              className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-1 text-xs"
            />
          </div>

          {/* 6. Total Récapitulatif Direct */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-zinc-400 text-xs block">
                {isArabic ? `الأطباق: ${selectedItems.length}` : `Articles : ${selectedItems.length}`}
                {selectedItems.length > 0 && ` (${selectedItems.reduce((acc, i) => acc + i.quantity, 0)} pièces)`}
              </span>
              {orderType === 'delivery' && (
                <span className="text-zinc-500 text-[11px]">
                  {isArabic
                    ? `+ ${effectiveDeliveryFee} دج توصيل`
                    : `+ ${effectiveDeliveryFee} DA livraison`}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold text-amber-400 font-mono">
                {isArabic ? 'المجموع : ' : 'TOTAL : '}
                {grandTotal.toLocaleString()} {isArabic ? 'دج' : 'DA'}
              </div>
              <span className="text-[10px] text-zinc-500">
                {orderType === 'delivery' ? 'paiement à la livraison' : 'paiement au comptoir'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: The 3 requested action buttons */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl font-semibold text-xs"
          >
            {isArabic ? 'إلغاء' : 'Annuler'}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Bouton "Créer" -> Statut En attente */}
            <button
              type="button"
              onClick={() => handleCreateOrder('create')}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl font-bold text-xs transition"
            >
              {isArabic ? 'إنشاء (في الانتظار)' : 'Créer'}
            </button>

            {/* 3. Bouton "Créer et accepter" -> Statut En cours directement */}
            <button
              type="button"
              onClick={() => handleCreateOrder('create_and_accept')}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إنشاء وقبول فوري' : 'Créer et accepter'}</span>
            </button>

            {/* 2. Bouton PRINCIPAL "Créer et envoyer au groupe" -> Crée + ouvre WhatsApp */}
            <button
              type="button"
              onClick={() => handleCreateOrder('create_and_whatsapp')}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600 hover:from-orange-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-950/40 flex items-center gap-1.5 transition active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-emerald-300" />
              <span>{isArabic ? 'إنشاء وإرسال للمجموعة' : 'Créer et envoyer au groupe'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
