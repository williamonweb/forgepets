import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Plan } from '@prisma/client';
import { createSession } from '@/lib/auth';

const allowedPlans = new Set(['ESSENCIAL','PROFISSIONAL','PREMIUM']);
export async function POST(request:Request){
 try{
  const body=await request.json();
  const ownerName=String(body.ownerName||'').trim(); const companyName=String(body.companyName||'').trim(); const email=String(body.email||'').toLowerCase().trim(); const phone=String(body.phone||'').trim(); const password=String(body.password||''); const plan: Plan=allowedPlans.has(body.plan)?body.plan as Plan:Plan.PROFISSIONAL;
  if(!ownerName||!companyName||!email||!phone||password.length<8) return NextResponse.json({message:'Preencha todos os campos e use uma senha de pelo menos 8 caracteres.'},{status:400});
  const settings=await prisma.saaSSettings.upsert({where:{id:'global'},update:{},create:{id:'global'}});
  if(!settings.publicSignupEnabled) return NextResponse.json({message:'Novos cadastros estão temporariamente desativados.'},{status:403});
  if(await prisma.user.findUnique({where:{email}})) return NextResponse.json({message:'Já existe uma conta com este e-mail.'},{status:409});
  const trialEndsAt=new Date(Date.now()+settings.trialDays*86400000);
  const passwordHash=await bcrypt.hash(password,12);
  const result=await prisma.$transaction(async tx=>{
   const company=await tx.company.create({data:{name:companyName,tradeName:companyName,email,phone,plan,subscriptionStatus:'TRIAL',trialEndsAt}});
   const user=await tx.user.create({data:{companyId:company.id,name:ownerName,email,passwordHash,role:'OWNER'}});
   await tx.planHistory.create({data:{companyId:company.id,newPlan:plan}});
   await tx.auditLog.create({data:{companyId:company.id,userId:user.id,action:'PUBLIC_SIGNUP',entity:'Company',entityId:company.id}});
   return {company,user};
  });
  await createSession({userId:result.user.id,companyId:result.company.id,role:result.user.role,name:result.user.name});
  return NextResponse.json({ok:true});
 }catch(error){console.error(error);return NextResponse.json({message:'Não foi possível criar a conta agora.'},{status:500});}
}
