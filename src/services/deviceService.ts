// Identité anonyme par appareil : UUID stocké dans localStorage avec repli
// cookie (1 an, SameSite=Lax). Aucune donnée personnelle, aucun profil créé
// au chargement — le device_id sert uniquement à retrouver le profil de cet
// appareil et la liste « Mes commandes ».
const DEVICE_ID_KEY = 'sultan_device_id_v1';
const DEVICE_COOKIE = 'sultan_did';
const DEVICE_COOKIE_MAX_AGE = 365 * 24 * 3600;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function writeDeviceCookie(value: string) {
  if (typeof document === 'undefined' || !document.cookie) return;
  document.cookie =
    `${DEVICE_COOKIE}=${value}; max-age=${DEVICE_COOKIE_MAX_AGE}; path=/; samesite=lax; secure`;
}

function readDeviceCookie(): string | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const prefix = `${DEVICE_COOKIE}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length) || null;
    }
  }
  return null;
}

let cachedDeviceId: string | null = null;

export function getDeviceId(): string {
  if (cachedDeviceId && UUID_RE.test(cachedDeviceId)) return cachedDeviceId;

  try {
    const saved = localStorage.getItem(DEVICE_ID_KEY);
    if (saved && UUID_RE.test(saved)) {
      cachedDeviceId = saved;
      writeDeviceCookie(saved);
      return saved;
    }
  } catch {
    // localStorage indisponible (mode privé strict) : le cookie prend le relais.
  }

  const fromCookie = readDeviceCookie();
  if (fromCookie && UUID_RE.test(fromCookie)) {
    try {
      localStorage.setItem(DEVICE_ID_KEY, fromCookie);
    } catch {
      // ignore
    }
    cachedDeviceId = fromCookie;
    return fromCookie;
  }

  const deviceId = createUuid();
  try {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  } catch {
    // ignore
  }
  writeDeviceCookie(deviceId);
  cachedDeviceId = deviceId;
  return deviceId;
}
