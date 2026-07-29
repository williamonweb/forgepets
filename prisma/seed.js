const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const plans = [
  { code: 'ESSENCIAL', name: 'Essencial', monthlyPrice: '129.00', level: 1, features: { loyalty: false, automation: false } },
  { code: 'PROFISSIONAL', name: 'Profissional', monthlyPrice: '179.00', level: 2, features: { loyalty: true, automation: false } },
  { code: 'PREMIUM', name: 'Premium', monthlyPrice: '219.00', level: 3, features: { loyalty: true, automation: true } },
];

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({ where: { code: plan.code }, update: plan, create: plan });
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'meu-pet-shop' },
    update: {},
    create: { name: 'Meu Pet Shop', slug: 'meu-pet-shop', email: process.env.SEED_ADMIN_EMAIL || 'admin@forgepets.com', status: 'TRIAL', trialEndsAt: new Date(Date.now() + 2 * 86400000) },
  });

  const professional = await prisma.plan.findUnique({ where: { code: 'PROFISSIONAL' } });
  await prisma.subscription.upsert({
    where: { id: 'seed-subscription-profissional' },
    update: {},
    create: { id: 'seed-subscription-profissional', tenantId: tenant.id, planId: professional.id, status: 'TRIALING', nextChargeAt: new Date(Date.now() + 2 * 86400000) },
  });

  const masterPassword = await bcrypt.hash(process.env.SEED_MASTER_PASSWORD || '123456', 12);
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || '123456', 12);

  await prisma.user.upsert({
    where: { email: (process.env.SEED_MASTER_EMAIL || 'master@forgepets.com').toLowerCase() },
    update: { passwordHash: masterPassword, role: 'MASTER', active: true },
    create: { name: 'William', email: (process.env.SEED_MASTER_EMAIL || 'master@forgepets.com').toLowerCase(), passwordHash: masterPassword, role: 'MASTER' },
  });

  await prisma.user.upsert({
    where: { email: (process.env.SEED_ADMIN_EMAIL || 'admin@forgepets.com').toLowerCase() },
    update: { tenantId: tenant.id, passwordHash: adminPassword, role: 'OWNER', active: true },
    create: { tenantId: tenant.id, name: 'Administrador', email: (process.env.SEED_ADMIN_EMAIL || 'admin@forgepets.com').toLowerCase(), passwordHash: adminPassword, role: 'OWNER' },
  });

  console.log('Seed ForgePets concluido.');
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
