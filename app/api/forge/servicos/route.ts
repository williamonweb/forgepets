import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

export async function GET() {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
  const services = await prisma.service.findMany({ where: { companyId: session.companyId, active: true }, orderBy: { name: 'asc' } });
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? '').trim();
  const price = Number(body.price ?? 0);
  const durationMinutes = Math.max(15, Math.min(720, Number(body.durationMinutes ?? 60) || 60));
  if (!name) return NextResponse.json({ message: 'Informe o nome do serviço.' }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ message: 'Informe um valor válido.' }, { status: 400 });

  const service = await prisma.service.create({
    data: {
      companyId: session.companyId,
      name,
      category: clean(body.category),
      price,
      durationMinutes,
      generatesPoints: Boolean(body.generatesPoints),
      generatesCashback: Boolean(body.generatesCashback)
    }
  });
  return NextResponse.json({ service }, { status: 201 });
}
