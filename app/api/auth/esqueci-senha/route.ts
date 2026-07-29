import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(request:Request){
 const {email}=await request.json(); const normalized=String(email||'').toLowerCase().trim();
 const user=normalized?await prisma.user.findUnique({where:{email:normalized}}):null;
 if(user){
  await prisma.passwordResetToken.deleteMany({where:{userId:user.id,usedAt:null}});
  const token=randomBytes(32).toString('hex'); const tokenHash=createHash('sha256').update(token).digest('hex');
  await prisma.passwordResetToken.create({data:{userId:user.id,tokenHash,expiresAt:new Date(Date.now()+60*60*1000)}});
  const baseUrl=process.env.NEXT_PUBLIC_APP_URL||new URL(request.url).origin;
  const resetUrl=`${baseUrl}/redefinir-senha?token=${token}`;
  // Integração de e-mail será ligada ao provedor escolhido. Em desenvolvimento, o link fica no log do servidor.
  console.log(`[ForgePets] Link de recuperação para ${normalized}: ${resetUrl}`);
 }
 return NextResponse.json({message:'Se o e-mail estiver cadastrado, você receberá um link válido por 1 hora.'});
}
