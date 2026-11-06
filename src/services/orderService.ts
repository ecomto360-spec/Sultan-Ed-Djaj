import type { Order, OrderItem, OrderSource, OrderStatus, OrderType, PaymentMethod } from '../types';
import { authFetch, fetchSupabaseRealtimeToken, getAdminToken } from './authService';

const ORDER_ACCESS_TOKENS_KEY = 'sultan_order_access_tokens_v1';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class OrderApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'OrderApiError';
    this.status = status;
    this.code = code;
  }
}

export interface DeliveryAddressPayload {
  wilaya: string;
  commune: string;
  address: string;
  landmark?: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateOrderRequest {
  clientRequestId: string;
  accessToken: string;
  deviceId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  type: OrderType;
  source?: OrderSource;
  status?: OrderStatus;
  items: OrderItem[];
  deliveryAddress?: DeliveryAddressPayload;
  pickupTimeSlot?: string;
  kitchenNotes?: string;
  dayId?: string;
  paymentMethod?: PaymentMethod;
  driverName?: string;
  driverFee?: number;
  deliveryFee?: number;
  stockDeducted?: boolean;
  sentToWhatsApp?: boolean;
  sentAt?: string;
  language?: 'fr' | 'ar';
}

export interface CreateOrderResult {
  order: Order;
  accessToken?: string;
  duplicate?: boolean;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  note?: string;
  paymentMethod?: PaymentMethod;
  driverName?: string;
  driverFee?: number;
  cancellationReason?: string;
  stockDeducted?: boolean;
  isNewAlert?: boolean;
  sentToWhatsApp?: boolean;
  sentAt?: string;
  expectedUpdatedAt?: string;
  language?: 'fr' | 'ar';
}

interface StoredOrderCredentials {
  accessToken?: string;
  supabaseToken?: string;
  supabaseExpiresAt?: number;
}

export function isRemoteOrderId(orderId: string | undefined | null): boolean {
  return UUID_RE.test(String(orderId || ''));
}

function readCredentialsMap(): Record<string, StoredOrderCredentials> {
  try {
    const raw = localStorage.getItem(ORDER_ACCESS_TOKENS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getOrderCredentials(orderId: string): StoredOrderCredentials {
  return readCredentialsMap()[orderId] || {};
}

export function saveOrderCredentials(
  orderId: string,
  credentials: StoredOrderCredentials
): void {
  if (!orderId || (!credentials.accessToken && !credentials.supabaseToken)) return;
  try {
    const map = readCredentialsMap();
    map[orderId] = {
      ...map[orderId],
      ...credentials,
    };
    localStorage.setItem(ORDER_ACCESS_TOKENS_KEY, JSON.stringify(map));
  } catch {
    // Le suivi reste possible dans la session courante même sans persistance.
  }
}

async function parseOrderResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new OrderApiError(
      data?.error || `Le service de commandes est indisponible (HTTP ${response.status}).`,
      response.status,
      data?.code
    );
  }

  if (!data) {
    throw new OrderApiError('Réponse invalide du service de commandes.', response.status, 'INVALID_RESPONSE');
  }

  return data as T;
}

function persistCredentialsFromResponse(
  orderId: string,
  data: { accessToken?: string; supabaseToken?: string; supabaseExpiresAt?: number },
  fallbackAccessToken?: string
) {
  saveOrderCredentials(orderId, {
    accessToken: data.accessToken || fallbackAccessToken,
    supabaseToken: data.supabaseToken,
    supabaseExpiresAt: data.supabaseExpiresAt,
  });
}

export async function createOrderRemote(
  payload: CreateOrderRequest,
  { staff = false }: { staff?: boolean } = {}
): Promise<CreateOrderResult> {
  const requester = staff ? authFetch : fetch;
  const response = await requester('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await parseOrderResponse<{
    order: Order;
    accessToken?: string;
    supabaseToken?: string;
    supabaseExpiresAt?: number;
    duplicate?: boolean;
  }>(response);

  if (!data.order?.id) {
    throw new OrderApiError('La confirmation de commande est incomplète.', response.status, 'INVALID_RESPONSE');
  }

  persistCredentialsFromResponse(data.order.id, data, payload.accessToken);

  return {
    order: data.order,
    accessToken: data.accessToken || payload.accessToken,
    duplicate: Boolean(data.duplicate),
  };
}

export async function fetchOrdersRemote(limit = 300): Promise<Order[]> {
  const response = await authFetch(`/api/orders?limit=${encodeURIComponent(String(limit))}`);
  const data = await parseOrderResponse<{ orders: Order[] }>(response);
  return Array.isArray(data.orders) ? data.orders : [];
}

// « Mes commandes » : uniquement les commandes passées depuis cet appareil.
export async function fetchMyOrdersRemote(deviceId: string): Promise<Order[]> {
  const response = await fetch(
    `/api/orders/mine?deviceId=${encodeURIComponent(deviceId)}`,
    { headers: { Accept: 'application/json' } }
  );
  const data = await parseOrderResponse<{ orders: Order[] }>(response);
  return Array.isArray(data.orders) ? data.orders : [];
}

export async function fetchOrderRemote(orderId: string, accessTokenOverride?: string): Promise<Order> {
  const credentials = getOrderCredentials(orderId);
  const accessToken = accessTokenOverride || credentials.accessToken;
  const useStaffToken = Boolean(getAdminToken());
  const requester = useStaffToken ? authFetch : fetch;
  const response = await requester(`/api/orders/${encodeURIComponent(orderId)}`, {
    headers: accessToken && !useStaffToken
      ? { 'x-order-access-token': accessToken }
      : undefined,
  });

  const data = await parseOrderResponse<{
    order: Order;
    accessToken?: string;
    supabaseToken?: string;
    supabaseExpiresAt?: number;
  }>(response);

  persistCredentialsFromResponse(orderId, data, credentials.accessToken);
  return data.order;
}

export async function updateOrderRemote(
  orderId: string,
  patch: UpdateOrderRequest
): Promise<Order> {
  const response = await authFetch(`/api/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });

  const data = await parseOrderResponse<{ order: Order }>(response);
  return data.order;
}

interface SubscribeOptions {
  customerOrderId?: string | null;
  onChange: () => void;
  onStatus?: (status: string) => void;
}

/**
 * Abonnement Supabase Realtime INSERT/UPDATE sur public.orders.
 * L'événement déclenche une relecture autoritative via /api/orders : en cas
 * d'événement manqué pendant une coupure, le rattrapage est donc complet.
 */
export function subscribeToOrderChanges({ customerOrderId, onChange, onStatus }: SubscribeOptions): () => void {
  let disposed = false;
  let channel: any = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryDelay = 1000;
  let supabase: any = null;
  const channelSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const cleanupChannel = async () => {
    if (supabase && channel) {
      try {
        await supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    }
    channel = null;
  };

  const scheduleReconnect = () => {
    if (disposed || retryTimer) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      retryDelay = Math.min(retryDelay * 2, 10000);
      void connect();
    }, retryDelay);
  };

  const connect = async () => {
    if (disposed) return;

    try {
      const { getSupabaseBrowserClient } = await import('./supabaseClient');
      supabase = getSupabaseBrowserClient();
      if (!supabase) {
        onStatus?.('REALTIME_NOT_CONFIGURED');
        return;
      }

      const staffToken = getAdminToken()
        ? await fetchSupabaseRealtimeToken()
        : null;
      const customerCredentials = !staffToken && customerOrderId
        ? getOrderCredentials(customerOrderId)
        : {};
      const realtimeToken = staffToken || customerCredentials.supabaseToken;

      if (!realtimeToken) {
        onStatus?.('REALTIME_TOKEN_UNAVAILABLE');
        scheduleReconnect();
        return;
      }

      await cleanupChannel();
      await supabase.realtime.setAuth(realtimeToken);

      const filter = !staffToken && customerOrderId
        ? { filter: `id=eq.${customerOrderId}` }
        : {};

      channel = supabase
        .channel(`orders-live-${staffToken ? 'staff' : customerOrderId || 'guest'}-${channelSuffix}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders', ...filter },
          () => onChange()
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', ...filter },
          () => onChange()
        )
        .subscribe((status: string) => {
          onStatus?.(status);
          if (status === 'SUBSCRIBED') {
            retryDelay = 1000;
            onChange();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            scheduleReconnect();
          }
        });
    } catch (error) {
      console.warn('Supabase Realtime orders subscription failed:', error);
      onStatus?.('REALTIME_ERROR');
      scheduleReconnect();
    }
  };

  const handleOnline = () => {
    onChange();
    if (!channel) void connect();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
  }

  void connect();

  return () => {
    disposed = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
    }
    void cleanupChannel();
  };
}
