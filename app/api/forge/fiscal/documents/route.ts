import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getSession();
  if (!session?.companyId) return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  const documents = await prisma.fiscalDocument.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
  return NextResponse.json({ documents });
}
