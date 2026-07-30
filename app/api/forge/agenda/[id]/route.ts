import { AppointmentStatus, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BLOCKING_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.SCHEDULED,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.IN_SERVICE
];

const STATUS_MAP: Record<string, AppointmentStatus> = {
  Agendado: AppointmentStatus.SCHEDULED,
  Confirmado: AppointmentStatus.CONFIRMED,
  'Em atendimento': AppointmentStatus.IN_SERVICE,
  'Concluído': AppointmentStatus.COMPLETED,
  Cancelado: AppointmentStatus.CANCELED,
  'Não compareceu': AppointmentStatus.NO_SHOW
};

function parseLocalDateTime(date: unknown, time: unknown) {
  const value = new Date(`${String(date ?? '')}T${String(time ?? '')}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const companyId = session?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { message: 'Sessão inválida. Entre novamente.' },
        { status: 401 }
      );
    }

    const current = await prisma.appointment.findFirst({
      where: { id: params.id, companyId }
    });

    if (!current) {
      return NextResponse.json(
        { message: 'Agendamento não encontrado.' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const tutorId = String(body.tutorId ?? current.tutorId);
    const petId = String(body.petId ?? current.petId);
    const serviceId = String(body.serviceId ?? current.serviceId);

    const service = await prisma.service.findFirst({
      where: { id: serviceId, companyId, active: true }
    });

    const pet = await prisma.pet.findFirst({
      where: { id: petId, tutorId, companyId, active: true }
    });

    if (!service || !pet) {
      return NextResponse.json(
        { message: 'Pet ou serviço inválido.' },
        { status: 400 }
      );
    }

    const startsAt =
      body.date || body.time
        ? parseLocalDateTime(body.date, body.time)
        : current.startsAt;

    if (!startsAt) {
      return NextResponse.json(
        { message: 'Data ou horário inválido.' },
        { status: 400 }
      );
    }

    const endsAt = new Date(
      startsAt.getTime() + service.durationMinutes * 60_000
    );
    const status = STATUS_MAP[String(body.status)] ?? current.status;

    const appointment = await prisma.$transaction(
      async (tx) => {
        if (BLOCKING_STATUSES.includes(status)) {
          const conflict = await tx.appointment.findFirst({
            where: {
              id: { not: current.id },
              companyId,
              status: { in: BLOCKING_STATUSES },
              startsAt: { lt: endsAt },
              endsAt: { gt: startsAt }
            }
          });

          if (conflict) throw new Error('TIME_CONFLICT');
        }

        return tx.appointment.update({
          where: { id: current.id },
          data: {
            tutorId,
            petId,
            serviceId,
            startsAt,
            endsAt,
            status,
            notes:
              String(body.notes ?? current.notes ?? '').trim() || null,
            completedAt:
              status === AppointmentStatus.COMPLETED
                ? new Date()
                : current.completedAt
          },
          include: { tutor: true, pet: true, service: true }
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json({ appointment });
  } catch (error: any) {
    if (error?.message === 'TIME_CONFLICT' || error?.code === 'P2034') {
      return NextResponse.json(
        { message: 'Este horário já está ocupado.' },
        { status: 409 }
      );
    }

    console.error('Não foi possível atualizar o agendamento.', error);
    return NextResponse.json(
      { message: 'Não foi possível atualizar o agendamento.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  const companyId = session?.companyId;

  if (!companyId) {
    return NextResponse.json(
      { message: 'Sessão inválida. Entre novamente.' },
      { status: 401 }
    );
  }

  const current = await prisma.appointment.findFirst({
    where: { id: params.id, companyId }
  });

  if (!current) {
    return NextResponse.json(
      { message: 'Agendamento não encontrado.' },
      { status: 404 }
    );
  }

  const appointment = await prisma.appointment.update({
    where: { id: current.id },
    data: { status: AppointmentStatus.CANCELED },
    include: { tutor: true, pet: true, service: true }
  });

  return NextResponse.json({ appointment });
}
