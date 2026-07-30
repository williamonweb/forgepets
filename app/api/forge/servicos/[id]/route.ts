import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
  }

  const current = await prisma.service.findFirst({
    where: { id: params.id, companyId: session.companyId, active: true }
  });
  if (!current) {
    return NextResponse.json({ message: 'Serviço não encontrado.' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? current.name).trim();
  const price = Number(body.price ?? current.price);
  const durationMinutes = Math.max(
    15,
    Math.min(720, Number(body.durationMinutes ?? current.durationMinutes) || current.durationMinutes)
  );

  if (!name) {
    return NextResponse.json({ message: 'Informe o nome do serviço.' }, { status: 400 });
  }
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ message: 'Informe um valor válido.' }, { status: 400 });
  }

  const service = await prisma.service.update({
    where: { id: current.id },
    data: {
      name,
      category: body.category === undefined ? current.category : clean(body.category),
      price,
      durationMinutes,
      generatesPoints: body.generatesPoints === undefined ? current.generatesPoints : Boolean(body.generatesPoints),
      generatesCashback: body.generatesCashback === undefined ? current.generatesCashback : Boolean(body.generatesCashback)
    }
  });

  return NextResponse.json({ service });
}
