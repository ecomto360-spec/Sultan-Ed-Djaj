import type { Product, ProductCategoryItem } from '../types';
import { authFetch, getAdminToken, getStoredAdminRole } from './authService';

export interface RemoteCatalogState {
  initialized: boolean;
  unchanged?: boolean;
  version: number;
  products: Product[];
  categories: ProductCategoryItem[];
  updatedAt?: string | null;
}

export class CatalogServiceError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'CatalogServiceError';
    this.status = status;
    this.code = code;
  }
}

async function readCatalogResponse(response: Response): Promise<RemoteCatalogState> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new CatalogServiceError(
      data?.error || `Erreur catalogue (${response.status})`,
      response.status,
      data?.code
    );
  }

  const catalog = data?.catalog;
  if (!catalog || typeof catalog !== 'object') {
    throw new CatalogServiceError('Réponse catalogue invalide.', 502, 'INVALID_CATALOG_RESPONSE');
  }

  const unchanged = catalog.unchanged === true;
  if (!unchanged && (!Array.isArray(catalog.products) || !Array.isArray(catalog.categories))) {
    throw new CatalogServiceError('Réponse catalogue incomplète.', 502, 'INVALID_CATALOG_RESPONSE');
  }

  return {
    initialized: catalog.initialized === true,
    unchanged,
    version: Number.isInteger(Number(catalog.version)) ? Number(catalog.version) : 0,
    products: Array.isArray(catalog.products) ? catalog.products : [],
    categories: Array.isArray(catalog.categories) ? catalog.categories : [],
    updatedAt: catalog.updatedAt || null,
  };
}

export async function fetchCatalogRemote(knownVersion?: number): Promise<RemoteCatalogState> {
  const query = Number.isInteger(knownVersion) && Number(knownVersion) > 0
    ? `?version=${Number(knownVersion)}`
    : '';
  const response = await authFetch(`/api/catalog${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  return readCatalogResponse(response);
}

function isDataImage(value?: string) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

/**
 * Existing manager photos may still be browser-local data URLs. Upload them
 * one product at a time before publishing the catalog: this avoids sending
 * several megabytes of base64 in one Vercel request and gives each client a
 * normal public Supabase Storage URL.
 */
async function uploadLocalProductImages(product: Product): Promise<Product> {
  const largeIsData = isDataImage(product.imageUrl);
  const thumbIsData = isDataImage(product.imageThumbUrl);
  if (!largeIsData && !thumbIsData) return product;

  try {
    const response = await authFetch('/api/upload', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: product.id,
        largeBase64: largeIsData ? product.imageUrl : product.imageThumbUrl,
        ...(largeIsData && thumbIsData ? { thumbBase64: product.imageThumbUrl } : {}),
      }),
      cache: 'no-store',
    });
    if (!response.ok) return product;

    const data = await response.json().catch(() => null);
    if (!data?.imageUrl) return product;

    return {
      ...product,
      imageUrl: largeIsData ? data.imageUrl : product.imageUrl,
      imageThumbUrl: thumbIsData
        ? (largeIsData ? data.imageThumbUrl || data.imageUrl : data.imageUrl)
        : product.imageThumbUrl || (largeIsData ? data.imageThumbUrl || data.imageUrl : undefined),
    };
  } catch {
    // Keep the data URL; /api/catalog also migrates it server-side, and will
    // preserve it if Storage is temporarily unavailable.
    return product;
  }
}

export async function publishCatalogRemote(input: {
  products: Product[];
  categories: ProductCategoryItem[];
  expectedVersion: number;
}): Promise<RemoteCatalogState | null> {
  if (!getAdminToken()) return null;

  const products = getStoredAdminRole() === 'gerant'
    ? await Promise.all(input.products.map(uploadLocalProductImages))
    : input.products;

  const response = await authFetch('/api/catalog', {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...input, products }),
    cache: 'no-store',
  });
  return readCatalogResponse(response);
}
