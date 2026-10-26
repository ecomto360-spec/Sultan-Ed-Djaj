import { describe, it, expect } from 'vitest';
import { buildWhatsAppMessage, getWhatsAppShareUrl } from './whatsappService';
import { Order } from '../types';

describe('whatsappService', () => {
  it('formats a delivery order matching requirements', () => {
    const order: Order = {
      id: 'ord-1',
      orderNumber: '#SD-0012',
      customerId: 'c-1',
      customerName: 'Karim Bouzid',
      customerPhone: '0550123456',
      type: 'delivery',
      status: 'pending',
      items: [
        { productId: 'p-1', nameFr: 'Poulet rôti', nameAr: 'دجاج', price: 1300, quantity: 2 },
        { productId: 'p-2', nameFr: 'Hmiss grillé', nameAr: 'حميس', price: 400, quantity: 1 },
      ],
      subtotal: 3000,
      deliveryFee: 400,
      total: 3400,
      deliveryAddress: {
        wilaya: 'Alger',
        commune: 'Birkhadem',
        address: 'Cité 200 Logements, Bât C, Apt 14',
      },
      kitchenNotes: 'Bien cuit, citron svp',
      createdAt: '2026-10-15T18:42:00Z',
      updatedAt: '2026-10-15T18:42:00Z',
      statusHistory: [],
    };

    const msg = buildWhatsAppMessage(order);
    expect(msg).toContain('🛵 *LIVRAISON* — #SD-0012');
    expect(msg).toContain('👤 Karim Bouzid');
    expect(msg).toContain('📞 0550123456');
    expect(msg).toContain('📍 Cité 200 Logements, Bât C, Apt 14, Birkhadem');
    expect(msg).toContain('2x Poulet rôti');
    expect(msg).toContain('1x Hmiss grillé');
    expect(msg).toContain('📝 Bien cuit, citron svp');
    expect(msg).toContain('💰 Articles : 3 000 DA');
    expect(msg).toContain('🚚 Livraison : 400 DA');
    expect(msg).toContain('✅ *TOTAL : 3 400 DA* (paiement à la livraison)');
  });

  it('formats a counter/pickup order matching requirements', () => {
    const order: Order = {
      id: 'ord-2',
      orderNumber: '#SD-0013',
      customerId: 'c-2',
      customerName: 'Nadia Hamidi',
      customerPhone: '0771556677',
      type: 'pickup',
      status: 'pending',
      pickupTimeSlot: '18:00',
      items: [
        { productId: 'p-1', nameFr: 'Poulet rôti', nameAr: 'دجاج', price: 2000, quantity: 1 },
      ],
      subtotal: 2000,
      deliveryFee: 0,
      total: 2000,
      createdAt: '2026-10-15T18:45:00Z',
      updatedAt: '2026-10-15T18:45:00Z',
      statusHistory: [],
    };

    const msg = buildWhatsAppMessage(order);
    expect(msg).toContain('🏪 *COMPTOIR* — #SD-0013');
    expect(msg).toContain('👤 Nadia Hamidi — 📞 0771556677');
    expect(msg).toContain('⏰ Retrait : 18:00');
    expect(msg).toContain('1x Poulet rôti');
    expect(msg).not.toContain('🚚 Livraison');
    expect(msg).toContain('✅ *TOTAL : 2 000 DA* (paiement au comptoir)');
  });

  it('generates a valid wa.me share URL', () => {
    const url = getWhatsAppShareUrl('Hello Sultan');
    expect(url).toBe('https://wa.me/?text=Hello%20Sultan');
  });
});
