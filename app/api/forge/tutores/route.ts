import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function errorResponse(error: unknown, fallback: string) {
  console.error(fallback, error);
  return NextResponse.json({ message: fallback }, { status: 500 });
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
    }

    const tutors = await prisma.tutor.findMany({
      where: { companyId: session.companyId },
      include: {
        pets: {
          where: { active: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ tutors });
  } catch (error) {
    return errorResponse(error, 'Não foi possível carregar os tutores.');
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').trim();

    if (!name) {
      return NextResponse.json({ message: 'Informe o nome do tutor.' }, { status: 400 });
    }

    const tutor = await prisma.tutor.create({
      data: {
        companyId: session.companyId,
        name,
        phone,
        email: clean(body.email),
        document: clean(body.document),
        notes: clean(body.notes),
        address: clean(body.address),
        number: clean(body.number),
        complement: clean(body.complement),
        neighborhood: clean(body.neighborhood),
        city: clean(body.city),
        state: clean(body.state),
        zipCode: clean(body.zipCode)
      }
    });

    return NextResponse.json({ tutor }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Não foi possível salvar o tutor.');
  }
}
