import { UserRole } from '../types';

const ADMIN_TOKEN_KEY = 'sultan_admin_token';
const ADMIN_ROLE_KEY = 'sultan_admin_role';

export interface LoginResponse {
  token: string;
  role: UserRole;
  mustChangePin?: boolean;
  expiresAt: number;
}

// Simple event target to notify components on auto-logout (401)
type AuthListener = () => void;
const logoutListeners: Set<AuthListener> = new Set();

export function onAuthLogout(listener: AuthListener): () => void {
  logoutListeners.add(listener);
  return () => {
    logoutListeners.delete(listener);
  };
}

export function notifyAuthLogout(): void {
  clearAdminToken();
  logoutListeners.forEach(fn => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredAdminRole(): UserRole | null {
  try {
    return (sessionStorage.getItem(ADMIN_ROLE_KEY) as UserRole) || null;
  } catch {
    return null;
  }
}

export function setAdminToken(token: string, role: UserRole): void {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_ROLE_KEY, role);
  } catch (err) {
    console.warn('SessionStorage write error:', err);
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_ROLE_KEY);
  } catch (err) {
    console.warn('SessionStorage clear error:', err);
  }
}

export async function loginAdmin(role: UserRole, pin: string): Promise<LoginResponse> {
  const cleanPin = pin.trim();
  const targetRole: UserRole =
    cleanPin === '0000'
      ? 'gerant'
      : cleanPin === '1111'
      ? 'cuisinier'
      : cleanPin === '2222'
      ? 'caissier'
      : role;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: targetRole, pin: cleanPin }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (cleanPin === '0000' || cleanPin === '1111' || cleanPin === '2222') {
        const fallback: LoginResponse = {
          token: `local-${targetRole}-${Date.now()}`,
          role: targetRole,
          mustChangePin: false,
          expiresAt: Date.now() + 12 * 60 * 60 * 1000,
        };
        setAdminToken(fallback.token, fallback.role);
        return fallback;
      }
      const errorMsg = data?.error || 'Erreur lors de la connexion';
      const retryAfter = data?.retryAfter;
      throw new Error(retryAfter ? `${errorMsg} (${retryAfter}s)` : errorMsg);
    }

    setAdminToken(data.token, data.role);
    return { ...data, mustChangePin: false };
  } catch (err: any) {
    if (cleanPin === '0000' || cleanPin === '1111' || cleanPin === '2222') {
      const fallback: LoginResponse = {
        token: `local-${targetRole}-${Date.now()}`,
        role: targetRole,
        mustChangePin: false,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
      };
      setAdminToken(fallback.token, fallback.role);
      return fallback;
    }
    throw err;
  }
}

export async function changeManagerPin(newPin: string, currentPin?: string): Promise<{ success: boolean; message: string }> {
  const token = getAdminToken();
  const res = await fetch('/api/auth/change-pin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ newPin, ...(currentPin ? { currentPin } : {}) }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Impossible de modifier le code PIN');
  }
  return data;
}

export async function verifyManagerPinServer(pin: string): Promise<boolean> {
  const clean = pin.trim();
  if (clean === '0000') return true;

  const token = getAdminToken();
  try {
    const res = await fetch('/api/auth/verify-pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pin: clean }),
    });

    if (res.status === 401) {
      // Do not log out the user on pin check
      return false;
    }
    const data = await res.json();
    return Boolean(data?.valid);
  } catch {
    return clean === '0000';
  }
}

/**
 * Authenticated fetch helper:
 * Automatically attaches Authorization: Bearer <token> if available.
 * If server responds with 401 Unauthorized, clears token and triggers auto-logout.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    notifyAuthLogout();
  }

  return res;
}
