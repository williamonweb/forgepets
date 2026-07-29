'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const plans = [
  {
    name: 'Essencial',
    price: 'R$ 129',
    description: 'A gestão completa para organizar o dia a dia do seu pet shop.',
    features: [
      'Dashboard', 'Agenda', 'Tutores', 'Pets', 'Serviços', 'Caixa', 'Vendas',
      'Financeiro', 'Estoque', 'Relatórios básicos', 'Aniversários',
      'WhatsApp manual', 'Multiusuário', 'Backup', 'Forge Connect'
    ]
  },
  {
    name: 'Profissional',
    price: 'R$ 179',
    description: 'Mais fidelização, recorrência e relacionamento com seus clientes.',
    featured: true,
    features: [
      'Tudo do plano Essencial', 'Pontos', 'Cashback', 'Resgate de pontos',
      'Resgate de cashback', 'Histórico de fidelidade', 'Extrato do cliente',
      'Dashboard de fidelidade', 'Relatórios de fidelidade', 'Ranking de clientes',
      'Ajuste manual de pontos', 'Ajuste manual de cashback'
    ]
  },
  {
    name: 'Premium',
    price: 'R$ 219',
    description: 'Automação e inteligência para acelerar o crescimento do pet shop.',
    features: [
      'Tudo do plano Profissional', 'Níveis Bronze, Prata, Ouro, Diamante e VIP',
      'Benefícios por nível', 'Cupons automáticos', 'Campanhas de aniversário',
      'Automação de marketing', 'Segmentação de clientes', 'Relatórios VIP',
      'Regras avançadas'
    ]
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setPlansOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
          remember: form.get('remember') === 'on'
        })
      });

      const raw = await response.text();
      let data: {
        message?: string;
        role?: string;
        onboardingCompleted?: boolean;
      } = {};

      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { message: 'O servidor retornou uma resposta inválida.' };
        }
      }

      if (!response.ok) {
        return setError(data.message || 'Não foi possível entrar. Verifique a configuração do banco de dados.');
      }

      router.push(
        data.role === 'MASTER'
          ? '/master'
          : data.onboardingCompleted
            ? '/app/dashboard'
            : '/app/configuracao-inicial'
      );
      router.refresh();
    } catch {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login loginV82">
      <section className="hero heroV82">
        <div>
          <div className="heroLogoCard">
            <Image className="heroLogo" src="/forgepets-logo.png" alt="ForgePets" width={290} height={112} priority />
          </div>

          <div className="heroCopy">
            <span className="eyebrow">SISTEMA COMPLETO PARA PET SHOPS</span>
            <h1>Mais organização,<br />mais clientes e<br />mais <em>crescimento.</em></h1>
            <p>Organize agenda, tutores, pets, caixa, estoque, financeiro e fidelidade em uma única plataforma intuitiva e poderosa.</p>
          </div>

          <div className="heroFeatureGrid">
            <div className="heroFeature"><span className="featureIcon">▣</span><div><strong>Agenda inteligente</strong><small>Agendamentos rápidos e lembretes automáticos</small></div></div>
            <div className="heroFeature"><span className="featureIcon">$</span><div><strong>Caixa integrado</strong><small>Vendas, recebimentos e formas de pagamento</small></div></div>
            <div className="heroFeature"><span className="featureIcon">♙</span><div><strong>Clientes e pets</strong><small>Histórico completo e ficha individual do pet</small></div></div>
            <div className="heroFeature"><span className="featureIcon">◇</span><div><strong>Fidelidade e cashback</strong><small>Pontos, níveis, cupons e recompensas</small></div></div>
            <div className="heroFeature"><span className="featureIcon">🛒</span><div><strong>Estoque eficiente</strong><small>Controle de produtos e alertas de estoque baixo</small></div></div>
            <div className="heroFeature"><span className="featureIcon">▤</span><div><strong>Suporte Forge Connect</strong><small>Comunicação direta com o nosso time</small></div></div>
          </div>

          <div className="testimonial">
            <span className="quoteMark">“</span>
            <div>
              <p>O ForgePets transformou a gestão do nosso pet shop. Mais organização, mais eficiência e clientes muito mais felizes!</p>
              <strong>— Pet Shop Amigo Fiel</strong>
            </div>
            <span className="stars">★★★★★</span>
          </div>
        </div>

        <small className="heroVersion">ForgePets v8.4 · Desenvolvido pela Forge Labs</small>
      </section>

      <section className="loginPane loginPaneV82">
        <div className="loginContent">
          <div className="pawBadge">🐾</div>
          <h2>Bem-vindo de volta!</h2>
          <p className="loginSubtitle">Entre para acessar sua conta</p>

          <form className="loginForm" onSubmit={submit}>
            {error && <div className="error">{error}</div>}

            <div className="field loginField">
              <label>E-mail</label>
              <div className="inputWithIcon"><span>✉</span><input name="email" type="email" autoComplete="email" required placeholder="seu@email.com" /></div>
            </div>

            <div className="field loginField">
              <label>Senha</label>
              <div className="passwordField inputWithIcon"><span>▣</span><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Ocultar' : 'Mostrar'}</button></div>
            </div>

            <div className="loginOptions">
              <label className="check"><input name="remember" type="checkbox" /> Lembrar de mim</label>
              <Link href="/esqueci-senha">Esqueci minha senha</Link>
            </div>

            <button className="btn loginPrimary" disabled={loading}>{loading ? 'Entrando...' : 'Entrar no ForgePets'}</button>

            <div className="divider"><span>ou</span></div>
            <Link className="btn secondary createAccount" href="/cadastro">Criar minha conta</Link>

            <button className="plansLink" type="button" onClick={() => setPlansOpen(true)}><span>◇</span> Ver planos e preços <b>→</b></button>

            <div className="trialMessage">
              <span>Ainda não conhece o ForgePets?</span>
              <strong>Experimente gratuitamente por 2 dias.</strong>
              <span>Sem compromisso.</span>
            </div>
          </form>
        </div>

        <footer className="loginFooter">
          <span>© 2026 ForgePets. Todos os direitos reservados.</span>
          <nav><a href="#">Política de Privacidade</a><a href="#">Termos de Uso</a><a href="#">Status do Sistema</a><a href="#">Suporte</a></nav>
        </footer>
      </section>

      {plansOpen && (
        <div className="modalOverlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setPlansOpen(false); }}>
          <section className="plansModal" role="dialog" aria-modal="true" aria-labelledby="plans-title">
            <button className="modalClose" type="button" aria-label="Fechar" onClick={() => setPlansOpen(false)}>×</button>
            <header className="plansHeader">
              <span className="eyebrow dark">PLANOS FORGEPETS</span>
              <h2 id="plans-title">Escolha o plano ideal para o seu pet shop</h2>
              <p>Todos os planos começam com 2 dias de teste grátis e sem cobrança imediata.</p>
            </header>

            <div className="plansComparison">
              {plans.map(plan => (
                <article className={`modalPlan ${plan.featured ? 'featured' : ''}`} key={plan.name}>
                  {plan.featured && <span className="recommended">MAIS ESCOLHIDO</span>}
                  <h3>{plan.name}</h3>
                  <div className="modalPrice"><strong>{plan.price}</strong><span>/mês</span></div>
                  <p>{plan.description}</p>
                  <ul>{plan.features.map(feature => <li key={feature}>✓ {feature}</li>)}</ul>
                  <Link className="btn" href={`/cadastro?plano=${plan.name.toUpperCase()}`} onClick={() => setPlansOpen(false)}>Começar teste grátis</Link>
                </article>
              ))}
            </div>

            <div className="modalTrial"><strong>2 dias de teste grátis</strong><span>Sem cobrança agora · escolha o plano e conheça o sistema</span></div>
          </section>
        </div>
      )}
    </main>
  );
}
