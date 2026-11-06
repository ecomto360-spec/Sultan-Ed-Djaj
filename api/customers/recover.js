import { handleApiError, readJsonBody, sendJson } from '../_lib/orders.js';
import {
  attemptRecovery,
  presentCustomer,
  requireDeviceId,
  requireSupabaseCustomersConfig,
} from '../_lib/customers.js';

// « J'ai déjà commandé » : rattache cet appareil à un profil existant après
// vérification du code à 4 chiffres choisi par le client (aucun SMS).
// Limité à 5 essais / 15 minutes, compteur persisté en base.
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, { success: false, code: 'METHOD_NOT_ALLOWED', error: 'Méthode non autorisée.' });
    }

    await requireSupabaseCustomersConfig();

    const body = await readJsonBody(req);
    const deviceId = requireDeviceId(body?.deviceId);
    const row = await attemptRecovery(deviceId, body?.phone, body?.code);
    return sendJson(res, 200, { success: true, profile: presentCustomer(row) });
  } catch (error) {
    return handleApiError(res, error);
  }
}
