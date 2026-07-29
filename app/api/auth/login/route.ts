import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email;
    const password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Informe e-mail e senha.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      include: { company: true }
    });

    const validPassword = user
      ? await bcrypt.compare(String(password), user.passwordHash)
      : false;

    if (!user || !user.active || !validPassword) {
      return NextResponse.json(
        { message: 'E-mail ou senha inválidos.' },
        { status: 401 }
      );
    }

    await createSession({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      name: user.name
    });

    return NextResponse.json({
      ok: true,
      role: user.role,
      onboardingCompleted: user.company?.onboardingCompleted ?? true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);

    return NextResponse.json(
      {
        message: 'Não foi possível acessar o sistema. Verifique a conexão com o banco de dados.'
      },
      { status: 500 }
    );
  }
}
