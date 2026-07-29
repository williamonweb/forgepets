const jwt = require('jsonwebtoken');

function secret() {
  const value = process.env.JWT_SECRET || process.env.AUTH_SECRET;

  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET ausente ou com menos de 32 caracteres.');
  }

  return value;
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId || null,
      role: user.role,
      name: user.name
    },
    secret(),
    {
      algorithm: 'HS256',
      expiresIn: '7d'
    }
  );
}

function bearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function requireAuth(req) {
  const token = bearer(req);

  if (!token) {
    throw Object.assign(new Error('Token ausente.'), { statusCode: 401 });
  }

  try {
    return jwt.verify(token, secret(), { algorithms: ['HS256'] });
  } catch {
    throw Object.assign(
      new Error('Token inválido ou expirado.'),
      { statusCode: 401 }
    );
  }
}

module.exports = { createToken, requireAuth };
