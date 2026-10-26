import { describe, it, expect } from 'vitest';
import {
  calculateSalesMetrics,
  isOrderInDay,
  calculateTheoreticalCash,
  computeDaySnapshot,
  generateHistoryCsv,
  formatFrenchNumber,
} from './salesService';
import { Day, Order } from '../types';

describe('salesService pure tests', () => {
  it('journée sans commande (pas de division par zéro)', () => {
    const metrics = calculateSalesMetrics([]);
    expect(metrics.caProduits).toBe(0);
    expect(metrics.fraisLivraison).toBe(0);
    expect(metrics.caTotal).toBe(0);
    expect(metrics.caEnCours).toBe(0);
    expect(metrics.nbCommandes).toBe(0);
    expect(metrics.panierMoyen).toBe(0); // Pas de division par zéro (NaN ou Infinity)
    expect(metrics.annulations.count).toBe(0);
    expect(metrics.annulations.valeurPerdue).toBe(0);
  });

  it('annulation après livraison : commande annulée non comptée en CA livré mais enregistrée dans les annulations', () => {
    const orders: Order[] = [
      {
        id: 'ord-1',
        orderNumber: '#SD-0001',
        customerId: 'cust-1',
        customerName: 'Client 1',
        customerPhone: '0550123456',
        type: 'delivery',
        status: 'delivered',
        items: [{ productId: 'prod-1', nameFr: 'Poulet rôti', nameAr: 'دجاج محمر', price: 1300, quantity: 1 }],
        subtotal: 1300,
        deliveryFee: 200,
        total: 1500,
        createdAt: '2026-10-12T14:00:00.000Z',
        updatedAt: '2026-10-12T14:30:00.000Z',
        statusHistory: [],
      },
      {
        id: 'ord-2',
        orderNumber: '#SD-0002',
        customerId: 'cust-2',
        customerName: 'Client 2',
        customerPhone: '0770987654',
        type: 'delivery',
        status: 'cancelled',
        cancellationReason: 'Client indisponible après tentative de livraison',
        items: [{ productId: 'prod-2', nameFr: 'Poulet braisé', nameAr: 'دجاج مشوي', price: 1500, quantity: 1 }],
        subtotal: 1500,
        deliveryFee: 200,
        total: 1700,
        createdAt: '2026-10-12T14:15:00.000Z',
        updatedAt: '2026-10-12T14:45:00.000Z',
        statusHistory: [
          { status: 'pending', timestamp: '2026-10-12T14:15:00.000Z' },
          { status: 'delivered', timestamp: '2026-10-12T14:40:00.000Z' },
          { status: 'cancelled', timestamp: '2026-10-12T14:45:00.000Z', note: 'Annulée après retour' },
        ],
      },
    ];

    const metrics = calculateSalesMetrics(orders);
    // Seule la commande livrée compte dans le CA produits
    expect(metrics.caProduits).toBe(1300);
    expect(metrics.fraisLivraison).toBe(200);
    expect(metrics.caTotal).toBe(1500);
    expect(metrics.nbCommandes).toBe(1);
    expect(metrics.panierMoyen).toBe(1300);

    // L'annulation est comptabilisée avec son motif et sa valeur perdue
    expect(metrics.annulations.count).toBe(1);
    expect(metrics.annulations.valeurPerdue).toBe(1700);
    expect(metrics.annulations.motifs[0].reason).toBe('Client indisponible après tentative de livraison');
  });

  it('commande à 00h30 rattachée à la journée ouverte en cours', () => {
    // Journée ouverte le 12 octobre à 12h00
    const openDay: Day = {
      id: 'day-2026-10-12',
      date: '2026-10-12',
      status: 'open',
      openedAt: '2026-10-12T11:00:00.000Z', // 12h00 locale Alger
      quotaInitial: 100,
      quotaCurrent: 100,
      quotaAdjustments: [],
      pouletsVendus: 0,
      pouletsRestants: 100,
      nbCommandes: 0,
      nbAnnulees: 0,
      ca: 0,
      panierMoyen: 0,
      nbLivraison: 0,
      nbComptoir: 0,
    };

    // Commande créée le lendemain matin à 00h30 (UTC: 2026-10-12T23:30:00Z -> Alger: 2026-10-13 00:30)
    // sans dayId explicite, mais pendant que la journée est toujours ouverte
    const lateNightOrder: Order = {
      id: 'ord-late-1',
      orderNumber: '#SD-0099',
      customerId: 'cust-late',
      customerName: 'Client Nocturne',
      customerPhone: '0555112233',
      type: 'pickup',
      status: 'delivered',
      items: [{ productId: 'prod-1', nameFr: 'Poulet rôti', nameAr: 'دجاج', price: 1300, quantity: 1 }],
      subtotal: 1300,
      deliveryFee: 0,
      total: 1300,
      createdAt: '2026-10-12T23:30:00.000Z', // 00h30 à Alger le 13/10
      updatedAt: '2026-10-12T23:45:00.000Z',
      statusHistory: [],
    };

    // La commande à 00h30 doit être reconnue comme faisant partie de la journée ouverte
    const belongs = isOrderInDay(lateNightOrder, openDay);
    expect(belongs).toBe(true);

    // Rattachement explicite via dayId fonctionne également
    const explicitOrder: Order = {
      ...lateNightOrder,
      dayId: 'day-2026-10-12',
    };
    expect(isOrderInDay(explicitOrder, openDay)).toBe(true);
  });

  it('arrondis en DA : calculs de panier moyen, CA et espèces arrondis sans décimales flottantes', () => {
    const orders: Order[] = [
      {
        id: 'ord-1',
        orderNumber: '#SD-1',
        customerId: 'c1',
        customerName: 'C1',
        customerPhone: '0550000000',
        type: 'delivery',
        status: 'delivered',
        items: [{ productId: 'p1', nameFr: 'P1', nameAr: 'د1', price: 1333, quantity: 1 }],
        subtotal: 1333,
        deliveryFee: 200,
        total: 1533,
        paymentMethod: 'cash',
        createdAt: '2026-10-12T14:00:00Z',
        updatedAt: '2026-10-12T14:30:00Z',
        statusHistory: [],
      },
      {
        id: 'ord-2',
        orderNumber: '#SD-2',
        customerId: 'c2',
        customerName: 'C2',
        customerPhone: '0550000001',
        type: 'delivery',
        status: 'delivered',
        items: [{ productId: 'p2', nameFr: 'P2', nameAr: 'د2', price: 1500, quantity: 1 }],
        subtotal: 1500,
        deliveryFee: 200,
        total: 1700,
        paymentMethod: 'cash',
        createdAt: '2026-10-12T15:00:00Z',
        updatedAt: '2026-10-12T15:30:00Z',
        statusHistory: [],
      },
    ];

    const metrics = calculateSalesMetrics(orders);
    // CA produits = 1333 + 1500 = 2833
    expect(metrics.caProduits).toBe(2833);
    // Panier moyen = 2833 / 2 = 1416.5 -> arrondi en DA = 1417
    expect(metrics.panierMoyen).toBe(1417);
    expect(Number.isInteger(metrics.panierMoyen)).toBe(true);

    // Calcul de caisse avec dépense
    const cashResult = calculateTheoreticalCash(orders, [
      { id: 'exp-1', date: '2026-10-12', category: 'autre', amount: 500, note: 'Pain', createdBy: 'manager', createdAt: '2026-10-12T12:00:00Z' },
    ]);
    // Cash in: 1533 + 1700 = 3233, Cash out: 500 => Théorique: 2733 DA
    expect(cashResult.cashIn).toBe(3233);
    expect(cashResult.cashOut).toBe(500);
    expect(cashResult.theoreticalCash).toBe(2733);
    expect(Number.isInteger(cashResult.theoreticalCash)).toBe(true);
  });

  it('export CSV : séparateur ";", BOM UTF-8, nombres format français (virgule), colonnes entre guillemets', () => {
    const day: Day = {
      id: 'day-2026-10-12',
      date: '2026-10-12',
      status: 'closed',
      openedAt: '2026-10-12T11:00:00Z',
      closedAt: '2026-10-12T23:00:00Z',
      quotaInitial: 100,
      quotaCurrent: 100,
      quotaAdjustments: [],
      pouletsVendus: 45.5,
      pouletsRestants: 54.5,
      nbCommandes: 20,
      nbAnnulees: 2,
      ca: 45000,
      deliveryFees: 4000,
      caTotal: 49000,
      panierMoyen: 2250,
      nbLivraison: 15,
      nbComptoir: 5,
      theoreticalCash: 48000,
      countedCash: 48000,
      cashDifference: 0,
    };

    const csvFr = generateHistoryCsv([day], [], false);
    // Vérification du BOM UTF-8
    expect(csvFr.startsWith('\uFEFF')).toBe(true);
    // Vérification du séparateur ';'
    expect(csvFr.includes(';')).toBe(true);
    // Vérification des colonnes entre guillemets
    expect(csvFr.includes('"Date"')).toBe(true);
    expect(csvFr.includes('"CA Produits (DA)"')).toBe(true);
    // Nombres au format français avec virgule (45.5 -> "45,5")
    expect(csvFr.includes('"45,5"')).toBe(true);

    // Export en Arabe
    const csvAr = generateHistoryCsv([day], [], true);
    expect(csvAr.startsWith('\uFEFF')).toBe(true);
    expect(csvAr.includes('"التاريخ"')).toBe(true);
    expect(csvAr.includes('"رقم أعمال المنتجات (دج)"')).toBe(true);
  });
});
