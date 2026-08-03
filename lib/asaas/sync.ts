import { SubscriptionStatus } from '@prisma/client';
import { asaasRequest } from '@/lib/asaas/client';
import { prisma } from '@/lib/prisma';

type AsaasPayment = {
  id: string;
  status?: string;
  dueDate?: string;
  subscription?: string;
  customer?: string;
  externalReference?: string;
  billingType?: string;
  dateCreated?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  confirmedDate?: string;
  description?: string;
};

type PaymentsResponse = { data?: AsaasPayment[] };

const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH']);
const PAID_EVENTS = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED_IN_CASH']);

function paymentDate(payment: AsaasPayment) {
  const raw = payment.paymentDate || payment.clientPaymentDate || payment.confirmedDate || payment.dateCreated;
  if (!raw) return null;
  const parsed = new Date(`${raw}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

function isPaid(payment: AsaasPayment) {
  return PAID_STATUSES.has(String(payment.status || '').toUpperCase());
}

async function safePayments(path: string) {
  try {
    const result = await asaasRequest<PaymentsResponse>(path);
    return result.data || [];
  } catch (error) {
    console.warn(`[ForgePets] Falha ao consultar ${path}:`, error instanceof Error ? error.message : error);
    return [];
  }
}

function addUnique(target: AsaasPayment[], values: AsaasPayment[]) {
  for (const value of values) {
    if (value?.id && !target.some(item => item.id === value.id)) target.push(value);
  }
}

export async function syncCompanyBilling(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      asaasSubscriptionId: true,
      asaasCustomerId: true,
      subscriptionStatus: true,
      pendingPlan: true,
      pendingPlanRequestedAt: true,
      plan: true,
      modules: {
        where: { enabled: false, price: { not: null } },
        select: { id: true, module: true, updatedAt: true }
      }
    }
  });

  if (!company) return { synced: false, paid: false, reason: 'COMPANY_NOT_FOUND' } as const;

  // Se o Neon já está ativo, apenas garante que módulos pagos pendentes sejam liberados.
  if (company.subscriptionStatus === SubscriptionStatus.ACTIVE) {
    const activated = await prisma.companyModule.updateMany({
      where: { companyId, enabled: false, price: { not: null } },
      data: { enabled: true, activatedAt: new Date() }
    });
    return { synced: true, paid: true, reason: 'ALREADY_ACTIVE', modulesActivated: activated.count } as const;
  }

  const requestDates = [
    company.pendingPlanRequestedAt,
    ...company.modules.map(module => module.updatedAt)
  ].filter((value): value is Date => Boolean(value));
  const requestedAt = requestDates.length
    ? new Date(Math.min(...requestDates.map(date => date.getTime())))
    : null;
  const requestDay = dateKey(requestedAt);

  const candidates: AsaasPayment[] = [];

  if (company.asaasSubscriptionId) {
    addUnique(candidates, await safePayments(`/subscriptions/${company.asaasSubscriptionId}/payments?limit=100&offset=0`));
    addUnique(candidates, await safePayments(`/payments?subscription=${encodeURIComponent(company.asaasSubscriptionId)}&limit=100&offset=0`));
  }

  if (company.asaasCustomerId) {
    addUnique(candidates, await safePayments(`/payments?customer=${encodeURIComponent(company.asaasCustomerId)}&limit=100&offset=0`));
  }

  // Usa também webhooks já gravados. Isso permite recuperar pagamentos mesmo se
  // uma consulta temporária ao Asaas falhar durante o login.
  const storedEvents = await prisma.asaasWebhookEvent.findMany({
    where: {
      eventType: { in: Array.from(PAID_EVENTS) },
      OR: [
        { companyId },
        ...(company.asaasCustomerId
          ? [{ payload: { path: ['payment', 'customer'], equals: company.asaasCustomerId } } as any]
          : []),
        ...(company.asaasSubscriptionId
          ? [{ payload: { path: ['payment', 'subscription'], equals: company.asaasSubscriptionId } } as any]
          : [])
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  for (const event of storedEvents) {
    const payload = event.payload as any;
    const payment = payload?.payment || {};
    if (payment?.id) {
      addUnique(candidates, [{
        id: payment.id,
        status: payment.status || (event.eventType === 'PAYMENT_CONFIRMED' ? 'CONFIRMED' : event.eventType === 'PAYMENT_RECEIVED_IN_CASH' ? 'RECEIVED_IN_CASH' : 'RECEIVED'),
        dueDate: payment.dueDate,
        subscription: payment.subscription,
        customer: payment.customer,
        externalReference: payment.externalReference,
        billingType: payment.billingType,
        paymentDate: payment.paymentDate || payment.clientPaymentDate || payment.confirmedDate,
        dateCreated: payment.dateCreated
      }]);
    }
  }

  const paidPayment = candidates
    .filter(isPaid)
    .filter(payment => {
      if (company.asaasSubscriptionId && payment.subscription === company.asaasSubscriptionId) return true;
      if (payment.externalReference === company.id) return true;
      if (!requestDay) return true;
      const paidDay = dateKey(paymentDate(payment));
      return !paidDay || paidDay >= requestDay;
    })
    .sort((a, b) => (paymentDate(b)?.getTime() || 0) - (paymentDate(a)?.getTime() || 0))[0];

  if (!paidPayment) {
    return {
      synced: true,
      paid: false,
      reason: candidates.length ? 'PAYMENT_PENDING' : 'NO_PAYMENT_FOUND',
      candidates: candidates.length
    } as const;
  }

  const shouldActivatePlan = Boolean(company.pendingPlan);
  const result = await prisma.$transaction(async tx => {
    await tx.company.update({
      where: { id: company.id },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        trialEndsAt: null,
        plan: shouldActivatePlan ? company.pendingPlan! : undefined,
        pendingPlan: shouldActivatePlan ? null : undefined,
        pendingPlanRequestedAt: shouldActivatePlan ? null : undefined,
        nextBillingDate: paidPayment.dueDate ? new Date(`${paidPayment.dueDate}T12:00:00Z`) : undefined
      }
    });

    const modules = await tx.companyModule.updateMany({
      where: { companyId: company.id, enabled: false, price: { not: null } },
      data: { enabled: true, activatedAt: new Date() }
    });

    await tx.auditLog.create({
      data: {
        companyId: company.id,
        action: 'ASAAS_PAYMENT_RECONCILED_AND_ACCESS_RELEASED',
        entity: 'Subscription',
        entityId: paidPayment.subscription || company.asaasSubscriptionId || paidPayment.id,
        metadata: {
          paymentId: paidPayment.id,
          paymentStatus: paidPayment.status,
          billingType: paidPayment.billingType,
          modulesActivated: modules.count,
          trialCleared: true
        }
      }
    });
    return modules.count;
  });

  return { synced: true, paid: true, paymentId: paidPayment.id, modulesActivated: result } as const;
}
