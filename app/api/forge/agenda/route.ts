import { AppointmentStatus, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BLOCKING_STATUSES: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'IN_SERVICE'];

function parseLocalDateTime(date: unknown, time: unknown) {
  const day = String(date ?? '').trim();
  const hour = String(time ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(hour)) return null;
  const value = new Date(`${day}T${hour}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

async function validateRelations(companyId: string, tutorId: string, petId: string, serviceId: string) {
  const [tutor, pet, service] = await Promise.all([
    prisma.tutor.findFirst({ where: { id: tutorId, companyId } }),
    prisma.pet.findFirst({ where: { id: petId, companyId, tutorId, active: true } }),
    prisma.service.findFirst({ where: { id: serviceId, companyId, active: true } })
  ]);
  if (!tutor) throw new Error('TUTOR_NOT_FOUND');
  if (!pet) throw new Error('PET_NOT_FOUND');
  if (!service) throw new Error('SERVICE_NOT_FOUND');
  return service;
}

async function createWithConflictProtection(companyId: string, data: {
  tutorId: string; petId: string; serviceId: string; startsAt: Date; endsAt: Date; notes: string | null;
}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        const conflict = await tx.appointment.findFirst({
          where: {
            companyId,
            status: { in: BLOCKING_STATUSES },
            startsAt: { lt: data.endsAt },
            endsAt: { gt: data.startsAt }
          },
          select: { id: true }
        });
        if (conflict) throw new Error('TIME_CONFLICT');
        return tx.appointment.create({
          data: { companyId, ...data },
          include: { tutor: true, pet: true, service: true }
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.message === 'TIME_CONFLICT') throw error;
      if (error?.code === 'P2034' && attempt < 2) continue;
      throw error;
    }
  }
  throw new Error('TIME_CONFLICT');
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const where: Prisma.AppointmentWhereInput = { companyId: session.companyId };
  if (from || to) {
    where.startsAt = {};
    if (from) where.startsAt.gte = new Date(`${from}T00:00:00-03:00`);
    if (to) where.startsAt.lte = new Date(`${to}T23:59:59-03:00`);
  }
  const appointments = await prisma.appointment.findMany({
    where,
    include: { tutor: true, pet: true, service: true },
    orderBy: { startsAt: 'asc' }
  });
  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const tutorId = String(body.tutorId ?? '').trim();
    const petId = String(body.petId ?? '').trim();
    const serviceId = String(body.serviceId ?? '').trim();
    if (!tutorId || !petId || !serviceId) return NextResponse.json({ message: 'Informe tutor, pet e serviço.' }, { status: 400 });
    const startsAt = parseLocalDateTime(body.date, body.time);
    if (!startsAt) return NextResponse.json({ message: 'Informe uma data e um horário válidos.' }, { status: 400 });
    const service = await validateRelations(session.companyId, tutorId, petId, serviceId);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    const appointment = await createWithConflictProtection(session.companyId, {
      tutorId, petId, serviceId, startsAt, endsAt, notes: String(body.notes ?? '').trim() || null
    });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'TIME_CONFLICT') return NextResponse.json({ message: 'Este horário acabou de ser ocupado. Escolha outro.' }, { status: 409 });
    if (error?.message === 'TUTOR_NOT_FOUND') return NextResponse.json({ message: 'Tutor não encontrado nesta empresa.' }, { status: 400 });
    if (error?.message === 'PET_NOT_FOUND') return NextResponse.json({ message: 'Pet inválido ou não pertence ao tutor selecionado.' }, { status: 400 });
    if (error?.message === 'SERVICE_NOT_FOUND') return NextResponse.json({ message: 'Serviço não encontrado ou inativo.' }, { status: 400 });
    console.error('Não foi possível criar o agendamento.', error);
    return NextResponse.json({ message: 'Não foi possível criar o agendamento.' }, { status: 500 });
  }
}
