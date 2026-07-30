import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

const allowedModules = new Set([
  'dashboard',
  'tutores',
  'clientes',
  'pets',
  'agenda',
  'atendimentos',
  'servicos',
  'caixa',
  'estoque',
  'financeiro',
  'boletos',
  'relatorios',
  'fidelidade',
  'configuracoes',
  'config',
]);

export default async function ModulePage({ params }: { params: { modulo: string } }) {
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.role === 'MASTER') redirect('/master');

  const modulo = allowedModules.has(params.modulo.toLowerCase())
    ? params.modulo.toLowerCase()
    : 'dashboard';

  redirect(`/forgepets/index.html?modulo=${encodeURIComponent(modulo)}`);
}
