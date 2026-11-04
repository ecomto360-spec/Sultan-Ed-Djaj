// Catalogue serveur de référence pour le recalcul des totaux.
// Le navigateur envoie uniquement productId + quantity : les prix ci-dessous
// font foi côté API. À mettre à jour en même temps que le catalogue produit
// tant que le catalogue lui-même n'est pas migré dans la base partagée.
export const SERVER_CATALOG = [
  { id: 'prod-1', nameFr: 'Poulet rôti', nameAr: 'دجاج محمر', price: 1300, isAvailable: true },
  { id: 'prod-2', nameFr: 'Poulet braisé sur charbon', nameAr: 'دجاج مشوي على الجمر', price: 1500, isAvailable: true },
  { id: 'prod-3', nameFr: 'Frites fraîches maison', nameAr: 'بطاطا مقلية طازجة', price: 300, isAvailable: true },
  { id: 'prod-4', nameFr: 'Hmiss grillé piquant', nameAr: 'حميس مشوي حار', price: 400, isAvailable: true },
  { id: 'prod-5', nameFr: 'Riz aux épices & vermicelles', nameAr: 'أرز بالشعيرية والتوابل', price: 300, isAvailable: true },
  { id: 'prod-6', nameFr: 'Matlouh maison traditionnel', nameAr: 'مطلوع نتاع الدار', price: 50, isAvailable: true },
  { id: 'prod-7', nameFr: 'Boisson naturelle fraîche', nameAr: 'مشروب طبيعي منعش', price: 150, isAvailable: true },
];

export const SERVER_CATALOG_BY_ID = new Map(
  SERVER_CATALOG.map(product => [product.id, product])
);

export function getServerDeliveryFee() {
  const parsed = Number(process.env.ORDER_DELIVERY_FEE_DA || 200);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 200;
}
