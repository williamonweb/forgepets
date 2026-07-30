'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CadastroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (form.get('password') !== form.get('confirmPassword')) {
      setError('As senhas não conferem.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: form.get('ownerName'),
          companyName: form.get('companyName'),
          email: form.get('email'),
          phone: form.get('phone'),
          password: form.get('password')
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Não foi possível criar a conta.');
        return;
      }

      router.push('/app/configuracao-inicial');
      router.refresh();
    } catch {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <form className="card authWide" onSubmit={submit}>
        <Link className="back" href="/login">← Voltar ao login</Link>

        <div className="signupTrialBadge">2 DIAS GRÁTIS</div>
        <h2>Crie sua conta</h2>
        <div className="sub">Comece a organizar seu pet shop em poucos minutos.</div>

        {error && <div className="error">{error}</div>}

        <div className="formGrid">
          <div className="field">
            <label>Nome do responsável</label>
            <input name="ownerName" required autoComplete="name" />
          </div>
          <div className="field">
            <label>Nome do pet shop</label>
            <input name="companyName" required />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label>WhatsApp</label>
            <input name="phone" placeholder="(51) 99999-9999" required inputMode="tel" />
          </div>
          <div className="field">
            <label>Senha</label>
            <input name="password" type="password" minLength={8} required autoComplete="new-password" />
          </div>
          <div className="field">
            <label>Confirmar senha</label>
            <input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" />
          </div>
        </div>

        <div className="trialNote">
          Teste todos os recursos gratuitamente por 2 dias. Nenhum pagamento ou cartão é solicitado agora.
        </div>

        <button className="btn" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta e começar teste grátis'}
        </button>

        <p className="legal">
          Ao criar sua conta, você concorda com os Termos de Uso e a Política de Privacidade.
        </p>
      </form>
    </main>
  );
}
