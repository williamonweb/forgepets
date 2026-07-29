const jwt = require('jsonwebtoken');

function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET ausente ou muito curta.');
  }
  return process.env.JWT_SECRET;
}

function createToken(user) {
  return jwt.sign(
    { sub: user.id, tenantId: user.tenantId || null, role: user.role, email: user.email },
    secret(),
    { expiresIn: '12h', issuer: 'forgepets' }
  );
}

function bearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function requireAuth(req) {
  const token = bearer(req);
  if (!token) throw Object.assign(new Error('Token ausente.'), { statusCode: 401 });
  try {
    return jwt.verify(token, secret(), { issuer: 'forgepets' });
  } catch {
    throw Object.assign(new Error('Token invalido ou expirado.'), { statusCode: 401 });
  }
}

module.exports = { createToken, requireAuth };
