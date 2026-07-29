import { PrismaClient, UserRole, Plan, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.saaSSettings.upsert({ where: { id: 'global' }, update: {}, create: { id: 'global', publicSignupEnabled: true, trialDays: 2, defaultTrialPlan: Plan.PROFISSIONAL } });
  const masterPassword = await bcrypt.hash('123456', 12);
  await prisma.user.upsert({
    where: { email: 'master@forgepets.com' },
    update: {},
    create: { name: 'William - Forge Labs', email: 'master@forgepets.com', passwordHash: masterPassword, role: UserRole.MASTER }
  });

  const company = await prisma.company.upsert({
    where: { document: '00000000000100' },
    update: {},
    create: {
      name: 'Pet Shop Demonstração',
      tradeName: 'ForgePets Demo',
      document: '00000000000100',
      plan: Plan.PREMIUM,
      subscriptionStatus: SubscriptionStatus.TRIAL,
      onboardingCompleted: true
    }
  });

  const adminPassword = await bcrypt.hash('123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@forgepets.com' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Administrador',
      email: 'admin@forgepets.com',
      passwordHash: adminPassword,
      role: UserRole.OWNER
    }
  });
}

main().finally(() => prisma.$disconnect());
