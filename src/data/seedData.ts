import {
  Product,
  Customer,
  Order,
  StoreSettings,
  StockItem,
  ProductComposition,
  StockMovement,
  Expense,
  CashClosing,
} from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    nameFr: 'Poulet rôti',
    nameAr: 'دجاج محمر',
    descriptionFr: 'Poulet entier rôti à la broche, mariné aux épices traditionnelles du Sultan, peau croustillante et chair tendre.',
    descriptionAr: 'دجاج كامل محمر على السيخ، متبل بخلطة بهارات السلطان السرية، مقرمش من الخارج وطري ولذيذ من الداخل.',
    price: 1300,
    category: 'poulets',
    isAvailable: true,
    imageType: 'poulet-roti',
  },
  {
    id: 'prod-2',
    nameFr: 'Poulet braisé sur charbon',
    nameAr: 'دجاج مشوي على الجمر',
    descriptionFr: 'Poulet braisé lentement sur braises de charbon de bois naturel, saveur fumée authentique et juteuse.',
    descriptionAr: 'دجاج مشوي على فحم الخشب الطبيعي بنكهة مدخنة أصيلة، متبل بعناية ومشوي على نار هادئة.',
    price: 1500,
    category: 'poulets',
    isAvailable: true,
    imageType: 'poulet-braise',
  },
  {
    id: 'prod-3',
    nameFr: 'Frites fraîches maison',
    nameAr: 'بطاطا مقلية طازجة',
    descriptionFr: 'Portion généreuse de frites fraîches dorées et croustillantes, assaisonnées au sel de mer.',
    descriptionAr: 'حصة وفيرة من البطاطا المقلية الطازجة الذهبية والمقرمشة، متبلة بملح البحر والأعشاب.',
    price: 300,
    category: 'accompagnements',
    isAvailable: true,
    imageType: 'frites',
  },
  {
    id: 'prod-4',
    nameFr: 'Hmiss grillé piquant',
    nameAr: 'حميس مشوي حار',
    descriptionFr: 'Poivrons et piments grillés au feu de bois, ail frais, huile d\'olive vierge extra kabyle.',
    descriptionAr: 'فلفل حلو وحار مشوي على الجمر، ثوم طازج، متبل بزيت الزيتون البكر الممتاز.',
    price: 400,
    category: 'accompagnements',
    isAvailable: true,
    imageType: 'hmiss',
  },
  {
    id: 'prod-5',
    nameFr: 'Riz aux épices & vermicelles',
    nameAr: 'أرز بالشعيرية والتوابل',
    descriptionFr: 'Riz basmati parfumé cuit dans le bouillon de poulet braisé, vermicelles dorées et touche de safran.',
    descriptionAr: 'أرز بسمتي معطر مطبوخ في مرق الدجاج المشوي مع الشعيرية المحمصة ولمسة زعفران.',
    price: 300,
    category: 'accompagnements',
    isAvailable: true,
    imageType: 'riz',
  },
  {
    id: 'prod-6',
    nameFr: 'Matlouh maison traditionnel',
    nameAr: 'مطلوع نتاع الدار',
    descriptionFr: 'Pain traditionnel algérien cuit sur tajine en terre cuite, mie aérée et moelleuse.',
    descriptionAr: 'خبز دار تقليدي طايب على الطاجين، خفيف، إسفنجي وطري.',
    price: 50,
    category: 'pains',
    isAvailable: true,
    imageType: 'matlouh',
  },
  {
    id: 'prod-7',
    nameFr: 'Boisson naturelle fraîche',
    nameAr: 'مشروب طبيعي منعش',
    descriptionFr: 'Citronnade maison à la menthe fraîche ou jus d\'orange pressé naturel (33cl).',
    descriptionAr: 'عصير ليمون طبيعي بالنعناع الطازج أو برتقال معصور (33 سل).',
    price: 150,
    category: 'boissons',
    isAvailable: true,
    imageType: 'boisson',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Karim Bouzid',
    phone: '0550123456',
    wilaya: 'Alger',
    commune: 'Birkhadem',
    address: 'Cité 200 Logements, Bâtiment C, Apt 14',
    landmark: 'En face de la pharmacie centrale',
    orderCount: 8,
    totalSpent: 16800,
    createdAt: '2026-08-10T14:30:00Z',
  },
  {
    id: 'cust-2',
    name: 'Amine Belkacem',
    phone: '0770987654',
    wilaya: 'Alger',
    commune: 'Birkhadem (Les Vergers)',
    address: 'Résidence Les Vergers, Villa 12',
    landmark: 'Près de l\'école primaire',
    orderCount: 14,
    totalSpent: 31200,
    createdAt: '2026-08-01T11:00:00Z',
  },
  {
    id: 'cust-3',
    name: 'Yasmine Mansouri',
    phone: '0661223344',
    wilaya: 'Alger',
    commune: 'Kouba',
    address: 'Rue Ben Omar, Imm 4, 2ème étage',
    landmark: 'À côté du grand rond-point',
    orderCount: 5,
    totalSpent: 9400,
    createdAt: '2026-08-15T18:20:00Z',
  },
  {
    id: 'cust-4',
    name: 'Sofiane Cherif',
    phone: '0555443322',
    wilaya: 'Alger',
    commune: 'Hydra',
    address: 'Boulevard Sidi Yahia, N° 45',
    landmark: 'Au-dessus du café glacier',
    orderCount: 3,
    totalSpent: 6200,
    createdAt: '2026-08-22T19:40:00Z',
  },
  {
    id: 'cust-5',
    name: 'Nadia Hamidi',
    phone: '0771556677',
    wilaya: 'Alger',
    commune: 'Saoula',
    address: 'Lotissement El Amal, N° 18',
    landmark: 'Près de la mosquée',
    orderCount: 6,
    totalSpent: 11500,
    createdAt: '2026-08-12T13:10:00Z',
  },
  {
    id: 'cust-6',
    name: 'Reda Meziane',
    phone: '0662889900',
    wilaya: 'Alger',
    commune: 'El Mouradia',
    address: 'Rue Ahmed Ouaked, Apt 6',
    landmark: 'Proche du ministère',
    orderCount: 2,
    totalSpent: 3800,
    createdAt: '2026-09-02T20:15:00Z',
  },
  {
    id: 'cust-7',
    name: 'Walid Benaissa',
    phone: '0560778899',
    wilaya: 'Alger',
    commune: 'Ain Naadja',
    address: 'Cité 720 Logements, Bloc 12, N° 3',
    landmark: 'En face de la station métro',
    orderCount: 9,
    totalSpent: 18900,
    createdAt: '2026-08-05T12:00:00Z',
  },
  {
    id: 'cust-8',
    name: 'Farid Louali',
    phone: '0772112233',
    wilaya: 'Alger',
    commune: 'Dely Ibrahim',
    address: 'Chemin Doudou Mokhtar, Villa 9',
    landmark: 'À côté de la clinique',
    orderCount: 4,
    totalSpent: 8300,
    createdAt: '2026-08-28T17:50:00Z',
  },
];

