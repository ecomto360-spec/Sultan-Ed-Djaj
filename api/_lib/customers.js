// Profils clients : identité anonyme par appareil (device_id).
// Les navigateurs ne lisent jamais la table directement : toutes les
// opérations passent par l'API Vercel avec la clé service_role, et seule
// la ligne du device_id fourni est renvoyée (jamais de liste publique,
// jamais le hash du code de récupération).
import crypto from 'node:crypto';
import { ApiError, getSupabaseServerConfig, supabaseRest } from './orders.js';

const DEVICE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PHONE_RE = /^(05|06|07)\d{8}$/;
const RECOVERY_CODE_RE = /^\d{4}$/;
const RECOVERY_MAX_ATTEMPTS = 5;
const RECOVERY_LOCK_MINUTES = 15;

export function isValidDeviceId(value) {
  return DEVICE_ID_RE.test(String(value || ''));
}

export function requireDeviceId(value) {
  const text = String(value || '').trim();
  if (!DEVICE_ID_RE.test(text)) {
    throw new ApiError(400, 'Identifiant d’appareil invalide.', 'INVALID_DEVICE_ID');
  }
  return text.toLowerCase();
}

function cleanTextField(value, field, { max = 200, required = false } = {}) {
  const text = String(value ?? '').trim();
  if (required && !text) {
    throw new ApiError(400, `Le champ ${field} est requis.`, 'VALIDATION_ERROR');
  }
  if (text.length > max) {
    throw new ApiError(400, `Le champ ${field} est trop long.`, 'VALIDATION_ERROR');
  }
  return text;
}

function cleanOptionalNumber(value, field, min, max) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new ApiError(400, `Le champ ${field} est invalide.`, 'VALIDATION_ERROR');
  }
  return num;
}

// Validation partagée du formulaire profil : nom, téléphone (05/06/07 + 8
// chiffres), wilaya/commune, adresse, repère, URL de carte, coordonnées GPS
// et code de récupération optionnel (4 chiffres).
export function sanitizeCustomerInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Payload profil invalide.', 'VALIDATION_ERROR');
  }

  const name = cleanTextField(body.name, 'name', { max: 80, required: true });
  if (name.length < 2) {
    throw new ApiError(400, 'Le nom doit contenir au moins 2 caractères.', 'VALIDATION_ERROR');
  }

  const phone = cleanTextField(body.phone, 'phone', { max: 20, required: true })
    .replace(/[\s.-]/g, '');
  if (!PHONE_RE.test(phone)) {
    throw new ApiError(
      400,
      'Le numéro de téléphone doit commencer par 05, 06 ou 07 et contenir 8 chiffres.',
      'INVALID_PHONE'
    );
  }

  const wilaya = cleanTextField(body.wilaya, 'wilaya', { max: 60 }) || 'Alger';
  const commune = cleanTextField(body.commune, 'commune', { max: 80 }) || 'Birkhadem';
  const address = cleanTextField(body.address, 'address', { max: 300 });
  const landmark = cleanTextField(body.landmark, 'landmark', { max: 200 }) || null;

  let mapUrl = cleanTextField(body.mapUrl, 'mapUrl', { max: 500 }) || null;
  if (mapUrl && !/^https:\/\//i.test(mapUrl)) {
    throw new ApiError(400, 'Le lien de carte doit commencer par https://', 'VALIDATION_ERROR');
  }

  const latitude = cleanOptionalNumber(body.latitude, 'latitude', -90, 90);
  const longitude = cleanOptionalNumber(body.longitude, 'longitude', -180, 180);
  const recentAddresses = sanitizeRecentAddresses(body.recentAddresses);

  let recoveryCode = undefined;
  if (body.recoveryCode !== undefined && body.recoveryCode !== null && String(body.recoveryCode).trim() !== '') {
    recoveryCode = String(body.recoveryCode).trim();
    if (!RECOVERY_CODE_RE.test(recoveryCode)) {
      throw new ApiError(400, 'Le code de récupération doit contenir 4 chiffres.', 'INVALID_RECOVERY_CODE');
    }
  }

  return {
    name,
    phone,
    wilaya,
    commune,
    address,
    landmark,
    mapUrl,
    latitude,
    longitude,
    recentAddresses,
    recoveryCode,
  };
}

