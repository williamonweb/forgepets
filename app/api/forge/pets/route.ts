import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clean(value: unknown) {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function parseDate(value: unknown) {
  const normalized = String(value ?? '').trim();
  return normalized ? new Date(`${normalized}T12:00:00.000Z`) : null;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
    }

    const pets = await prisma.pet.findMany({
      where: { companyId: session.companyId, active: true },
      include: { tutor: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ pets });
  } catch (error) {
    console.error('Erro ao carregar pets:', error);
    return NextResponse.json({ message: 'Não foi possível carregar os pets.' }, { status: 500 });
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
    const tutorId = String(body.tutorId ?? '').trim();

    if (!name || !tutorId) {
      return NextResponse.json({ message: 'Informe o nome e o tutor.' }, { status: 400 });
    }

    const tutor = await prisma.tutor.findFirst({ where: { id: tutorId, companyId: session.companyId } });
    if (!tutor) return NextResponse.json({ message: 'Tutor inválido.' }, { status: 400 });

    const numericWeight = body.weight === '' || body.weight == null ? null : Number(body.weight);
    if (numericWeight !== null && (!Number.isFinite(numericWeight) || numericWeight < 0)) {
      return NextResponse.json({ message: 'Informe um peso válido.' }, { status: 400 });
    }

    const pet = await prisma.pet.create({
      data: {
        companyId: session.companyId,
        tutorId,
        name,
        species: String(body.species ?? 'Outro'),
        breed: clean(body.breed),
        sex: clean(body.sex),
        size: clean(body.size),
        color: clean(body.color),
        birthDate: parseDate(body.birthDate),
        neutered: body.neutered === true,
        temperament: clean(body.temperament),
        careNotes: clean(body.careNotes),
        weight: numericWeight,
        photoUrl: clean(body.photoUrl),
        carePreferences: body.carePreferences || undefined
      }
    });

    return NextResponse.json({ pet }, { status: 201 });
  } catch (error) {
    console.error('Erro ao salvar pet:', error);
    return NextResponse.json({ message: 'Não foi possível salvar o pet.' }, { status: 500 });
  }
}
