import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionStatus } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { asaasRequest, AsaasBillingType, normalizeDocument } from '@/lib/asaas/client';
import { PLAN_CONFIG, PublicPlanName, publicPlanName } from '@/lib/asaas/plans';

export const runtime = 'nodejs';

type CustomerResponse = { id: string };
type SubscriptionResponse = { id: string; status?: string; nextDueDate?: string };

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function billingType(method: string): AsaasBillingType {
  if (method === 'card') return 'CREDIT_CARD';
  if (method === 'boleto') return 'BOLETO';
  return 'PIX';
}

export async function GET() {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: {
      id: true, name: true, tradeName: true, document: true, email: true, phone: true,
      plan: true, subscriptionStatus: true, asaasCustomerId: true, asaasSubscriptionId: true,
      billingType: true, nextBillingDate: true, downgradeLockedUntil: true, pendingPlan: true, pendingPlanRequestedAt: true
    }
  });

  if (!company) return NextResponse.json({ message: 'Pet shop não encontrado.' }, { status: 404 });
  return NextResponse.json({
    subscription: {
      ...company,
      planName: publicPlanName(company.plan)
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
    if (!['OWNER', 'MANAGER', 'MASTER'].includes(session.role)) {
      return NextResponse.json({ message: 'Você não tem permissão para alterar o plano.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const requestedPlan = String(body?.plan || '') as PublicPlanName;
    const selected = PLAN_CONFIG[requestedPlan];
    if (!selected) return NextResponse.json({ message: 'Plano inválido.' }, { status: 400 });

    const company = await prisma.company.findUnique({ where: { id: session.companyId } });
    if (!company) return NextResponse.json({ message: 'Pet shop não encontrado.' }, { status: 404 });

    const currentName = publicPlanName(company.plan);
    const current = PLAN_CONFIG[currentName];
    const isDowngrade = selected.level < current.level;
    const isUpgrade = selected.level > current.level;
    const now = new Date();

    if (isDowngrade && company.downgradeLockedUntil && company.downgradeLockedUntil > now) {
      return NextResponse.json({
        message: `A redução do plano estará disponível após ${company.downgradeLockedUntil.toLocaleDateString('pt-BR')}.`
      }, { status: 409 });
    }

    const name = String(body?.name || '').trim();
    const companyName = String(body?.companyName || '').trim();
    const document = normalizeDocument(body?.document);
    const email = String(body?.email || '').trim().toLowerCase();
    const phone = normalizeDocument(body?.phone || company.phone || '');
    const postalCode = normalizeDocument(body?.postalCode || '');
    const addressNumber = String(body?.addressNumber || '').trim();
    const method = String(body?.method || 'pix');

    if (!name || !companyName || !email || ![11, 14].includes(document.length)) {
      return NextResponse.json({ message: 'Preencha responsável, pet shop, CPF/CNPJ e e-mail.' }, { status: 400 });
    }

    let customerId = company.asaasCustomerId;
    if (!customerId) {
      const customer = await asaasRequest<CustomerResponse>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: companyName,
          cpfCnpj: document,
          email,
          mobilePhone: phone || undefined,
          externalReference: company.id,
          notificationDisabled: false
        })
      });
      customerId = customer.id;
    }

    const type = billingType(method);
    const subscriptionPayload: Record<string, unknown> = {
      customer: customerId,
      billingType: type,
      value: selected.value,
      nextDueDate: dateOnly(now),
      cycle: 'MONTHLY',
      description: `ForgePets · Plano ${requestedPlan}`,
      externalReference: company.id
    };

    if (type === 'CREDIT_CARD') {
      const cardNumber = normalizeDocument(body?.creditCard?.number);
      const expiryMonth = String(body?.creditCard?.expiryMonth || '').padStart(2, '0');
      const expiryYear = String(body?.creditCard?.expiryYear || '');
      const ccv = normalizeDocument(body?.creditCard?.ccv);
      const holderName = String(body?.creditCard?.holderName || '').trim();
      if (!cardNumber || !expiryMonth || !expiryYear || !ccv || !holderName || !phone || !postalCode || !addressNumber) {
        return NextResponse.json({ message: 'Preencha todos os dados do cartão e do titular.' }, { status: 400 });
      }
      subscriptionPayload.creditCard = { holderName, number: cardNumber, expiryMonth, expiryYear, ccv };
      subscriptionPayload.creditCardHolderInfo = {
        name,
        email,
        cpfCnpj: document,
        postalCode,
        addressNumber,
        phone
      };
      subscriptionPayload.remoteIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';
    }

    const subscription = await asaasRequest<SubscriptionResponse>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionPayload)
    });

    const lockedUntil = isUpgrade ? addMonths(now, 3) : company.downgradeLockedUntil;
    const status = SubscriptionStatus.TRIAL;

    await prisma.$transaction([
      prisma.company.update({
        where: { id: company.id },
        data: {
          tradeName: companyName,
          document,
          email,
          phone: phone || company.phone,
          pendingPlan: selected.prisma,
          pendingPlanRequestedAt: now,
          subscriptionStatus: status,
          asaasCustomerId: customerId,
          asaasSubscriptionId: subscription.id,
          billingType: type,
          nextBillingDate: subscription.nextDueDate ? new Date(`${subscription.nextDueDate}T12:00:00Z`) : now,
          downgradeLockedUntil: lockedUntil
        }
      }),
      prisma.planHistory.create({
        data: {
          companyId: company.id,
          previousPlan: company.plan,
          newPlan: selected.prisma,
          lockedUntil: isUpgrade ? lockedUntil : null
        }
      }),
      prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: session.userId,
          action: isUpgrade ? 'SUBSCRIPTION_UPGRADE_CREATED' : isDowngrade ? 'SUBSCRIPTION_DOWNGRADE_CREATED' : 'SUBSCRIPTION_RENEWED',
          entity: 'Subscription',
          entityId: subscription.id,
          metadata: { plan: requestedPlan, billingType: type, value: selected.value }
        }
      })
    ]);

    return NextResponse.json({
      ok: true,
      subscriptionId: subscription.id,
      plan: requestedPlan,
      status: 'pending',
      nextDueDate: subscription.nextDueDate || dateOnly(now),
      downgradeLockedUntil: lockedUntil?.toISOString() || null,
      message: `Assinatura criada. O plano ${requestedPlan} será liberado automaticamente após a confirmação do pagamento pelo Asaas.`
    });
  } catch (error) {
    console.error('[ForgePets] Erro ao criar assinatura:', error instanceof Error ? error.message : error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Não foi possível criar a assinatura.' }, { status: 500 });
  }
}
