import {
  ApiError,
  createOrder,
  getStaffSession,
  handleApiError,
  hasAuthorizationHeader,
  listOrders,
  mapDbRowToOrder,
  presentOrder,
  readJsonBody,
  requireStaffSession,
  sendJson,
} from '../_lib/orders.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      requireStaffSession(req);
      const rows = await listOrders({
        limit: req.query?.limit,
        updatedAfter: req.query?.updatedAfter,
      });
      return sendJson(res, 200, { orders: rows.map(mapDbRowToOrder) });
    }

    if (req.method === 'POST') {
      const staffSession = getStaffSession(req);
      if (hasAuthorizationHeader(req) && !staffSession) {
        throw new ApiError(401, 'Session équipe invalide ou expirée.', 'STAFF_AUTH_REQUIRED');
      }

      const body = await readJsonBody(req);
      const result = await createOrder(body, staffSession);
      return sendJson(res, result.status, presentOrder(result.row, {
        accessToken: result.accessToken,
        duplicate: result.duplicate,
      }));
    }

    res.setHeader('Allow', 'GET, POST');
    return sendJson(res, 405, { error: 'Méthode non autorisée.' });
  } catch (error) {
    return handleApiError(res, error);
  }
}
