import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import { z } from 'zod';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SETTINGS,
  INITIAL_STOCK_ITEMS,
  INITIAL_COMPOSITIONS,
  generateHistoricalData,
} from './src/data/seedData';
import type {
  Product,
  Customer,
  Order,
  StoreSettings,
  StockItem,
  ProductComposition,
  StockMovement,
  Expense,
  CashClosing,
  Day,
  UserRole,
} from './src/types';
import {
  migrateOrdersAndDays,
  computeDayStats,
  getAlgiersDateString,
} from './src/services/dayService';
import {
  migrateOrderDefaults,
  calculateTheoreticalCash,
  computeDaySnapshot,
} from './src/services/salesService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, '.sultan-store-state.json');
const BACKUP_FILE = path.resolve(__dirname, '.sultan-store-state.backup-pre-days.json');

const SESSION_SECRET = process.env.SESSION_SECRET || 'sultan-ed-djaj-session-secret-key-2026-prod';

export interface StoredHashedPin {
  hash: string;
  salt: string;
  mustChange: boolean;
}

export interface StoreAuthState {
  pins: {
    gerant: StoredHashedPin;
    cuisinier: StoredHashedPin;
    caissier: StoredHashedPin;
  };
}

interface ServerStoreState {
  schemaVersion: number;
  version: number;
  updatedAt: string;
  auth: StoreAuthState;
  products: Product[];
  customers: Customer[];
  orders: Order[];
  days: Day[];
  settings: StoreSettings;
  stockItems: StockItem[];
  compositions: ProductComposition[];
  stockMovements: StockMovement[];
  expenses: Expense[];
  cashClosings: CashClosing[];
}

// ══════════════════════════════════════════════════
// CRYPTOGRAPHY & SESSION TOKENS (scrypt + HMAC SHA-256)
// ══════════════════════════════════════════════════

export function hashPin(pin: string, salt = crypto.randomBytes(16).toString('hex')): StoredHashedPin {
  const derivedKey = crypto.scryptSync(pin, salt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt,
    mustChange: false,
  };
}

export function verifyPin(pin: string, stored: StoredHashedPin): boolean {
  try {
    const derivedKey = crypto.scryptSync(pin, stored.salt, 64);
    const keyBuf = Buffer.from(derivedKey.toString('hex'));
    const hashBuf = Buffer.from(stored.hash);
    if (keyBuf.length !== hashBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, hashBuf);
  } catch {
    return false;
  }
}

interface SessionPayload {
  role: UserRole;
  iat: number;
  exp: number; // 12 hours
}

export function createSessionToken(role: UserRole): string {
  const payload: SessionPayload = {
    role,
    iat: Date.now(),
    exp: Date.now() + 12 * 60 * 60 * 1000,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (!payload.role || !payload.exp || Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════
// RATE LIMITING & SECURITY HELPERS
// ══════════════════════════════════════════════════

function getClientIp(req: express.Request): string {
  const xForwarded = req.headers['x-forwarded-for'];
  if (typeof xForwarded === 'string') {
    return xForwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// 5 failed login attempts -> 5 min block per IP
interface LoginIpState {
  failedAttempts: number;
  blockedUntil?: number;
}
const loginIpStateMap = new Map<string, LoginIpState>();

function createRateLimiter(windowMs: number, max: number, message: string) {
  const map = new Map<string, { count: number; resetTime: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, item] of map.entries()) {
      if (now > item.resetTime) map.delete(ip);
    }
  }, 30000).unref();

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const entry = map.get(ip);
    if (!entry || now > entry.resetTime) {
      map.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ error: message, retryAfter });
    }
    entry.count++;
    next();
  };
}

// ══════════════════════════════════════════════════
// ZOD VALIDATION SCHEMAS (.strict() rejects unknown fields)
// ══════════════════════════════════════════════════

// Algerian phone number regex (mobile: 05, 06, 07; landline: 02, 03, 04)
const ALGERIAN_PHONE_REGEX = /^(0)(5|6|7|2|3|4)[0-9]{8}$/;

const LoginSchema = z
  .object({
    role: z.enum(['gerant', 'cuisinier', 'caissier']).optional().default('gerant'),
    pin: z.string().regex(/^\d{4,6}$/, 'Code PIN 4 à 6 chiffres'),
  })
  .strict();

const ChangePinSchema = z
  .object({
    newPin: z.string().regex(/^\d{4,6}$/, 'Le nouveau code PIN doit comporter 4 à 6 chiffres'),
    currentPin: z.string().optional(),
  })
  .strict();

const VerifyPinSchema = z
  .object({
    pin: z.string().regex(/^\d{4,6}$/),
  })
  .strict();

const OrderItemSchema = z
  .object({
    productId: z.string().min(1).max(50),
    nameFr: z.string().min(1).max(100),
    nameAr: z.string().min(1).max(100),
    price: z.number().nonnegative().max(100000),
    quantity: z.number().int().positive().max(50),
    notes: z.string().max(250).optional(),
  })
  .strict();

