const bcrypt = require('bcryptjs');
const { prisma } = require('../_lib/prisma');
const { json, methodNotAllowed } = require('../_lib/http');
const { createToken } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return json(res, 400, { ok: false, error: 'EMAIL_PASSWORD_REQUIRED' });

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: { tenant: true },
    });
    if (!user || !user.active || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return json(res, 401, { ok: false, error: 'INVALID_CREDENTIALS' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const token = createToken(user);
    return json(res, 200, {
      ok: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
      tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug, status: user.tenant.status } : null,
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok: false, error: 'LOGIN_FAILED' });
  }
};