// Adresses récentes : 3 maximum, dédupliquées par libellé, sans données sensibles.
export function sanitizeRecentAddresses(rawList) {
  if (rawList === undefined || rawList === null) return undefined;
  if (!Array.isArray(rawList)) {
    throw new ApiError(400, 'Le champ recentAddresses doit être une liste.', 'VALIDATION_ERROR');
  }
  const seen = new Set();
  const cleaned = [];
  for (const raw of rawList) {
    if (cleaned.length >= 3) break;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const address = cleanTextField(raw.address, 'recentAddresses.address', { max: 300 });
    if (!address || seen.has(address)) continue;
    let mapUrl = cleanTextField(raw.mapUrl, 'recentAddresses.mapUrl', { max: 500 }) || null;
    if (mapUrl && !/^https:\/\//i.test(mapUrl)) {
      throw new ApiError(400, 'Le lien de carte doit commencer par https://', 'VALIDATION_ERROR');
    }
    const entry = {
      address,
      landmark: cleanTextField(raw.landmark, 'recentAddresses.landmark', { max: 200 }) || null,
      mapUrl,
      latitude: cleanOptionalNumber(raw.latitude, 'recentAddresses.latitude', -90, 90),
      longitude: cleanOptionalNumber(raw.longitude, 'recentAddresses.longitude', -180, 180),
    };
    seen.add(address);
    cleaned.push(Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== null && v !== undefined)));
  }
  return cleaned;
}

export function hashRecoveryCode(code) {
  const pepper = String(process.env.SESSION_SECRET || 'sultan-ed-djaj-recovery');
  return crypto.createHmac('sha256', pepper).update(String(code)).digest('hex');
}

