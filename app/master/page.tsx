import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function Master() {
  const session = await getSession();
  if (!session) return redirect('/login');
  if (session.role !== 'MASTER') return redirect('/app/dashboard');
  return <iframe title="ForgePets Master" src="/admin.html" style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,background:'#f6f7fb'}} />;
}
