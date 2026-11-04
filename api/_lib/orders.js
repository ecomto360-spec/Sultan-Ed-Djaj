import crypto from 'node:crypto';
import { SERVER_CATALOG_BY_ID, getServerDeliveryFee } from './catalog.js';

const SESSION_SECRET = process.env.SESSION_SECRET || 'sultan-ed-djaj-session-secret-key-2026-prod';
const VALID_STAFF_ROLES = new Set(['gerant', 'cuisinier', 'caissier']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STAFF_SUBJECTS = {
  gerant: '00000000-0000-4000-8000-000000000001',
  cuisinier: '00000000-0000-4000-8000-000000000002',
  caissier: '00000000-0000-4000-8000-000000000003',
};

export const APP_TO_DB_STATUS = {
  pending: 'en_attente',
  preparing: 'en_preparation',
  ready: 'prete',
  delivered: 'livree',
  cancelled: 'annulee',
};

export const DB_TO_APP_STATUS = {
  en_attente: 'pending',
  en_preparation: 'preparing',
  prete: 'ready',
  livree: 'delivered',
  annulee: 'cancelled',
};

const APP_TO_DB_TYPE = {
  delivery: 'livraison',
  pickup: 'comptoir',
  livraison: 'livraison',
  comptoir: 'comptoir',
};

const DB_TO_APP_TYPE = {
  livraison: 'delivery',
  comptoir: 'pickup',
};

const APP_TO_DB_SOURCE = {
  app: 'App',
  phone: 'Tél',
  counter: 'Comptoir',
  whatsapp: 'WhatsApp',
  App: 'App',
  'Tél': 'Tél',
  Comptoir: 'Comptoir',
  WhatsApp: 'WhatsApp',
};

const DB_TO_APP_SOURCE = {
  App: 'app',
  'Tél': 'phone',
  Comptoir: 'counter',
  WhatsApp: 'whatsapp',
};

const ALLOWED_TRANSITIONS = {
  en_attente: new Set(['en_attente', 'en_preparation', 'prete', 'annulee']),
  en_preparation: new Set(['en_preparation', 'prete', 'annulee']),
  prete: new Set(['prete', 'livree', 'annulee']),
  livree: new Set(['livree']),
  annulee: new Set(['annulee']),
};

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sendJson(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(payload);
}

export function handleApiError(res, error) {
  if (error instanceof ApiError) {
    return sendJson(res, error.status, {
      error: error.message,
      ...(error.code ? { code: error.code } : {}),
    });
  }

  console.error('[orders-api]', error);
  return sendJson(res, 500, {
    error: 'Erreur interne du service de commandes.',
    code: 'ORDERS_INTERNAL_ERROR',
  });
}

export async function readJsonBody(req) {
  if (!req.body) return {};

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      throw new ApiError(400, 'Corps JSON invalide.', 'INVALID_JSON');
    }
  }

  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf8') || '{}');
    } catch {
      throw new ApiError(400, 'Corps JSON invalide.', 'INVALID_JSON');
    }
  }

  return req.body;
}

