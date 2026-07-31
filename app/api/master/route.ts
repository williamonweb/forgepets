import { NextRequest, NextResponse } from 'next/server';
import { Plan, SubscriptionStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_CONFIG, publicPlanName } from '@/lib/asaas/plans';
import { syncCompanyBilling } from '@/lib/asaas/sync';

export const runtime = 'nodejs';

async function requireMaster() {
  const session = await getSession();
  if (!session || session.role !== 'MASTER') return null;
  return session;
}

const statusMap: Record<string, SubscriptionStatus> = {
  active: SubscriptionStatus.ACTIVE,
  trial: SubscriptionStatus.TRIAL,
  overdue: SubscriptionStatus.OVERDUE,
  blocked: SubscriptionStatus.BLOCKED,
  cancelled: SubscriptionStatus.CANCELED,
  canceled: SubscriptionStatus.CANCELED
};

function asDate(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  const session = await requireMaster();
  if (!session) return NextResponse.json({ message: 'Acesso restrito ao Master.' }, { status: 403 });

  const pendingBillingCompanies = await prisma.company.findMany({
    where: {
      asaasSubscriptionId: { not: null },
      modules: { some: { module: 'FISCAL', enabled: false } }
    },
    select: { id: true }
  });

  await Promise.allSettled(
    pendingBillingCompanies.map(company => syncCompanyBilling(company.id))
  );

  const [companies, users, tickets, logs, webhookEvents, settings] = await Promise.all([
    prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, active: true, updatedAt: true } },
        fiscalConfig: true,
        modules: { where: { module: 'FISCAL' }, select: { enabled: true } },
        _count: { select: { pets: true, tutors: true, users: true, fiscalDocuments: true } }
      }
    }),
    prisma.user.findMany({ where: { role: { in: [UserRole.MASTER] } }, orderBy: { createdAt: 'asc' } }),
    prisma.connectTicket.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { company: { select: { name: true } }, _count: { select: { messages: true } } } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 250, include: { company: { select: { name: true } }, user: { select: { name: true } } } }),
    prisma.asaasWebhookEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 250, include: { company: { select: { name: true } } } }),
    prisma.saaSSettings.findUnique({ where: { id: 'global' } })
  ]);

  const companyRows = companies.map(c => {
    const owner = c.users.find(u => u.role === 'OWNER') || c.users[0];
    return {
      id: c.id,
      name: c.tradeName || c.name,
      legal: c.name,
      doc: c.document || '',
      owner: owner?.name || 'Sem responsável',
      email: c.email || owner?.email || '',
      phone: c.phone || '',
      plan: publicPlanName(c.plan),
      planKey: c.plan,
      pendingPlan: c.pendingPlan ? publicPlanName(c.pendingPlan) : null,
      status: c.subscriptionStatus.toLowerCase(),
      created: c.createdAt,
      due: c.nextBillingDate,
      users: c._count.users,
      pets: c._count.pets,
      tutors: c._count.tutors,
      lastAccess: owner?.updatedAt || c.updatedAt,
      billingType: c.billingType,
      asaasCustomerId: c.asaasCustomerId,
      asaasSubscriptionId: c.asaasSubscriptionId,
      downgradeLockedUntil: c.downgradeLockedUntil,
      onboardingCompleted: c.onboardingCompleted,
      fiscal: {
        contracted: Boolean(c.modules[0]),
        enabled: Boolean(c.modules[0]?.enabled),
        configured: Boolean(c.fiscalConfig),
        active: Boolean(c.fiscalConfig?.active),
        city: c.fiscalConfig?.city || '',
        state: c.fiscalConfig?.state || '',
        environment: c.fiscalConfig?.environment || null,
        integrationType: c.fiscalConfig?.integrationType || null,
        documents: c._count.fiscalDocuments
      }
    };
  });

  const plans = Object.entries(PLAN_CONFIG).map(([name, p], index) => ({
    id: p.prisma,
    name,
    price: p.value,
    cycle: 'Mensal',
    level: p.level,
    companies: companies.filter(c => c.plan === p.prisma).length,
    featured: name === 'Profissional',
    userLimit: name === 'Essencial' ? 2 : name === 'Profissional' ? 5 : 999,
    features: name === 'Essencial'
      ? ['Agenda e atendimentos', 'Tutores e pets', 'Caixa e vendas', 'Estoque básico', '2 usuários']
      : name === 'Profissional'
        ? ['Tudo do Essencial', 'Financeiro completo', 'Relatórios avançados', 'Fidelidade e cashback', '5 usuários']
        : ['Tudo do Profissional', 'Usuários ilimitados', 'Multiunidade', 'Suporte prioritário', 'Recursos antecipados'],
    color: ['#38bdf8', '#7c3aed', '#ff8a1c'][index]
  }));

  const payments = webhookEvents
    .filter(e => e.eventType.startsWith('PAYMENT_'))
    .map(e => {
      const payload = e.payload as any;
      const p = payload?.payment || {};
      return {
        id: p.id || e.eventId,
        companyId: e.companyId,
        companyName: e.company?.name || 'Empresa não identificada',
        amount: Number(p.value || p.netValue || 0),
        status: ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(e.eventType) ? 'paid' : e.eventType === 'PAYMENT_OVERDUE' ? 'overdue' : 'pending',
        method: p.billingType || '—',
        due: p.dueDate || null,
        paid: p.paymentDate || p.confirmedDate || null,
        event: e.eventType,
        createdAt: e.createdAt
      };
    });

  return NextResponse.json({
    currentUser: { id: session.userId, name: session.name, role: session.role },
    companies: companyRows,
    plans,
    payments,
    tickets: tickets.map(t => ({ id: t.id, companyId: t.companyId, companyName: t.company.name, subject: t.subject, priority: 'Média', status: t.status.toLowerCase(), created: t.createdAt, messages: t._count.messages })),
    users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.active ? 'active' : 'inactive', last: u.updatedAt })),
    logs: logs.map(l => ({ id: l.id, date: l.createdAt, user: l.user?.name || 'Sistema', action: l.action, target: l.company?.name || l.entity || 'ForgePets', metadata: l.metadata })),
    settings: {
      trialDays: settings?.trialDays ?? 2,
      allowSignup: settings?.publicSignupEnabled ?? true,
      welcomeMessage: settings?.welcomeMessage || 'Bem-vindo ao ForgePets!',
      monthlyGoal: 5000,
      supportWhatsapp: '(51) 98584-5457',
      supportEmail: 'suporte@forgepets.com'
    }
  });
}

