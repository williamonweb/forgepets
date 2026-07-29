import Image from 'next/image';
import Link from 'next/link';

const items = ['Dashboard','Agenda','Tutores','Pets','Serviços','Caixa','Vendas','Financeiro','Estoque','Fidelidade','Relatórios','Forge Connect','Configurações'];
export default function AppShell({ children, master=false }: { children: React.ReactNode; master?: boolean }) {
  const menu = master ? ['Dashboard','Empresas','Planos','Assinaturas','Financeiro','Suporte','Usuários','Logs','Forge Connect','Configurações'] : items;
  return <div className="shell"><aside className="sidebar"><div className="brand"><Image src="/forgepets-logo.png" alt="ForgePets" width={180} height={70}/></div><nav className="nav">{menu.map((x,i)=><Link key={x} className={i===0?'active':''} href="#">{x}</Link>)}</nav></aside><main className="content">{children}</main></div>;
}