// ══════════════════════════════════════════════════
// INITIAL STOCK ITEMS (13 Articles, with Poulet in CRITICAL)
// ══════════════════════════════════════════════════
export const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: 'stock-1',
    nameFr: 'Poulet entier frais',
    nameAr: 'دجاج كامل طازج',
    category: 'viandes',
    unit: 'piece',
    currentStock: 4, // CRITIQUE (≤ 6) pour déclencher l'alerte
    alertThreshold: 15,
    criticalThreshold: 6,
    idealStock: 50,
    unitCostDA: 520,
    supplierName: 'Abattoir El-Baraqa',
    supplierPhone: '0550 44 22 11',
    expiryDate: '2026-09-24',
    lastRestockedAt: '2026-09-17T08:00:00Z',
  },
  {
    id: 'stock-2',
    nameFr: 'Charbon de bois naturel',
    nameAr: 'فحم خشب طبيعي',
    category: 'combustible',
    unit: 'kg',
    currentStock: 22, // BAS (≤ 25)
    alertThreshold: 25,
    criticalThreshold: 10,
    idealStock: 100,
    unitCostDA: 120,
    supplierName: 'Charbonnerie Atlas',
    supplierPhone: '0770 12 34 56',
    lastRestockedAt: '2026-09-14T10:00:00Z',
  },
  {
    id: 'stock-3',
    nameFr: 'Pommes de terre fraîches',
    nameAr: 'بطاطا طازجة خاصة بالقلي',
    category: 'legumes',
    unit: 'kg',
    currentStock: 48,
    alertThreshold: 30,
    criticalThreshold: 12,
    idealStock: 120,
    unitCostDA: 75,
    supplierName: 'Marché de Gros Ain Benian',
    supplierPhone: '0661 33 22 11',
    lastRestockedAt: '2026-09-16T09:00:00Z',
  },
  {
    id: 'stock-4',
    nameFr: 'Huile de friture végétale',
    nameAr: 'زيت قلي نباتي نقي',
    category: 'epicerie',
    unit: 'L',
    currentStock: 26,
    alertThreshold: 20,
    criticalThreshold: 8,
    idealStock: 60,
    unitCostDA: 240,
    supplierName: 'Grossiste El-Afia',
    supplierPhone: '0555 88 99 00',
    expiryDate: '2027-01-15',
    lastRestockedAt: '2026-09-12T11:00:00Z',
  },
  {
    id: 'stock-5',
    nameFr: 'Riz basmati extra',
    nameAr: 'أرز بسمتي فاخر',
    category: 'epicerie',
    unit: 'kg',
    currentStock: 19,
    alertThreshold: 15,
    criticalThreshold: 5,
    idealStock: 40,
    unitCostDA: 220,
    supplierName: 'Importation Céréales Algérie',
    supplierPhone: '0560 11 44 77',
    expiryDate: '2027-06-30',
    lastRestockedAt: '2026-09-10T14:00:00Z',
  },
  {
    id: 'stock-6',
    nameFr: 'Vermicelles dorées',
    nameAr: 'شعيرية تقليدية',
    category: 'epicerie',
    unit: 'kg',
    currentStock: 14,
    alertThreshold: 8,
    criticalThreshold: 3,
    idealStock: 25,
    unitCostDA: 150,
    supplierName: 'Grossiste Pâtes Amor',
    supplierPhone: '0551 22 33 44',
    lastRestockedAt: '2026-09-08T09:00:00Z',
  },
  {
    id: 'stock-7',
    nameFr: 'Semoule & Farine tajine',
    nameAr: 'سميد وفرينة للمطلوع',
    category: 'epicerie',
    unit: 'kg',
    currentStock: 32,
    alertThreshold: 20,
    criticalThreshold: 8,
    idealStock: 60,
    unitCostDA: 90,
    supplierName: 'Moulins du Centre',
    supplierPhone: '0772 44 55 66',
    lastRestockedAt: '2026-09-15T08:30:00Z',
  },
  {
    id: 'stock-8',
    nameFr: 'Poivrons & Piments frais',
    nameAr: 'فلفل حلو وحار طازج',
    category: 'legumes',
    unit: 'kg',
    currentStock: 15,
    alertThreshold: 10,
    criticalThreshold: 4,
    idealStock: 30,
    unitCostDA: 180,
    supplierName: 'Maraîcher Mitidja',
    supplierPhone: '0663 55 66 77',
    expiryDate: '2026-09-22',
    lastRestockedAt: '2026-09-16T08:00:00Z',
  },
  {
    id: 'stock-9',
    nameFr: 'Épices marinades Sultan',
    nameAr: 'خلطة توابل السلطان',
    category: 'epicerie',
    unit: 'kg',
    currentStock: 7.5,
    alertThreshold: 5,
    criticalThreshold: 2,
    idealStock: 15,
    unitCostDA: 950,
    supplierName: 'Épices de Ghardaïa',
    supplierPhone: '0550 77 88 99',
    lastRestockedAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'stock-10',
    nameFr: 'Boissons 33cl fraîches',
    nameAr: 'مشروبات وعصائر 33 سل',
    category: 'boissons',
    unit: 'piece',
    currentStock: 52,
    alertThreshold: 35,
    criticalThreshold: 15,
    idealStock: 120,
    unitCostDA: 70,
    supplierName: 'Boissons & Jus Frais Centre',
    supplierPhone: '0771 99 88 77',
    lastRestockedAt: '2026-09-14T15:00:00Z',
  },
  {
    id: 'stock-11',
    nameFr: 'Boîtes poulet isothermes',
    nameAr: 'علب دجاج حرارية',
    category: 'emballages',
    unit: 'piece',
    currentStock: 38, // BAS (≤ 40)
    alertThreshold: 40,
    criticalThreshold: 15,
    idealStock: 150,
    unitCostDA: 45,
    supplierName: 'Emballages Modernes Alger',
    supplierPhone: '0662 11 00 22',
    lastRestockedAt: '2026-09-11T12:00:00Z',
  },
  {
    id: 'stock-12',
    nameFr: 'Sachets & Barquettes alu',
    nameAr: 'أكياس وصحون ألمنيوم',
    category: 'emballages',
    unit: 'piece',
    currentStock: 95,
    alertThreshold: 60,
    criticalThreshold: 25,
    idealStock: 250,
    unitCostDA: 25,
    supplierName: 'Emballages Modernes Alger',
    supplierPhone: '0662 11 00 22',
    lastRestockedAt: '2026-09-11T12:00:00Z',
  },
  {
    id: 'stock-13',
    nameFr: 'Sauce piquante harissa maison',
    nameAr: 'هريسة وصلصة حارة منزلية',
    category: 'epicerie',
    unit: 'L',
    currentStock: 8.5,
    alertThreshold: 6,
    criticalThreshold: 2,
    idealStock: 20,
    unitCostDA: 300,
    supplierName: 'Préparation artisanale',
    supplierPhone: '0771 01 20 33',
    lastRestockedAt: '2026-09-13T10:00:00Z',
  },
];

