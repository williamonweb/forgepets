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
      include: { company: true },
    });
    if (!user || !user.active || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return json(res, 401, { ok: false, error: 'INVALID_CREDENTIALS' });
    }

        const token = createToken(user);
    return json(res, 200, {
      ok: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId, tenantId: user.companyId },
      company: user.company ? { id: user.company.id, name: user.company.tradeName || user.company.name, legalName: user.company.name, plan: user.company.plan, status: user.company.subscriptionStatus } : null,
      tenant: user.company ? { id: user.company.id, name: user.company.tradeName || user.company.name, slug: user.company.slug || null, status: user.company.subscriptionStatus || null } : null,
    });
  } catch (error) {
    console.error(error);
    return json(res, 500, { ok: false, error: 'LOGIN_FAILED' });
  }
};