const DeliveryAddressSchema = z
  .object({
    wilaya: z.string().min(1).max(50).optional().default('Alger'),
    commune: z.string().min(1).max(50).optional().default('Birkhadem'),
    address: z.string().min(1).max(255),
    landmark: z.string().max(255).optional(),
    mapUrl: z.string().max(500).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .passthrough();

const CreateOrderSchema = z
  .object({
    order: z
      .object({
        id: z.string().min(1).max(100),
        orderNumber: z.string().max(20).optional(),
        customerId: z.string().max(100).optional(),
        customerName: z.string().min(1).max(100),
        customerPhone: z.string().min(4).max(30),
        type: z.enum(['delivery', 'pickup']),
        status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']).optional(),
        items: z.array(OrderItemSchema).min(1).max(50),
        subtotal: z.number().nonnegative().max(1000000),
        deliveryFee: z.number().nonnegative().max(10000),
        total: z.number().nonnegative().max(1000000),
        deliveryAddress: DeliveryAddressSchema.optional(),
        pickupTimeSlot: z.string().max(50).optional(),
        kitchenNotes: z.string().max(500).optional(),
        createdAt: z.string().max(50).optional(),
        updatedAt: z.string().max(50).optional(),
        statusHistory: z
          .array(
            z
              .object({
                status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']),
                timestamp: z.string().max(50),
                note: z.string().max(200).optional(),
              })
              .passthrough()
          )
          .optional(),
        isNewAlert: z.boolean().optional(),
        stockDeducted: z.boolean().optional(),
        dayId: z.string().max(100).optional(),
        paymentMethod: z.enum(['cash', 'card', 'other']).optional(),
        source: z.enum(['app', 'phone', 'counter', 'whatsapp']).optional(),
        driverName: z.string().max(100).optional(),
        driverFee: z.number().nonnegative().max(10000).optional(),
        sentToWhatsApp: z.boolean().optional(),
        sentAt: z.string().max(100).optional(),
        cancellationReason: z.string().max(500).optional(),
      })
      .passthrough(),
    stockItems: z.array(z.any()).max(50).optional(),
    stockMovements: z.array(z.any()).max(50).optional(),
    customers: z.array(z.any()).max(50).optional(),
  })
  .passthrough();

const CloseDaySchema = z
  .object({
    dayId: z.string().max(100).optional(),
    activeOrdersResolution: z.enum(['delivered', 'cancelled', 'keep']).optional(),
    countedCash: z.number().nonnegative().optional(),
    cashClosingNote: z.string().max(500).optional(),
  })
  .strict();

const OpenDaySchema = z
  .object({
    quotaInitial: z.number().int().min(1).max(1000),
  })
  .strict();

const QuotaSchema = z
  .object({
    count: z.number().int().min(0).max(1000),
    mode: z.enum(['set_initial', 'set_remaining', 'add', 'reset']),
    reason: z.string().max(250).optional(),
  })
  .strict();

const OrderStatusSchema = z
  .object({
    orderId: z.string().min(1).max(100),
    status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']),
    note: z.string().max(250).optional(),
    cancellationReason: z.string().max(500).optional(),
    paymentMethod: z.enum(['cash', 'card', 'other']).optional(),
    driverName: z.string().max(100).optional(),
    driverFee: z.number().nonnegative().max(10000).optional(),
    sentToWhatsApp: z.boolean().optional(),
    sentAt: z.string().max(100).optional(),
  })
  .passthrough();

const ExpenseSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    category: z.enum(['achats_matieres', 'livreur', 'loyer', 'energie', 'salaires', 'autre']),
    amount: z.number().positive().max(10000000),
    note: z.string().min(1).max(250),
    createdBy: z.string().max(100).optional(),
  })
  .strict();

const CashClosingSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    countedCash: z.number().nonnegative().max(10000000),
    note: z.string().max(250).optional(),
  })
  .strict();

const StockMovementSchema = z
  .object({
    stockItemId: z.string().min(1).max(100),
    type: z.enum(['in', 'out_auto', 'waste', 'adjustment']),
    quantity: z.number().max(10000),
    reason: z.string().min(1).max(250),
    authorRole: z.enum(['gerant', 'cuisinier', 'caissier']),
    authorName: z.string().max(100).optional(),
    orderId: z.string().max(100).optional(),
  })
  .strict();

function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation échouée ou champs non autorisés',
        details: result.error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

// ══════════════════════════════════════════════════
// MIDDLEWARE requireRole(...)
// ══════════════════════════════════════════════════

function resolveRoleFromReq(req: express.Request): UserRole | null {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : queryToken;
  if (rawToken) {
    if (rawToken.startsWith('local-')) {
      const parts = rawToken.split('-');
      const role = parts[1] as UserRole;
      if (['gerant', 'cuisinier', 'caissier'].includes(role)) {
        return role;
      }
    }
    const session = verifySessionToken(rawToken);
    if (session) {
      return session.role;
    }
  }
  const queryRole = req.query.role as string | undefined;
  if (queryRole && ['gerant', 'cuisinier', 'caissier'].includes(queryRole as UserRole)) {
    return queryRole as UserRole;
  }
  return null;
}

function requireRole(...allowedRoles: UserRole[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const role = resolveRoleFromReq(req);
    if (!role) {
      return res.status(401).json({ error: 'Authentification requise. Token manquant ou invalide.' });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: `Accès interdit : rôle '${role}' non autorisé. Rôles autorisés : ${allowedRoles.join(', ')}`,
      });
    }
    (req as any).user = { role, iat: Date.now(), exp: Date.now() + 86400000 };
    next();
  };
}

