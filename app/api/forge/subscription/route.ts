import { NextRequest, NextResponse } from 'next/server';
import { ModuleCode, SubscriptionStatus } from '@prisma/client';
import { createHash } from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { asaasRequest, AsaasBillingType, normalizeDocument } from '@/lib/asaas/client';
import { PLAN_CONFIG, PublicPlanName, publicPlanName } from '@/lib/asaas/plans';

export const runtime = 'nodejs';

const CONTRACT_VERSION = 'FORGEPETS-SAAS-2026-07-V1';
const CONTRACT_TEXT = `CONTRATO DE LICENÇA DE USO E PRESTAÇÃO DE SERVIÇOS — FORGE PETS
Versão: Julho de 2026 · V1
1. Objeto: regula o acesso à plataforma Forge Pets, disponibilizada como software por assinatura para gestão de pet shops e estabelecimentos do segmento animal.
2. Licença de uso: limitada, não exclusiva, intransferível e válida enquanto a assinatura estiver ativa e os pagamentos regulares.
3. Planos e módulos opcionais: os recursos dependem do plano contratado; módulos opcionais, como o Módulo Fiscal, podem possuir contratação, configuração e cobrança separadas.
4. Cobrança recorrente: o contratante autoriza a cobrança pelo meio selecionado, conforme valor e periodicidade apresentados.
5. Responsabilidades: o contratante responde pela veracidade dos dados, credenciais, uso adequado e informações fiscais, contábeis e operacionais inseridas.
6. Disponibilidade e suporte: poderão ocorrer manutenções, atualizações e correções necessárias à segurança e ao funcionamento.
7. Dados e privacidade: os dados serão tratados para prestação do serviço, segurança, suporte, cobrança e obrigações aplicáveis; o contratante deve possuir base legal para os dados inseridos.
8. Cancelamento: impede cobranças futuras após o processamento aplicável, sem prejuízo de valores vencidos; a exportação deverá ocorrer dentro do prazo disponibilizado.
9. Aceite eletrônico: registra usuário, empresa, versão, data, horário, IP e informações técnicas da sessão.
10. Disposições finais: o instrumento deve ser complementado pelos dados das partes e revisado juridicamente antes da comercialização definitiva.`
const CONTRACT_HASH = createHash('sha256').update(CONTRACT_TEXT).digest('hex');
const MODULE_CATALOG: Record<ModuleCode, { name: string; price: number }> = {
  FISCAL: { name: 'Módulo Fiscal', price: 49 },
  WHATSAPP: { name: 'WhatsApp Oficial', price: 39 },
  LOYALTY: { name: 'Fidelidade Avançada', price: 29 },
  ONLINE_BOOKING: { name: 'Agendamento Online', price: 39 },
  AI: { name: 'Recursos de IA', price: 29 },
  TUTOR_APP: { name: 'App do Tutor', price: 39 }
};

