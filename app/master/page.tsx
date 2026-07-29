import { redirect } from 'next/navigation';
import AppShell from '@/components/AppShell';
import LogoutButton from '@/components/LogoutButton';
import { getSession } from '@/lib/auth';

export default async function Master(){
 const session=await getSession(); if(!session) redirect('/login'); if(session.role!=='MASTER') redirect('/app/dashboard');
 return <AppShell master><div className="topbar"><div><h1>Painel Master</h1><small>Administração SaaS do ForgePets.</small></div><LogoutButton/></div><section className="grid"><div className="metric"><span>Empresas ativas</span><strong>0</strong></div><div className="metric"><span>MRR</span><strong>R$ 0,00</strong></div><div className="metric"><span>Em teste</span><strong>0</strong></div><div className="metric"><span>Chamados abertos</span><strong>0</strong></div></section><section className="empty"><h3>Painel Master estruturado</h3><p>Sem balão flutuante. O Forge Connect será administrado pelo menu lateral.</p></section></AppShell>;
}
