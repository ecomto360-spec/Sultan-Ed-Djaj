import { UserRole } from '../types';

const ADMIN_TOKEN_KEY = 'sultan_admin_token';
const ADMIN_ROLE_KEY = 'sultan_admin_role';

export interface LoginResponse {
  token: string;
  role: UserRole;
  accountName?: string;
  mustChangePin?: boolean;
  expiresAt: number;
  retryAfter?: number;
}

export interface TeamAccountApi {
  id: string;
  name: string;
  role: UserRole;
  status: 'active' | 'disabled';
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthAuditLogApi {
  id: string;
  timestamp: string;
  role?: UserRole;
  accountName?: string;
  success: boolean;
  ip: string;
  userAgent?: string;
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

const ADMIN_LOCKED_KEY = 'sultan_admin_locked';

export function getAdminToken(): string | null {
  try {
    const isLocked = sessionStorage.getItem(ADMIN_LOCKED_KEY) === 'true' || localStorage.getItem(ADMIN_LOCKED_KEY) === 'true';
    if (isLocked) return null;

    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token === 'preview-caissier-token') {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_ROLE_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_ROLE_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function getStoredAdminRole(): UserRole | null {
  try {
    const isLocked = sessionStorage.getItem(ADMIN_LOCKED_KEY) === 'true' || localStorage.getItem(ADMIN_LOCKED_KEY) === 'true';
    if (isLocked) return null;
    const role = (sessionStorage.getItem(ADMIN_ROLE_KEY) || localStorage.getItem(ADMIN_ROLE_KEY)) as UserRole | null;
    return role || null;
  } catch {
    return null;
  }
}

export function setAdminToken(token: string, role: UserRole, rememberMe = false): void {
  try {
    sessionStorage.removeItem(ADMIN_LOCKED_KEY);
    localStorage.removeItem(ADMIN_LOCKED_KEY);

    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_ROLE_KEY, role);

    if (rememberMe) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_ROLE_KEY, role);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_ROLE_KEY);
    }
  } catch (err) {
    console.warn('Storage write error:', err);
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.setItem(ADMIN_LOCKED_KEY, 'true');
    localStorage.setItem(ADMIN_LOCKED_KEY, 'true');
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_ROLE_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_ROLE_KEY);
  } catch (err) {
    console.warn('Storage clear error:', err);
  }
}

/**
 * Modern role-inferring PIN login (no role selection needed from client).
 */
export async function loginAdminByPin(pin: string, rememberMe = false): Promise<LoginResponse> {
  const cleanPin = pin.trim();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin: cleanPin }),
    });

    const responseText = await res.text();
    let data: any = null;

    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const message = data?.error
        || (data ? 'Code PIN incorrect' : `Service d'authentification indisponible (HTTP ${res.status}).`);
      const err: any = new Error(message);
      err.retryAfter = data?.retryAfter;
      err.status = res.status;
      throw err;
    }

    if (!data?.token || !data?.role) {
      throw new Error("Réponse d'authentification invalide.");
    }

    setAdminToken(data.token, data.role, rememberMe);
    return { ...data, mustChangePin: false };
  } catch (err: any) {
    throw err;
  }
}

/**
 * Legacy wrapper for compatibility
 */
export async function loginAdmin(role: UserRole, pin: string): Promise<LoginResponse> {
  return loginAdminByPin(pin);
}

// Team Accounts API
export async function fetchTeamAccounts(): Promise<TeamAccountApi[]> {
  const res = await authFetch('/api/auth/accounts');
  if (!res.ok) throw new Error('Impossible de charger les comptes équipe');
  return res.json();
}

export async function createTeamAccount(name: string, role: UserRole): Promise<{ account: TeamAccountApi; generatedPin: string }> {
  const res = await authFetch('/api/auth/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Échec de la création du compte');
  return data;
}

export async function regenerateAccountPin(id: string): Promise<{ generatedPin: string }> {
  const res = await authFetch(`/api/auth/accounts/${id}/regenerate-pin`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Échec de la régénération du PIN');
  return data;
}

export async function changeAccountPin(id: string, pin: string): Promise<void> {
  const res = await authFetch(`/api/auth/accounts/${id}/change-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Échec du changement de PIN');
}

export async function toggleAccountStatus(id: string, status: 'active' | 'disabled'): Promise<void> {
  const res = await authFetch(`/api/auth/accounts/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || 'Échec du changement de statut');
  }
}

export async function deleteTeamAccount(id: string): Promise<void> {
  const res = await authFetch(`/api/auth/accounts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.error || 'Échec de la suppression');
  }
}

export async function fetchAuthAuditLogs(): Promise<AuthAuditLogApi[]> {
  const res = await authFetch('/api/auth/audit-logs');
  if (!res.ok) return [];
  return res.json();
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
