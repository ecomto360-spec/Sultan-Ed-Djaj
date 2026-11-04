import { ApiError, supabaseRest } from './orders.js';
import { isDataImageUrl, safeStorageSegment, uploadDataUrlImage } from './storage.js';

const MAX_PRODUCTS = 500;
const MAX_CATEGORIES = 100;
const MAX_OPTIONS_PER_PRODUCT = 50;
const MAX_IMAGE_REFERENCE_LENGTH = 8_000_000;
const ALLOWED_BADGES = new Set(['nouveau', 'populaire', 'epice', 'promo']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value, field, { max = 500, required = false, fallback = '' } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new ApiError(400, `Le champ ${field} est obligatoire.`, 'INVALID_CATALOG');
    return fallback;
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, `Le champ ${field} doit être un texte.`, 'INVALID_CATALOG');
  }
  const cleaned = value.trim();
  if (required && !cleaned) {
    throw new ApiError(400, `Le champ ${field} est obligatoire.`, 'INVALID_CATALOG');
  }
  if (cleaned.length > max) {
    throw new ApiError(400, `Le champ ${field} dépasse ${max} caractères.`, 'INVALID_CATALOG');
  }
  return cleaned;
}

function cleanNumber(value, field, { min = 0, max = 1_000_000, fallback = 0 } = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new ApiError(400, `Valeur invalide pour ${field}.`, 'INVALID_CATALOG');
  }
  return number;
}

function cleanBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function cleanImageReference(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new ApiError(400, `Le champ ${field} doit être une URL ou une image.`, 'INVALID_CATALOG');
  }
  const cleaned = value.trim();
  if (!cleaned) return undefined;
  if (cleaned.length > MAX_IMAGE_REFERENCE_LENGTH) {
    throw new ApiError(413, `L’image ${field} est trop volumineuse.`, 'IMAGE_TOO_LARGE');
  }
  if (
    cleaned.toLowerCase().startsWith('data:image/') ||
    /^https?:\/\//i.test(cleaned) ||
    !/^[a-z][a-z0-9+.-]*:/i.test(cleaned)
  ) {
    return cleaned;
  }
  throw new ApiError(400, `URL d’image invalide pour ${field}.`, 'INVALID_CATALOG');
}

function sanitizeOptions(rawOptions) {
  if (rawOptions === undefined || rawOptions === null) return [];
  if (!Array.isArray(rawOptions) || rawOptions.length > MAX_OPTIONS_PER_PRODUCT) {
    throw new ApiError(400, 'Les options du produit sont invalides.', 'INVALID_CATALOG');
  }
  return rawOptions.map((raw, index) => {
    if (!isRecord(raw)) throw new ApiError(400, `Option ${index + 1} invalide.`, 'INVALID_CATALOG');
    return {
      id: cleanString(raw.id, 'option.id', { max: 100, required: true }),
      nameFr: cleanString(raw.nameFr, 'option.nameFr', { max: 160, required: true }),
      nameAr: cleanString(raw.nameAr, 'option.nameAr', { max: 160 }),
      extraPrice: cleanNumber(raw.extraPrice, 'option.extraPrice', { min: 0, max: 1_000_000 }),
    };
  });
}

function sanitizeBadges(rawBadges) {
  if (rawBadges === undefined || rawBadges === null) return undefined;
  if (!Array.isArray(rawBadges)) throw new ApiError(400, 'Les badges du produit sont invalides.', 'INVALID_CATALOG');
  const badges = [...new Set(rawBadges.filter(badge => ALLOWED_BADGES.has(badge)))];
  return badges.length > 0 ? badges : undefined;
}

