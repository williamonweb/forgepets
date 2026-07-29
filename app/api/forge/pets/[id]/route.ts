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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });

    const exists = await prisma.pet.findFirst({ where: { id: params.id, companyId: session.companyId } });
    if (!exists) return NextResponse.json({ message: 'Pet não encontrado.' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? '').trim();
    if (!name) return NextResponse.json({ message: 'Informe o nome do pet.' }, { status: 400 });

    const tutorId = String(body.tutorId ?? exists.tutorId).trim();
    const tutor = await prisma.tutor.findFirst({ where: { id: tutorId, companyId: session.companyId } });
    if (!tutor) return NextResponse.json({ message: 'Tutor inválido.' }, { status: 400 });

    const numericWeight = body.weight === '' || body.weight == null ? null : Number(body.weight);
    if (numericWeight !== null && (!Number.isFinite(numericWeight) || numericWeight < 0)) {
      return NextResponse.json({ message: 'Informe um peso válido.' }, { status: 400 });
    }

    const pet = await prisma.pet.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json({ pet });
  } catch (error) {
    console.error('Erro ao atualizar pet:', error);
    return NextResponse.json({ message: 'Não foi possível atualizar o pet.' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });

    const exists = await prisma.pet.findFirst({ where: { id: params.id, companyId: session.companyId } });
    if (!exists) return NextResponse.json({ message: 'Pet não encontrado.' }, { status: 404 });

    await prisma.pet.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao excluir pet:', error);
    return NextResponse.json({ message: 'Não foi possível excluir o pet.' }, { status: 500 });
  }
}
