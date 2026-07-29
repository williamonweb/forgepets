import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import LogoutButton from '@/components/LogoutButton';
import { getSession } from '@/lib/auth';

export default async function Dashboard(){
 const session=await getSession(); if(!session) redirect('/login'); if(session.role==='MASTER') redirect('/master');
 return <AppShell><div className="topbar"><div><h1>Dashboard</h1><small>Olá, {session.name}. A estrutura SaaS está pronta para receber os módulos.</small></div><div style={{display:'flex',gap:10,alignItems:'center'}}><span className="pill">Banco conectado</span><LogoutButton/></div></div><section className="grid"><div className="metric"><span>Faturamento hoje</span><strong>R$ 0,00</strong></div><div className="metric"><span>Agendamentos</span><strong>0</strong></div><div className="metric"><span>Pets cadastrados</span><strong>0</strong></div><div className="metric"><span>Contas a receber</span><strong>R$ 0,00</strong></div></section><section className="empty"><h3>Base zerada com sucesso</h3><p>O visual foi preservado e os dados agora serão gravados no Neon, separados por empresa.</p></section></AppShell>;
}
