import crypto from 'node:crypto';

import { ApiError, getSupabaseServerConfig } from './orders.js';

export const PRODUCT_IMAGE_BUCKET = 'product-images';
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSIONS = new Map([
  ['image/webp', 'webp'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
]);

export function safeStorageSegment(value, fallback = 'product') {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return cleaned || fallback;
}

export function parseDataUrlImage(value, field = 'image') {
  if (typeof value !== 'string') {
    throw new ApiError(400, `Le champ ${field} doit contenir une image.`, 'INVALID_IMAGE');
  }

  const match = value.trim().match(/^data:(image\/(?:webp|jpeg|png));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) {
    throw new ApiError(400, `Format d’image invalide pour ${field}. Utilisez WebP, JPEG ou PNG.`, 'INVALID_IMAGE');
  }

  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (buffer.length === 0) {
    throw new ApiError(400, `L’image ${field} est vide.`, 'INVALID_IMAGE');
  }
  if (buffer.length > MAX_PRODUCT_IMAGE_BYTES) {
    throw new ApiError(413, `L’image ${field} dépasse 5 Mo.`, 'IMAGE_TOO_LARGE');
  }

  return {
    buffer,
    contentType,
    extension: MIME_EXTENSIONS.get(contentType) || 'webp',
  };
}

export function isDataImageUrl(value) {
  return typeof value === 'string' && /^data:image\/(?:webp|jpeg|png);base64,/i.test(value.trim());
}

function requireSupabaseStorageConfig() {
  const config = getSupabaseServerConfig();
  if (!config) {
    throw new ApiError(
      503,
      'Supabase Storage non configuré. Vérifiez SUPABASE_URL et SUPABASE_SECRET_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }
  return config;
}

export function getPublicStorageUrl(objectPath) {
  const { url } = requireSupabaseStorageConfig();
  const encodedPath = objectPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return `${url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${encodedPath}`;
}

async function uploadBufferToProductImages(objectPath, buffer, contentType) {
  const config = requireSupabaseStorageConfig();
  const serviceRoleKey = config.serviceRoleKey;
  const headers = {
    apikey: serviceRoleKey,
    'Content-Type': contentType,
    'cache-control': 'max-age=31536000',
    'x-upsert': 'true',
  };
  if (serviceRoleKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }

  const encodedPath = objectPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  const response = await fetch(
    `${config.url}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}/${encodedPath}`,
    {
      method: 'POST',
      headers,
      body: buffer,
    }
  );
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const detail = payload?.message || payload?.error || response.statusText;
    throw new ApiError(502, `Échec de l’envoi de l’image vers Supabase Storage (${response.status}) : ${detail}`, 'IMAGE_UPLOAD_FAILED');
  }

  return getPublicStorageUrl(objectPath);
}

/**
 * Uploads a data URL under a content-addressed path. A changed image therefore
 * receives a new public URL and cannot remain stuck behind a browser/CDN cache.
 */
export async function uploadDataUrlImage(value, pathStem = 'products/image', field = 'image') {
  const image = parseDataUrlImage(value, field);
  const hash = crypto.createHash('sha256').update(image.buffer).digest('hex').slice(0, 24);
  const cleanStem = String(pathStem || 'products/image')
    .split('/')
    .map(segment => safeStorageSegment(segment, 'image'))
    .join('/');
  const objectPath = `${cleanStem}-${hash}.${image.extension}`;
  return uploadBufferToProductImages(objectPath, image.buffer, image.contentType);
}
