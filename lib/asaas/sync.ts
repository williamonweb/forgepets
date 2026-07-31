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
};

type PaymentsResponse = { data?: AsaasPayment[] };

const PAID_STATUSES = new Set(['RECEIVED', 'CONFIRMED']);

export async function syncCompanyBilling(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      asaasSubscriptionId: true,
      subscriptionStatus: true,
      pendingPlan: true,
      plan: true
    }
  });

  if (!company?.asaasSubscriptionId) {
    return { synced: false, paid: false, reason: 'NO_SUBSCRIPTION' } as const;
  }

  const payments = await asaasRequest<PaymentsResponse>(
    `/subscriptions/${company.asaasSubscriptionId}/payments?limit=100&offset=0`
  );

  const paidPayment = payments.data?.find(payment =>
    PAID_STATUSES.has(String(payment.status || '').toUpperCase())
  );

  if (!paidPayment) {
    return { synced: true, paid: false, reason: 'PAYMENT_PENDING' } as const;
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
          entityId: company.asaasSubscriptionId,
          metadata: {
            paymentId: paidPayment.id,
            paymentStatus: paidPayment.status,
            billingType: paidPayment.billingType,
            modulesActivated: modules.count
          }
        }
      });
    }
  });

  return {
    synced: true,
    paid: true,
    paymentId: paidPayment.id
  } as const;
}
