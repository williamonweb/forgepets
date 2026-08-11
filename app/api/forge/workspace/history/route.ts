import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });

  const revisions = await prisma.companyWorkspaceRevision.findMany({
    where: { companyId: session.companyId },
    orderBy: { revision: 'desc' },
    take: 30,
    select: { id: true, revision: true, source: true, createdAt: true, payload: true }
  });

  const summary = revisions.map(item => {
    const payload = item.payload as any;
    const count = (key: string) => Array.isArray(payload?.[key]) ? payload[key].length : 0;
    return {
      id: item.id,
      revision: item.revision,
      source: item.source,
      createdAt: item.createdAt,
      counts: {
        clientes: count('clientes'), pets: count('pets'), agenda: count('agenda'),
        despesas: count('despesas'), caixa: count('caixa'), vendas: count('vendas'), estoque: count('estoque')
      }
    };
  });

  return NextResponse.json({ revisions: summary }, { headers: { 'Cache-Control': 'no-store' } });
}
