const bcrypt = require('bcryptjs');
const { prisma } = require('../_lib/prisma');
const { json, methodNotAllowed } = require('../_lib/http');
const { createToken } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, ['POST']);
  }

  try {
    const { email, password, remember } = req.body || {};

    if (!email || !password) {
      return json(res, 400, {
        ok: false,
        message: 'Informe e-mail e senha.'
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: String(email).trim().toLowerCase()
      },
      include: {
        company: true
      }
    });

    const validPassword = user
      ? await bcrypt.compare(String(password), user.passwordHash)
      : false;

    if (!user || !user.active || !validPassword) {
      return json(res, 401, {
        ok: false,
        message: 'E-mail ou senha inválidos.'
      });
    }

    const token = createToken(user);
    const maxAge = remember
      ? 60 * 60 * 24 * 30
      : 60 * 60 * 24 * 7;

    const secure =
      process.env.NODE_ENV === 'production'
        ? '; Secure'
        : '';

    res.setHeader(
      'Set-Cookie',
      `forgepets_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`
    );

    return json(res, 200, {
      ok: true,
      role: user.role,
      onboardingCompleted:
        user.company?.onboardingCompleted ?? true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error('Erro no login legado:', error);

    return json(res, 500, {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : 'Não foi possível acessar o sistema.'
    });
  }
};
