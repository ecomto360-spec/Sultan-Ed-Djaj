import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { OrderType, OrderItem } from '../../types';
import { PlusCircle, X, Plus, Minus, Motorbike, Store, Banknote, ShoppingBag } from 'lucide-react';

interface ManualOrderModalProps {
  onClose: () => void;
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ onClose }) => {
  const { products, addManualOrder, settings, language, isStoreActuallyOpen } = useApp();
  const t = TRANSLATIONS[language];
  const isArabic = language === 'ar';

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('0770');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [commune, setCommune] = useState('Birkhadem');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [kitchenNotes, setKitchenNotes] = useState('');

  // Selected item quantities
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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
  const deliveryFee = orderType === 'delivery' ? settings.deliveryFee : 0;
  const grandTotal = subtotal + deliveryFee;

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg(isArabic ? 'يرجى إدخال اسم وهاتف الزبون.' : 'Veuillez renseigner le nom et le téléphone du client.');
      return;
    }
    if (selectedItems.length === 0) {
      setErrorMsg(isArabic ? 'يرجى اختيار منتج واحد على الأقل.' : 'Veuillez ajouter au moins un produit.');
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      setErrorMsg(isArabic ? 'يرجى إدخال عنوان التوصيل.' : 'Veuillez renseigner l\'adresse de livraison.');
      return;
    }

    addManualOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      type: orderType,
      items: selectedItems,
      deliveryAddress:
        orderType === 'delivery'
          ? {
              wilaya: 'Alger',
              commune: commune.trim() || 'Birkhadem',
              address: address.trim(),
              landmark: landmark.trim() || undefined,
            }
          : undefined,
      kitchenNotes: kitchenNotes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-bold text-white">
              {t.addManualOrder} ({isArabic ? 'هاتف / منضدة' : 'Téléphone / Comptoir'})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Customer details */}
          <div className="bg-zinc-800/60 p-3 rounded-xl border border-zinc-700 space-y-2.5">
            <h4 className="font-bold text-zinc-200">{isArabic ? 'معلومات الزبون' : 'Coordonnées du client'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-400">{isArabic ? 'الاسم واللقب *' : 'Nom & Prénom *'}</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={isArabic ? 'مثال: مراد قاسي' : 'Ex: Mourad Kaci'}
                  className="w-full bg-zinc-900 rounded-lg p-2 text-white border border-zinc-700 mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-400">{isArabic ? 'الهاتف *' : 'Téléphone (+213) *'}</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="0770 00 00 00"
                  className="w-full bg-zinc-900 rounded-lg p-2 text-white border border-zinc-700 mt-1 font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Type Choice */}
            <div className="pt-2">
              <label className="text-[11px] text-zinc-400 mb-1 block">{isArabic ? 'نوع الطلب :' : 'Mode de commande :'}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-2 font-bold ${
                    orderType === 'delivery'
                      ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <Motorbike className="w-4 h-4" />
                  <span>{isArabic ? `توصيل (+${settings.deliveryFee} دج)` : `Livraison (+${settings.deliveryFee} DA)`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-2 font-bold ${
                    orderType === 'pickup'
                      ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>{isArabic ? 'استلام من المطعم (0 دج)' : 'Comptoir / Retrait (0 DA)'}</span>
                </button>
              </div>
            </div>

            {/* Delivery address if applicable */}
            {orderType === 'delivery' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-zinc-400">{isArabic ? 'البلدية' : 'Commune'}</label>
                  <input
                    type="text"
                    value={commune}
                    onChange={e => setCommune(e.target.value)}
                    className="w-full bg-zinc-900 rounded-lg p-1.5 text-white border border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400">{isArabic ? 'العنوان الدقيق *' : 'Adresse exacte *'}</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder={isArabic ? 'حي، عمارة، رقم الشارع...' : 'Bâtiment, N°...'}
                    className="w-full bg-zinc-900 rounded-lg p-1.5 text-white border border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400">{isArabic ? 'علامة مميزة' : 'Point de repère'}</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    placeholder={isArabic ? 'مثال: بجانب الصيدلية' : 'Ex: À côté de...'}
                    className="w-full bg-zinc-900 rounded-lg p-1.5 text-white border border-zinc-700"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Products Selector */}
          <div className="space-y-2">
            <h4 className="font-bold text-zinc-200">{isArabic ? 'الأطباق المراد إضافتها :' : 'Articles à ajouter :'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {products.map(product => {
                const qty = quantities[product.id] || 0;
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/80"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-white truncate text-xs">{isArabic ? product.nameAr : product.nameFr}</p>
                      <p className="text-amber-400 font-semibold text-[11px]">
                        {product.price} {isArabic ? 'دج' : 'DA'}
                      </p>
                    </div>

                    <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-700 p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQty(product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-white">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kitchen Note */}
          <div>
            <label className="text-[11px] text-zinc-400">{isArabic ? 'ملاحظات للمطبخ' : 'Note pour la cuisine'}</label>
            <input
              type="text"
              value={kitchenNotes}
              onChange={e => setKitchenNotes(e.target.value)}
              placeholder={isArabic ? 'مثال: نضج جيد، تقطيع 4 أجزاء...' : 'Ex: Bien cuit, découpe en 4, sauce supplémentaire...'}
              className="w-full bg-zinc-800 rounded-lg p-2 text-white border border-zinc-700 mt-1 text-xs"
            />
          </div>

          {/* Summary */}
          <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-zinc-400 text-xs">
                {isArabic ? `الأطباق: ${selectedItems.length}` : `Articles : ${selectedItems.length}`}
              </span>
              {deliveryFee > 0 && (
                <span className="text-zinc-500 text-[11px]">
                  {isArabic ? ` (+${settings.deliveryFee} دج توصيل)` : ` (+${settings.deliveryFee} DA livraison)`}
                </span>
              )}
            </div>
            <div className="text-base font-extrabold text-amber-400">
              {isArabic ? 'المجموع : ' : 'Total : '}
              {grandTotal.toLocaleString()} {isArabic ? 'دج' : 'DA'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold"
            >
              {isArabic ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-md"
            >
              {isArabic ? 'تسجيل الطلب' : 'Enregistrer la commande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