function verifyRecoveryCode(code, expectedHash) {
  if (!code || !expectedHash) return false;
  const actual = Buffer.from(hashRecoveryCode(code), 'utf8');
  const expected = Buffer.from(String(expectedHash), 'utf8');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

// Version publique d'un profil : aucune donnée sensible (hash, device_id).
export function presentCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    wilaya: row.wilaya || 'Alger',
    commune: row.commune || 'Birkhadem',
    address: row.address || '',
    landmark: row.landmark || null,
    mapUrl: row.map_url || null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    recentAddresses: Array.isArray(row.recent_addresses)
      ? row.recent_addresses
          .filter((item) => item && typeof item === 'object' && typeof item.address === 'string' && item.address.trim())
          .slice(0, 3)
          .map((item) => ({
            address: item.address,
            landmark: typeof item.landmark === 'string' ? item.landmark : null,
            mapUrl: typeof item.mapUrl === 'string' ? item.mapUrl : null,
            latitude: typeof item.latitude === 'number' && Number.isFinite(item.latitude) ? item.latitude : null,
            longitude: typeof item.longitude === 'number' && Number.isFinite(item.longitude) ? item.longitude : null,
          }))
      : [],
    hasRecoveryCode: Boolean(row.recovery_code_hash),
    orderCount: Number(row.order_count || 0),
    totalSpent: Number(row.total_spent || 0),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

const CUSTOMER_SELECT = 'id,device_id,phone,name,wilaya,commune,address,landmark,map_url,latitude,longitude,recent_addresses,recovery_code_hash,recovery_attempts,recovery_locked_until,order_count,total_spent,created_at,updated_at';

export async function fetchCustomerByDeviceId(deviceId) {
  const rows = await supabaseRest(
    `/rest/v1/customers?device_id=eq.${deviceId}&select=${encodeURIComponent(CUSTOMER_SELECT)}&limit=1`
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// Crée ou met à jour le profil rattaché à cet appareil. Un numéro déjà utilisé
// par un autre profil ne déclenche aucune fuite : un profil séparé est créé,
// sans jamais renvoyer les données de l'ancien.
export async function saveCustomerProfile(deviceId, input) {
  const patch = {
    phone: input.phone,
    name: input.name,
    wilaya: input.wilaya,
    commune: input.commune,
    address: input.address,
    landmark: input.landmark,
    map_url: input.mapUrl,
    latitude: input.latitude,
    longitude: input.longitude,
  };
  if (input.recentAddresses !== undefined) {
    patch.recent_addresses = input.recentAddresses;
  }
  if (input.recoveryCode !== undefined) {
    patch.recovery_code_hash = input.recoveryCode ? hashRecoveryCode(input.recoveryCode) : null;
  }

  const existing = await fetchCustomerByDeviceId(deviceId);
  if (existing) {
    await supabaseRest(`/rest/v1/customers?id=eq.${existing.id}`, {
      method: 'PATCH',
      body: patch,
      prefer: 'return=representation',
    });
    return fetchCustomerByDeviceId(deviceId);
  }

  // Upsert défensif si deux onglets créent le profil en parallèle.
  const rows = await supabaseRest(
    `/rest/v1/customers?on_conflict=device_id&select=${encodeURIComponent(CUSTOMER_SELECT)}`,
    {
      method: 'POST',
      body: { ...patch, device_id: deviceId },
      prefer: 'resolution=merge-duplicates,return=representation',
    }
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : fetchCustomerByDeviceId(deviceId);
}

export async function eraseCustomerByDeviceId(deviceId) {
  await supabaseRest(`/rest/v1/customers?device_id=eq.${deviceId}`, { method: 'DELETE' });
}

// « J'ai déjà commandé » : vérifie le code à 4 chiffres personnel puis
// rattache le nouvel appareil au profil existant. Limité à 5 essais / 15 min
// côté base (compteur persistant, pas en mémoire serveur).
export async function attemptRecovery(deviceId, phone, code) {
  const cleanPhone = String(phone || '').replace(/[\s.-]/g, '');
  if (!PHONE_RE.test(cleanPhone)) {
    throw new ApiError(400, 'Numéro de téléphone invalide.', 'INVALID_PHONE');
  }
  const cleanCode = String(code || '').trim();
  if (!RECOVERY_CODE_RE.test(cleanCode)) {
    throw new ApiError(400, 'Le code doit contenir 4 chiffres.', 'INVALID_RECOVERY_CODE');
  }

  const rows = await supabaseRest(
    `/rest/v1/customers?phone=eq.${cleanPhone}&recovery_code_hash=not.is.null` +
    `&select=${encodeURIComponent(CUSTOMER_SELECT)}&order=created_at.desc&limit=3`
  );
  const candidate = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!candidate) {
    // Message volontairement générique : ne révèle pas si le numéro existe.
    throw new ApiError(
      404,
      'Récupération impossible pour ce numéro. Vérifiez le numéro et le code.',
      'RECOVERY_UNAVAILABLE'
    );
  }

  const now = Date.now();
  const lockedUntil = candidate.recovery_locked_until
    ? new Date(candidate.recovery_locked_until).getTime()
    : 0;
  if (lockedUntil > now) {
    const minutes = Math.max(1, Math.ceil((lockedUntil - now) / 60000));
    throw new ApiError(
      429,
      `Trop de tentatives. Réessayez dans ${minutes} minute(s).`,
      'RECOVERY_LOCKED'
    );
  }

  if (!verifyRecoveryCode(cleanCode, candidate.recovery_code_hash)) {
    const attempts = Number(candidate.recovery_attempts || 0) + 1;
    const patch = attempts >= RECOVERY_MAX_ATTEMPTS
      ? { recovery_attempts: 0, recovery_locked_until: new Date(now + RECOVERY_LOCK_MINUTES * 60000).toISOString() }
      : { recovery_attempts: attempts };
    await supabaseRest(`/rest/v1/customers?id=eq.${candidate.id}`, { method: 'PATCH', body: patch });
    if (attempts >= RECOVERY_MAX_ATTEMPTS) {
      throw new ApiError(
        429,
        `Trop de tentatives. Réessayez dans ${RECOVERY_LOCK_MINUTES} minutes.`,
        'RECOVERY_LOCKED'
      );
    }
    throw new ApiError(401, 'Code incorrect.', 'RECOVERY_INVALID');
  }

  // Détache d'abord tout profil déjà rattaché à cet appareil (l'index unique
  // sur device_id l'exige), puis rattache le profil récupéré.
  await supabaseRest(
    `/rest/v1/customers?device_id=eq.${deviceId}&id=neq.${candidate.id}`,
    { method: 'PATCH', body: { device_id: null } }
  );
  await supabaseRest(`/rest/v1/customers?id=eq.${candidate.id}`, {
    method: 'PATCH',
    body: { device_id: deviceId, recovery_attempts: 0, recovery_locked_until: null },
    prefer: 'return=representation',
  });

  const fresh = await fetchCustomerByDeviceId(deviceId);
  if (!fresh || fresh.id !== candidate.id) {
    throw new ApiError(409, 'La récupération n’a pas pu être finalisée.', 'RECOVERY_CONFLICT');
  }
  return fresh;
}

// Liste back-office : jamais le hash ni le code du profil.
export async function listCustomersForStaff() {
  const rows = await supabaseRest(
    `/rest/v1/customers?select=${encodeURIComponent(CUSTOMER_SELECT)}&order=created_at.desc&limit=500`
  );
  return Array.isArray(rows) ? rows.map(presentCustomer) : [];
}

export async function requireSupabaseCustomersConfig() {
  if (!getSupabaseServerConfig()) {
    throw new ApiError(
      503,
      'Service clients non configuré. Vérifiez SUPABASE_URL et SUPABASE_SECRET_KEY.',
      'SUPABASE_NOT_CONFIGURED'
    );
  }
}
