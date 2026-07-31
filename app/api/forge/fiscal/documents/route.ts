import { NextResponse } from 'next/server';
import { FiscalDocumentStatus, ModuleCode } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

async function requireFiscalAccess(companyId: string) {
  const module = await prisma.companyModule.findUnique({
    where: { companyId_module: { companyId, module: ModuleCode.FISCAL } },
    select: { enabled: true }
  });
  return Boolean(module?.enabled);
}

export async function GET() {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  if (!(await requireFiscalAccess(session.companyId))) {
    return NextResponse.json({ message: 'O Módulo Fiscal não está ativo para esta empresa.' }, { status: 403 });
  }
  const documents = await prisma.fiscalDocument.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  if (!(await requireFiscalAccess(session.companyId))) {
    return NextResponse.json({ message: 'O Módulo Fiscal não está ativo para esta empresa.' }, { status: 403 });
  }

  const [config, body] = await Promise.all([
    prisma.fiscalConfig.findUnique({ where: { companyId: session.companyId } }),
    request.json().catch(() => ({}))
  ]);
  if (!config) return NextResponse.json({ message: 'Conclua a configuração fiscal antes de registrar documentos.' }, { status: 400 });
  if (!config.active) return NextResponse.json({ message: 'Marque a configuração fiscal como pronta para emissão.' }, { status: 400 });

  const clean = (value: unknown) => String(value ?? '').trim();
  const digits = (value: unknown) => clean(value).replace(/\D/g, '');
  const serviceDescription = clean(body.serviceDescription);
  const serviceAmount = Number(String(body.serviceAmount ?? '').replace(',', '.'));
  const tutorDocument = digits(body.tutorDocument);
  if (!serviceDescription) return NextResponse.json({ message: 'Informe a descrição do serviço.' }, { status: 400 });
  if (!Number.isFinite(serviceAmount) || serviceAmount <= 0) return NextResponse.json({ message: 'Informe um valor de serviço válido.' }, { status: 400 });
  if (tutorDocument && ![11, 14].includes(tutorDocument.length)) {
    return NextResponse.json({ message: 'O CPF/CNPJ do tomador deve ter 11 ou 14 dígitos.' }, { status: 400 });
  }

  const issRate = Number(config.issRate ?? 0);
  const issAmount = Number((serviceAmount * issRate / 100).toFixed(2));
  const document = await prisma.$transaction(async tx => {
    const created = await tx.fiscalDocument.create({
      data: {
        companyId: session.companyId!,
        status: FiscalDocumentStatus.DRAFT,
        environment: config.environment,
        integrationType: config.integrationType,
        saleReference: clean(body.saleReference) || null,
        tutorName: clean(body.tutorName) || null,
        tutorDocument: tutorDocument || null,
        serviceDescription,
        serviceAmount,
        issAmount,
        requestPayload: {
          origin: clean(body.saleReference) ? 'CASHIER' : 'MANUAL',
          createdBy: session.userId,
          transmissionPending: true
        }
      }
    });
    await tx.auditLog.create({
      data: {
        companyId: session.companyId,
        userId: session.userId,
        action: 'FISCAL_DOCUMENT_CREATED',
        entity: 'FiscalDocument',
        entityId: created.id,
        metadata: { saleReference: created.saleReference, serviceAmount, environment: config.environment }
      }
    });
    return created;
  });

  return NextResponse.json({
    document,
    message: config.environment === 'HOMOLOGATION'
      ? 'Documento registrado em homologação. A transmissão à prefeitura ainda não foi executada.'
      : 'Documento registrado e aguardando integração com a prefeitura.'
  }, { status: 201 });
}