export async function POST(request: NextRequest) {
  const session = await requireMaster();
  if (!session) return NextResponse.json({ message: 'Acesso restrito ao Master.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '');

  if (action === 'company') {
    const name = String(body.name || '').trim();
    const owner = String(body.owner || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!name || !owner || !email) return NextResponse.json({ message: 'Nome, responsável e e-mail são obrigatórios.' }, { status: 400 });
    const plan = (String(body.planKey || body.plan || 'PROFISSIONAL').toUpperCase() as Plan);
    const created = await prisma.company.create({
      data: {
        name: String(body.legal || name).trim(), tradeName: name, document: String(body.doc || '').replace(/\D/g, '') || null,
        email, phone: String(body.phone || '').trim() || null, plan, subscriptionStatus: statusMap[String(body.status || 'trial')] || SubscriptionStatus.TRIAL,
        trialEndsAt: asDate(body.due), nextBillingDate: asDate(body.due),
        users: { create: { name: owner, email, passwordHash: 'PENDING_INVITE', role: UserRole.OWNER, active: true } }
      }
    });
    await prisma.auditLog.create({ data: { companyId: created.id, userId: session.userId, action: 'MASTER_COMPANY_CREATED', entity: 'Company', entityId: created.id } });
    return NextResponse.json({ ok: true, id: created.id });
  }

  if (action === 'ticket') {
    const ticket = await prisma.connectTicket.create({ data: { companyId: String(body.companyId), subject: String(body.subject || '').trim() } });
    return NextResponse.json({ ok: true, id: ticket.id });
  }

  if (action === 'master-user') {
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!name || !email || password.length < 6) {
      return NextResponse.json({ message: 'Informe nome, e-mail e uma senha com pelo menos 6 caracteres.' }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ message: 'Já existe um usuário com este e-mail.' }, { status: 409 });
    const created = await prisma.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 12), role: UserRole.MASTER, active: body.active !== false }
    });
    await prisma.auditLog.create({ data: { userId: session.userId, action: 'MASTER_USER_CREATED', entity: 'User', entityId: created.id, metadata: { name, email } } });
    return NextResponse.json({ ok: true, id: created.id });
  }

  return NextResponse.json({ message: 'Ação inválida.' }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const session = await requireMaster();
  if (!session) return NextResponse.json({ message: 'Acesso restrito ao Master.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || '');

  if (action === 'company') {
    const id = String(body.id || '');
    const data: any = {};
    if (body.name !== undefined) data.tradeName = String(body.name).trim();
    if (body.legal !== undefined) data.name = String(body.legal || body.name).trim();
    if (body.doc !== undefined) data.document = String(body.doc).replace(/\D/g, '') || null;
    if (body.email !== undefined) data.email = String(body.email).trim().toLowerCase() || null;
    if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
    if (body.planKey || body.plan) data.plan = String(body.planKey || body.plan).toUpperCase() as Plan;
    if (body.status) data.subscriptionStatus = statusMap[String(body.status)] || SubscriptionStatus.TRIAL;
    if (body.due !== undefined) data.nextBillingDate = asDate(body.due);
    await prisma.company.update({ where: { id }, data });
    if (body.owner || body.ownerEmail) {
      const owner = await prisma.user.findFirst({ where: { companyId: id, role: UserRole.OWNER } });
      if (owner) await prisma.user.update({ where: { id: owner.id }, data: { name: body.owner || undefined, email: body.ownerEmail || body.email || undefined } });
    }
    await prisma.auditLog.create({ data: { companyId: id, userId: session.userId, action: 'MASTER_COMPANY_UPDATED', entity: 'Company', entityId: id, metadata: { fields: Object.keys(data) } } });
    return NextResponse.json({ ok: true });
  }

  if (action === 'company-status') {
    const id = String(body.id || '');
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) return NextResponse.json({ message: 'Empresa não encontrada.' }, { status: 404 });
    const next = company.subscriptionStatus === SubscriptionStatus.BLOCKED ? SubscriptionStatus.ACTIVE : SubscriptionStatus.BLOCKED;
    await prisma.company.update({ where: { id }, data: { subscriptionStatus: next } });
    await prisma.auditLog.create({ data: { companyId: id, userId: session.userId, action: 'MASTER_COMPANY_STATUS_CHANGED', entity: 'Company', entityId: id, metadata: { status: next } } });
    return NextResponse.json({ ok: true, status: next.toLowerCase() });
  }

  if (action === 'company-module') {
    const companyId = String(body.companyId || body.id || '').trim();
    const moduleCode = String(body.module || 'FISCAL').trim().toUpperCase();
    const enabled = body.enabled === true;

    if (!companyId) {
      return NextResponse.json({ message: 'Empresa não informada.' }, { status: 400 });
    }

    if (moduleCode !== 'FISCAL') {
      return NextResponse.json({ message: 'Módulo inválido.' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, tradeName: true }
    });

    if (!company) {
      return NextResponse.json({ message: 'Empresa não encontrada.' }, { status: 404 });
    }

    const module = await prisma.companyModule.upsert({
      where: {
        companyId_module: {
          companyId,
          module: 'FISCAL'
        }
      },
      create: {
        companyId,
        module: 'FISCAL',
        enabled,
        activatedAt: enabled ? new Date() : null,
        price: 49
      },
      update: {
        enabled,
        activatedAt: enabled ? new Date() : null
      }
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        userId: session.userId,
        action: enabled ? 'MASTER_MODULE_ENABLED' : 'MASTER_MODULE_DISABLED',
        entity: 'CompanyModule',
        entityId: module.id,
        metadata: {
          module: 'FISCAL',
          enabled,
          companyName: company.tradeName || company.name,
          source: 'MASTER_MANUAL_CONTROL'
        }
      }
    });

    return NextResponse.json({
      ok: true,
      module: {
        code: module.module,
        enabled: module.enabled,
        activatedAt: module.activatedAt
      },
      message: enabled
        ? 'Módulo Fiscal liberado para a empresa.'
        : 'Módulo Fiscal bloqueado para a empresa.'
    });
  }

  if (action === 'settings') {
    await prisma.saaSSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global', trialDays: Number(body.trialDays || 2), publicSignupEnabled: Boolean(body.allowSignup), welcomeMessage: String(body.welcomeMessage || 'Bem-vindo ao ForgePets!') },
      update: { trialDays: Number(body.trialDays || 2), publicSignupEnabled: Boolean(body.allowSignup), welcomeMessage: String(body.welcomeMessage || 'Bem-vindo ao ForgePets!') }
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'ticket-status') {
    await prisma.connectTicket.update({ where: { id: String(body.id) }, data: { status: body.status === 'resolved' ? 'RESOLVED' : 'OPEN' } });
    return NextResponse.json({ ok: true });
  }

  if (action === 'master-user') {
    const id = String(body.id || '');
    const current = await prisma.user.findFirst({ where: { id, role: UserRole.MASTER } });
    if (!current) return NextResponse.json({ message: 'Usuário Master não encontrado.' }, { status: 404 });
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    if (!name || !email) return NextResponse.json({ message: 'Nome e e-mail são obrigatórios.' }, { status: 400 });
    const duplicate = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (duplicate) return NextResponse.json({ message: 'Já existe outro usuário com este e-mail.' }, { status: 409 });
    const updateData: any = { name, email };
    if (String(body.password || '').trim()) {
      if (String(body.password).length < 6) return NextResponse.json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' }, { status: 400 });
      updateData.passwordHash = await bcrypt.hash(String(body.password), 12);
    }
    await prisma.user.update({ where: { id }, data: updateData });
    await prisma.auditLog.create({ data: { userId: session.userId, action: 'MASTER_USER_UPDATED', entity: 'User', entityId: id, metadata: { name, email, passwordChanged: Boolean(updateData.passwordHash) } } });
    return NextResponse.json({ ok: true });
  }

  if (action === 'master-user-status') {
    const id = String(body.id || '');
    if (id === session.userId) return NextResponse.json({ message: 'Você não pode inativar o próprio usuário.' }, { status: 400 });
    const current = await prisma.user.findFirst({ where: { id, role: UserRole.MASTER } });
    if (!current) return NextResponse.json({ message: 'Usuário Master não encontrado.' }, { status: 404 });
    const updated = await prisma.user.update({ where: { id }, data: { active: !current.active } });
    await prisma.auditLog.create({ data: { userId: session.userId, action: 'MASTER_USER_STATUS_CHANGED', entity: 'User', entityId: id, metadata: { active: updated.active } } });
    return NextResponse.json({ ok: true, status: updated.active ? 'active' : 'inactive' });
  }

  return NextResponse.json({ message: 'Ação inválida.' }, { status: 400 });
}