export function sanitizeProduct(raw, index = 0) {
  if (!isRecord(raw)) throw new ApiError(400, `Produit ${index + 1} invalide.`, 'INVALID_CATALOG');

  const product = {
    id: cleanString(raw.id, 'product.id', { max: 120, required: true }),
    nameFr: cleanString(raw.nameFr, 'product.nameFr', { max: 180, required: true }),
    nameAr: cleanString(raw.nameAr, 'product.nameAr', { max: 180 }),
    descriptionFr: cleanString(raw.descriptionFr, 'product.descriptionFr', { max: 2000 }),
    descriptionAr: cleanString(raw.descriptionAr, 'product.descriptionAr', { max: 2000 }),
    price: cleanNumber(raw.price, 'product.price', { min: 0, max: 10_000_000 }),
    originalPrice: (raw.originalPrice ?? raw.oldPrice) === undefined || (raw.originalPrice ?? raw.oldPrice) === null || (raw.originalPrice ?? raw.oldPrice) === ''
      ? undefined
      : cleanNumber(raw.originalPrice ?? raw.oldPrice, 'product.originalPrice', { min: 0, max: 10_000_000 }),
    category: cleanString(raw.category, 'product.category', { max: 100, required: true }),
    isAvailable: raw.isAvailable !== false,
    isVisible: raw.isVisible !== false,
    isFeatured: cleanBoolean(raw.isFeatured, false),
    isArchived: cleanBoolean(raw.isArchived, false),
    sortOrder: cleanNumber(raw.sortOrder, 'product.sortOrder', { min: -100000, max: 100000, fallback: index + 1 }),
    countsInChickenQuota: raw.countsInChickenQuota !== false,
    chickenQuotaPerItem: raw.chickenQuotaPerItem === undefined || raw.chickenQuotaPerItem === null
      ? undefined
      : cleanNumber(raw.chickenQuotaPerItem, 'product.chickenQuotaPerItem', { min: 0, max: 1000 }),
    badges: sanitizeBadges(raw.badges),
    options: sanitizeOptions(raw.options),
    imageType: cleanString(raw.imageType, 'product.imageType', { max: 120, fallback: 'poulet-roti' }) || 'poulet-roti',
    imageUrl: cleanImageReference(raw.imageUrl, 'product.imageUrl'),
    imageThumbUrl: cleanImageReference(raw.imageThumbUrl, 'product.imageThumbUrl'),
    createdAt: raw.createdAt ? cleanString(raw.createdAt, 'product.createdAt', { max: 100 }) : undefined,
    updatedAt: raw.updatedAt ? cleanString(raw.updatedAt, 'product.updatedAt', { max: 100 }) : undefined,
  };

  return Object.fromEntries(Object.entries(product).filter(([, value]) => value !== undefined));
}

export function sanitizeCategory(raw, index = 0) {
  if (!isRecord(raw)) throw new ApiError(400, `Catégorie ${index + 1} invalide.`, 'INVALID_CATALOG');
  const category = {
    id: cleanString(raw.id, 'category.id', { max: 100, required: true }),
    nameFr: cleanString(raw.nameFr, 'category.nameFr', { max: 140, required: true }),
    nameAr: cleanString(raw.nameAr, 'category.nameAr', { max: 140 }),
    order: cleanNumber(raw.order, 'category.order', { min: -100000, max: 100000, fallback: index + 1 }),
    ...(typeof raw.icon === 'string' && raw.icon.trim()
      ? { icon: cleanString(raw.icon, 'category.icon', { max: 100 }) }
      : {}),
  };
  return category;
}

export function sanitizeCatalogPayload(body) {
  if (!isRecord(body)) throw new ApiError(400, 'Catalogue JSON invalide.', 'INVALID_CATALOG');
  if (!Array.isArray(body.products) || body.products.length > MAX_PRODUCTS) {
    throw new ApiError(400, 'La liste des produits est invalide.', 'INVALID_CATALOG');
  }
  if (!Array.isArray(body.categories) || body.categories.length > MAX_CATEGORIES) {
    throw new ApiError(400, 'La liste des catégories est invalide.', 'INVALID_CATALOG');
  }

  const products = body.products.map(sanitizeProduct);
  const categories = body.categories.map(sanitizeCategory);
  if (new Set(products.map(product => product.id)).size !== products.length) {
    throw new ApiError(400, 'Deux produits utilisent le même identifiant.', 'INVALID_CATALOG');
  }
  if (new Set(categories.map(category => category.id)).size !== categories.length) {
    throw new ApiError(400, 'Deux catégories utilisent le même identifiant.', 'INVALID_CATALOG');
  }

  const expectedVersion = body.expectedVersion === undefined || body.expectedVersion === null
    ? null
    : Number(body.expectedVersion);
  if (expectedVersion !== null && (!Number.isInteger(expectedVersion) || expectedVersion < 0)) {
    throw new ApiError(400, 'Version du catalogue invalide.', 'INVALID_CATALOG');
  }

  return { products, categories, expectedVersion };
}