// ══════════════════════════════════════════════════
// INITIAL PRODUCT COMPOSITIONS
// ══════════════════════════════════════════════════
export const INITIAL_COMPOSITIONS: ProductComposition[] = [
  {
    productId: 'prod-1', // Poulet rôti
    ingredients: [
      { stockItemId: 'stock-1', quantity: 1 }, // 1 poulet
      { stockItemId: 'stock-2', quantity: 0.3 }, // 0.3 kg charbon
      { stockItemId: 'stock-11', quantity: 1 }, // 1 boîte
      { stockItemId: 'stock-9', quantity: 0.02 }, // 20g épices
    ],
  },
  {
    productId: 'prod-2', // Poulet braisé
    ingredients: [
      { stockItemId: 'stock-1', quantity: 1 }, // 1 poulet
      { stockItemId: 'stock-2', quantity: 0.4 }, // 0.4 kg charbon
      { stockItemId: 'stock-11', quantity: 1 }, // 1 boîte
      { stockItemId: 'stock-9', quantity: 0.025 }, // 25g épices
    ],
  },
  {
    productId: 'prod-3', // Frites
    ingredients: [
      { stockItemId: 'stock-3', quantity: 0.25 }, // 0.25 kg pommes de terre
      { stockItemId: 'stock-4', quantity: 0.03 }, // 0.03 L huile
      { stockItemId: 'stock-12', quantity: 1 }, // 1 barquette
    ],
  },
  {
    productId: 'prod-4', // Hmiss
    ingredients: [
      { stockItemId: 'stock-8', quantity: 0.2 }, // 0.2 kg poivrons
      { stockItemId: 'stock-4', quantity: 0.02 }, // 0.02 L huile
      { stockItemId: 'stock-13', quantity: 0.02 }, // 0.02 L sauce piment
      { stockItemId: 'stock-12', quantity: 1 }, // 1 barquette
    ],
  },
  {
    productId: 'prod-5', // Riz
    ingredients: [
      { stockItemId: 'stock-5', quantity: 0.15 }, // 0.15 kg riz
      { stockItemId: 'stock-6', quantity: 0.03 }, // 0.03 kg vermicelles
      { stockItemId: 'stock-9', quantity: 0.01 }, // 10g épices
      { stockItemId: 'stock-12', quantity: 1 }, // 1 barquette
    ],
  },
  {
    productId: 'prod-6', // Matlouh
    ingredients: [
      { stockItemId: 'stock-7', quantity: 0.15 }, // 0.15 kg semoule/farine
      { stockItemId: 'stock-12', quantity: 1 }, // 1 sachet
    ],
  },
  {
    productId: 'prod-7', // Boisson
    ingredients: [
      { stockItemId: 'stock-10', quantity: 1 }, // 1 canette/bouteille
    ],
  },
];

