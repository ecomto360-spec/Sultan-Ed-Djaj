import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { OrderType } from '../../types';
import { GeolocationPicker } from './GeolocationPicker';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Truck,
  Store,
  AlertCircle,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Clock,
  MessageSquare,
} from 'lucide-react';

interface SavedAddress {
  address: string;
  commune: string;
  wilaya: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

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
  const [pickupTimeSlot, setPickupTimeSlot] = useState(t.asap);

  // Address state populated from GeolocationPicker
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress>({
    address: currentCustomer?.address || '',
    commune: currentCustomer?.commune || 'Birkhadem',
    wilaya: currentCustomer?.wilaya || 'Alger',
    landmark: currentCustomer?.landmark || '',
    latitude: currentCustomer?.latitude,
    longitude: currentCustomer?.longitude,
  });

  const [formError, setFormError] = useState<string | null>(null);

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

  const handleConfirmOrder = () => {
    setFormError(null);

    if (!isStoreActuallyOpen) {
      setFormError(t.storeClosedCannotOrder);
      return;
    }

    if (cart.length === 0) return;

    if (orderType === 'delivery' && !selectedAddress.address.trim()) {
      setFormError(
        isArabic
          ? 'يرجى إدخال عنوان التوصيل أو استخدام خاصية تحديد الموقع.'
          : 'Veuillez renseigner votre adresse de livraison.'
      );
      return;
    }

    const order = placeOrder({
      type: orderType,
      deliveryAddress:
        orderType === 'delivery'
          ? {
              wilaya: selectedAddress.wilaya || 'Alger',
              commune: selectedAddress.commune || 'Birkhadem',
              address: selectedAddress.address,
              landmark: selectedAddress.landmark,
              mapUrl:
                selectedAddress.latitude && selectedAddress.longitude
                  ? `https://maps.google.com/?q=${selectedAddress.latitude},${selectedAddress.longitude}`
                  : undefined,
              latitude: selectedAddress.latitude,
              longitude: selectedAddress.longitude,
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

      {/* CONDITIONAL STEP: Geolocation / Address required ONLY for Livraison */}
      {orderType === 'delivery' ? (
        <GeolocationPicker
          initialAddress={selectedAddress}
          onAddressSelect={setSelectedAddress}
        />
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
          className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
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
          <span>{formError}</span>
        </div>
      )}

      {/* Place Order Button */}
      <button
        type="button"
        onClick={handleConfirmOrder}
        className="w-full h-13 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-950/30 transition active:scale-[0.98] cursor-pointer"
      >
        <span>{isArabic ? 'تأكيد وإرسال الطلب' : 'Valider la commande'}</span>
        <ArrowRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
