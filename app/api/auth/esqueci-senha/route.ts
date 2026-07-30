import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email/resend';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const normalized = String(email || '').toLowerCase().trim();
    const user = normalized
      ? await prisma.user.findUnique({ where: { email: normalized } })
      : null;

    if (user) {
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null }
      });

      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        }
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`;

      try {
        await sendPasswordResetEmail({ to: normalized, resetUrl });
      } catch (emailError) {
        console.error(
          '[ForgePets] Falha no envio do e-mail de recuperação:',
          emailError instanceof Error ? emailError.message : emailError
        );
        return NextResponse.json(
          { message: 'Não foi possível enviar o e-mail agora. Verifique a configuração do Resend e tente novamente.' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      message: 'Se o e-mail estiver cadastrado, você receberá um link válido por 1 hora.'
    });
  } catch (error) {
    console.error(
      '[ForgePets] Erro na recuperação de senha:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { message: 'Não foi possível processar a recuperação de senha.' },
      { status: 500 }
    );
  }
}