const now = new Date();
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

// ══════════════════════════════════════════════════
// TODAY'S 7 ORDERS (SUM OF NON-CANCELLED = 14 750 DA)
// ══════════════════════════════════════════════════
export const TODAY_ORDERS: Order[] = [
  {
    id: 'ord-1',
    orderNumber: '#SD-0001',
    customerId: 'cust-1',
    customerName: 'Karim Bouzid',
    customerPhone: '0550123456',
    type: 'delivery',
    status: 'pending',
    items: [
      { productId: 'prod-2', nameFr: 'Poulet braisé sur charbon', nameAr: 'دجاج مشوي على الجمر', price: 1500, quantity: 1 },
      { productId: 'prod-4', nameFr: 'Hmiss grillé piquant', nameAr: 'حميس مشوي حار', price: 400, quantity: 1 },
      { productId: 'prod-6', nameFr: 'Matlouh maison traditionnel', nameAr: 'مطلوع نتاع الدار', price: 50, quantity: 2 },
      { productId: 'prod-7', nameFr: 'Boisson naturelle fraîche', nameAr: 'مشروب طبيعي منعش', price: 150, quantity: 2 },
    ],
    subtotal: 2300,
    deliveryFee: 200,
    total: 2500,
    deliveryAddress: { wilaya: 'Alger', commune: 'Birkhadem', address: 'Cité 200 Logements, Bâtiment C, Apt 14', landmark: 'En face de la pharmacie centrale' },
    kitchenNotes: 'Bien pimenté le hmiss et découper le poulet en 4 morceaux svp.',
    createdAt: minutesAgo(8),
    updatedAt: minutesAgo(8),
    statusHistory: [{ status: 'pending', timestamp: minutesAgo(8), note: 'Commande reçue depuis l\'application client' }],
    isNewAlert: true,
    stockDeducted: false,
  },
  {
    id: 'ord-2',
    orderNumber: '#SD-0002',
    customerId: 'cust-2',
    customerName: 'Amine Belkacem',
    customerPhone: '0770987654',
    type: 'pickup',
    status: 'preparing',
    items: [
      { productId: 'prod-1', nameFr: 'Poulet rôti', nameAr: 'دجاج محمر', price: 1300, quantity: 2 },
      { productId: 'prod-3', nameFr: 'Frites fraîches maison', nameAr: 'بطاطا مقلية طازجة', price: 300, quantity: 2 },
      { productId: 'prod-5', nameFr: 'Riz aux épices & vermicelles', nameAr: 'أرز بالشعيرية والتوابل', price: 300, quantity: 1 },
    ],
    subtotal: 3500,
    deliveryFee: 0,
    total: 3500,
    pickupTimeSlot: '19:30 (Dès que possible)',
    kitchenNotes: 'Mettre du jus de rôtissoire sur le riz et sauce piquante à part.',
    createdAt: minutesAgo(24),
    updatedAt: minutesAgo(18),
    statusHistory: [
      { status: 'pending', timestamp: minutesAgo(24), note: 'Commande comptoir enregistrée' },
      { status: 'preparing', timestamp: minutesAgo(18), note: 'Préparation lancée en rôtisserie' },
    ],
    isNewAlert: false,
    stockDeducted: true,
  },
  {
    id: 'ord-3',
    orderNumber: '#SD-0003',
    customerId: 'cust-3',
    customerName: 'Yasmine Mansouri',
    customerPhone: '0661223344',
    type: 'delivery',
    status: 'ready',
    items: [
      { productId: 'prod-2', nameFr: 'Poulet braisé sur charbon', nameAr: 'دجاج مشوي على الجمر', price: 1500, quantity: 1 },
      { productId: 'prod-3', nameFr: 'Frites fraîches maison', nameAr: 'بطاطا مقلية طازجة', price: 300, quantity: 1 },
      { productId: 'prod-6', nameFr: 'Matlouh maison traditionnel', nameAr: 'مطلوع نتاع الدار', price: 50, quantity: 3 },
    ],
    subtotal: 1950,
    deliveryFee: 200,
    total: 2150,
    deliveryAddress: { wilaya: 'Alger', commune: 'Kouba', address: 'Rue Ben Omar, Imm 4, 2ème étage', landmark: 'À côté du grand rond-point' },
    kitchenNotes: 'Pain bien chaud si possible.',
    createdAt: minutesAgo(42),
    updatedAt: minutesAgo(6),
    statusHistory: [
      { status: 'pending', timestamp: minutesAgo(42), note: 'Commande reçue' },
      { status: 'preparing', timestamp: minutesAgo(35), note: 'Braise en cours' },
      { status: 'ready', timestamp: minutesAgo(6), note: 'Commande emballée avec soin en boîte isotherme, en attente du livreur' },
    ],
    isNewAlert: false,
    stockDeducted: true,
  },
  {
    id: 'ord-4',
    orderNumber: '#SD-0004',
    customerId: 'cust-4',
    customerName: 'Sofiane Cherif',
    customerPhone: '0555443322',
    type: 'delivery',
    status: 'delivered',
    items: [
      { productId: 'prod-1', nameFr: 'Poulet rôti', nameAr: 'دجاج محمر', price: 1300, quantity: 1 },
      { productId: 'prod-5', nameFr: 'Riz aux épices & vermicelles', nameAr: 'أرز بالشعيرية والتوابل', price: 300, quantity: 2 },
      { productId: 'prod-7', nameFr: 'Boisson naturelle fraîche', nameAr: 'مشروب طبيعي منعش', price: 150, quantity: 1 },
    ],
    subtotal: 2050,
    deliveryFee: 200,
    total: 2250,
    deliveryAddress: { wilaya: 'Alger', commune: 'Hydra', address: 'Boulevard Sidi Yahia, N° 45', landmark: 'Au-dessus du café glacier' },
    createdAt: minutesAgo(95),
    updatedAt: minutesAgo(20),
    statusHistory: [
      { status: 'pending', timestamp: minutesAgo(95) },
      { status: 'preparing', timestamp: minutesAgo(80) },
      { status: 'ready', timestamp: minutesAgo(45) },
      { status: 'delivered', timestamp: minutesAgo(20), note: 'Livré au client avec encaissement en espèces' },
    ],
    isNewAlert: false,
    stockDeducted: true,
  },
  {
    id: 'ord-5',
    orderNumber: '#SD-0005',
    customerId: 'cust-5',
    customerName: 'Nadia Hamidi',
    customerPhone: '0771556677',
    type: 'pickup',
    status: 'delivered',
    items: [
      { productId: 'prod-2', nameFr: 'Poulet braisé sur charbon', nameAr: 'دجاج مشوي على الجمر', price: 1500, quantity: 1 },
      { productId: 'prod-4', nameFr: 'Hmiss grillé piquant', nameAr: 'حميس مشوي حار', price: 400, quantity: 1 },
      { productId: 'prod-6', nameFr: 'Matlouh maison traditionnel', nameAr: 'مطلوع نتاع الدار', price: 50, quantity: 2 },
    ],
    subtotal: 2000,
    deliveryFee: 0,
    total: 2000,
    pickupTimeSlot: '18:00',
    createdAt: minutesAgo(130),
    updatedAt: minutesAgo(65),
    statusHistory: [
      { status: 'pending', timestamp: minutesAgo(130) },
      { status: 'preparing', timestamp: minutesAgo(115) },
      { status: 'ready', timestamp: minutesAgo(80) },
      { status: 'delivered', timestamp: minutesAgo(65), note: 'Remise au client au comptoir' },
    ],
    isNewAlert: false,
    stockDeducted: true,
  },
  {
    id: 'ord-6',
    orderNumber: '#SD-0006',
    customerId: 'cust-6',
    customerName: 'Reda Meziane',
    customerPhone: '0662889900',
    type: 'delivery',
    status: 'cancelled',
    items: [
      { productId: 'prod-1', nameFr: 'Poulet rôti', nameAr: 'دجاج محمر', price: 1300, quantity: 1 },
    ],
    subtotal: 1300,
    deliveryFee: 200,
    total: 1500,
    deliveryAddress: { wilaya: 'Alger', commune: 'El Mouradia', address: 'Rue Ahmed Ouaked, Apt 6', landmark: 'Proche du ministère' },
    cancellationReason: 'Client a annulé : changement d\'horaire de son côté.',
    createdAt: minutesAgo(180),
    updatedAt: minutesAgo(170),
    statusHistory: [
      { status: 'pending', timestamp: minutesAgo(180) },
      { status: 'cancelled', timestamp: minutesAgo(170), note: 'Annulation demandée par le client' },
    ],
    isNewAlert: false,
    stockDeducted: false,
  },
  {
    id: 'ord-7',
    orderNumber: '#SD-0007',
    customerId: 'cust-7',
    customerName: 'Walid Benaissa',
    customerPhone: '0560778899',
    type: 'delivery',
    status: 'delivered',
    items: [
      { productId: 'prod-1', nameFr: 'Poulet rôti', nameAr: 'دجاج محمر', price: 1300, quantity: 1 },
      { productId: 'prod-3', nameFr: 'Frites fraîches maison', nameAr: 'بطاطا مقلية طازجة', price: 300, quantity: 1 },
      { productId: 'prod-4', nameFr: 'Hmiss grillé piquant', nameAr: 'حميس مشوي حار', price: 400, quantity: 1 },
      { productId: 'prod-6', nameFr: 'Matlouh maison traditionnel', nameAr: 'مطلوع نتاع الدار', price: 50, quantity: 3 },
    ],
    subtotal: 2150,
    deliveryFee: 200,
    total: 2350,
    deliveryAddress: { wilaya: 'Alger', commune: 'Ain Naadja', address: 'Cité 720 Logements, Bloc 12, N° 3', landmark: 'En face de la station métro' },
    kitchenNotes: 'Bien cuit avec citron svp.',
    createdAt: minutesAgo(240),
    updatedAt: minutesAgo(190),
    statusHistory: [
      { status: 'pending', timestamp: minutesAgo(240) },
      { status: 'preparing', timestamp: minutesAgo(225) },
      { status: 'ready', timestamp: minutesAgo(205) },
      { status: 'delivered', timestamp: minutesAgo(190), note: 'Livrée avec succès' },
    ],
    isNewAlert: false,
    stockDeducted: true,
  },
];

