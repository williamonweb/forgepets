import { Plan } from '@prisma/client';

export const PLAN_CONFIG = {
  Essencial: { prisma: Plan.ESSENCIAL, value: 129, level: 1 },
  Profissional: { prisma: Plan.PROFISSIONAL, value: 179, level: 2 },
  Premium: { prisma: Plan.PREMIUM, value: 219, level: 3 }
} as const;

export type PublicPlanName = keyof typeof PLAN_CONFIG;

export function publicPlanName(plan: Plan): PublicPlanName {
  return plan === Plan.ESSENCIAL ? 'Essencial' : plan === Plan.PREMIUM ? 'Premium' : 'Profissional';
}
