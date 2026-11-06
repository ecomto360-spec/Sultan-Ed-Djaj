// Profils clients : lecture/écriture du profil de CET appareil via l'API.
// Le serveur ne renvoie jamais de liste ni le hash du code de récupération.
// Une copie locale (affichage instantané) est conservée et toujours
// révalidée depuis le serveur.
import { getDeviceId } from './deviceService';

const PROFILE_CACHE_KEY = 'sultan_customer_profile_v1';
const ALGERIA_MOBILE_PHONE_RE = /^(05|06|07)\d{8}$/;

export function isValidClientPhone(phone: string): boolean {
  return ALGERIA_MOBILE_PHONE_RE.test(String(phone || '').replace(/[\s.-]/g, ''));
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  landmark?: string | null;
  mapUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hasRecoveryCode: boolean;
  orderCount: number;
  totalSpent: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CustomerProfileInput {
  name: string;
  phone: string;
  wilaya?: string;
  commune?: string;
  address?: string;
  landmark?: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  recoveryCode?: string;
}

export class CustomerApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'CustomerApiError';
    this.status = status;
    this.code = code;
  }
}

async function parseCustomerResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new CustomerApiError(
      data?.error || `Le service profils est indisponible (HTTP ${response.status}).`,
      response.status,
      data?.code
    );
  }
  return data as T;
}

export function readCachedProfile(): CustomerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' && typeof parsed.id === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedProfile(profile: CustomerProfile | null) {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch {
    // Le cache local n'est qu'une aide d'affichage.
  }
}

export async function fetchMyProfile(): Promise<CustomerProfile | null> {
  const deviceId = getDeviceId();
  const response = await fetch(
    `/api/customers?deviceId=${encodeURIComponent(deviceId)}`,
    { headers: { Accept: 'application/json' } }
  );
  const data = await parseCustomerResponse<{ profile: CustomerProfile | null }>(response);
  return data.profile || null;
}

export async function saveMyProfile(profile: CustomerProfileInput): Promise<CustomerProfile> {
  const deviceId = getDeviceId();
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...profile, deviceId }),
  });
  const data = await parseCustomerResponse<{ profile: CustomerProfile }>(response);
  if (!data.profile?.id) {
    throw new CustomerApiError('Le profil n’a pas pu être enregistré.', 0, 'INVALID_RESPONSE');
  }
  return data.profile;
}

export async function recoverMyProfile(phone: string, code: string): Promise<CustomerProfile> {
  const deviceId = getDeviceId();
  const response = await fetch('/api/customers/recover', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, phone, code }),
  });
  const data = await parseCustomerResponse<{ profile: CustomerProfile }>(response);
  if (!data.profile?.id) {
    throw new CustomerApiError('La récupération n’a pas abouti.', 0, 'INVALID_RESPONSE');
  }
  return data.profile;
}

export async function eraseMyProfile(): Promise<void> {
  const deviceId = getDeviceId();
  const response = await fetch(
    `/api/customers?deviceId=${encodeURIComponent(deviceId)}`,
    { method: 'DELETE' }
  );
  await parseCustomerResponse<unknown>(response);
}
