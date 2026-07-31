import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { asaasRequest } from '@/lib/asaas/client';

export const runtime = 'nodejs';

type PaymentDetails = {
  id?: string;
  customer?: string;
  subscription?: string;
  externalReference?: string;
  status?: string;
  dueDate?: string;
  billingType?: string;
};

type AsaasWebhook = {
  id?: string;
  event?: string;
  payment?: PaymentDetails;
  subscription?: {
    id?: string;
    customer?: string;
    externalReference?: string;
    status?: string;
    nextDueDate?: string;
  };
};

async function hydratePayment(payment?: PaymentDetails) {
  if (!payment?.id) return payment || null;
  const hasIdentity = payment.subscription || payment.externalReference || payment.customer;
  if (hasIdentity) return payment;
  try {
    return await asaasRequest<PaymentDetails>(`/payments/${payment.id}`);
  } catch (error) {
    console.warn('[ForgePets] Não foi possível consultar a cobrança do webhook:', error instanceof Error ? error.message : error);
    return payment;
  }
}

export async function POST(request: NextRequest) {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const receivedToken = request.headers.get('asaas-access-token') || request.headers.get('auth-token');
  if (!configuredToken || receivedToken !== configuredToken) {
    return NextResponse.json({ message: 'Webhook não autorizado.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null) as AsaasWebhook | null;
  if (!payload?.id || !payload.event) {
    return NextResponse.json({ message: 'Evento inválido.' }, { status: 400 });
  }

  const payment = await hydratePayment(payload.payment);
  const subscriptionId = payment?.subscription || payload.subscription?.id;
  const companyReference = payment?.externalReference || payload.subscription?.externalReference;
  const customerId = payment?.customer || payload.subscription?.customer;

  const company = companyReference
    ? await prisma.company.findUnique({ where: { id: companyReference } }).catch(() => null)
    : subscriptionId
      ? await prisma.company.findFirst({ where: { asaasSubscriptionId: subscriptionId } })
      : customerId
        ? await prisma.company.findFirst({ where: { asaasCustomerId: customerId } })
        : null;

  const alreadyProcessed = await prisma.asaasWebhookEvent.findUnique({
    where: { eventId: payload.id }
  });

  if (alreadyProcessed?.companyId) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await prisma.$transaction(async tx => {
    if (alreadyProcessed) {
      await tx.asaasWebhookEvent.update({
        where: { eventId: payload.id! },
        data: {
          companyId: company?.id,
          payload: { ...payload, payment: payment || payload.payment } as any
        }
      });
    } else {
      await tx.asaasWebhookEvent.create({
        data: {
          eventId: payload.id!,
          eventType: payload.event!,
          companyId: company?.id,
          payload: { ...payload, payment: payment || payload.payment } as any
        }
      });
    }

    if (!company) return;

    const paidEvents = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];
    const overdueEvents = ['PAYMENT_OVERDUE', 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'];
    const canceledEvents = [
      'PAYMENT_DELETED',
      'PAYMENT_REFUNDED',
      'SUBSCRIPTION_DELETED',
      'SUBSCRIPTION_INACTIVATED'
    ];

    let status: SubscriptionStatus | undefined;
    if (paidEvents.includes(payload.event!)) status = SubscriptionStatus.ACTIVE;
    if (overdueEvents.includes(payload.event!)) status = SubscriptionStatus.OVERDUE;
    if (canceledEvents.includes(payload.event!)) status = SubscriptionStatus.CANCELED;

    const nextDate = payload.subscription?.nextDueDate || payment?.dueDate;
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

      if (status === SubscriptionStatus.ACTIVE) {
        await tx.companyModule.updateMany({
          where: {
            companyId: company.id,
            enabled: false,
            price: { not: null }
          },
          data: {
            enabled: true,
            activatedAt: new Date()
          }
        });
      }
    }

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        action: `ASAAS_${payload.event}`,
        entity: 'Subscription',
        entityId: subscriptionId || payment?.id,
        metadata: {
          eventId: payload.id,
          paymentStatus: payment?.status,
          billingType: payment?.billingType
        }
      }
    });
  });

  return NextResponse.json({ ok: true, companyResolved: Boolean(company) });
}
