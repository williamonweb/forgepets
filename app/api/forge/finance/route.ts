import {
  FinancialCategoryType,
  FinancialPayableStatus,
  FinancialTransactionType,
  PlannedRevenueStatus,
  Prisma
} from '@prisma/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CATEGORY_TYPES: Record<string, FinancialCategoryType> = {
  receita: 'INCOME',
  despesa: 'EXPENSE',
  boleto: 'PAYABLE'
};

function asText(value: unknown, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function asAmount(value: unknown) {
  const amount = Number(value ?? 0);
  return new Prisma.Decimal(Number.isFinite(amount) ? Math.max(0, amount) : 0);
}

function asDate(value: unknown, fallback = new Date()) {
  const raw = asText(value, 40);
  const parsed = raw ? new Date(raw.length === 10 ? `${raw}T12:00:00-03:00` : raw) : fallback;
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function uniqueIds(values: unknown[]) {
  return [...new Set(values.map(value => asText(value, 120)).filter(Boolean))];
}

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
  const [categories, payables, revenues, transactions] = await Promise.all([
    prisma.financialCategory.findMany({
      where: { companyId, deletedAt: null, active: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }]
    }),
    prisma.financialPayable.findMany({
      where: { companyId, deletedAt: null },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }]
    }),
    prisma.plannedRevenue.findMany({
      where: { companyId, deletedAt: null },
      orderBy: [{ expectedDate: 'asc' }, { createdAt: 'asc' }]
    }),
    prisma.financialTransaction.findMany({
      where: { companyId, deletedAt: null },
      orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }]
    })
  ]);

  const payableRows = payables.filter(item => item.recordType === 'PAYABLE');
  const expenseRows = payables.filter(item => item.recordType !== 'PAYABLE');
  const serializePayable = (item: (typeof payables)[number]) => ({
      id: item.legacyId,
      serverId: item.id,
      loteId: item.batchId,
      empresa: item.supplier,
      descricao: item.description || '',
      categoria: item.category || '',
      valor: Number(item.originalAmount),
      juros: Number(item.interestAmount),
      multa: Number(item.penaltyAmount),
      valorPago: item.paidAmount === null ? null : Number(item.paidAmount),
      numeroNota: item.invoiceNumber || '',
      valorNota: item.invoiceTotal === null ? null : Number(item.invoiceTotal),
      imposto: Number(item.taxAmount),
      impostoIncluso: item.taxIncluded,
      totalFinanceiro: item.financialTotal === null ? null : Number(item.financialTotal),
      parcela: item.installmentNumber,
      quantidade: item.installmentCount,
      vencimento: item.dueDate.toISOString().slice(0, 10),
      status: item.status === 'PAID' ? 'pago' : item.status === 'CANCELED' ? 'cancelado' : 'aberto',
      pagoEm: item.paidAt?.toISOString() || null,
      paidAt: item.paidAt?.toISOString() || null,
      forma: item.paymentMethod || '',
      observacoes: item.notes || '',
      createdAt: item.createdAt.toISOString()
    });

  return NextResponse.json({
    categories: categories.map(item => ({
      id: item.id,
      type: item.type === 'INCOME' ? 'receita' : item.type === 'EXPENSE' ? 'despesa' : 'boleto',
      name: item.name
    })),
    payables: payableRows.map(serializePayable),
    expenses: expenseRows.map(serializePayable),
    revenues: revenues.map(item => ({
      id: item.legacyId,
      serverId: item.id,
      descricao: item.description,
      categoria: item.category || '',
      valor: Number(item.amount),
      data: item.expectedDate.toISOString().slice(0, 10),
      status: item.status === 'RECEIVED' ? 'recebido' : item.status === 'CANCELED' ? 'cancelado' : 'previsto',
      forma: item.paymentMethod || '',
      observacoes: item.notes || '',
      receivedAt: item.receivedAt?.toISOString() || null,
      createdAt: item.createdAt.toISOString()
    })),
    transactions: transactions.map(item => ({
      id: item.legacyId,
      serverId: item.id,
      tipo: item.type === 'ENTRY' ? 'entrada' : 'saida',
      data: item.transactionDate.toISOString().slice(0, 10),
      descricao: item.description,
      categoria: item.category || '',
      valor: Number(item.amount),
      forma: item.paymentMethod || '',
      source: item.source || '',
      sourceId: item.sourceId || '',
      observacoes: item.notes || '',
      createdAt: item.createdAt.toISOString()
    }))
  });
}

