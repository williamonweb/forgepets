import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024;

function validPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export async function GET() {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
  }

  const workspace = await prisma.companyWorkspace.findUnique({
    where: { companyId: session.companyId },
    select: { payload: true, revision: true, updatedAt: true }
  });

  return NextResponse.json(
    workspace
      ? { exists: true, data: workspace.payload, revision: workspace.revision, updatedAt: workspace.updatedAt }
      : { exists: false, data: null, revision: 0, updatedAt: null },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.companyId) {
    return NextResponse.json({ message: 'Sessão inválida. Entre novamente.' }, { status: 401 });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ message: 'A base de dados excedeu o limite de sincronização.' }, { status: 413 });
  }

  let body: any;
  try { body = JSON.parse(raw || '{}'); } catch {
    return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  }

  if (!validPayload(body.data)) {
    return NextResponse.json({ message: 'Base de dados inválida.' }, { status: 400 });
  }

  const companyId = session.companyId;
  const baseRevision = Number(body.baseRevision || 0);
  const source = String(body.source || 'APP').slice(0, 40);

  const result = await prisma.$transaction(async tx => {
    const current = await tx.companyWorkspace.findUnique({ where: { companyId } });

    if (current && baseRevision !== current.revision) {
      return { conflict: true as const, current };
    }

    if (!current) {
      const created = await tx.companyWorkspace.create({
        data: { companyId, payload: body.data as Prisma.InputJsonValue, revision: 1 }
      });
      await tx.auditLog.create({
        data: {
          companyId,
          userId: session.userId,
          action: 'COMPANY_DATA_MIGRATED_TO_NEON',
          entity: 'CompanyWorkspace',
          entityId: created.id,
          metadata: { source }
        }
      });
      return { conflict: false as const, workspace: created };
    }

    await tx.companyWorkspaceRevision.create({
      data: {
        companyId,
        revision: current.revision,
        payload: current.payload as Prisma.InputJsonValue,
        source
      }
    });

    const updated = await tx.companyWorkspace.update({
      where: { companyId },
      data: { payload: body.data as Prisma.InputJsonValue, revision: { increment: 1 } }
    });

    // Mantém as últimas 120 revisões por empresa para recuperação rápida.
    const oldRevisions = await tx.companyWorkspaceRevision.findMany({
      where: { companyId },
      orderBy: { revision: 'desc' },
      skip: 120,
      select: { id: true }
    });
    if (oldRevisions.length) {
      await tx.companyWorkspaceRevision.deleteMany({
        where: { id: { in: oldRevisions.map(item => item.id) } }
      });
    }

    return { conflict: false as const, workspace: updated };
  });

  if (result.conflict) {
    return NextResponse.json({
      conflict: true,
      data: result.current.payload,
      revision: result.current.revision,
      updatedAt: result.current.updatedAt
    }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    revision: result.workspace.revision,
    updatedAt: result.workspace.updatedAt
  });
}
