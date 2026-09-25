import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { OrderType } from '../../types';
import { ShoppingBag, Trash2, Plus, Minus, Motorbike, Store, Banknote, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export const ClientCart: React.FC = () => {
  const {
    cart,
    cartTotal,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
    settings,
    currentCustomer,
    language,
    isStoreActuallyOpen,
    setClientTab,
  } = useApp();

  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [kitchenNotes, setKitchenNotes] = useState('');
  
  // Delivery address fields
  const [commune, setCommune] = useState(currentCustomer?.commune || 'Birkhadem');
  const [address, setAddress] = useState(currentCustomer?.address || '');
  const [landmark, setLandmark] = useState(currentCustomer?.landmark || '');
  
  // Pickup time slot
  const [pickupTimeSlot, setPickupTimeSlot] = useState(t.asap);

  const deliveryFee = orderType === 'delivery' ? settings.deliveryFee : 0;
  const grandTotal = cartTotal + deliveryFee;

  const [formError, setFormError] = useState<string | null>(null);

  const pickupSlots = [
    t.asap,
    '13:30',
    '14:00',
    '14:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
  ];

  const handleConfirmOrder = () => {
    setFormError(null);
    if (!isStoreActuallyOpen) {
      setFormError(t.storeClosedCannotOrder);
      return;
    }
    if (cart.length === 0) return;

    if (orderType === 'delivery' && !address.trim()) {
      setFormError(language === 'ar' ? 'يرجى إدخال عنوان التوصيل' : 'Veuillez saisir votre adresse de livraison.');
      return;
    }

    const order = placeOrder({
      type: orderType,
      deliveryAddress:
        orderType === 'delivery'
          ? {
              wilaya: 'Alger',
              commune: commune.trim() || 'Birkhadem',
              address: address.trim(),
              landmark: landmark.trim() || undefined,
            }
          : undefined,
      pickupTimeSlot: orderType === 'pickup' ? pickupTimeSlot : undefined,
      kitchenNotes: kitchenNotes.trim() || undefined,
    });

    if (order) {
      setClientTab('tracking');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-500 shadow-inner">
          <ShoppingBag className="w-8 h-8 text-zinc-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-zinc-100">{t.cartEmpty}</h3>
          <p className="text-xs text-zinc-400 max-w-[240px] leading-relaxed">
            {t.cartEmptySubtitle}
          </p>
        </div>
        <button
          onClick={() => setClientTab('menu')}
          className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition hover:brightness-105 active:scale-95"
        >
          {t.exploreMenu}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3.5 pb-24 space-y-4">
      {/* Title & Clear Cart */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-100">{t.cartTitle} ({cart.length})</h2>
        <button
          onClick={clearCart}
          className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'تفريغ السلة' : 'Vider'}</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="space-y-2">
        {cart.map(item => (
          <div
            key={item.productId}
            className="flex items-center justify-between bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800/80 shadow-sm"
          >
            <div className="space-y-0.5 flex-1 min-w-0 pr-2">
              <h4 className="text-xs font-bold text-zinc-100 truncate">
                {isArabic ? item.nameAr : item.nameFr}
              </h4>
              <p className="text-[11px] font-semibold text-amber-400">
                {item.price.toLocaleString()} {t.currency}
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center bg-zinc-800 rounded-lg border border-zinc-700 p-0.5">
                <button
                  onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                  className="w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-white rounded hover:bg-zinc-700 transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-zinc-300 hover:text-white rounded hover:bg-zinc-700 transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.productId)}
                className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Kitchen Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-300">
          {t.kitchenNotesLabel}
        </label>
        <textarea
          value={kitchenNotes}
          onChange={e => setKitchenNotes(e.target.value)}
          placeholder={t.kitchenNotesPlaceholder}
          rows={2}
          className="w-full bg-zinc-900 rounded-xl border border-zinc-700/80 p-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition shadow-inner resize-none"
        />
      </div>

      {/* Mode Choice: Delivery vs Counter Pickup */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-300">
          {t.orderTypeChoice}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOrderType('delivery')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition ${
              orderType === 'delivery'
                ? 'bg-orange-950/40 border-orange-500 text-orange-400 ring-1 ring-orange-500/50'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Motorbike className="w-5 h-5" />
            <span className="text-xs font-bold">{t.typeDeliveryShort}</span>
            <span className="text-[10px] text-zinc-400">+{settings.deliveryFee} {t.currency}</span>
          </button>

          <button
            type="button"
            onClick={() => setOrderType('pickup')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition ${
              orderType === 'pickup'
                ? 'bg-orange-950/40 border-orange-500 text-orange-400 ring-1 ring-orange-500/50'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-xs font-bold">{t.typePickupShort}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">{t.freeDelivery}</span>
          </button>
        </div>
      </div>

      {/* Mode Details Section */}
      {orderType === 'delivery' ? (
        <div className="space-y-2.5 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400">
              {t.wilayaCommuneLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                disabled
                value="Alger (16)"
                className="bg-zinc-800/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 border border-zinc-700/60 cursor-not-allowed"
              />
              <input
                type="text"
                value={commune}
                onChange={e => setCommune(e.target.value)}
                placeholder="Commune (ex: Birkhadem)"
                className="bg-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 border border-zinc-700 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400">
              {t.deliveryAddressLabel} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Cité, Bâtiment, N° rue..."
              className="w-full bg-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 border border-zinc-700 focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-zinc-400">
              {t.landmarkLabel}
            </label>
            <input
              type="text"
              value={landmark}
              onChange={e => setLandmark(e.target.value)}
              placeholder="Ex: En face de la pharmacie"
              className="w-full bg-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 border border-zinc-700 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      ) : (
        /* Pickup Slot */
        <div className="space-y-2 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
          <label className="text-[11px] font-semibold text-zinc-400">
            {t.pickupSlotLabel}
          </label>
          <select
            value={pickupTimeSlot}
            onChange={e => setPickupTimeSlot(e.target.value)}
            className="w-full bg-zinc-800 rounded-lg px-2.5 py-2 text-xs text-zinc-100 border border-zinc-700 focus:outline-none focus:border-orange-500"
          >
            {pickupSlots.map(slot => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-zinc-400">
            {isArabic
              ? 'العنوان: البساتين، بئر خادم (الجزائر). هاتف: 0771 01 20 33'
              : 'Retrait au restaurant : Les Vergers, Birkhadem. Tél : 0771 01 20 33'}
          </p>
        </div>
      )}

      {/* Payment Notice */}
      <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
        <Banknote className="w-4 h-4 shrink-0 text-amber-400" />
        <span className="font-medium">
          {orderType === 'delivery' ? t.cashOnDelivery : t.cashOnPickup}
        </span>
      </div>

      {/* Summary Box */}
      <div className="bg-zinc-900/90 rounded-2xl p-3.5 border border-zinc-800 space-y-2 text-xs">
        <div className="flex justify-between text-zinc-400">
          <span>{t.subtotal}</span>
          <span className="text-zinc-200 font-semibold">{cartTotal.toLocaleString()} {t.currency}</span>
        </div>
        <div className="flex justify-between text-zinc-400">
          <span>{t.deliveryFee}</span>
          <span className="text-zinc-200 font-semibold">
            {deliveryFee === 0 ? t.freeDelivery : `${deliveryFee} ${t.currency}`}
          </span>
        </div>
        <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
          <span className="text-sm font-bold text-white">{t.total}</span>
          <div className="text-base font-extrabold text-amber-400">
            {grandTotal.toLocaleString()} <span className="text-xs font-semibold">{t.currency}</span>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {formError && (
        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{formError}</span>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={handleConfirmOrder}
        disabled={!isStoreActuallyOpen}
        className={`w-full h-12 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] ${
          isStoreActuallyOpen
            ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 shadow-orange-950/50 hover:brightness-105'
            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
        }`}
      >
        <span>{t.confirmOrder}</span>
        {isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
};