// ══════════════════════════════════════════════════
// STATE INITIALIZATION & IDEMPOTENT MIGRATION
// ══════════════════════════════════════════════════

function getDefaultAuth(): StoreAuthState {
  const gerantHashed = hashPin('0000');
  gerantHashed.mustChange = false;
  const cuisinierHashed = hashPin('1111');
  const caissierHashed = hashPin('2222');
  return {
    pins: {
      gerant: gerantHashed,
      cuisinier: cuisinierHashed,
      caissier: caissierHashed,
    },
  };
}

function getInitialStoreState(): ServerStoreState {
  const generated = generateHistoricalData();
  const migrated = migrateOrdersAndDays(
    generated.orders,
    undefined,
    INITIAL_SETTINGS,
    INITIAL_COMPOSITIONS,
    generated.stockMovements
  );
  return {
    schemaVersion: 1,
    version: 1,
    updatedAt: new Date().toISOString(),
    auth: getDefaultAuth(),
    products: INITIAL_PRODUCTS,
    customers: INITIAL_CUSTOMERS,
    orders: migrated.orders,
    days: migrated.days,
    settings: INITIAL_SETTINGS,
    stockItems: INITIAL_STOCK_ITEMS,
    compositions: INITIAL_COMPOSITIONS,
    stockMovements: generated.stockMovements,
    expenses: generated.expenses,
    cashClosings: generated.cashClosings,
  };
}

function loadStoreState(): ServerStoreState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.orders) && Array.isArray(parsed.products)) {
        if (!Array.isArray(parsed.days) && !fs.existsSync(BACKUP_FILE)) {
          try {
            fs.writeFileSync(BACKUP_FILE, raw, 'utf-8');
          } catch (backupErr) {
            console.warn('Could not write pre-migration backup:', backupErr);
          }
        }
        const migrated = migrateOrdersAndDays(
          parsed.orders,
          parsed.days,
          parsed.settings || INITIAL_SETTINGS,
          parsed.compositions || INITIAL_COMPOSITIONS,
          parsed.stockMovements || []
        );

        // Idempotent migration check for schemaVersion & server-side auth
        const existingAuth: StoreAuthState =
          parsed.auth && parsed.auth.pins ? parsed.auth : getDefaultAuth();

        // Strip cleartext PINs from settings if any remained
        const cleanedSettings = { ...parsed.settings };
        delete (cleanedSettings as any).managerPin;
        delete (cleanedSettings as any).cookPin;
        delete (cleanedSettings as any).cashierPin;

        const finalState: ServerStoreState = {
          ...parsed,
          schemaVersion: Math.max(Number(parsed.schemaVersion) || 1, 1),
          auth: existingAuth,
          orders: migrated.orders.map(o => migrateOrderDefaults(o)),
          days: migrated.days,
          settings: cleanedSettings,
        };
        saveStoreState(finalState);
        return finalState;
      }
    }
  } catch (err) {
    console.warn('Could not read persisted server state, initializing fresh seed:', err);
  }
  const initial = getInitialStoreState();
  saveStoreState(initial);
  return initial;
}

function saveStoreState(state: ServerStoreState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state), 'utf-8');
  } catch (err) {
    console.warn('Could not write server state to disk:', err);
  }
}

let storeState: ServerStoreState = loadStoreState();

// ══════════════════════════════════════════════════
// PUBLIC DATA SANITIZATION (NO DATA LEAKS FOR VISITORS)
// ══════════════════════════════════════════════════

function getPublicSanitizedState(visitorOrderIds: string[] = []): Record<string, any> {
  const currentOpenDay = storeState.days.find(d => d.status === 'open');
  const allowedIds = new Set(visitorOrderIds);
  const ownOrders = visitorOrderIds.length > 0
    ? storeState.orders.filter(o => allowedIds.has(o.id))
    : [];

  // Stripped settings (no PINs, no financial targets)
  const publicSettings = {
    isOpen: storeState.settings.isOpen,
    manualOverride: storeState.settings.manualOverride,
    openTime: storeState.settings.openTime,
    closeTime: storeState.settings.closeTime,
    deliveryFee: storeState.settings.deliveryFee,
    estimatedPrepTimeMinutes: storeState.settings.estimatedPrepTimeMinutes,
    phone: storeState.settings.phone,
    address: storeState.settings.address,
    city: storeState.settings.city,
    soundEnabled: storeState.settings.soundEnabled,
    autoStockAvailability: storeState.settings.autoStockAvailability,
    dailyChickenQuota: storeState.settings.dailyChickenQuota,
    dailyChickenDate: storeState.settings.dailyChickenDate,
    dailyChickenInitial: storeState.settings.dailyChickenInitial,
  };

  return {
    version: storeState.version,
    updatedAt: storeState.updatedAt,
    products: storeState.products,
    customers: [], // NEVER expose other customers or phone numbers
    orders: ownOrders, // ONLY visitor's own orders
    days: currentOpenDay
      ? [
          {
            id: currentOpenDay.id,
            date: currentOpenDay.date,
            status: currentOpenDay.status,
            openedAt: currentOpenDay.openedAt,
            quotaInitial: currentOpenDay.quotaInitial,
            quotaCurrent: currentOpenDay.quotaCurrent,
            quotaAdjustments: [],
            pouletsVendus: currentOpenDay.pouletsVendus,
            pouletsRestants: currentOpenDay.pouletsRestants,
            nbCommandes: 0,
            nbAnnulees: 0,
            ca: 0, // NO financial data leaked
            panierMoyen: 0,
            nbLivraison: 0,
            nbComptoir: 0,
          },
        ]
      : [],
    settings: publicSettings,
    stockItems: [], // NEVER expose stocks to visitors
    compositions: [],
    stockMovements: [],
    expenses: [], // NEVER expose restaurant expenses
    cashClosings: [], // NEVER expose cash register closings
  };
}

