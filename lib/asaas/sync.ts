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

const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED']);

function paymentDate(payment: AsaasPayment) {
  const raw =
    payment.paymentDate ||
    payment.clientPaymentDate ||
    payment.confirmedDate ||
    payment.dateCreated;

  if (!raw) return null;
  const parsed = new Date(`${raw}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isPaid(payment: AsaasPayment) {
  return PAID_STATUSES.has(String(payment.status || '').toUpperCase());
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

  if (!company) {
    return { synced: false, paid: false, reason: 'COMPANY_NOT_FOUND' } as const;
  }

  const requestDates = [
    company.pendingPlanRequestedAt,
    ...company.modules.map(module => module.updatedAt)
  ].filter((value): value is Date => Boolean(value));

  const requestedAt = requestDates.length
    ? new Date(Math.min(...requestDates.map(date => date.getTime())))
    : null;

  const candidates: AsaasPayment[] = [];

  if (company.asaasSubscriptionId) {
    const subscriptionPayments = await asaasRequest<PaymentsResponse>(
      `/subscriptions/${company.asaasSubscriptionId}/payments?limit=100&offset=0`
    );
    candidates.push(...(subscriptionPayments.data || []));
  }

  // Se uma nova tentativa de checkout substituiu o ID da assinatura,
  // busca também as cobranças do cliente no Asaas.
  if (company.asaasCustomerId) {
    const customerPayments = await asaasRequest<PaymentsResponse>(
      `/payments?customer=${encodeURIComponent(company.asaasCustomerId)}&limit=100&offset=0`
    );
    for (const payment of customerPayments.data || []) {
      if (!candidates.some(item => item.id === payment.id)) candidates.push(payment);
    }
  }

  const paidPayment = candidates
    .filter(isPaid)
    .filter(payment => {
      if (!requestedAt) return true;
      const paidAt = paymentDate(payment);
      return !paidAt || paidAt.getTime() >= requestedAt.getTime() - 5 * 60 * 1000;
    })
    .sort((a, b) => {
      const da = paymentDate(a)?.getTime() || 0;
      const db = paymentDate(b)?.getTime() || 0;
      return db - da;
    })[0];

  if (!paidPayment) {
    return {
      synced: true,
      paid: false,
      reason: candidates.length ? 'PAYMENT_PENDING' : 'NO_PAYMENT_FOUND'
    } as const;
  }

  const shouldActivatePlan = Boolean(company.pendingPlan);
  const alreadyActive = company.subscriptionStatus === SubscriptionStatus.ACTIVE;

  await prisma.$transaction(async tx => {
    await tx.company.update({
      where: { id: company.id },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        plan: shouldActivatePlan ? company.pendingPlan! : undefined,
        pendingPlan: shouldActivatePlan ? null : undefined,
        pendingPlanRequestedAt: shouldActivatePlan ? null : undefined,
        nextBillingDate: paidPayment.dueDate
          ? new Date(`${paidPayment.dueDate}T12:00:00Z`)
          : undefined
      }
    });

    const modules = await tx.companyModule.updateMany({
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

    if (!alreadyActive || shouldActivatePlan || modules.count > 0) {
      await tx.auditLog.create({
        data: {
          companyId: company.id,
          action: 'ASAAS_BILLING_RECONCILED',
          entity: 'Subscription',
          entityId: paidPayment.subscription || company.asaasSubscriptionId || paidPayment.id,
          metadata: {
            paymentId: paidPayment.id,
            paymentStatus: paidPayment.status,
            billingType: paidPayment.billingType,
            modulesActivated: modules.count,
            reconciledByCustomer: paidPayment.subscription !== company.asaasSubscriptionId
          }
        }
      });
    }
  });

  return {
    synced: true,
    paid: true,
    paymentId: paidPayment.id,
    modulesActivated: company.modules.length
  } as const;
}
