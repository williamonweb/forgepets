import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request:Request){
 const session=await getSession(); if(!session?.companyId) return NextResponse.json({message:'Sessão inválida.'},{status:401});
 const body=await request.json();
 await prisma.company.update({where:{id:session.companyId},data:{tradeName:String(body.tradeName||'').trim()||undefined,phone:String(body.phone||'').trim()||undefined,onboardingCompleted:true}});
 const services=Array.isArray(body.services)?body.services.filter(Boolean):[];
 for(const name of services) await prisma.service.upsert({where:{id:`seed-${session.companyId}-${String(name).toLowerCase().replace(/\W/g,'')}`},update:{},create:{id:`seed-${session.companyId}-${String(name).toLowerCase().replace(/\W/g,'')}`,companyId:session.companyId,name:String(name),price:0,durationMinutes:60}}).catch(()=>null);
 return NextResponse.json({ok:true});
}
