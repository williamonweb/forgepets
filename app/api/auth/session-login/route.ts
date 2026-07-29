import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';

function getSecret() {
  const value = process.env.JWT_SECRET || process.env.AUTH_SECRET;

  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET deve possuir pelo menos 32 caracteres.');
  }

  return new TextEncoder().encode(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const remember = body?.remember === true;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Informe e-mail e senha.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    const validPassword = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !user.active || !validPassword) {
      return NextResponse.json(
        { message: 'E-mail ou senha inválidos.' },
        { status: 401 }
      );
    }

    const expiresInSeconds = remember
      ? 60 * 60 * 24 * 30
      : 60 * 60 * 24 * 7;

    const token = await new SignJWT({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      name: user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${expiresInSeconds}s`)
      .sign(getSecret());

    const onboardingCompleted =
      user.company?.onboardingCompleted ?? true;

    const destination =
      user.role === 'MASTER'
        ? '/master'
        : onboardingCompleted
          ? '/app/dashboard'
          : '/app/configuracao-inicial';

    const response = NextResponse.json({
      ok: true,
      role: user.role,
      onboardingCompleted,
      destination
    });

    response.cookies.set('forgepets_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiresInSeconds
    });

    return response;
  } catch (error) {
    console.error('Erro no session-login:', error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível acessar o sistema.'
      },
      { status: 500 }
    );
  }
}