export function getSupabaseServerConfig() {
  const url = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  // SUPABASE_SECRET_KEY accepte la nouvelle clé sb_secret_... (rôle
  // service_role). L'ancien nom reste accepté pour les projets legacy.
  const serviceRoleKey = String(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  ).trim();
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

export async function supabaseRest(path, { method = 'GET', body, prefer } = {}) {
  const config = getSupabaseServerConfig();
  if (!config) {
    throw new ApiError(
      503,
      'Service de commandes non configuré. Vérifiez SUPABASE_URL et SUPABASE_SECRET_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }

  if (config.serviceRoleKey.startsWith('sb_publishable_')) {
    throw new ApiError(
      503,
      'SUPABASE_SECRET_KEY contient une clé publique. Utilisez la clé secrète sb_secret_... côté serveur.',
      'SUPABASE_SECRET_KEY_INVALID'
    );
  }

  const isOpaqueApiKey = config.serviceRoleKey.startsWith('sb_');
  const response = await fetch(`${config.url}${path}`, {
    method,
    headers: {
      apikey: config.serviceRoleKey,
      // Les clés sb_secret_... ne sont pas des JWT : elles vont uniquement
      // dans apikey. Les anciennes clés service_role JWT gardent Bearer.
      ...(!isOpaqueApiKey
        ? { Authorization: `Bearer ${config.serviceRoleKey}` }
        : {}),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new ApiError(
      response.status,
      data?.message || data?.error || 'La base de commandes a refusé la requête.',
      data?.code || 'SUPABASE_REQUEST_FAILED'
    );
    error.details = data?.details;
    error.hint = data?.hint;
    throw error;
  }

  return data;
}

function timingSafeEqualText(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyStaffSessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [data, signature, extra] = token.split('.');
  if (!data || !signature || extra) return null;

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');

  if (!timingSafeEqualText(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!VALID_STAFF_ROLES.has(payload.role) || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getStaffSession(req) {
  const authorization = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return null;
  return verifyStaffSessionToken(authorization.slice('Bearer '.length).trim());
}

export function hasAuthorizationHeader(req) {
  const authorization = req.headers?.authorization || req.headers?.Authorization;
  return typeof authorization === 'string' && authorization.trim().length > 0;
}

export function requireStaffSession(req) {
  const session = getStaffSession(req);
  if (!session) {
    throw new ApiError(401, 'Authentification équipe requise ou session expirée.', 'STAFF_AUTH_REQUIRED');
  }
  return session;
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export function createSupabaseJwt({ appRole, orderId, expiresInSeconds = 3600 } = {}) {
  const secret = String(process.env.SUPABASE_JWT_SECRET || '').trim();
  if (!secret) return null;
  if (appRole && !VALID_STAFF_ROLES.has(appRole)) return null;
  if (!appRole && !orderId) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const payload = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: appRole ? STAFF_SUBJECTS[appRole] : orderId,
    iat: nowSeconds,
    exp: nowSeconds + Math.max(300, Math.min(expiresInSeconds, 7 * 24 * 3600)),
    ...(supabaseUrl ? { iss: `${supabaseUrl}/auth/v1` } : {}),
    ...(appRole
      ? { app_role: appRole, app_metadata: { app_role: appRole } }
      : { order_id: orderId }),
  };

  const kid = String(process.env.SUPABASE_JWT_KID || '').trim();
  const header = base64UrlJson({
    alg: 'HS256',
    typ: 'JWT',
    ...(kid ? { kid } : {}),
  });
  const body = base64UrlJson(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return {
    token: `${header}.${body}.${signature}`,
    expiresAt: payload.exp * 1000,
  };
}

export function createOrderAccessToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashOrderAccessToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function verifyOrderAccessToken(token, expectedHash) {
  if (!token || !expectedHash) return false;
  return timingSafeEqualText(hashOrderAccessToken(token), expectedHash);
}

function cleanString(value, field, { required = false, min = 0, max = 500, fallback = '' } = {}) {
  const text = String(value ?? fallback).trim();
  if (required && text.length < Math.max(1, min)) {
    throw new ApiError(400, `Le champ ${field} est requis.`, 'VALIDATION_ERROR');
  }
  if (text.length < min || text.length > max) {
    throw new ApiError(400, `Le champ ${field} est invalide.`, 'VALIDATION_ERROR');
  }
  return text;
}

function optionalCleanString(value, field, max = 500) {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  return cleanString(value, field, { max });
}

function cleanPhone(value) {
  let phone = String(value || '').replace(/[\s().-]/g, '');
  if (phone.startsWith('00213')) phone = `+${phone.slice(2)}`;
  if (/^213[567]\d{8}$/.test(phone)) phone = `+${phone}`;
  if (!/^(\+213|0)[567]\d{8}$/.test(phone)) {
    throw new ApiError(400, 'Numéro de téléphone algérien invalide.', 'VALIDATION_ERROR');
  }
  return phone;
}

function cleanMoney(value, field, { required = false, max = 1000000 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ApiError(400, `Le champ ${field} est requis.`, 'VALIDATION_ERROR');
    return undefined;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) {
    throw new ApiError(400, `Le champ ${field} est invalide.`, 'VALIDATION_ERROR');
  }
  return Math.round(number * 100) / 100;
}

function cleanCoordinate(value, min, max, field) {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new ApiError(400, `Le champ ${field} est invalide.`, 'VALIDATION_ERROR');
  }
  return number;
}

function cleanAddress(rawAddress, dbType) {
  const address = rawAddress && typeof rawAddress === 'object' ? rawAddress : {};
  const isDelivery = dbType === 'livraison';
  const mapUrl = optionalCleanString(address.mapUrl, 'adresse.mapUrl', 500);
  if (mapUrl && !/^https?:\/\//i.test(mapUrl)) {
    throw new ApiError(400, 'Le champ adresse.mapUrl est invalide.', 'VALIDATION_ERROR');
  }

  const cleaned = {
    wilaya: cleanString(address.wilaya || 'Alger', 'adresse.wilaya', { max: 80 }),
    commune: cleanString(address.commune || 'Birkhadem', 'adresse.commune', { max: 80 }),
    address: cleanString(address.address || '', 'adresse.address', {
      required: isDelivery,
      max: 300,
    }),
    landmark: optionalCleanString(address.landmark, 'adresse.landmark', 200),
    mapUrl,
    latitude: cleanCoordinate(address.latitude, -90, 90, 'adresse.latitude'),
    longitude: cleanCoordinate(address.longitude, -180, 180, 'adresse.longitude'),
  };

  return Object.fromEntries(Object.entries(cleaned).filter(([, value]) => value !== undefined && value !== ''));
}

function cleanItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) {
    throw new ApiError(400, 'La commande doit contenir entre 1 et 50 lignes.', 'VALIDATION_ERROR');
  }

  const merged = new Map();
  for (const rawItem of rawItems) {
    const productId = cleanString(rawItem?.productId, 'articles.productId', { required: true, max: 120 });
    const product = SERVER_CATALOG_BY_ID.get(productId);
    if (!product || !product.isAvailable) {
      throw new ApiError(422, `Produit indisponible ou inconnu : ${productId}.`, 'UNKNOWN_PRODUCT');
    }

    const quantity = Number(rawItem?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new ApiError(400, 'Chaque quantité doit être un entier entre 1 et 99.', 'VALIDATION_ERROR');
    }

    const notes = optionalCleanString(rawItem?.notes, 'articles.notes', 300);
    const key = `${productId}::${notes || ''}`;
    const current = merged.get(key);
    if (current) {
      current.quantity += quantity;
      if (current.quantity > 99) {
        throw new ApiError(400, 'Quantité maximale dépassée pour un produit.', 'VALIDATION_ERROR');
      }
    } else {
      merged.set(key, {
        productId,
        nameFr: product.nameFr,
        nameAr: product.nameAr,
        price: product.price,
        quantity,
        ...(notes ? { notes } : {}),
      });
    }
  }

  return Array.from(merged.values());
}

function mapStatusToDb(status) {
  if (!status) return undefined;
  if (APP_TO_DB_STATUS[status]) return APP_TO_DB_STATUS[status];
  if (DB_TO_APP_STATUS[status]) return status;
  throw new ApiError(400, 'Statut de commande invalide.', 'VALIDATION_ERROR');
}

function defaultStatusNote(appStatus, isArabic) {
  const notes = {
    pending: isArabic ? 'تم استلام الطلب من تطبيق الزبون' : "Commande reçue depuis l'application client",
    preparing: isArabic ? 'بدأ تحضير الطلب' : 'Préparation lancée',
    ready: isArabic ? 'الطلب جاهز' : 'Commande prête',
    delivered: isArabic ? 'تم تسليم الطلب' : 'Livrée / récupérée avec succès',
    cancelled: isArabic ? 'تم إلغاء الطلب' : 'Commande annulée',
  };
  return notes[appStatus] || 'Statut mis à jour';
}

export function buildOrderInsert(body, staffSession) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Payload de commande invalide.', 'VALIDATION_ERROR');
  }

  const clientRequestId = cleanString(body.clientRequestId, 'clientRequestId', { required: true, max: 36 });
  if (!UUID_RE.test(clientRequestId)) {
    throw new ApiError(400, 'clientRequestId doit être un UUID.', 'VALIDATION_ERROR');
  }

  const suppliedAccessToken = body.accessToken
    ? cleanString(body.accessToken, 'accessToken', { required: true, min: 32, max: 256 })
    : createOrderAccessToken();
  if (/\s/.test(suppliedAccessToken)) {
    throw new ApiError(400, 'accessToken invalide.', 'VALIDATION_ERROR');
  }

  const dbType = APP_TO_DB_TYPE[body.type || 'delivery'];
  if (!dbType) throw new ApiError(400, 'Type de commande invalide.', 'VALIDATION_ERROR');

  const articles = cleanItems(body.items);
  const subtotal = articles.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const deliveryFee = dbType === 'livraison'
    ? (staffSession && body.deliveryFee !== undefined
        ? cleanMoney(body.deliveryFee, 'deliveryFee', { required: true, max: 10000 })
        : getServerDeliveryFee())
    : 0;

  const source = staffSession ? (APP_TO_DB_SOURCE[body.source || 'counter'] || 'Comptoir') : 'App';
  const statut = staffSession ? (mapStatusToDb(body.status) || 'en_attente') : 'en_attente';
  const appStatus = DB_TO_APP_STATUS[statut];
  const isArabic = body.language === 'ar';
  const nowIso = new Date().toISOString();

  const sentToWhatsApp = staffSession ? Boolean(body.sentToWhatsApp) : false;
  const sentAt = sentToWhatsApp
    ? (body.sentAt && !Number.isNaN(new Date(body.sentAt).getTime()) ? new Date(body.sentAt).toISOString() : nowIso)
    : null;

  const insert = {
    client_request_id: clientRequestId,
    access_token_hash: hashOrderAccessToken(suppliedAccessToken),
    type: dbType,
    source,
    statut,
    client: cleanString(body.customerName, 'customerName', { required: true, min: 2, max: 120 }),
    telephone: cleanPhone(body.customerPhone),
    customer_id: optionalCleanString(body.customerId, 'customerId', 120) || null,
    adresse: cleanAddress(body.deliveryAddress, dbType),
    articles,
    note: optionalCleanString(body.kitchenNotes, 'kitchenNotes', 1000) || null,
    creneau: dbType === 'comptoir' ? (optionalCleanString(body.pickupTimeSlot, 'pickupTimeSlot', 120) || null) : null,
    sous_total: subtotal,
    frais_livraison: deliveryFee,
    total: subtotal + deliveryFee,
    day_id: optionalCleanString(body.dayId, 'dayId', 160) || null,
    payment_method: staffSession && ['cash', 'card', 'other'].includes(body.paymentMethod)
      ? body.paymentMethod
      : 'cash',
    driver_name: staffSession && dbType === 'livraison'
      ? (optionalCleanString(body.driverName, 'driverName', 120) || null)
      : null,
    driver_fee: staffSession && dbType === 'livraison'
      ? (cleanMoney(body.driverFee, 'driverFee', { max: 100000 }) ?? null)
      : null,
    stock_deducted: staffSession ? Boolean(body.stockDeducted) : false,
    is_new_alert: statut === 'en_attente',
    sent_to_whatsapp: sentToWhatsApp,
    sent_at: sentAt,
    status_history: [{
      status: appStatus,
      timestamp: nowIso,
      note: staffSession
        ? (isArabic ? 'تم إدخال الطلب يدوياً' : 'Commande manuelle saisie au back-office')
        : defaultStatusNote(appStatus, isArabic),
    }],
  };

  return { insert, accessToken: suppliedAccessToken };
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function mapDbRowToOrder(row) {
  const address = row.adresse && typeof row.adresse === 'object' ? row.adresse : {};
  const hasAddress = Boolean(address.address || address.commune || address.wilaya);

  return {
    id: row.id,
    orderNumber: row.numero,
    clientRequestId: row.client_request_id,
    customerId: row.customer_id || 'cust-guest',
    customerName: row.client,
    customerPhone: row.telephone,
    type: DB_TO_APP_TYPE[row.type] || 'delivery',
    source: DB_TO_APP_SOURCE[row.source] || 'app',
    status: DB_TO_APP_STATUS[row.statut] || 'pending',
    items: Array.isArray(row.articles) ? row.articles : [],
    subtotal: toNumber(row.sous_total),
    deliveryFee: toNumber(row.frais_livraison),
    total: toNumber(row.total),
    deliveryAddress: hasAddress ? address : undefined,
    pickupTimeSlot: row.creneau || undefined,
    kitchenNotes: row.note || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    statusHistory: Array.isArray(row.status_history) ? row.status_history : [],
    cancellationReason: row.cancellation_reason || undefined,
    isNewAlert: Boolean(row.is_new_alert),
    stockDeducted: Boolean(row.stock_deducted),
    dayId: row.day_id || undefined,
    paymentMethod: row.payment_method || 'cash',
    driverName: row.driver_name || undefined,
    driverFee: row.driver_fee === null || row.driver_fee === undefined ? undefined : toNumber(row.driver_fee),
    sentToWhatsApp: Boolean(row.sent_to_whatsapp),
    sentAt: row.sent_at || undefined,
  };
}

export function presentOrder(row, { accessToken, duplicate = false } = {}) {
  const realtime = createSupabaseJwt({
    orderId: row.id,
    expiresInSeconds: 7 * 24 * 3600,
  });

  return {
    order: mapDbRowToOrder(row),
    ...(accessToken ? { accessToken } : {}),
    ...(realtime ? { supabaseToken: realtime.token, supabaseExpiresAt: realtime.expiresAt } : {}),
    ...(duplicate ? { duplicate: true } : {}),
  };
}

export async function fetchOrderRowById(id) {
  if (!UUID_RE.test(String(id || ''))) {
    throw new ApiError(404, 'Commande introuvable.', 'ORDER_NOT_FOUND');
  }
  const rows = await supabaseRest(`/rest/v1/orders?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new ApiError(404, 'Commande introuvable.', 'ORDER_NOT_FOUND');
  }
  return rows[0];
}

async function fetchOrderRowByClientRequestId(clientRequestId) {
  const rows = await supabaseRest(
    `/rest/v1/orders?select=*&client_request_id=eq.${encodeURIComponent(clientRequestId)}&limit=1`
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function createOrder(body, staffSession) {
  const { insert, accessToken } = buildOrderInsert(body, staffSession);

  const existingBeforeInsert = await fetchOrderRowByClientRequestId(insert.client_request_id);
  if (existingBeforeInsert) {
    if (!verifyOrderAccessToken(accessToken, existingBeforeInsert.access_token_hash)) {
      throw new ApiError(403, 'Cette tentative de commande existe déjà avec un autre jeton d’accès.', 'ORDER_REQUEST_CONFLICT');
    }
    return { row: existingBeforeInsert, accessToken, duplicate: true, status: 200 };
  }

  try {
    const rows = await supabaseRest('/rest/v1/orders', {
      method: 'POST',
      body: insert,
      prefer: 'return=representation',
    });

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new ApiError(502, 'La base de commandes n’a pas renvoyé la commande créée.', 'SUPABASE_EMPTY_RESPONSE');
    }

    return { row: rows[0], accessToken, duplicate: false, status: 201 };
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const existing = await fetchOrderRowByClientRequestId(insert.client_request_id);
      if (existing) {
        if (!verifyOrderAccessToken(accessToken, existing.access_token_hash)) {
          throw new ApiError(403, 'Cette tentative de commande existe déjà avec un autre jeton d’accès.', 'ORDER_REQUEST_CONFLICT');
        }
        return { row: existing, accessToken, duplicate: true, status: 200 };
      }
    }
    throw error;
  }
}

export async function listOrders({ limit = 300, updatedAfter } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 300, 500));
  let path = `/rest/v1/orders?select=*&order=created_at.desc&limit=${safeLimit}`;
  if (updatedAfter && !Number.isNaN(new Date(updatedAfter).getTime())) {
    path += `&updated_at=gt.${encodeURIComponent(new Date(updatedAfter).toISOString())}`;
  }
  const rows = await supabaseRest(path);
  return Array.isArray(rows) ? rows : [];
}

export function buildOrderPatch(existing, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Payload de mise à jour invalide.', 'VALIDATION_ERROR');
  }

  const patch = {};
  const nowIso = new Date().toISOString();
  const requestedStatus = mapStatusToDb(body.status);

  if (requestedStatus && requestedStatus !== existing.statut) {
    const allowed = ALLOWED_TRANSITIONS[existing.statut] || new Set();
    if (!allowed.has(requestedStatus)) {
      throw new ApiError(
        409,
        `Transition de statut interdite : ${existing.statut} → ${requestedStatus}.`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    patch.statut = requestedStatus;
    patch.is_new_alert = false;

    const appStatus = DB_TO_APP_STATUS[requestedStatus];
    const note = optionalCleanString(body.note, 'note', 500) || defaultStatusNote(appStatus, body.language === 'ar');
    patch.status_history = [
      ...(Array.isArray(existing.status_history) ? existing.status_history : []),
      { status: appStatus, timestamp: nowIso, note },
    ];
  }

  if (body.paymentMethod !== undefined) {
    if (!['cash', 'card', 'other'].includes(body.paymentMethod)) {
      throw new ApiError(400, 'Moyen de paiement invalide.', 'VALIDATION_ERROR');
    }
    patch.payment_method = body.paymentMethod;
  }

  if (body.driverName !== undefined) {
    patch.driver_name = optionalCleanString(body.driverName, 'driverName', 120) || null;
  }

  if (body.driverFee !== undefined) {
    patch.driver_fee = body.driverFee === null
      ? null
      : cleanMoney(body.driverFee, 'driverFee', { required: true, max: 100000 });
  }

  if (body.cancellationReason !== undefined) {
    patch.cancellation_reason = optionalCleanString(body.cancellationReason, 'cancellationReason', 500) || null;
  }

  if ((patch.statut === 'annulee' || requestedStatus === 'annulee') && !patch.cancellation_reason && !existing.cancellation_reason) {
    patch.cancellation_reason = optionalCleanString(body.note, 'note', 500) || 'Annulée au back-office';
  }

  if (body.stockDeducted !== undefined) {
    patch.stock_deducted = Boolean(body.stockDeducted);
  }

  if (body.isNewAlert !== undefined) {
    patch.is_new_alert = Boolean(body.isNewAlert);
  }

  if (body.sentToWhatsApp !== undefined) {
    patch.sent_to_whatsapp = Boolean(body.sentToWhatsApp);
    patch.sent_at = patch.sent_to_whatsapp
      ? (body.sentAt && !Number.isNaN(new Date(body.sentAt).getTime()) ? new Date(body.sentAt).toISOString() : nowIso)
      : null;
  }

  if (Object.keys(patch).length === 0) {
    throw new ApiError(400, 'Aucune modification de commande fournie.', 'VALIDATION_ERROR');
  }

  return patch;
}

export async function updateOrder(id, body) {
  const existing = await fetchOrderRowById(id);
  const patch = buildOrderPatch(existing, body || {});

  let path = `/rest/v1/orders?select=*&id=eq.${encodeURIComponent(id)}`;
  if (body?.expectedUpdatedAt) {
    const expectedRaw = String(body.expectedUpdatedAt).trim();
    const expectedDate = new Date(expectedRaw);
    const existingRaw = String(existing.updated_at || '');
    const existingDate = new Date(existingRaw);
    if (Number.isNaN(expectedDate.getTime()) || Number.isNaN(existingDate.getTime())) {
      throw new ApiError(400, 'expectedUpdatedAt invalide.', 'VALIDATION_ERROR');
    }
    if (expectedDate.getTime() !== existingDate.getTime()) {
      throw new ApiError(
        409,
        'La commande a été modifiée entre-temps. Actualisez puis réessayez.',
        'ORDER_VERSION_CONFLICT'
      );
    }

    // Postgres conserve les microsecondes (ex. .587387), alors que Date
    // limite la précision aux millisecondes (.587). Convertir la valeur
    // attendue avec toISOString() rend donc le filtre eq incapable de
    // retrouver la ligne. On conserve la précision transmise par le client
    // lorsqu'elle existe ; sinon, on filtre avec la valeur exacte relue en
    // base après avoir vérifié l'égalité à la milliseconde.
    const fractionMatch = expectedRaw.match(/\.(\d+)(?:Z|[+-]\d{2}:?\d{2})?$/i);
    const versionForFilter = fractionMatch && fractionMatch[1].length > 3
      ? expectedRaw
      : existingRaw;
    path += `&updated_at=eq.${encodeURIComponent(versionForFilter)}`;
  }

  const rows = await supabaseRest(path, {
    method: 'PATCH',
    body: patch,
    prefer: 'return=representation',
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new ApiError(
      409,
      'La commande a été modifiée entre-temps. Actualisez puis réessayez.',
      'ORDER_VERSION_CONFLICT'
    );
  }

  return rows[0];
}

export function getOrderAccessTokenFromRequest(req) {
  const headerToken = req.headers?.['x-order-access-token'] || req.headers?.['X-Order-Access-Token'];
  if (typeof headerToken === 'string' && headerToken.trim()) return headerToken.trim();
  return null;
}

export function isUuid(value) {
  return UUID_RE.test(String(value || ''));
}
