const { prisma } = require('./_lib/prisma');
const { json, methodNotAllowed } = require('./_lib/http');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json(res, 200, { ok: true, service: 'forgepets-api', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return json(res, 503, { ok: false, service: 'forgepets-api', database: 'disconnected' });
  }
};