// ══════════════════════════════════════════════════
// DETERMINISTIC 60-DAY GENERATOR (FIXED SEED PRNG)
// ══════════════════════════════════════════════════
function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateHistoricalData(): {
  orders: Order[];
  expenses: Expense[];
  stockMovements: StockMovement[];
  cashClosings: CashClosing[];
} {
  const rand = createPrng(12345);
  const orders: Order[] = [...TODAY_ORDERS];
  const expenses: Expense[] = [];
  const stockMovements: StockMovement[] = [];
  const cashClosings: CashClosing[] = [];

  const customerPool = [...INITIAL_CUSTOMERS];
  const communesPool = ['Birkhadem', 'Kouba', 'Hydra', 'Saoula', 'El Mouradia', 'Ain Naadja', 'Dely Ibrahim', 'Bachdjerrah'];

  let orderSeqCounter = 8;

  // Initial movements for today's active items
  stockMovements.push({
    id: 'mov-init-1',
    timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    stockItemId: 'stock-1',
    stockItemName: 'Poulet entier frais',
    type: 'out_auto',
    quantity: -2,
    balanceAfter: 4,
    authorRole: 'cuisinier',
    reason: 'Sortie préparation commande #SD-0002',
    orderId: 'ord-2',
    unitCostDA: 520,
  });

  stockMovements.push({
    id: 'mov-init-2',
    timestamp: new Date(now.getTime() - 36 * 3600 * 1000).toISOString(),
    stockItemId: 'stock-1',
    stockItemName: 'Poulet entier frais',
    type: 'waste',
    quantity: -1,
    balanceAfter: 6,
    authorRole: 'cuisinier',
    reason: 'Poulet tombé au sol lors du débrochage',
    unitCostDA: 520,
  });

  // Generate for past 60 days
  for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
    const dayDate = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000);
    const dayOfWeek = dayDate.getDay(); // 5 = Friday, 6 = Saturday, 4 = Thursday
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 4;

    // Weekends have 14 to 22 orders, weekdays have 7 to 12 orders
    const ordersCount = isWeekend
      ? 14 + Math.floor(rand() * 9)
      : 7 + Math.floor(rand() * 6);

    let dayDeliveredCash = 0;

    for (let ordIdx = 0; ordIdx < ordersCount; ordIdx++) {
      // Pick peak rush hours:
      // ~40% lunch rush: 13h00 - 14h45
      // ~50% dinner rush: 20h00 - 23h30
      // ~10% afternoon: 15h00 - 19h00
      const rushRoll = rand();
      let hour = 20;
      let min = Math.floor(rand() * 60);

      if (rushRoll < 0.4) {
        hour = 13 + (rand() < 0.6 ? 0 : 1);
        min = Math.floor(rand() * 45);
      } else if (rushRoll < 0.9) {
        hour = 20 + Math.floor(rand() * 4); // 20, 21, 22, 23
        min = Math.floor(rand() * 60);
      } else {
        hour = 15 + Math.floor(rand() * 5); // 15..19
        min = Math.floor(rand() * 60);
      }

      const orderTime = new Date(dayDate);
      orderTime.setHours(hour, min, Math.floor(rand() * 60), 0);
      const orderIso = orderTime.toISOString();

      // Type: ~58% delivery, ~42% pickup
      const isDelivery = rand() < 0.58;
      const type: 'delivery' | 'pickup' = isDelivery ? 'delivery' : 'pickup';

      // Status: ~95% delivered, ~5% cancelled
      const isCancelled = rand() < 0.05;
      const status = isCancelled ? 'cancelled' : 'delivered';

      // Pick customer
      const cust = customerPool[Math.floor(rand() * customerPool.length)];
      const commune = cust.commune || communesPool[Math.floor(rand() * communesPool.length)];

      // Build items
      const itemsList = [];
      // Main chicken
      const chickenQty = rand() < 0.35 ? 2 : 1;
      const chickenProd = rand() < 0.5 ? INITIAL_PRODUCTS[0] : INITIAL_PRODUCTS[1];
      itemsList.push({
        productId: chickenProd.id,
        nameFr: chickenProd.nameFr,
        nameAr: chickenProd.nameAr,
        price: chickenProd.price,
        quantity: chickenQty,
      });

      // Side dish 1: frites or riz
      if (rand() < 0.75) {
        const sideProd = rand() < 0.55 ? INITIAL_PRODUCTS[2] : INITIAL_PRODUCTS[4];
        itemsList.push({
          productId: sideProd.id,
          nameFr: sideProd.nameFr,
          nameAr: sideProd.nameAr,
          price: sideProd.price,
          quantity: rand() < 0.3 ? 2 : 1,
        });
      }

      // Side dish 2: hmiss or matlouh
      if (rand() < 0.6) {
        const sideProd2 = rand() < 0.4 ? INITIAL_PRODUCTS[3] : INITIAL_PRODUCTS[5];
        itemsList.push({
          productId: sideProd2.id,
          nameFr: sideProd2.nameFr,
          nameAr: sideProd2.nameAr,
          price: sideProd2.price,
          quantity: sideProd2.id === 'prod-6' ? 2 + Math.floor(rand() * 3) : 1,
        });
      }

      // Drinks
      if (rand() < 0.65) {
        const drinkProd = INITIAL_PRODUCTS[6];
        itemsList.push({
          productId: drinkProd.id,
          nameFr: drinkProd.nameFr,
          nameAr: drinkProd.nameAr,
          price: drinkProd.price,
          quantity: 1 + Math.floor(rand() * 3),
        });
      }

      const subtotal = itemsList.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const deliveryFee = isDelivery ? 200 : 0;
      const total = subtotal + deliveryFee;

      const orderNumber = `#SD-${String(orderSeqCounter++).padStart(4, '0')}`;

      const history = [
        { status: 'pending' as const, timestamp: orderIso },
        {
          status: 'preparing' as const,
          timestamp: new Date(orderTime.getTime() + 5 * 60000).toISOString(),
        },
      ];

      if (status === 'delivered') {
        history.push({
          status: 'ready' as const,
          timestamp: new Date(orderTime.getTime() + 22 * 60000).toISOString(),
        });
        history.push({
          status: 'delivered' as const,
          timestamp: new Date(orderTime.getTime() + 42 * 60000).toISOString(),
          note: isDelivery ? 'Livré et encaissé en espèces' : 'Remis au comptoir',
        });
        dayDeliveredCash += total;
      } else {
        history.push({
          status: 'cancelled' as const,
          timestamp: new Date(orderTime.getTime() + 15 * 60000).toISOString(),
          note: 'Commande annulée par le client',
        });
      }

      orders.push({
        id: `ord-hist-${dayOffset}-${ordIdx}`,
        orderNumber,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        type,
        status,
        items: itemsList,
        subtotal,
        deliveryFee,
        total,
        deliveryAddress: isDelivery
          ? {
              wilaya: 'Alger',
              commune,
              address: cust.address,
              landmark: cust.landmark,
            }
          : undefined,
        pickupTimeSlot: !isDelivery ? '19:30' : undefined,
        createdAt: orderIso,
        updatedAt: history[history.length - 1].timestamp,
        statusHistory: history,
        cancellationReason: isCancelled ? 'Annulation client avant départ livreur' : undefined,
        isNewAlert: false,
        stockDeducted: status === 'delivered',
      });
    }

    // Generate Expenses for this day or weekly
    const dateStr = dayDate.toISOString().split('T')[0];

    // Every 3-4 days: Supplier replenishment (Achats matières)
    if (dayOffset % 3 === 0) {
      const chickenQtyReceived = 40 + Math.floor(rand() * 20);
      const coalQtyReceived = 80 + Math.floor(rand() * 40);
      const amount = chickenQtyReceived * 520 + coalQtyReceived * 120 + 8000;

      expenses.push({
        id: `exp-mat-${dayOffset}`,
        date: dateStr,
        category: 'achats_matieres',
        amount,
        note: `Réapprovisionnement poulet (${chickenQtyReceived} pcs), charbon (${coalQtyReceived} kg) & emballages`,
        createdBy: 'Gérant (Admin)',
        createdAt: `${dateStr}T09:30:00Z`,
      });

      // Corresponding Stock movement
      stockMovements.push({
        id: `mov-in-${dayOffset}-1`,
        timestamp: `${dateStr}T09:30:00Z`,
        stockItemId: 'stock-1',
        stockItemName: 'Poulet entier frais',
        type: 'in',
        quantity: chickenQtyReceived,
        balanceAfter: 45,
        authorRole: 'gerant',
        reason: `Réception bon de livraison Abattoir El-Baraqa`,
        unitCostDA: 520,
      });
    }

    // Daily delivery driver compensation
    expenses.push({
      id: `exp-livreur-${dayOffset}`,
      date: dateStr,
      category: 'livreur',
      amount: 1800 + Math.floor(rand() * 800),
      note: 'Indemnité livraison quotidienne de service',
      createdBy: 'Gérant',
      createdAt: `${dateStr}T23:45:00Z`,
    });

    // 1st of month: Rent
    if (dayDate.getDate() === 1) {
      expenses.push({
        id: `exp-loyer-${dayOffset}`,
        date: dateStr,
        category: 'loyer',
        amount: 60000,
        note: 'Loyer mensuel local commercial Les Vergers',
        createdBy: 'Gérant',
        createdAt: `${dateStr}T10:00:00Z`,
      });
    }

    // 15th of month: Energy & Salaries
    if (dayDate.getDate() === 15) {
      expenses.push({
        id: `exp-energy-${dayOffset}`,
        date: dateStr,
        category: 'energie',
        amount: 17500,
        note: 'Facture Sonelgaz (électricité triphasée & gaz)',
        createdBy: 'Gérant',
        createdAt: `${dateStr}T11:00:00Z`,
      });
      expenses.push({
        id: `exp-salaires-${dayOffset}`,
        date: dateStr,
        category: 'salaires',
        amount: 75000,
        note: 'Avances sur salaires équipe cuisine et service',
        createdBy: 'Gérant',
        createdAt: `${dateStr}T12:00:00Z`,
      });
    }

    // Past cash closing (for the last 14 days)
    if (dayOffset <= 14) {
      const diffRoll = (rand() - 0.5) * 400; // slight difference +/- 200 DA
      const diff = Math.round(diffRoll / 50) * 50;
      cashClosings.push({
        id: `closing-${dayOffset}`,
        date: dateStr,
        theoreticalCash: dayDeliveredCash,
        countedCash: dayDeliveredCash + diff,
        difference: diff,
        note: diff === 0 ? 'Caisse exacte conforme' : diff > 0 ? 'Surplus pourboires non retirés' : 'Petit écart monnaie rendu',
        closedBy: 'Gérant',
        closedAt: `${dateStr}T23:55:00Z`,
        locked: true,
      });
    }
  }

  return { orders, expenses, stockMovements, cashClosings };
}

export const INITIAL_SETTINGS: StoreSettings = {
  isOpen: true,
  manualOverride: false,
  openTime: '13:00',
  closeTime: '00:00',
  deliveryFee: 200,
  estimatedPrepTimeMinutes: 25,
  phone: '+213 771 01 20 33',
  address: 'Les Vergers, Birkhadem',
  city: 'Alger',
  soundEnabled: true,
  managerPin: '0000',
  dailyRevenueTarget: 25000,
  autoStockAvailability: true,
};

export const INITIAL_ORDERS: Order[] = TODAY_ORDERS;
