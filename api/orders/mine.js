import {
  ApiError,
  handleApiError,
  mapDbRowToOrder,
  sendJson,
  supabaseRest,
} from '../_lib/orders.js';
import { requireDeviceId, requireSupabaseCustomersConfig } from '../_lib/customers.js';

// « Mes commandes » : liste publique STRICTEMENT limitée aux commandes passées
// depuis cet appareil (device_id UUID). Aucune donnée d'autres appareils, et
// aucun identifiant personnel dans l'URL ou les logs.
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return sendJson(res, 405, { success: false, code: 'METHOD_NOT_ALLOWED', error: 'Méthode non autorisée.' });
    }

    const deviceId = requireDeviceId(req.query?.deviceId);
    await requireSupabaseCustomersConfig();

    const rows = await supabaseRest(
      `/rest/v1/orders?select=*&device_id=eq.${deviceId}&order=created_at.desc&limit=50`
    );
    if (!Array.isArray(rows)) {
      throw new ApiError(502, 'La base de commandes n’a pas répondu correctement.', 'SUPABASE_INVALID_RESPONSE');
    }

    return sendJson(res, 200, { success: true, orders: rows.map(mapDbRowToOrder) });
  } catch (error) {
    return handleApiError(res, error);
  }
}
