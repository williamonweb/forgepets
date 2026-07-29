const { prisma } = require('../_lib/prisma');
const { json, methodNotAllowed } = require('../_lib/http');
const { requireAuth } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  try {
    const auth = requireAuth(req);
    if (!auth.tenantId) return json(res, 403, { ok: false, error: 'TENANT_REQUIRED' });
    const namespace = String((req.query && req.query.namespace) || 'main').slice(0, 50);

    if (req.method === 'GET') {
      const snapshot = await prisma.tenantSnapshot.findUnique({
        where: { tenantId_namespace: { tenantId: auth.tenantId, namespace } },
      });
      return json(res, 200, { ok: true, snapshot: snapshot ? { payload: snapshot.payload, version: snapshot.version, updatedAt: snapshot.updatedAt } : null });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const payload = req.body && req.body.payload;
      if (!payload || typeof payload !== 'object') return json(res, 400, { ok: false, error: 'PAYLOAD_REQUIRED' });
      const snapshot = await prisma.tenantSnapshot.upsert({
        where: { tenantId_namespace: { tenantId: auth.tenantId, namespace } },
        create: { tenantId: auth.tenantId, namespace, payload, version: 1 },
        update: { payload, version: { increment: 1 } },
      });
      return json(res, 200, { ok: true, version: snapshot.version, updatedAt: snapshot.updatedAt });
    }

    return methodNotAllowed(res, ['GET', 'PUT', 'POST']);
  } catch (error) {
    console.error(error);
    return json(res, error.statusCode || 500, { ok: false, error: error.statusCode ? 'UNAUTHORIZED' : 'SNAPSHOT_FAILED' });
  }
};
