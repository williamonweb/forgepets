import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';

function getSecret() {
  const value =
    process.env.JWT_SECRET ||
    process.env.AUTH_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      'JWT_SECRET ausente ou com menos de 32 caracteres.'
    );
  }

  return new TextEncoder().encode(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || '')
      .trim()
      .toLowerCase();
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

    const maxAge = remember
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
      .setExpirationTime(`${maxAge}s`)
      .sign(getSecret());

    const response = NextResponse.json({
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

    response.cookies.set('forgepets_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge
    });

    return response;
  } catch (error) {
    console.error('Erro no login Next:', error);

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
