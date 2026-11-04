import {
  ApiError,
  createSupabaseJwt,
  handleApiError,
  requireStaffSession,
  sendJson,
} from '../_lib/orders.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, { error: 'Méthode non autorisée.' });
    }

    const session = requireStaffSession(req);
    const realtime = createSupabaseJwt({
      appRole: session.role,
      expiresInSeconds: 3600,
    });

    if (!realtime) {
      throw new ApiError(
        503,
        'Realtime non configuré. Vérifiez SUPABASE_JWT_SECRET.',
        'REALTIME_NOT_CONFIGURED'
      );
    }

    return sendJson(res, 200, {
      supabaseToken: realtime.token,
      supabaseExpiresAt: realtime.expiresAt,
      role: session.role,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
}
