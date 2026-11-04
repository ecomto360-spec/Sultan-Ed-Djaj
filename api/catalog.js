import {
  handleApiError,
  readJsonBody,
  requireStaffSession,
  sendJson,
} from './_lib/orders.js';
import {
  getCatalogStateRow,
  presentCatalog,
  saveCatalogState,
} from './_lib/catalogState.js';

function requestedVersion(req) {
  const raw = req.query?.version;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const version = Number(value);
  return Number.isInteger(version) && version > 0 ? version : null;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const row = await getCatalogStateRow();
      const knownVersion = requestedVersion(req);
      const omitData = knownVersion !== null && knownVersion === Number(row.version);
      return sendJson(res, 200, {
        success: true,
        catalog: presentCatalog(row, { omitData }),
      });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const staffSession = requireStaffSession(req);
      const body = await readJsonBody(req);
      const saved = await saveCatalogState(body, staffSession);
      return sendJson(res, 200, {
        success: true,
        catalog: presentCatalog(saved),
      });
    }

    res.setHeader('Allow', 'GET, PUT, POST');
    return sendJson(res, 405, {
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      error: 'Méthode non autorisée.',
    });
  } catch (error) {
    return handleApiError(res, error, 'catalog');
  }
}
