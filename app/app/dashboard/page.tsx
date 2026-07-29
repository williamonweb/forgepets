import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (session.role === 'MASTER') {
    redirect('/master');
  }

  return (
    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#f4f6fb' }}>
      <iframe
        src="/forgepets/index.html"
        title="ForgePets"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block'
        }}
      />
    </main>
  );
}
