import { AppointmentStatus, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BLOCKING_STATUSES: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'IN_SERVICE'];
type AppointmentItemInput = {
  serviceId: string;
  quantity: number;
  unitPrice?: number;
};

type NormalizedAppointmentItem = {
  serviceId: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  total: Prisma.Decimal;
  category: string | null;
  duration: number;
};

const STATUS_MAP: Record<string, AppointmentStatus> = {
  Agendado: 'SCHEDULED',
  Confirmado: 'CONFIRMED',
  'Em atendimento': 'IN_SERVICE',
  'Concluído': 'COMPLETED',
  Cancelado: 'CANCELED',
  'Não compareceu': 'NO_SHOW'
};

function parseLocalDateTime(date: unknown, time: unknown) {
  const value = new Date(`${String(date ?? '')}T${String(time ?? '')}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
    }

    const companyId = session.companyId;
    const current = await prisma.appointment.findFirst({
      where: { id: params.id, companyId },
      include: { items: true }
    });

    if (!current) {
      return NextResponse.json({ message: 'Agendamento não encontrado.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const tutorId = String(body.tutorId ?? current.tutorId);
    const petId = String(body.petId ?? current.petId);
    const hasItems = Array.isArray(body.items) && body.items.length > 0;

    const requestedItems: AppointmentItemInput[] | null = hasItems
      ? body.items.slice(0, 20).map((item: any): AppointmentItemInput => ({
          serviceId: String(item?.serviceId ?? '').trim(),
          quantity: Math.max(1, Math.min(99, Number(item?.quantity || 1))),
          unitPrice: item?.unitPrice === undefined ? undefined : Number(item.unitPrice)
        })).filter((item: AppointmentItemInput) => Boolean(item.serviceId))
      : null;

    const primaryServiceId = requestedItems?.[0]?.serviceId || String(body.serviceId ?? current.serviceId);
    const serviceIds = requestedItems
      ? [...new Set(requestedItems.map((item: AppointmentItemInput) => item.serviceId))]
      : [primaryServiceId];

    const [pet, services] = await Promise.all([
      prisma.pet.findFirst({ where: { id: petId, tutorId, companyId, active: true } }),
      prisma.service.findMany({ where: { id: { in: serviceIds }, companyId, active: true } })
    ]);

    if (!pet || services.length !== serviceIds.length) {
      return NextResponse.json({ message: 'Pet ou serviço inválido.' }, { status: 400 });
    }

    const serviceMap = new Map(services.map((service: (typeof services)[number]) => [service.id, service]));
    const normalizedItems: NormalizedAppointmentItem[] | undefined = requestedItems?.map((item: AppointmentItemInput): NormalizedAppointmentItem => {
      const service = serviceMap.get(item.serviceId)!;
      const customPrice = Number(item.unitPrice);
      const unitPrice = Number.isFinite(customPrice) && customPrice >= 0
        ? new Prisma.Decimal(customPrice)
        : service.price;
      return {
        serviceId: service.id,
        quantity: item.quantity,
        unitPrice,
        total: unitPrice.mul(item.quantity),
        category: service.category || null,
        duration: service.durationMinutes * item.quantity
      };
    });

    const scheduleChanged = Boolean(body.date || body.time || hasItems || body.serviceId);
    const startsAt = body.date || body.time
      ? parseLocalDateTime(body.date, body.time)
      : current.startsAt;

    if (!startsAt) {
      return NextResponse.json({ message: 'Data ou horário inválido.' }, { status: 400 });
    }

    const durationMinutes = normalizedItems
      ? normalizedItems.reduce((sum: number, item: NormalizedAppointmentItem) => sum + item.duration, 0)
      : Math.max(15, Math.round((current.endsAt.getTime() - current.startsAt.getTime()) / 60_000));

    const endsAt = scheduleChanged
      ? new Date(startsAt.getTime() + Math.max(15, durationMinutes) * 60_000)
      : current.endsAt;

    const status = STATUS_MAP[String(body.status)] ?? current.status;

    const appointment = await prisma.$transaction(async tx => {
      if (BLOCKING_STATUSES.includes(status)) {
        const conflict = await tx.appointment.findFirst({
          where: {
            id: { not: current.id },
            companyId,
            petId,
            status: { in: BLOCKING_STATUSES },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt }
          }
        });
        if (conflict) throw new Error('PET_TIME_CONFLICT');
      }

      if (normalizedItems) {
        await tx.appointmentServiceItem.deleteMany({ where: { appointmentId: current.id, companyId } });
        await tx.appointmentServiceItem.createMany({
          data: normalizedItems.map((item: NormalizedAppointmentItem) => ({
            companyId,
            appointmentId: current.id,
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            category: item.category
          }))
        });
      }

      return tx.appointment.update({
        where: { id: current.id },
        data: {
          tutorId,
          petId,
          serviceId: primaryServiceId,
          startsAt,
          endsAt,
          status,
          notes: String(body.notes ?? current.notes ?? '').trim() || null,
          completedAt: status === 'COMPLETED' ? new Date() : current.completedAt
        },
        include: {
          tutor: true,
          pet: true,
          service: true,
          items: { include: { service: true }, orderBy: { createdAt: 'asc' } }
        }
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json({ appointment });
  } catch (error: any) {
    if (error?.message === 'PET_TIME_CONFLICT') {
      return NextResponse.json({ message: 'Este pet já possui outro atendimento neste horário.' }, { status: 409 });
    }
    if (error?.code === 'P2034') {
      return NextResponse.json({ message: 'O atendimento foi alterado por outro usuário. Atualize e tente novamente.' }, { status: 409 });
    }
    console.error('Não foi possível atualizar o agendamento.', error);
    return NextResponse.json({ message: 'Não foi possível atualizar o agendamento.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
  }

  const companyId = session.companyId;
  const current = await prisma.appointment.findFirst({
    where: { id: params.id, companyId },
    include: { receivable: { include: { payments: true } } }
  });

  if (!current) {
    return NextResponse.json({ message: 'Atendimento não encontrado.' }, { status: 404 });
  }

  const permanent = new URL(request.url).searchParams.get('permanent') === '1';

  if (permanent) {
    await prisma.$transaction(async tx => {
      if (current.receivable) {
        await tx.payment.deleteMany({
          where: { receivableId: current.receivable.id, companyId }
        });
        await tx.receivable.delete({
          where: { id: current.receivable.id }
        });
      }

      await tx.appointment.delete({
        where: { id: current.id }
      });

      await tx.auditLog.create({
        data: {
          companyId,
          userId: session.userId,
          action: 'APPOINTMENT_DELETED',
          entity: 'Appointment',
          entityId: current.id,
          metadata: {
            startsAt: current.startsAt.toISOString(),
            status: current.status,
            source: 'USER_DUPLICATE_REMOVAL'
          }
        }
      });
    });

    return NextResponse.json({
      ok: true,
      deleted: true,
      message: 'Atendimento excluído.'
    });
  }

  const appointment = await prisma.appointment.update({
    where: { id: current.id },
    data: { status: 'CANCELED' },
    include: {
      tutor: true,
      pet: true,
      service: true,
      items: { include: { service: true }, orderBy: { createdAt: 'asc' } }
    }
  });

  return NextResponse.json({ appointment });
}
