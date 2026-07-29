import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type AsaasWebhook = {
  id?: string;
  event?: string;
  payment?: {
    id?: string;
    customer?: string;
    subscription?: string;
    externalReference?: string;
    status?: string;
    dueDate?: string;
  };
  subscription?: {
    id?: string;
    customer?: string;
    externalReference?: string;
    status?: string;
    nextDueDate?: string;
  };
};

export async function POST(request: NextRequest) {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const receivedToken = request.headers.get('asaas-access-token') || request.headers.get('auth-token');
  if (!configuredToken || receivedToken !== configuredToken) {
    return NextResponse.json({ message: 'Webhook não autorizado.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null) as AsaasWebhook | null;
  if (!payload?.id || !payload.event) return NextResponse.json({ message: 'Evento inválido.' }, { status: 400 });

  const alreadyProcessed = await prisma.asaasWebhookEvent.findUnique({ where: { eventId: payload.id } });
  if (alreadyProcessed) return NextResponse.json({ ok: true, duplicate: true });

  const subscriptionId = payload.payment?.subscription || payload.subscription?.id;
  const companyReference = payload.payment?.externalReference || payload.subscription?.externalReference;
  const customerId = payload.payment?.customer || payload.subscription?.customer;

  const company = companyReference
    ? await prisma.company.findUnique({ where: { id: companyReference } }).catch(() => null)
    : subscriptionId
      ? await prisma.company.findFirst({ where: { asaasSubscriptionId: subscriptionId } })
      : customerId
        ? await prisma.company.findFirst({ where: { asaasCustomerId: customerId } })
        : null;

  await prisma.$transaction(async tx => {
    await tx.asaasWebhookEvent.create({
      data: { eventId: payload.id!, eventType: payload.event!, companyId: company?.id, payload: payload as any }
    });

    if (!company) return;

    const paidEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
    const overdueEvents = ['PAYMENT_OVERDUE', 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'];
    const canceledEvents = ['PAYMENT_DELETED', 'PAYMENT_REFUNDED', 'SUBSCRIPTION_DELETED', 'SUBSCRIPTION_INACTIVATED'];

    let status: SubscriptionStatus | undefined;
    if (paidEvents.includes(payload.event!)) status = SubscriptionStatus.ACTIVE;
    if (overdueEvents.includes(payload.event!)) status = SubscriptionStatus.OVERDUE;
    if (canceledEvents.includes(payload.event!)) status = SubscriptionStatus.CANCELED;

    const nextDate = payload.subscription?.nextDueDate || payload.payment?.dueDate;
    if (status || nextDate) {
      const activatePendingPlan = status === SubscriptionStatus.ACTIVE && company.pendingPlan;
      await tx.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: status,
          plan: activatePendingPlan ? company.pendingPlan! : undefined,
          pendingPlan: activatePendingPlan ? null : undefined,
          pendingPlanRequestedAt: activatePendingPlan ? null : undefined,
          nextBillingDate: nextDate ? new Date(`${nextDate}T12:00:00Z`) : undefined
        }
      });
    }

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        action: `ASAAS_${payload.event}`,
        entity: 'Subscription',
        entityId: subscriptionId || payload.payment?.id,
        metadata: { eventId: payload.id }
      }
    });
  });

  return NextResponse.json({ ok: true });
}
