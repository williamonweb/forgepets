import { AppointmentStatus, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BLOCKING_STATUSES: AppointmentStatus[] = ['SCHEDULED', 'CONFIRMED', 'IN_SERVICE'];

type RequestedItem = {
  serviceId: string;
  quantity: number;
  unitPrice?: number;
};

function parseLocalDateTime(date: unknown, time: unknown) {
  const day = String(date ?? '').trim();
  const hour = String(time ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(hour)) return null;
  const value = new Date(`${day}T${hour}:00-03:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function normalizeItems(body: any): RequestedItem[] {
  const source = Array.isArray(body.items) && body.items.length
    ? body.items
    : [{ serviceId: body.serviceId, quantity: 1 }];

  return source
    .slice(0, 20)
    .map((item: any) => ({
      serviceId: String(item?.serviceId ?? '').trim(),
      quantity: Math.max(1, Math.min(99, Number(item?.quantity || 1))),
      unitPrice: item?.unitPrice === undefined ? undefined : Number(item.unitPrice)
    }))
    .filter((item: RequestedItem) => item.serviceId);
}

async function validateRelations(
  companyId: string,
  tutorId: string,
  petId: string,
  requestedItems: RequestedItem[]
) {
  const serviceIds = [...new Set(requestedItems.map((item: RequestedItem) => item.serviceId))];
  const [tutor, pet, services] = await Promise.all([
    prisma.tutor.findFirst({ where: { id: tutorId, companyId } }),
    prisma.pet.findFirst({ where: { id: petId, companyId, tutorId, active: true } }),
    prisma.service.findMany({ where: { id: { in: serviceIds }, companyId, active: true } })
  ]);

  if (!tutor) throw new Error('TUTOR_NOT_FOUND');
  if (!pet) throw new Error('PET_NOT_FOUND');
  if (services.length !== serviceIds.length) throw new Error('SERVICE_NOT_FOUND');

  const serviceMap = new Map(services.map((service: (typeof services)[number]) => [service.id, service]));
  return requestedItems.map((item: RequestedItem) => {
    const service = serviceMap.get(item.serviceId)!;
    const customPrice = Number(item.unitPrice);
    const unitPrice = Number.isFinite(customPrice) && customPrice >= 0
      ? new Prisma.Decimal(customPrice)
      : service.price;

    return {
      service,
      serviceId: service.id,
      quantity: item.quantity,
      unitPrice,
      total: unitPrice.mul(item.quantity),
      category: service.category || null
    };
  });
}

async function createWithConflictProtection(
  companyId: string,
  data: {
    tutorId: string;
    petId: string;
    serviceId: string;
    startsAt: Date;
    endsAt: Date;
    notes: string | null;
    items: Array<{
      serviceId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      total: Prisma.Decimal;
      category: string | null;
    }>;
  }
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async tx => {
        const conflict = await tx.appointment.findFirst({
          where: {
            companyId,
            petId: data.petId,
            status: { in: BLOCKING_STATUSES },
            startsAt: { lt: data.endsAt },
            endsAt: { gt: data.startsAt }
          },
          select: { id: true }
        });
        if (conflict) throw new Error('PET_TIME_CONFLICT');

        return tx.appointment.create({
          data: {
            companyId,
            tutorId: data.tutorId,
            petId: data.petId,
            serviceId: data.serviceId,
            startsAt: data.startsAt,
            endsAt: data.endsAt,
            notes: data.notes,
            items: {
              create: data.items.map((item: (typeof data.items)[number]) => ({
                companyId,
                serviceId: item.serviceId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                category: item.category
              }))
            }
          },
          include: {
            tutor: true,
            pet: true,
            service: true,
            items: { include: { service: true }, orderBy: { createdAt: 'asc' } }
          }
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.message === 'PET_TIME_CONFLICT') throw error;
      if (error?.code === 'P2034' && attempt < 2) continue;
      throw error;
    }
  }
  throw new Error('PET_TIME_CONFLICT');
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
  }

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
    include: {
      tutor: true,
      pet: true,
      service: true,
      items: { include: { service: true }, orderBy: { createdAt: 'asc' } }
    },
    orderBy: { startsAt: 'asc' }
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const tutorId = String(body.tutorId ?? '').trim();
    const petId = String(body.petId ?? '').trim();
    const requestedItems = normalizeItems(body);

    if (!tutorId || !petId || !requestedItems.length) {
      return NextResponse.json({ message: 'Informe tutor, pet e pelo menos um serviço.' }, { status: 400 });
    }

    const startsAt = parseLocalDateTime(body.date, body.time);
    if (!startsAt) {
      return NextResponse.json({ message: 'Informe uma data e um horário válidos.' }, { status: 400 });
    }

    const validatedItems = await validateRelations(
      session.companyId,
      tutorId,
      petId,
      requestedItems
    );

    const durationMinutes = validatedItems.reduce(
      (sum: number, item: (typeof validatedItems)[number]) => sum + item.service.durationMinutes * item.quantity,
      0
    );
    const endsAt = new Date(startsAt.getTime() + Math.max(15, durationMinutes) * 60_000);

    const appointment = await createWithConflictProtection(session.companyId, {
      tutorId,
      petId,
      serviceId: validatedItems[0].serviceId,
      startsAt,
      endsAt,
      notes: String(body.notes ?? '').trim() || null,
      items: validatedItems.map((item: (typeof validatedItems)[number]) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        category: item.category
      }))
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: any) {
    if (error?.message === 'PET_TIME_CONFLICT') {
      return NextResponse.json({ message: 'Este pet já possui outro atendimento neste horário. Escolha outro horário para ele.' }, { status: 409 });
    }
    if (error?.message === 'TUTOR_NOT_FOUND') {
      return NextResponse.json({ message: 'Tutor não encontrado nesta empresa.' }, { status: 400 });
    }
    if (error?.message === 'PET_NOT_FOUND') {
      return NextResponse.json({ message: 'Pet inválido ou não pertence ao tutor selecionado.' }, { status: 400 });
    }
    if (error?.message === 'SERVICE_NOT_FOUND') {
      return NextResponse.json({ message: 'Um dos serviços não foi encontrado ou está inativo.' }, { status: 400 });
    }
    console.error('Não foi possível criar o agendamento.', error);
    return NextResponse.json({ message: 'Não foi possível criar o agendamento.' }, { status: 500 });
  }
}
