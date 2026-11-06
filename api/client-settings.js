import {
  ApiError,
  handleApiError,
  readJsonBody,
  requireStaffSession,
  sendJson,
  supabaseRest,
} from './_lib/orders.js';

// Réglages destinés aux navigateurs clients, stockés dans catalog_state.
// GET public (avec Cache-Control: no-store) ; PUT réservé au Gérant.

const STATUS_KEYS = ['pending', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
const LANG_KEYS = ['fr', 'ar'];
const MAX_TEXT_LENGTH = 120;

export function sanitizeClientSettings(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const settings = {
    soundsEnabled: source.soundsEnabled !== false,
    statusTexts: {},
  };

  const texts = source.statusTexts && typeof source.statusTexts === 'object'
    ? source.statusTexts
    : {};
  for (const lang of LANG_KEYS) {
    const langTexts = texts[lang] && typeof texts[lang] === 'object' ? texts[lang] : {};
    const kept = {};
    for (const key of STATUS_KEYS) {
      const text = String(langTexts[key] ?? '').trim();
      if (text) {
        kept[key] = text.slice(0, MAX_TEXT_LENGTH);
      }
    }
    if (Object.keys(kept).length > 0) {
      settings.statusTexts[lang] = kept;
    }
  }
  return settings;
}

async function readStoredClientSettings() {
  const rows = await supabaseRest(
    '/rest/v1/catalog_state?select=client_settings&limit=1'
  );
  const raw = Array.isArray(rows) && rows.length > 0 ? rows[0].client_settings : null;
  return sanitizeClientSettings(raw);
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const clientSettings = await readStoredClientSettings();
      return sendJson(res, 200, { success: true, clientSettings });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const staffSession = requireStaffSession(req);
      if (staffSession.role !== 'gerant') {
        throw new ApiError(403, 'Action réservée au Gérant.', 'FORBIDDEN');
      }

      const body = await readJsonBody(req);
      const clientSettings = sanitizeClientSettings(body?.clientSettings ?? body);
      await supabaseRest('/rest/v1/catalog_state?singleton=eq.true', {
        method: 'PATCH',
        body: { client_settings: clientSettings },
      });
      return sendJson(res, 200, { success: true, clientSettings });
    }

    res.setHeader('Allow', 'GET, PUT, POST');
    return sendJson(res, 405, { success: false, code: 'METHOD_NOT_ALLOWED', error: 'Méthode non autorisée.' });
  } catch (error) {
    return handleApiError(res, error);
  }
}
