import {
  ApiError,
  fetchOrderRowById,
  getOrderAccessTokenFromRequest,
  getStaffSession,
  handleApiError,
  presentOrder,
  readJsonBody,
  requireStaffSession,
  sendJson,
  updateOrder,
  verifyOrderAccessToken,
} from '../_lib/orders.js';

export default async function handler(req, res) {
  try {
    const id = req.query?.id;

    if (req.method === 'GET') {
      const row = await fetchOrderRowById(id);
      const staffSession = getStaffSession(req);
      const accessToken = getOrderAccessTokenFromRequest(req);

      if (!staffSession && !verifyOrderAccessToken(accessToken, row.access_token_hash)) {
        throw new ApiError(403, 'Accès à cette commande refusé.', 'ORDER_ACCESS_DENIED');
      }

      return sendJson(res, 200, presentOrder(row, {
        accessToken: staffSession ? undefined : accessToken,
      }));
    }

    if (req.method === 'PATCH') {
      requireStaffSession(req);
      const body = await readJsonBody(req);
      const row = await updateOrder(id, body);
      return sendJson(res, 200, presentOrder(row));
    }

    res.setHeader('Allow', 'GET, PATCH');
    return sendJson(res, 405, { error: 'Méthode non autorisée.' });
  } catch (error) {
    return handleApiError(res, error);
  }
}
