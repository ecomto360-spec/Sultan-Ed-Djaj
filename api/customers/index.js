import {
  ApiError,
  getStaffSession,
  handleApiError,
  hasAuthorizationHeader,
  readJsonBody,
  sendJson,
} from '../_lib/orders.js';
import {
  eraseCustomerByDeviceId,
  fetchCustomerByDeviceId,
  listCustomersForStaff,
  presentCustomer,
  requireDeviceId,
  requireSupabaseCustomersConfig,
  sanitizeCustomerInput,
  saveCustomerProfile,
} from '../_lib/customers.js';

export default async function handler(req, res) {
  try {
    await requireSupabaseCustomersConfig();

    // GET : l'équipe voit la liste (sans code de récupération) ; un visiteur
    // ne reçoit QUE le profil de son propre device_id, jamais une liste.
    if (req.method === 'GET') {
      const staffSession = getStaffSession(req);
      if (staffSession) {
        const customers = await listCustomersForStaff();
        return sendJson(res, 200, { success: true, customers });
      }
      if (hasAuthorizationHeader(req)) {
        throw new ApiError(401, 'Session équipe invalide ou expirée.', 'STAFF_AUTH_REQUIRED');
      }

      const deviceId = requireDeviceId(req.query?.deviceId);
      const row = await fetchCustomerByDeviceId(deviceId);
      return sendJson(res, 200, { success: true, profile: presentCustomer(row) });
    }

    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const deviceId = requireDeviceId(body?.deviceId);
      const input = sanitizeCustomerInput(body);
      const row = await saveCustomerProfile(deviceId, input);
      return sendJson(res, 200, { success: true, profile: presentCustomer(row) });
    }

    if (req.method === 'DELETE') {
      const deviceId = requireDeviceId(req.query?.deviceId);
      await eraseCustomerByDeviceId(deviceId);
      return sendJson(res, 200, { success: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(res, 405, { success: false, code: 'METHOD_NOT_ALLOWED', error: 'Méthode non autorisée.' });
  } catch (error) {
    return handleApiError(res, error);
  }
}