export async function PUT(request: Request) {
  const session = await requireCompany();
  if (!session?.companyId) {
    return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  }

  const companyId = session.companyId;
  const body = await request.json().catch(() => ({}));
  const categories = body?.categories && typeof body.categories === 'object' ? body.categories : {};
  const payables = Array.isArray(body?.payables) ? body.payables.slice(0, 10000) : [];
  const expenses = Array.isArray(body?.expenses) ? body.expenses.slice(0, 10000) : [];
  const allPayables = [
    ...payables.map((item: any) => ({ ...item, recordType: 'PAYABLE' })),
    ...expenses.map((item: any) => ({ ...item, recordType: 'EXPENSE' }))
  ];
  const revenues = Array.isArray(body?.revenues) ? body.revenues.slice(0, 10000) : [];
  const transactions = Array.isArray(body?.transactions) ? body.transactions.slice(0, 30000) : [];

  const payableIds = uniqueIds(allPayables.map((item: any) => item?.id));
  const revenueIds = uniqueIds(revenues.map((item: any) => item?.id));
  const transactionIds = uniqueIds(transactions.map((item: any) => item?.id));

  const deletedCounts = { payables: 0, revenues: 0, transactions: 0 };

  await prisma.$transaction(async tx => {
    for (const [localType, prismaType] of Object.entries(CATEGORY_TYPES)) {
      const names = uniqueIds(Array.isArray(categories[localType]) ? categories[localType] : []);
      for (const name of names) {
        await tx.financialCategory.upsert({
          where: { companyId_type_name: { companyId, type: prismaType, name } },
          create: { companyId, type: prismaType, name, active: true },
          update: { active: true, deletedAt: null }
        });
      }
      await tx.financialCategory.updateMany({
        where: { companyId, type: prismaType, ...(names.length ? { name: { notIn: names } } : {}) },
        data: { active: false, deletedAt: new Date() }
      });
    }

    for (const item of allPayables) {
      const legacyId = asText(item?.id, 120);
      if (!legacyId) continue;
      const status: FinancialPayableStatus = item?.status === 'pago'
        ? 'PAID'
        : item?.status === 'cancelado'
          ? 'CANCELED'
          : 'OPEN';
      await tx.financialPayable.upsert({
        where: { companyId_legacyId: { companyId, legacyId } },
        create: {
          companyId,
          legacyId,
          batchId: asText(item?.loteId, 120) || null,
          recordType: item?.recordType === 'PAYABLE' ? 'PAYABLE' : 'EXPENSE',
          supplier: asText(item?.empresa || item?.descricao || 'Despesa', 200),
          description: asText(item?.descricao, 300) || null,
          category: asText(item?.categoria, 120) || null,
          originalAmount: asAmount(item?.valor),
          interestAmount: asAmount(item?.juros),
          penaltyAmount: asAmount(item?.multa),
          paidAmount: item?.valorPago === null || item?.valorPago === undefined ? null : asAmount(item.valorPago),
          invoiceNumber: asText(item?.numeroNota, 120) || null,
          invoiceTotal: item?.valorNota === null || item?.valorNota === undefined ? null : asAmount(item.valorNota),
          taxAmount: asAmount(item?.imposto),
          taxIncluded: Boolean(item?.impostoIncluso),
          financialTotal: item?.totalFinanceiro === null || item?.totalFinanceiro === undefined ? null : asAmount(item.totalFinanceiro),
          installmentNumber: Math.max(1, Number(item?.parcela || 1)),
          installmentCount: Math.max(1, Number(item?.quantidade || 1)),
          dueDate: asDate(item?.vencimento),
          status,
          paidAt: item?.pagoEm ? asDate(item.pagoEm) : null,
          paymentMethod: asText(item?.forma, 80) || null,
          notes: asText(item?.observacoes, 1000) || null,
          deletedAt: null
        },
        update: {
          batchId: asText(item?.loteId, 120) || null,
          recordType: item?.recordType === 'PAYABLE' ? 'PAYABLE' : 'EXPENSE',
          supplier: asText(item?.empresa || item?.descricao || 'Despesa', 200),
          description: asText(item?.descricao, 300) || null,
          category: asText(item?.categoria, 120) || null,
          originalAmount: asAmount(item?.valor),
          interestAmount: asAmount(item?.juros),
          penaltyAmount: asAmount(item?.multa),
          paidAmount: item?.valorPago === null || item?.valorPago === undefined ? null : asAmount(item.valorPago),
          invoiceNumber: asText(item?.numeroNota, 120) || null,
          invoiceTotal: item?.valorNota === null || item?.valorNota === undefined ? null : asAmount(item.valorNota),
          taxAmount: asAmount(item?.imposto),
          taxIncluded: Boolean(item?.impostoIncluso),
          financialTotal: item?.totalFinanceiro === null || item?.totalFinanceiro === undefined ? null : asAmount(item.totalFinanceiro),
          installmentNumber: Math.max(1, Number(item?.parcela || 1)),
          installmentCount: Math.max(1, Number(item?.quantidade || 1)),
          dueDate: asDate(item?.vencimento),
          status,
          paidAt: item?.pagoEm ? asDate(item.pagoEm) : null,
          paymentMethod: asText(item?.forma, 80) || null,
          notes: asText(item?.observacoes, 1000) || null,
          deletedAt: null
        }
      });
    }

    for (const item of revenues) {
      const legacyId = asText(item?.id, 120);
      if (!legacyId) continue;
      const status: PlannedRevenueStatus = item?.status === 'recebido'
        ? 'RECEIVED'
        : item?.status === 'cancelado'
          ? 'CANCELED'
          : 'EXPECTED';
      await tx.plannedRevenue.upsert({
        where: { companyId_legacyId: { companyId, legacyId } },
        create: {
          companyId,
          legacyId,
          description: asText(item?.descricao || 'Receita prevista', 300),
          category: asText(item?.categoria, 120) || null,
          amount: asAmount(item?.valor),
          expectedDate: asDate(item?.data),
          status,
          receivedAt: item?.receivedAt ? asDate(item.receivedAt) : null,
          paymentMethod: asText(item?.forma, 80) || null,
          notes: asText(item?.observacoes, 1000) || null,
          deletedAt: null
        },
        update: {
          description: asText(item?.descricao || 'Receita prevista', 300),
          category: asText(item?.categoria, 120) || null,
          amount: asAmount(item?.valor),
          expectedDate: asDate(item?.data),
          status,
          receivedAt: item?.receivedAt ? asDate(item.receivedAt) : null,
          paymentMethod: asText(item?.forma, 80) || null,
          notes: asText(item?.observacoes, 1000) || null,
          deletedAt: null
        }
      });
    }

    for (const item of transactions) {
      const legacyId = asText(item?.id, 120);
      if (!legacyId) continue;
      const type: FinancialTransactionType = item?.tipo === 'saida' ? 'EXIT' : 'ENTRY';
      await tx.financialTransaction.upsert({
        where: { companyId_legacyId: { companyId, legacyId } },
        create: {
          companyId,
          legacyId,
          type,
          description: asText(item?.descricao || 'Movimentação', 300),
          category: asText(item?.categoria, 120) || null,
          amount: asAmount(item?.valor),
          transactionDate: asDate(item?.data),
          paymentMethod: asText(item?.forma, 80) || null,
          source: asText(item?.source, 80) || null,
          sourceId: asText(item?.sourceId || item?.expenseId, 120) || null,
          notes: asText(item?.observacoes, 1000) || null,
          deletedAt: null
        },
        update: {
          type,
          description: asText(item?.descricao || 'Movimentação', 300),
          category: asText(item?.categoria, 120) || null,
          amount: asAmount(item?.valor),
          transactionDate: asDate(item?.data),
          paymentMethod: asText(item?.forma, 80) || null,
          source: asText(item?.source, 80) || null,
          sourceId: asText(item?.sourceId || item?.expenseId, 120) || null,
          notes: asText(item?.observacoes, 1000) || null,
          deletedAt: null
        }
      });
    }

    const deletedPayables = await tx.financialPayable.updateMany({
      where: { companyId, deletedAt: null, ...(payableIds.length ? { legacyId: { notIn: payableIds } } : {}) },
      data: { deletedAt: new Date() }
    });
    const deletedRevenues = await tx.plannedRevenue.updateMany({
      where: { companyId, deletedAt: null, ...(revenueIds.length ? { legacyId: { notIn: revenueIds } } : {}) },
      data: { deletedAt: new Date() }
    });
    const deletedTransactions = await tx.financialTransaction.updateMany({
      where: { companyId, deletedAt: null, ...(transactionIds.length ? { legacyId: { notIn: transactionIds } } : {}) },
      data: { deletedAt: new Date() }
    });

    deletedCounts.payables = deletedPayables.count;
    deletedCounts.revenues = deletedRevenues.count;
    deletedCounts.transactions = deletedTransactions.count;

    await tx.auditLog.create({
      data: {
        companyId,
        userId: session.userId,
        action: 'FINANCE_SYNC_COMPLETED',
        entity: 'Finance',
        metadata: {
          payables: payableIds.length,
          revenues: revenueIds.length,
          transactions: transactionIds.length,
          softDeleted: deletedCounts
        }
      }
    });
  });

  return NextResponse.json({
    ok: true,
    counts: {
      payables: payableIds.length,
      revenues: revenueIds.length,
      transactions: transactionIds.length,
      softDeleted: deletedCounts
    }
  });
}
