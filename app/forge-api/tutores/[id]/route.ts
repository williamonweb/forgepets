// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
function clean(value: unknown) { const v = String(value ?? '').trim(); return v || null; }
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession(); if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  const exists = await prisma.tutor.findFirst({ where: { id: params.id, companyId: session.companyId } });
  if (!exists) return NextResponse.json({ message: 'Tutor não encontrado.' }, { status: 404 });
  const body = await request.json().catch(() => ({})); const name=String(body.name??'').trim(); if(!name)return NextResponse.json({message:'Informe o nome do tutor.'},{status:400});
  const tutor = await prisma.tutor.update({ where: { id: params.id }, data: { name, phone:String(body.phone??'').trim(), email:clean(body.email), document:clean(body.document), notes:clean(body.notes), address:clean(body.address), number:clean(body.number), complement:clean(body.complement), neighborhood:clean(body.neighborhood), city:clean(body.city), state:clean(body.state), zipCode:clean(body.zipCode) } });
  return NextResponse.json({ tutor });
}
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session=await getSession(); if(!session?.companyId)return NextResponse.json({message:'Sessão inválida.'},{status:401});
  const exists=await prisma.tutor.findFirst({where:{id:params.id,companyId:session.companyId}}); if(!exists)return NextResponse.json({message:'Tutor não encontrado.'},{status:404});
  await prisma.tutor.delete({where:{id:params.id}}); return NextResponse.json({ok:true});
}
