'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const token = useSearchParams().get('token') || '';
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    setMsg('');

    const form = new FormData(e.currentTarget);
    const password = String(form.get('password') || '');
    const confirm = String(form.get('confirm') || '');

    if (password !== confirm) {
      setErr('As senhas não conferem.');
      return;
    }

    try {
      const response = await fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErr(data.message || 'Não foi possível redefinir a senha.');
        return;
      }

      setMsg(data.message || 'Senha redefinida com sucesso.');
    } catch {
      setErr('Não foi possível conectar ao servidor. Tente novamente.');
    }
  }

  return (
    <main className="authPage">
      <form className="card" onSubmit={submit}>
        <h2>Definir nova senha</h2>
        <div className="sub">
          Crie uma senha segura com pelo menos 8 caracteres.
        </div>

        {err && <div className="error">{err}</div>}

        {msg && (
          <div className="successBox">
            {msg} <Link href="/login">Ir para o login</Link>
          </div>
        )}

        <div className="field">
          <label>Nova senha</label>
          <input name="password" type="password" minLength={8} required />
        </div>

        <div className="field">
          <label>Confirmar senha</label>
          <input name="confirm" type="password" minLength={8} required />
        </div>

        <button className="btn" type="submit">
          Salvar nova senha
        </button>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="authPage">
          <div className="card">
            <h2>Carregando...</h2>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
