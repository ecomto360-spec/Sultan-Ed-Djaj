import {
  ApiError,
  handleApiError,
  readJsonBody,
  requireStaffSession,
  sendJson,
} from './_lib/orders.js';
import { safeStorageSegment, uploadDataUrlImage } from './_lib/storage.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, {
        success: false,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Méthode non autorisée.',
      });
    }

    const staffSession = requireStaffSession(req);
    if (staffSession.role !== 'gerant') {
      throw new ApiError(403, 'Seul le gérant peut publier une image produit.', 'FORBIDDEN');
    }

    const body = await readJsonBody(req);
    const productId = safeStorageSegment(body?.productId, 'product');
    const largeImage = body?.largeBase64 || body?.image800 || body?.imageUrl || body?.image;
    const thumbImage = body?.thumbBase64 || body?.image400 || body?.imageThumbUrl || body?.thumb;

    if (!largeImage) {
      throw new ApiError(400, 'Image produit manquante.', 'INVALID_IMAGE');
    }

    const imageUrl = await uploadDataUrlImage(
      largeImage,
      `products/${productId}/800`,
      'image800'
    );
    const imageThumbUrl = thumbImage
      ? await uploadDataUrlImage(thumbImage, `products/${productId}/400`, 'image400')
      : imageUrl;

    return sendJson(res, 200, {
      success: true,
      imageUrl,
      imageThumbUrl,
    });
  } catch (error) {
    return handleApiError(res, error, 'upload');
  }
}
