import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireCompany() {
  const session = await getSession();
  return session?.companyId ? session : null;
}

export async function GET() {
  const session = await requireCompany();
  if (!session?.companyId) {
    return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  }

  const companyId = session.companyId;

  const [payables, revenues, transactions] = await Promise.all([
    prisma.financialPayable.findMany({
      where: { companyId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      take: 500
    }),
    prisma.plannedRevenue.findMany({
      where: { companyId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      take: 500
    }),
    prisma.financialTransaction.findMany({
      where: { companyId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      take: 500
    })
  ]);

  return NextResponse.json({
    items: [
      ...payables.map(item => ({
        id: item.id,
        legacyId: item.legacyId,
        type: item.recordType === 'PAYABLE' ? 'boleto' : 'despesa',
        title: item.description || item.supplier,
        category: item.category || '',
        amount: Number(item.originalAmount),
        date: item.dueDate.toISOString(),
        deletedAt: item.deletedAt?.toISOString() || null
      })),
      ...revenues.map(item => ({
        id: item.id,
        legacyId: item.legacyId,
        type: 'receita',
        title: item.description,
        category: item.category || '',
        amount: Number(item.amount),
        date: item.expectedDate.toISOString(),
        deletedAt: item.deletedAt?.toISOString() || null
      })),
      ...transactions.map(item => ({
        id: item.id,
        legacyId: item.legacyId,
        type: item.type === 'ENTRY' ? 'entrada' : 'saida',
        title: item.description,
        category: item.category || '',
        amount: Number(item.amount),
        date: item.transactionDate.toISOString(),
        deletedAt: item.deletedAt?.toISOString() || null
      }))
    ].sort((a, b) => String(b.deletedAt || '').localeCompare(String(a.deletedAt || '')))
  });
}

export async function PATCH(request: Request) {
  const session = await requireCompany();
  if (!session?.companyId) {
    return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || '').trim();
  const type = String(body.type || '').trim().toLowerCase();

  if (!id || !type) {
    return NextResponse.json({ message: 'Registro inválido.' }, { status: 400 });
  }

  const companyId = session.companyId;
  let restoredTitle = '';

  if (type === 'boleto' || type === 'despesa') {
    const item = await prisma.financialPayable.findFirst({
      where: { id, companyId, deletedAt: { not: null } }
    });
    if (!item) return NextResponse.json({ message: 'Registro não encontrado na lixeira.' }, { status: 404 });

    await prisma.financialPayable.update({
      where: { id: item.id },
      data: { deletedAt: null }
    });
    restoredTitle = item.description || item.supplier;
  } else if (type === 'receita') {
    const item = await prisma.plannedRevenue.findFirst({
      where: { id, companyId, deletedAt: { not: null } }
    });
    if (!item) return NextResponse.json({ message: 'Registro não encontrado na lixeira.' }, { status: 404 });

    await prisma.plannedRevenue.update({
      where: { id: item.id },
      data: { deletedAt: null }
    });
    restoredTitle = item.description;
  } else if (type === 'entrada' || type === 'saida') {
    const item = await prisma.financialTransaction.findFirst({
      where: { id, companyId, deletedAt: { not: null } }
    });
    if (!item) return NextResponse.json({ message: 'Registro não encontrado na lixeira.' }, { status: 404 });

    await prisma.financialTransaction.update({
      where: { id: item.id },
      data: { deletedAt: null }
    });
    restoredTitle = item.description;
  } else {
    return NextResponse.json({ message: 'Tipo de registro inválido.' }, { status: 400 });
  }

  await prisma.auditLog.create({
    data: {
      companyId,
      userId: session.userId,
      action: 'FINANCE_RECORD_RESTORED',
      entity: type,
      entityId: id,
      metadata: {
        title: restoredTitle,
        source: 'FINANCE_TRASH'
      }
    }
  });

  return NextResponse.json({
    ok: true,
    message: 'Registro restaurado com sucesso.'
  });
}
