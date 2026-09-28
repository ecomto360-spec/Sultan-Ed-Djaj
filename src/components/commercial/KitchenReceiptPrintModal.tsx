import React, { useRef } from 'react';
import { Order } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X, Check, Phone } from 'lucide-react';

interface KitchenReceiptPrintModalProps {
  order: Order | null;
  onClose: () => void;
}

export const KitchenReceiptPrintModal: React.FC<KitchenReceiptPrintModalProps> = ({ order, onClose }) => {
  const { settings, language } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92dvh]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-bold text-white">Ticket Cuisine & Caisse (80mm)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 80mm Thermal Receipt Preview Canvas */}
        <div className="px-3 sm:px-6 py-3 flex justify-center overflow-y-auto flex-1 bg-zinc-950/40">
          <div
            ref={printRef}
            id="thermal-receipt"
            className="w-full max-w-[320px] bg-white text-black p-4 rounded shadow-md font-mono text-xs leading-relaxed space-y-3"
            style={{ fontFamily: 'monospace' }}
          >
            {/* Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-gray-400 pb-2">
              <div className="font-extrabold text-sm tracking-wider uppercase">SULTAN ED-DJAJ</div>
              <div className="text-[10px]">سلطان الدجاج - بئر خادم</div>
              <div className="text-[10px]">Spécialité Poulet Braisé & Rôti</div>
              <div className="text-[10px]">Les Vergers, Birkhadem (Alger)</div>
              <div className="text-[10px]">Tél : {settings.phone}</div>
            </div>

            {/* Order Meta */}
            <div className="space-y-1 border-b border-dashed border-gray-400 pb-2 text-[11px]">
              <div className="flex justify-between font-bold text-sm">
                <span>COMMANDE :</span>
                <span>{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date :</span>
                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Type :</span>
                <span className="font-bold uppercase">
                  {order.type === 'delivery' ? 'LIVRAISON' : 'RETRAIT COMPTOIR'}
                </span>
              </div>
              {order.pickupTimeSlot && (
                <div className="flex justify-between">
                  <span>Créneau :</span>
                  <span>{order.pickupTimeSlot}</span>
                </div>
              )}
            </div>

            {/* Client Info */}
            <div className="space-y-0.5 border-b border-dashed border-gray-400 pb-2 text-[11px]">
              <div className="font-bold">CLIENT : {order.customerName}</div>
              <div>Tél : {order.customerPhone}</div>
              {order.deliveryAddress && (
                <div>
                  <div>Adresse : {order.deliveryAddress.address}, {order.deliveryAddress.commune}</div>
                  {order.deliveryAddress.landmark && <div>Repère : {order.deliveryAddress.landmark}</div>}
                  {order.deliveryAddress.mapUrl && (
                    <div className="text-[10px] break-all pt-0.5">
                      📍 GPS : {order.deliveryAddress.mapUrl}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Articles Table */}
            <div className="space-y-1 border-b border-dashed border-gray-400 pb-2 text-[11px]">
              <div className="flex justify-between font-bold pb-1 border-b border-gray-200">
                <span>QTE / ARTICLE</span>
                <span>TOTAL</span>
              </div>
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span>
                    <strong>{it.quantity}x</strong> {it.nameFr}
                  </span>
                  <span>{(it.price * it.quantity).toLocaleString()} DA</span>
                </div>
              ))}
            </div>

            {/* Kitchen Notes */}
            {order.kitchenNotes && (
              <div className="p-1.5 bg-gray-100 rounded border border-gray-300 text-[10px]">
                <strong>NOTE CUISINE :</strong> {order.kitchenNotes}
              </div>
            )}

            {/* Financial Summary */}
            <div className="space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Sous-total :</span>
                <span>{order.subtotal.toLocaleString()} DA</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Livraison :</span>
                  <span>{order.deliveryFee.toLocaleString()} DA</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-black">
                <span>TOTAL A PAYER :</span>
                <span>{order.total.toLocaleString()} DA</span>
              </div>
              <div className="text-[10px] text-center pt-1 font-bold">
                *** PAIEMENT EN ESPÈCES ***
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] pt-2 border-t border-dashed border-gray-400">
              Merci pour votre fidélité ! صحة وهنا
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
          >
            Fermer
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le ticket (80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
