import { NextRequest, NextResponse } from 'next/server';
import { ModuleCode } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
const CATALOG = {
  FISCAL: { name: 'Módulo Fiscal', description: 'Emissão de NFS-e de serviços por integração municipal ou padrão nacional.', price: 49 },
  WHATSAPP: { name: 'WhatsApp Oficial', description: 'Mensagens e confirmações pela API oficial.', price: 39 },
  LOYALTY: { name: 'Fidelidade Avançada', description: 'Pontos, cashback, cupons e campanhas.', price: 29 },
  ONLINE_BOOKING: { name: 'Agendamento Online', description: 'Página pública de agendamento.', price: 39 },
  AI: { name: 'Recursos de IA', description: 'Textos, mensagens e análises inteligentes.', price: 29 },
  TUTOR_APP: { name: 'App do Tutor', description: 'Área exclusiva para clientes e pets.', price: 39 }
} as const;

export async function GET() {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  const rows = await prisma.companyModule.findMany({ where: { companyId: session.companyId } });
  const state = new Map(rows.map(row => [row.module, row]));
  return NextResponse.json({ modules: Object.entries(CATALOG).map(([code, item]) => ({ code, ...item, enabled: state.get(code as ModuleCode)?.enabled || false, expiresAt: state.get(code as ModuleCode)?.expiresAt || null })) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  if (!['OWNER','MASTER'].includes(session.role)) return NextResponse.json({ message: 'Somente o proprietário pode solicitar módulos.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  const module = String(body?.module || '') as ModuleCode;
  if (!(module in CATALOG)) return NextResponse.json({ message: 'Módulo inválido.' }, { status: 400 });
  await prisma.$transaction([
    prisma.companyModule.upsert({
      where: { companyId_module: { companyId: session.companyId, module } },
      update: { price: CATALOG[module].price },
      create: { companyId: session.companyId, module, enabled: false, price: CATALOG[module].price }
    }),
    prisma.auditLog.create({ data: { companyId: session.companyId, userId: session.userId, action: 'MODULE_REQUESTED', entity: 'CompanyModule', entityId: module, metadata: { module, catalogPrice: CATALOG[module].price } } })
  ]);
  return NextResponse.json({ ok: true, message: 'Solicitação registrada. O módulo será liberado após a contratação.' });
}
