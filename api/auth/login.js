import crypto from 'node:crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'sultan-ed-djaj-session-secret-key-2026-prod';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

const ACCOUNTS = [
  {
    pin: process.env.ADMIN_PIN_GERANT || '0000',
    role: 'gerant',
    accountName: 'Gérant Principal',
  },
  {
    pin: process.env.ADMIN_PIN_CUISINIER || '1111',
    role: 'cuisinier',
    accountName: 'Équipe Cuisine',
  },
  {
    pin: process.env.ADMIN_PIN_CAISSIER || '2222',
    role: 'caissier',
    accountName: 'Caisse & Comptoir',
  },
];

function createSessionToken(role, now) {
  const payload = {
    role,
    iat: now,
    exp: now + SESSION_DURATION_MS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');

  return `${data}.${signature}`;
}

function pinsMatch(candidate, expected) {
  const candidateHash = crypto.createHash('sha256').update(candidate).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
}

async function readJsonBody(req) {
  if (!req.body) return {};

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch {
      return null;
    }
  }

  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString('utf8') || '{}');
    } catch {
      return null;
    }
  }

  return req.body;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const body = await readJsonBody(req);
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Requête de connexion invalide.' });
  }

  const pin = String(body.pin || '').trim();
  if (!/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ error: 'Code PIN invalide (4 à 6 chiffres requis).' });
  }

  const account = ACCOUNTS.find(candidate => pinsMatch(pin, candidate.pin));
  if (!account) {
    return res.status(401).json({ error: 'Code PIN incorrect.' });
  }

  const now = Date.now();
  return res.status(200).json({
    success: true,
    token: createSessionToken(account.role, now),
    role: account.role,
    accountName: account.accountName,
    expiresAt: now + SESSION_DURATION_MS,
  });
}
