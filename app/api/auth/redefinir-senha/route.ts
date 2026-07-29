import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request:Request){
 const {token,password}=await request.json(); if(!token||String(password||'').length<8) return NextResponse.json({message:'Link inválido ou senha muito curta.'},{status:400});
 const tokenHash=createHash('sha256').update(String(token)).digest('hex');
 const record=await prisma.passwordResetToken.findUnique({where:{tokenHash}});
 if(!record||record.usedAt||record.expiresAt<new Date()) return NextResponse.json({message:'Este link é inválido ou expirou.'},{status:400});
 const passwordHash=await bcrypt.hash(String(password),12);
 await prisma.$transaction([prisma.user.update({where:{id:record.userId},data:{passwordHash}}),prisma.passwordResetToken.update({where:{id:record.id},data:{usedAt:new Date()}})]);
 return NextResponse.json({message:'Senha alterada com sucesso.'});
}
