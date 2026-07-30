import { NextResponse } from 'next/server';
import { FiscalEnvironment, FiscalIntegrationType, ModuleCode } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

async function fiscalAccess(companyId: string) {
  const module = await prisma.companyModule.findUnique({
    where: { companyId_module: { companyId, module: ModuleCode.FISCAL } },
    select: { enabled: true }
  });
  return Boolean(module?.enabled);
}

export async function GET() {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  const moduleActive = await fiscalAccess(session.companyId);
  const config = await prisma.fiscalConfig.findUnique({ where: { companyId: session.companyId } });
  return NextResponse.json({ moduleActive, config });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  if (!['OWNER', 'MASTER'].includes(session.role)) return NextResponse.json({ message: 'Somente o proprietário pode alterar os dados fiscais.' }, { status: 403 });
  if (!(await fiscalAccess(session.companyId))) return NextResponse.json({ message: 'O Módulo Fiscal não está ativo para esta empresa.' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const clean = (value: unknown) => String(value ?? '').trim();
  const digits = (value: unknown) => clean(value).replace(/\D/g, '');
  const cnpj = digits(body.cnpj);
  const ibgeCode = digits(body.ibgeCode);
  const issRateRaw = Number(String(body.issRate ?? '').replace(',', '.'));
  const integrationType = clean(body.integrationType) === 'MUNICIPAL' ? FiscalIntegrationType.MUNICIPAL : FiscalIntegrationType.NATIONAL;
  const environment = clean(body.environment) === 'PRODUCTION' ? FiscalEnvironment.PRODUCTION : FiscalEnvironment.HOMOLOGATION;

  if (cnpj.length !== 14) return NextResponse.json({ message: 'Informe um CNPJ válido com 14 dígitos.' }, { status: 400 });
  if (!clean(body.municipalRegistration)) return NextResponse.json({ message: 'Informe a Inscrição Municipal.' }, { status: 400 });
  if (!clean(body.city) || clean(body.state).length !== 2) return NextResponse.json({ message: 'Informe município e UF.' }, { status: 400 });
  if (ibgeCode.length !== 7) return NextResponse.json({ message: 'Informe o código IBGE do município com 7 dígitos.' }, { status: 400 });
  if (!clean(body.serviceListCode)) return NextResponse.json({ message: 'Informe o código do serviço municipal/nacional.' }, { status: 400 });
  if (!Number.isFinite(issRateRaw) || issRateRaw < 0 || issRateRaw > 100) return NextResponse.json({ message: 'Informe uma alíquota de ISS válida.' }, { status: 400 });
  if (integrationType === FiscalIntegrationType.MUNICIPAL && !clean(body.municipalProvider)) return NextResponse.json({ message: 'Informe o sistema/provedor usado pela prefeitura.' }, { status: 400 });

  const data = {
    legalName: clean(body.legalName) || null,
    tradeName: clean(body.tradeName) || null,
    cnpj,
    municipalRegistration: clean(body.municipalRegistration),
    taxRegime: clean(body.taxRegime) || null,
    simplesNacional: Boolean(body.simplesNacional),
    city: clean(body.city),
    state: clean(body.state).toUpperCase(),
    ibgeCode,
    serviceListCode: clean(body.serviceListCode),
    cnae: clean(body.cnae) || null,
    nbsCode: clean(body.nbsCode) || null,
    issRate: issRateRaw,
    integrationType,
    municipalProvider: integrationType === FiscalIntegrationType.MUNICIPAL ? clean(body.municipalProvider) : null,
    environment,
    active: Boolean(body.active)
  };

  const config = await prisma.$transaction(async tx => {
    const saved = await tx.fiscalConfig.upsert({
      where: { companyId: session.companyId! },
      update: data,
      create: { companyId: session.companyId!, ...data }
    });
    await tx.auditLog.create({
      data: {
        companyId: session.companyId,
        userId: session.userId,
        action: 'FISCAL_CONFIG_UPDATED',
        entity: 'FiscalConfig',
        entityId: saved.id,
        metadata: { integrationType, environment, city: data.city, state: data.state, active: data.active }
      }
    });
    return saved;
  });

  return NextResponse.json({ config, message: environment === FiscalEnvironment.HOMOLOGATION ? 'Configuração fiscal salva em homologação.' : 'Configuração fiscal salva para produção.' });
}
