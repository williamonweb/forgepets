import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const remember = body?.remember === true;

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: 'Informe e-mail e senha.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    const passwordMatches = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !user.active || !passwordMatches) {
      return NextResponse.json({ ok: false, message: 'E-mail ou senha inválidos.' }, { status: 401 });
    }

    const secretValue = process.env.JWT_SECRET || process.env.AUTH_SECRET;
    if (!secretValue || secretValue.length < 32) {
      console.error('JWT_SECRET/AUTH_SECRET ausente ou menor que 32 caracteres.');
      return NextResponse.json(
        { ok: false, message: 'A chave de sessão do sistema não está configurada corretamente.' },
        { status: 500 }
      );
    }

    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
    const token = await new SignJWT({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      name: user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${maxAge}s`)
      .sign(new TextEncoder().encode(secretValue));

    const onboardingCompleted = user.company?.onboardingCompleted ?? true;
    const destination = user.role === 'MASTER'
      ? '/master'
      : onboardingCompleted
        ? '/app/dashboard'
        : '/app/configuracao-inicial';

    const response = NextResponse.json({
      ok: true,
      role: user.role,
      onboardingCompleted,
      destination,
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
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge
    });

    return response;
  } catch (error) {
    console.error('Erro no login de sessão:', error);
    return NextResponse.json(
      { ok: false, message: 'Não foi possível acessar o sistema. Verifique a conexão com o banco de dados.' },
      { status: 500 }
    );
  }
}