type CustomerResponse = { id: string };
type SubscriptionResponse = { id: string; status?: string; nextDueDate?: string };
type PaymentItem = { id: string; status?: string; dueDate?: string; value?: number; billingType?: string; invoiceUrl?: string; bankSlipUrl?: string; invoiceNumber?: string };
type IdentificationFieldResponse = { identificationField?: string; nossoNumero?: string; barCode?: string };
type PaymentsResponse = { data?: PaymentItem[] };
type PixQrCodeResponse = { encodedImage: string; payload: string; expirationDate?: string };

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getFirstSubscriptionPayment(subscriptionId: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const payments = await asaasRequest<PaymentsResponse>(`/subscriptions/${subscriptionId}/payments?limit=10&offset=0`);
    const first = payments.data?.[0];
    if (first?.id) return first;
    await sleep(700);
  }
  return null;
}

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

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: {
      id: true, name: true, tradeName: true, document: true, email: true, phone: true,
      plan: true, subscriptionStatus: true, asaasCustomerId: true, asaasSubscriptionId: true,
      billingType: true, nextBillingDate: true, downgradeLockedUntil: true, pendingPlan: true, pendingPlanRequestedAt: true,
      trialEndsAt: true
    }
  });

  if (!company) return NextResponse.json({ message: 'Pet shop não encontrado.' }, { status: 404 });

  if (request.nextUrl.searchParams.get('status') === '1') {
    const now = new Date();
    const trialExpired = company.subscriptionStatus === SubscriptionStatus.TRIAL
      && !!company.trialEndsAt
      && company.trialEndsAt.getTime() <= now.getTime();

    let effectiveStatus = company.subscriptionStatus;
    if (trialExpired) {
      effectiveStatus = SubscriptionStatus.BLOCKED;
      await prisma.company.update({
        where: { id: company.id },
        data: { subscriptionStatus: SubscriptionStatus.BLOCKED }
      });
    }

    const remainingMs = company.trialEndsAt ? company.trialEndsAt.getTime() - now.getTime() : 0;
    const trialDaysRemaining = effectiveStatus === SubscriptionStatus.TRIAL
      ? Math.max(0, Math.ceil(remainingMs / 86400000))
      : 0;
    const active = effectiveStatus === SubscriptionStatus.ACTIVE;
    const accessAllowed = active || effectiveStatus === SubscriptionStatus.TRIAL;

    return NextResponse.json({
      status: effectiveStatus.toLowerCase(),
      active,
      accessAllowed,
      trialExpired,
      trialEndsAt: company.trialEndsAt,
      trialDaysRemaining,
      paymentPending: !!company.asaasSubscriptionId && !active,
      plan: publicPlanName(company.plan),
      pendingPlan: company.pendingPlan ? publicPlanName(company.pendingPlan) : null,
      nextBillingDate: company.nextBillingDate
    });
  }

  if (request.nextUrl.searchParams.get('payment') === '1') {
    if (!company.asaasSubscriptionId) return NextResponse.json({ ready: false }, { status: 202 });
    const payment = await getFirstSubscriptionPayment(company.asaasSubscriptionId);
    if (!payment?.id) return NextResponse.json({ ready: false }, { status: 202 });
    let identificationField: IdentificationFieldResponse | null = null;
    if (payment.billingType === 'BOLETO') {
      try { identificationField = await asaasRequest<IdentificationFieldResponse>(`/payments/${payment.id}/identificationField`); } catch {}
    }
    return NextResponse.json({
      ready: true,
      payment: {
        id: payment.id, status: payment.status || 'PENDING', dueDate: payment.dueDate || null,
        value: payment.value || 0, billingType: payment.billingType || company.billingType,
        invoiceUrl: payment.invoiceUrl || null, bankSlipUrl: payment.bankSlipUrl || null,
        invoiceNumber: payment.invoiceNumber || null,
        identificationField: identificationField?.identificationField || identificationField?.barCode || null
      }
    });
  }

  if (request.nextUrl.searchParams.get('pix') === '1') {
    if (!company.asaasSubscriptionId) {
      return NextResponse.json({ message: 'Assinatura PIX ainda não encontrada.' }, { status: 404 });
    }
    const payment = await getFirstSubscriptionPayment(company.asaasSubscriptionId);
    if (!payment?.id) {
      return NextResponse.json({ ready: false, message: 'A cobrança PIX ainda está sendo gerada pelo Asaas.' }, { status: 202 });
    }
    const pix = await asaasRequest<PixQrCodeResponse>(`/payments/${payment.id}/pixQrCode`);
    return NextResponse.json({
      ready: true,
      paymentId: payment.id,
      dueDate: payment.dueDate || null,
      pix: {
        encodedImage: pix.encodedImage,
        payload: pix.payload,
        expirationDate: pix.expirationDate || null
      }
    });
  }

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
    if (body?.contractAccepted !== true || body?.contractVersion !== CONTRACT_VERSION) {
      return NextResponse.json({ message: 'Leia e aceite o contrato para continuar.' }, { status: 400 });
    }
    if (!selected) return NextResponse.json({ message: 'Plano inválido.' }, { status: 400 });
    const requestedModules: ModuleCode[] = Array.isArray(body?.modules)
      ? Array.from(
          new Set(
            body.modules
              .map((value: unknown) => String(value))
              .filter(
                (value: string): value is ModuleCode =>
                  Object.prototype.hasOwnProperty.call(MODULE_CATALOG, value)
              )
          )
        )
      : [];

    const modulesValue = requestedModules.reduce(
      (sum: number, code: ModuleCode) => sum + MODULE_CATALOG[code].price,
      0
    );
    const totalValue = selected.value + modulesValue;

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
      value: totalValue,
      nextDueDate: dateOnly(now),
      cycle: 'MONTHLY',
      description: `ForgePets · Plano ${requestedPlan}${requestedModules.length ? ` + ${requestedModules.map(code => MODULE_CATALOG[code].name).join(', ')}` : ''}`, 
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
    const trialStillValid = company.subscriptionStatus === SubscriptionStatus.TRIAL
      && !!company.trialEndsAt
      && company.trialEndsAt.getTime() > now.getTime();
    const status = trialStillValid ? SubscriptionStatus.TRIAL : SubscriptionStatus.BLOCKED;

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
      prisma.contractAcceptance.create({
        data: {
          companyId: company.id,
          userId: session.userId || null,
          contractVersion: CONTRACT_VERSION,
          contractHash: CONTRACT_HASH,
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
          userAgent: request.headers.get('user-agent') || null,
          metadata: { plan: requestedPlan, modules: requestedModules, method: type, amount: totalValue }
        }
      }),
      ...requestedModules.map(module => prisma.companyModule.upsert({
        where: { companyId_module: { companyId: company.id, module } },
        update: { enabled: false, activatedAt: null, price: MODULE_CATALOG[module].price },
        create: { companyId: company.id, module, enabled: false, price: MODULE_CATALOG[module].price }
      })),
      prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: session.userId,
          action: isUpgrade ? 'SUBSCRIPTION_UPGRADE_CREATED' : isDowngrade ? 'SUBSCRIPTION_DOWNGRADE_CREATED' : 'SUBSCRIPTION_RENEWED',
          entity: 'Subscription',
          entityId: subscription.id,
          metadata: { plan: requestedPlan, modules: requestedModules, billingType: type, value: totalValue }
        }
      })
    ]);

    let payment: PaymentItem | null = null;
    let pix: PixQrCodeResponse | null = null;

    let boleto: (PaymentItem & { identificationField?: string | null }) | null = null;
    if (type === 'PIX' || type === 'BOLETO') {
      try {
        payment = await getFirstSubscriptionPayment(subscription.id);
        if (payment?.id && type === 'PIX') pix = await asaasRequest<PixQrCodeResponse>(`/payments/${payment.id}/pixQrCode`);
        if (payment?.id && type === 'BOLETO') {
          let field: IdentificationFieldResponse | null = null;
          try { field = await asaasRequest<IdentificationFieldResponse>(`/payments/${payment.id}/identificationField`); } catch {}
          boleto = { ...payment, identificationField: field?.identificationField || field?.barCode || null };
        }
      } catch (paymentError) {
        console.warn('[ForgePets] Assinatura criada, mas a cobrança ainda não ficou disponível:', paymentError instanceof Error ? paymentError.message : paymentError);
      }
    }

    return NextResponse.json({
      ok: true,
      subscriptionId: subscription.id,
      contractVersion: CONTRACT_VERSION,
      paymentId: payment?.id || null,
      plan: requestedPlan,
      modules: requestedModules,
      totalValue,
      status: 'pending',
      nextDueDate: payment?.dueDate || subscription.nextDueDate || dateOnly(now),
      downgradeLockedUntil: lockedUntil?.toISOString() || null,
      pix: pix ? {
        encodedImage: pix.encodedImage,
        payload: pix.payload,
        expirationDate: pix.expirationDate || null
      } : null,
      boleto: boleto ? {
        id: boleto.id, dueDate: boleto.dueDate || null, value: boleto.value || totalValue,
        invoiceUrl: boleto.invoiceUrl || null, bankSlipUrl: boleto.bankSlipUrl || null,
        invoiceNumber: boleto.invoiceNumber || null, identificationField: boleto.identificationField || null
      } : null,
      message: type === 'PIX' && pix
        ? 'PIX gerado. O plano será ativado automaticamente após a confirmação do pagamento pelo Asaas.'
        : type === 'BOLETO' && boleto
          ? 'Boleto gerado. O plano será ativado automaticamente após a confirmação do pagamento pelo Asaas.'
          : `Assinatura criada. O plano ${requestedPlan} será liberado automaticamente após a confirmação do pagamento pelo Asaas.`
    });
  } catch (error) {
    console.error('[ForgePets] Erro ao criar assinatura:', error instanceof Error ? error.message : error);
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Não foi possível criar a assinatura.' }, { status: 500 });
  }
}