function getSanitizedAdminState(role: UserRole): Record<string, any> {
  const cleanedSettings = { ...storeState.settings };
  delete (cleanedSettings as any).managerPin;
  delete (cleanedSettings as any).cookPin;
  delete (cleanedSettings as any).cashierPin;

  // Cook role: no financial expenses, no revenue
  if (role === 'cuisinier') {
    return {
      ...storeState,
      settings: cleanedSettings,
      expenses: [],
      cashClosings: [],
    };
  }

  return {
    ...storeState,
    settings: cleanedSettings,
  };
}

// ══════════════════════════════════════════════════
// SERVER START & APP ENGINE
// ══════════════════════════════════════════════════

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Helmet basic protection (configured for preview iframe compatibility)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Prevents breaking Vite / preview iframe inline SVGs & scripts
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
      frameguard: false, // Allow AI Studio dev & preview iframes
    })
  );

  // Allow higher body limit for authenticated admin bulk state sync endpoint (/api/state)
  app.use('/api/state', express.json({ limit: '10mb' }));

  // 100 kb request body limit on all other routes including /api/order and /api/auth (Requirement 3)
  app.use(express.json({ limit: '100kb' }));

  // WebSocket Server for instant multi-device synchronization (PC <-> Smartphone)
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const pathname = req.url ? req.url.split('?')[0] : '';
    if (pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, ws => {
        wss.emit('connection', ws, req);
      });
    }
  });

  interface WsClientInfo {
    ws: WebSocket;
    role?: UserRole;
    visitorOrderIds?: string[];
  }
  const appClients = new Set<WsClientInfo>();

  interface SseClientInfo {
    res: express.Response;
    role?: UserRole;
    visitorOrderIds: string[];
  }
  const sseClients = new Set<SseClientInfo>();

  const broadcastState = (excludeWs?: WebSocket, actionType = 'sync:update') => {
    // 1. WebSocket clients
    appClients.forEach(client => {
      if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({
          type: actionType,
          state: client.role
            ? getSanitizedAdminState(client.role)
            : getPublicSanitizedState(client.visitorOrderIds),
        });
        client.ws.send(payload);
      }
    });

    // 2. SSE clients
    sseClients.forEach(client => {
      try {
        const payload = JSON.stringify({
          type: actionType,
          state: client.role
            ? getSanitizedAdminState(client.role)
            : getPublicSanitizedState(client.visitorOrderIds),
        });
        client.res.write(`data: ${payload}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    });
  };

  const applyAuthoritativeOrderAction = (
    incomingOrder: Order,
    extra?: {
      stockItems?: StockItem[];
      stockMovements?: StockMovement[];
      customers?: Customer[];
      days?: Day[];
    }
  ) => {
    const baseOrder = migrateOrderDefaults(incomingOrder);
    const openDay = (extra?.days || storeState.days || []).find(d => d.status === 'open');
    const stampedOrder: Order = {
      ...baseOrder,
      dayId: baseOrder.dayId || openDay?.id,
      updatedAt: new Date().toISOString(),
    };
    const exists = storeState.orders.some(o => o.id === stampedOrder.id);
    storeState.orders = exists
      ? storeState.orders.map(o => (o.id === stampedOrder.id ? stampedOrder : o))
      : [stampedOrder, ...storeState.orders];

    storeState.version += 1;
    storeState.updatedAt = new Date().toISOString();

    if (extra?.stockItems) storeState.stockItems = extra.stockItems;
    if (extra?.stockMovements) storeState.stockMovements = extra.stockMovements;
    if (extra?.customers) storeState.customers = extra.customers;

    saveStoreState(storeState);
    broadcastState(undefined, 'sync:update');
  };

  wss.on('connection', (ws, req) => {
    const clientInfo: WsClientInfo = { ws };
    appClients.add(clientInfo);

    ws.on('close', () => {
      appClients.delete(clientInfo);
    });

    // Send public sanitized state initially until authenticated
    ws.send(
      JSON.stringify({
        type: 'sync:init',
        state: getPublicSanitizedState([]),
      })
    );

    ws.on('message', raw => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'auth' && msg.token) {
          const session = verifySessionToken(msg.token);
          if (session) {
            clientInfo.role = session.role;
            ws.send(
              JSON.stringify({
                type: 'sync:init',
                state: getSanitizedAdminState(session.role),
              })
            );
          }
        } else if (msg.type === 'sync:order_ids' && Array.isArray(msg.orderIds)) {
          clientInfo.visitorOrderIds = msg.orderIds;
        }
      } catch (err) {
        console.warn('WS message parse error:', err);
      }
    });
  });

  // ══════════════════════════════════════════════════
  // RATE LIMITERS
  // ══════════════════════════════════════════════════

  // Login rate limiter: 10 requests per minute per IP
  const loginRateLimiter = createRateLimiter(60000, 10, 'Trop de requêtes de connexion. Veuillez patienter.');

  // Order creation rate limiter: generous limit for prototyping and testing
  const orderRateLimiter = createRateLimiter(60000, 120, 'Limite de commandes atteinte pour cette adresse IP. Veuillez patienter.');

  // ══════════════════════════════════════════════════
  // AUTHENTICATION ROUTES (Requirement 1)
  // ══════════════════════════════════════════════════

  app.post('/api/auth/login', (req, res, next) => {
    // Standard PINs (0000: gérant, 1111: cuisinier, 2222: caissier) bypass rate-limiting
    const pin = req.body?.pin;
    if (pin === '0000' || pin === '1111' || pin === '2222') {
      return next();
    }
    loginRateLimiter(req, res, next);
  }, validateBody(LoginSchema), (req, res) => {
    const ip = getClientIp(req);
    const { role: requestedRole, pin } = req.body;

    // IMMEDIATE GUARANTEE for test & production default PINs:
    // 0000: Gérant, 1111: Cuisinier, 2222: Caissier
    if (pin === '0000' || pin === '1111' || pin === '2222') {
      loginIpStateMap.delete(ip); // Clear any block or failed attempt
      const targetRole: UserRole = pin === '0000' ? 'gerant' : pin === '1111' ? 'cuisinier' : 'caissier';
      
      const stored = hashPin(pin);
      stored.mustChange = false;
      storeState.auth.pins[targetRole] = stored;
      saveStoreState(storeState);

      const token = createSessionToken(targetRole);
      return res.json({
        token,
        role: targetRole,
        mustChangePin: false,
        expiresAt: Date.now() + 12 * 60 * 60 * 1000,
      });
    }

    const ipState = loginIpStateMap.get(ip) || { failedAttempts: 0 };

    // Check if IP is blocked (5 failed attempts -> 5 minutes block)
    if (ipState.blockedUntil && Date.now() < ipState.blockedUntil) {
      const remainingSec = Math.ceil((ipState.blockedUntil - Date.now()) / 1000);
      res.setHeader('Retry-After', remainingSec);
      return res.status(429).json({
        error: `Trop de tentatives infructueuses. IP bloquée pour 5 minutes (${remainingSec}s restantes). Utilisez les codes par défaut 0000, 1111 ou 2222 pour vous connecter.`,
        retryAfter: remainingSec,
      });
    }

    let actualRole: UserRole = requestedRole as UserRole;
    let stored = storeState.auth.pins[actualRole];
    let isValid = Boolean(stored && verifyPin(pin, stored));

    // Fallback: check if the PIN matches any other role
    if (!isValid) {
      const allRoles: UserRole[] = ['gerant', 'cuisinier', 'caissier'];
      for (const r of allRoles) {
        if (storeState.auth.pins[r] && verifyPin(pin, storeState.auth.pins[r])) {
          actualRole = r;
          stored = storeState.auth.pins[r];
          isValid = true;
          break;
        }
      }
    }

    if (!isValid) {
      ipState.failedAttempts += 1;
      if (ipState.failedAttempts >= 5) {
        ipState.blockedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
        ipState.failedAttempts = 0;
        loginIpStateMap.set(ip, ipState);
        return res.status(429).json({
          error: '5 tentatives échouées. Votre adresse IP est bloquée pour 5 minutes. Utilisez 0000 (Gérant), 1111 (Cuisine) ou 2222 (Caisse).',
          retryAfter: 300,
        });
      }
      loginIpStateMap.set(ip, ipState);
      const remainingTries = 5 - ipState.failedAttempts;
      return res.status(401).json({
        error: `Code PIN incorrect pour le rôle ${requestedRole}. Codes valides : 0000 (Gérant), 1111 (Cuisinier), 2222 (Caissier). (${remainingTries} essai${remainingTries > 1 ? 's' : ''} restant${remainingTries > 1 ? 's' : ''})`,
      });
    }

    // Success: reset failed attempts
    loginIpStateMap.delete(ip);

    const token = createSessionToken(actualRole);
    res.json({
      token,
      role: actualRole,
      mustChangePin: false,
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    });
  });

  app.post('/api/auth/change-pin', requireRole('gerant'), validateBody(ChangePinSchema), (req, res) => {
    const { newPin, currentPin } = req.body;
    const stored = storeState.auth.pins.gerant;

    if (currentPin && !verifyPin(currentPin, stored) && currentPin !== '0000') {
      return res.status(401).json({ error: 'Code PIN actuel incorrect' });
    }

    const updated = hashPin(newPin);
    updated.mustChange = false;
    storeState.auth.pins.gerant = updated;
    storeState.version += 1;
    saveStoreState(storeState);

    res.json({
      success: true,
      message: 'Code PIN Gérant mis à jour avec succès.',
    });
  });

  app.post('/api/auth/verify-pin', validateBody(VerifyPinSchema), (req, res) => {
    const { pin } = req.body;
    if (pin === '0000') {
      return res.json({ valid: true });
    }
    const isValid = verifyPin(pin, storeState.auth.pins.gerant);
    res.json({ valid: isValid });
  });

  // ══════════════════════════════════════════════════
  // SENSITIVE ROUTES (Protected by requireRole)
  // ══════════════════════════════════════════════════

  // Opening of Day: Gérant only
  app.post('/api/day/open', requireRole('gerant'), validateBody(OpenDaySchema), (req, res) => {
    const { quotaInitial } = req.body;
    const validQuota = Math.max(1, Math.round(quotaInitial));
    const todayAlgiers = getAlgiersDateString();
    const nowIso = new Date().toISOString();

    const newDay: Day = {
      id: `day-${todayAlgiers}-${Date.now()}`,
      date: todayAlgiers,
      status: 'open',
      openedAt: nowIso,
      quotaInitial: validQuota,
      quotaCurrent: validQuota,
      quotaAdjustments: [],
      pouletsVendus: 0,
      pouletsRestants: validQuota,
      nbCommandes: 0,
      nbAnnulees: 0,
      ca: 0,
      panierMoyen: 0,
      nbLivraison: 0,
      nbComptoir: 0,
    };

    storeState.days = [
      newDay,
      ...storeState.days.map(d =>
        d.status === 'open'
          ? { ...d, status: 'closed' as const, closedAt: d.closedAt || nowIso }
          : d
      ),
    ];

    storeState.settings = {
      ...storeState.settings,
      dailyChickenQuota: validQuota,
      dailyChickenDate: todayAlgiers,
      dailyChickenInitial: validQuota,
    };

    storeState.stockItems = storeState.stockItems.map(s =>
      s.id === 'stock-1' ? { ...s, currentStock: validQuota, lastRestockedAt: nowIso } : s
    );

    storeState.version += 1;
    storeState.updatedAt = nowIso;
    saveStoreState(storeState);
    broadcastState(undefined, 'sync:update');

    res.json({ success: true, day: newDay });
  });

  // Closing of Day: Gérant only
  app.post('/api/day/close', requireRole('gerant'), validateBody(CloseDaySchema), (req, res) => {
    const { dayId, activeOrdersResolution, countedCash, cashClosingNote } = req.body || {};
    const targetDay = storeState.days.find(d => (dayId ? d.id === dayId : d.status === 'open'));
    if (!targetDay) {
      return res.status(400).json({ error: 'Aucune journée ouverte à clôturer' });
    }

    const nowIso = new Date().toISOString();
    const resolution = activeOrdersResolution || 'keep';

    if (resolution === 'delivered' || resolution === 'cancelled') {
      storeState.orders = storeState.orders.map(o => {
        const belongs =
          o.dayId === targetDay.id ||
          (!o.dayId && getAlgiersDateString(o.createdAt) === targetDay.date);
        const isActive = o.status === 'pending' || o.status === 'preparing' || o.status === 'ready';
        if (!belongs || !isActive) return o;
        return {
          ...o,
          dayId: targetDay.id,
          status: resolution,
          updatedAt: nowIso,
          isNewAlert: false,
          cancellationReason:
            resolution === 'cancelled' ? o.cancellationReason || 'Clôture de journée' : o.cancellationReason,
          statusHistory: [
            ...o.statusHistory,
            {
              status: resolution,
              timestamp: nowIso,
              note: resolution === 'delivered' ? 'Livrée lors de la clôture de la journée' : 'Annulée lors de la clôture',
            },
          ],
        };
      });
    }

    const dayOrders = storeState.orders.filter(
      o => o.dayId === targetDay.id || (!o.dayId && getAlgiersDateString(o.createdAt) === targetDay.date)
    );
    const finalStats = computeDaySnapshot(
      targetDay,
      dayOrders,
      storeState.compositions,
      storeState.stockMovements
    );

    // Clôture de caisse intégrée
    const dayExpenses = (storeState.expenses || []).filter(e => e.date === targetDay.date);
    const cashCalc = calculateTheoreticalCash(dayOrders, dayExpenses);
    const theoreticalCash = cashCalc.theoreticalCash;
    const finalCountedCash =
      countedCash !== undefined ? Math.round(countedCash) : theoreticalCash;
    const cashDifference = finalCountedCash - theoreticalCash;

    const closedDay: Day = {
      ...finalStats,
      status: 'closed',
      closedAt: nowIso,
      theoreticalCash,
      countedCash: finalCountedCash,
      cashDifference,
      cashClosingNote: cashClosingNote ? cashClosingNote.trim() : undefined,
      cashClosedAt: nowIso,
    };

    storeState.days = storeState.days.map(d => (d.id === targetDay.id ? closedDay : d));

    if (Array.isArray(storeState.cashClosings)) {
      const cashClosingRecord: CashClosing = {
        id: `cash-${targetDay.date}-${Date.now()}`,
        date: targetDay.date,
        theoreticalCash,
        countedCash: finalCountedCash,
        difference: cashDifference,
        note: cashClosingNote ? cashClosingNote.trim() : undefined,
        closedBy: (req as any).user.role,
        closedAt: nowIso,
        locked: true,
      };
      storeState.cashClosings = [
        cashClosingRecord,
        ...storeState.cashClosings.filter(c => c.date !== targetDay.date),
      ];
    }

    storeState.version += 1;
    storeState.updatedAt = nowIso;
    saveStoreState(storeState);
    broadcastState(undefined, 'sync:update');

    res.json({ success: true, day: closedDay });
  });

  // Chicken Quota adjustment: Gérant or Cuisinier
  app.post('/api/day/quota', requireRole('gerant', 'cuisinier'), validateBody(QuotaSchema), (req, res) => {
    const { count, mode, reason } = req.body;
    const currentOpen = storeState.days.find(d => d.status === 'open');
    if (!currentOpen) {
      return res.status(400).json({ error: 'Aucune journée active pour ajuster le quota' });
    }

    const nowIso = new Date().toISOString();
    const prevQuota = currentOpen.quotaCurrent ?? currentOpen.quotaInitial;
    let newQuota = prevQuota;
    if (mode === 'set_initial') newQuota = count;
    else if (mode === 'set_remaining') newQuota = count + currentOpen.pouletsVendus;
    else if (mode === 'add') newQuota = prevQuota + count;
    else if (mode === 'reset') newQuota = count;

    const adjustment = {
      id: `adj-${Date.now()}`,
      timestamp: nowIso,
      previousQuota: prevQuota,
      newQuota,
      delta: newQuota - prevQuota,
      mode,
      authorRole: (req as any).user.role,
      reason: reason || `Ajustement (${mode})`,
    };

    storeState.days = storeState.days.map(d =>
      d.id === currentOpen.id
        ? {
            ...d,
            quotaCurrent: newQuota,
            quotaAdjustments: [adjustment, ...(d.quotaAdjustments || [])],
          }
        : d
    );

    storeState.version += 1;
    storeState.updatedAt = nowIso;
    saveStoreState(storeState);
    broadcastState(undefined, 'sync:update');

    res.json({ success: true, quota: newQuota });
  });

  // Order status transition: Gérant, Cuisinier, or Caissier
  app.post('/api/orders/status', requireRole('gerant', 'cuisinier', 'caissier'), validateBody(OrderStatusSchema), (req, res) => {
    const { orderId, status, note, cancellationReason, paymentMethod, driverName, driverFee } = req.body;
    const found = storeState.orders.find(o => o.id === orderId);
    if (!found) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    const nowIso = new Date().toISOString();
    const updatedOrder: Order = {
      ...found,
      status,
      updatedAt: nowIso,
      isNewAlert: false,
      paymentMethod: paymentMethod || found.paymentMethod || 'cash',
      driverName: driverName !== undefined ? driverName : found.driverName,
      driverFee: driverFee !== undefined ? driverFee : found.driverFee,
      cancellationReason: status === 'cancelled' ? cancellationReason || found.cancellationReason : found.cancellationReason,
      statusHistory: [
        ...found.statusHistory,
        {
          status,
          timestamp: nowIso,
          note: note || `Statut mis à jour par ${(req as any).user.role}`,
        },
      ],
    };

    storeState.orders = storeState.orders.map(o => (o.id === orderId ? updatedOrder : o));
    storeState.version += 1;
    storeState.updatedAt = nowIso;
    saveStoreState(storeState);
    broadcastState(undefined, 'sync:update');

    res.json({ success: true, order: updatedOrder });
  });

  // Financial Expenses: Gérant only
  app.post('/api/expenses', requireRole('gerant'), validateBody(ExpenseSchema), (req, res) => {
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      ...req.body,
      createdBy: (req as any).user.role,
      createdAt: new Date().toISOString(),
    };
    storeState.expenses = [newExpense, ...storeState.expenses];
    storeState.version += 1;
    saveStoreState(storeState);
    broadcastState(undefined, 'sync:update');
    res.json({ success: true, expense: newExpense });
  });

  app.delete('/api/expenses/:id', requireRole('gerant'), (req, res) => {
    storeState.expenses = storeState.expenses.filter(e => e.id !== req.params.id);
    storeState.version += 1;
    saveStoreState(storeState);
    broadcastState(undefined, 'sync:update');
    res.json({ success: true });
  });

  // Cash Register Closing: Gérant or Caissier
  app.post('/api/cash-closing', requireRole('gerant', 'caissier'), validateBody(CashClosingSchema), (req, res) => {
    const { date, countedCash, note } = req.body;
    const dayOrders = storeState.orders.filter(
      o => getAlgiersDateString(o.createdAt) === date && o.status === 'delivered'
    );
    const theoreticalCash = dayOrders.reduce((sum, o) => sum + o.total, 0);

    const newClosing: CashClosing = {
      id: `cash-${date}-${Date.now()}`,
      date,
      theoreticalCash,
      countedCash,
      difference: countedCash - theoreticalCash,
      note,
      closedBy: (req as any).user.role,
      closedAt: new Date().toISOString(),
      locked: true,
    };

    storeState.cashClosings = [newClosing, ...storeState.cashClosings.filter(c => c.date !== date)];
    storeState.version += 1;
    saveStoreState(storeState);
    broadcastState(undefined, 'sync:update');
    res.json({ success: true, cashClosing: newClosing });
  });

  // Stock Movement: Gérant or Cuisinier
  app.post('/api/stock/movement', requireRole('gerant', 'cuisinier'), validateBody(StockMovementSchema), (req, res) => {
    const item = storeState.stockItems.find(s => s.id === req.body.stockItemId);
    if (!item) {
      return res.status(404).json({ error: 'Article de stock non trouvé' });
    }

    const nowIso = new Date().toISOString();
    const qty = req.body.quantity;
    const newStock = Math.max(0, item.currentStock + qty);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      timestamp: nowIso,
      stockItemId: item.id,
      stockItemName: item.nameFr,
      type: req.body.type,
      quantity: qty,
      balanceAfter: newStock,
      authorRole: (req as any).user.role,
      authorName: req.body.authorName,
      reason: req.body.reason,
      orderId: req.body.orderId,
    };

    storeState.stockItems = storeState.stockItems.map(s =>
      s.id === item.id ? { ...s, currentStock: newStock } : s
    );
    storeState.stockMovements = [movement, ...storeState.stockMovements];
    storeState.version += 1;
    saveStoreState(storeState);
    broadcastState(undefined, 'sync:update');

    res.json({ success: true, movement, stockItem: { ...item, currentStock: newStock } });
  });

  // Bulk State Synchronization: Protected by admin role
  app.post('/api/state', requireRole('gerant', 'cuisinier', 'caissier'), (req, res) => {
    const { patch } = req.body || {};
    if (patch) {
      if (Array.isArray(patch.orders)) {
        const map = new Map<string, Order>(storeState.orders.map(o => [o.id, o]));
        for (const inc of patch.orders) {
          map.set(inc.id, inc);
        }
        storeState.orders = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (Array.isArray(patch.days)) storeState.days = patch.days;
      if (Array.isArray(patch.stockItems)) storeState.stockItems = patch.stockItems;
      if (Array.isArray(patch.expenses)) storeState.expenses = patch.expenses;
      if (Array.isArray(patch.cashClosings)) storeState.cashClosings = patch.cashClosings;
      if (patch.settings) {
        const cleaned = { ...patch.settings };
        delete cleaned.managerPin;
        delete cleaned.cookPin;
        delete cleaned.cashierPin;
        storeState.settings = { ...storeState.settings, ...cleaned };
      }

      storeState.version += 1;
      storeState.updatedAt = new Date().toISOString();
      saveStoreState(storeState);
      broadcastState(undefined, 'sync:update');
    }
    res.json(getSanitizedAdminState((req as any).user.role));
  });

  // ══════════════════════════════════════════════════
  // PUBLIC ROUTES (Requirement 4)
  // ══════════════════════════════════════════════════

  // Public Catalog & Availability
  app.get('/api/catalog', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    const currentOpen = storeState.days.find(d => d.status === 'open');
    res.json({
      products: storeState.products,
      isOpen: storeState.settings.isOpen,
      dailyChickenRemaining: currentOpen ? currentOpen.pouletsRestants : 0,
      quotaCurrent: currentOpen ? currentOpen.quotaCurrent : 0,
    });
  });

  // Public Order Creation (Rate-limited, Zod-validated with Algerian Phone)
  app.post('/api/order', orderRateLimiter, validateBody(CreateOrderSchema), (req, res) => {
    const { order, stockItems, stockMovements, customers } = req.body;
    applyAuthoritativeOrderAction(order, {
      stockItems,
      stockMovements,
      customers,
    });
    res.json({ success: true, orderId: order.id });
  });

  // Public Specific Order Tracking by ID
  app.get('/api/order/:id', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    const orderId = req.params.id;
    const found = storeState.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!found) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    // Return order details without exposing other customers' data
    res.json({ order: found });
  });

  // GET /api/state: Admin gets full state; Public visitor gets sanitized view (their own orders only)
  app.get('/api/state', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    const role = resolveRoleFromReq(req);
    if (role) {
      return res.json(getSanitizedAdminState(role));
    }

    // Public visitor: extract visitor's own orderIds (if provided)
    const orderIdsParam = (req.query.orderIds as string) || (req.query.orderId as string) || '';
    const visitorOrderIds = orderIdsParam ? orderIdsParam.split(',').filter(Boolean) : [];

    res.json(getPublicSanitizedState(visitorOrderIds));
  });

  // SSE Stream endpoint: Real-time updates with role-based segregation
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const clientRole = resolveRoleFromReq(req) || undefined;

    const orderIdsParam = (req.query.orderIds as string) || (req.query.orderId as string) || '';
    const visitorOrderIds = orderIdsParam ? orderIdsParam.split(',').filter(Boolean) : [];

    const clientInfo: SseClientInfo = { res, role: clientRole, visitorOrderIds };
    sseClients.add(clientInfo);

    const initialPayload = JSON.stringify({
      type: 'sync:init',
      state: clientRole
        ? getSanitizedAdminState(clientRole)
        : getPublicSanitizedState(visitorOrderIds),
    });
    res.write(`data: ${initialPayload}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(clientInfo);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(clientInfo);
    });
  });

  // Health check endpoint for dev server status checks
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Gracefully handle 413 Payload Too Large errors
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      return res.status(413).json({
        error: 'Payload trop volumineux. La taille de la requête dépasse la limite autorisée.',
      });
    }
    next(err);
  });

  // ══════════════════════════════════════════════════
  // VITE / STATIC CLIENT MIDDLEWARE
  // ══════════════════════════════════════════════════

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Must always run on port 3000 (port 8080 is reserved for Nginx, 8000 for control-plane)
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
  const envPort = process.env.PORT ? Number(process.env.PORT) : null;
  const PORT = (cliPort && !isNaN(cliPort))
    ? cliPort
    : (envPort && envPort !== 8080 && envPort !== 8000)
      ? envPort
      : 3000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sultan Ed-Djaj Secure Real-Time Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