async function migrateProductImages(products) {
  const cache = new Map();

  const migrate = async (value, productId, kind) => {
    if (!isDataImageUrl(value)) return value;
    const cacheKey = `${kind}:${value.length}:${value.slice(0, 96)}:${value.slice(-96)}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    try {
      const uploaded = await uploadDataUrlImage(
        value,
        `products/${safeStorageSegment(productId)}/${kind}`,
        `${productId}.${kind}`
      );
      cache.set(cacheKey, uploaded);
      return uploaded;
    } catch (error) {
      // Never lose a manager's existing local photo just because Storage is
      // temporarily unavailable: keep the data URL in the shared catalog and
      // let a later publish retry the migration.
      console.warn(`[catalog] Image migration deferred for ${productId}/${kind}:`, error?.message || error);
      cache.set(cacheKey, value);
      return value;
    }
  };

  return Promise.all(products.map(async product => {
    const next = { ...product };
    if (next.imageUrl) next.imageUrl = await migrate(next.imageUrl, product.id, '800');
    if (next.imageThumbUrl) next.imageThumbUrl = await migrate(next.imageThumbUrl, product.id, '400');
    return next;
  }));
}

export function emptyCatalogRow() {
  return {
    singleton: true,
    products: [],
    categories: [],
    version: 0,
    updated_at: null,
  };
}

export async function getCatalogStateRow() {
  const rows = await supabaseRest(
    '/rest/v1/catalog_state?select=singleton,products,categories,version,updated_at&singleton=eq.true&limit=1'
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : emptyCatalogRow();
}

export function presentCatalog(row, { omitData = false } = {}) {
  const safeRow = row || emptyCatalogRow();
  const version = Number.isInteger(Number(safeRow.version)) ? Number(safeRow.version) : 0;
  const initialized = version > 0;
  const result = {
    initialized,
    version,
    updatedAt: safeRow.updated_at || null,
  };
  if (!omitData) {
    result.products = Array.isArray(safeRow.products) ? safeRow.products : [];
    result.categories = Array.isArray(safeRow.categories) ? safeRow.categories : [];
  } else {
    result.unchanged = true;
  }
  return result;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function applyAvailabilityOnly(existingProducts, incomingProducts) {
  const incomingById = new Map(incomingProducts.map(product => [product.id, product]));
  return existingProducts.map(product => {
    const incoming = incomingById.get(product.id);
    if (!incoming || incoming.isAvailable === product.isAvailable) return product;
    return { ...product, isAvailable: incoming.isAvailable };
  });
}

export async function saveCatalogState(body, staffSession) {
  const payload = sanitizeCatalogPayload(body);
  const existing = await getCatalogStateRow();
  const existingVersion = Number(existing.version) || 0;
  const expectedVersion = payload.expectedVersion ?? existingVersion;

  if (expectedVersion !== existingVersion) {
    throw new ApiError(
      409,
      `Le catalogue a changé sur un autre poste (version ${existingVersion}). Rechargez-le avant de publier.`,
      'CATALOG_VERSION_CONFLICT'
    );
  }

  const existingProducts = Array.isArray(existing.products) ? existing.products : [];
  const existingCategories = Array.isArray(existing.categories) ? existing.categories : [];
  let nextProducts;
  let nextCategories;

  if (staffSession.role === 'gerant') {
    nextProducts = await migrateProductImages(payload.products);
    nextCategories = payload.categories;
  } else {
    if (existingVersion === 0) {
      throw new ApiError(409, 'Le catalogue partagé doit d’abord être publié depuis le compte Gérant.', 'CATALOG_NOT_INITIALIZED');
    }
    // Cook/cashier screens may legitimately toggle stock, but they must never
    // replace names, prices or images with an older browser-local catalog.
    nextProducts = applyAvailabilityOnly(existingProducts, payload.products);
    nextCategories = existingCategories;
  }

  if (existingVersion > 0 && sameJson(nextProducts, existingProducts) && sameJson(nextCategories, existingCategories)) {
    return existing;
  }

  const nextVersion = existingVersion + 1;
  let rows;
  if (existingVersion === 0 && !existing.updated_at && existingProducts.length === 0 && existingCategories.length === 0) {
    // The migration inserts the singleton row, so this is only a defensive
    // path if that row was deleted manually.
    try {
      rows = await supabaseRest('/rest/v1/catalog_state', {
        method: 'POST',
        prefer: 'return=representation',
        body: {
          singleton: true,
          products: nextProducts,
          categories: nextCategories,
          version: nextVersion,
        },
      });
    } catch (error) {
      if (error?.code !== '23505') throw error;
      rows = await supabaseRest(
        `/rest/v1/catalog_state?singleton=eq.true&version=eq.${existingVersion}`,
        {
          method: 'PATCH',
          prefer: 'return=representation',
          body: { products: nextProducts, categories: nextCategories, version: nextVersion },
        }
      );
    }
  } else {
    rows = await supabaseRest(
      `/rest/v1/catalog_state?singleton=eq.true&version=eq.${existingVersion}`,
      {
        method: 'PATCH',
        prefer: 'return=representation',
        body: { products: nextProducts, categories: nextCategories, version: nextVersion },
      }
    );
  }

  if (!Array.isArray(rows) || !rows[0]) {
    throw new ApiError(409, 'Le catalogue a changé pendant la publication. Rechargez-le puis réessayez.', 'CATALOG_VERSION_CONFLICT');
  }
  return rows[0];
}
