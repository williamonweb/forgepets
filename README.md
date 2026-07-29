# ForgePets v8.0 — Base SaaS

Nova fundação do ForgePets preparada para GitHub, Vercel e Neon.

## O que já está pronto

- Next.js 14 + React 18 + TypeScript
- Prisma + PostgreSQL/Neon
- Estrutura multiempresa por `companyId`
- Login real com senha criptografada
- Sessão segura por cookie HTTP-only
- Painel do pet shop e Painel Master separados
- Schema inicial para tutores, pets, serviços, agenda, caixa, pagamentos, estoque, fidelidade, planos e Forge Connect
- Base operacional zerada
- Interface inicial preservando a identidade do ForgePets

## Primeira execução

1. Crie um banco PostgreSQL no Neon.
2. Copie `.env.example` para `.env`.
3. Preencha `DATABASE_URL` e `AUTH_SECRET`.
4. Rode:

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Abra `http://localhost:3000`.

## Contas iniciais de teste

- Cliente: `admin@forgepets.com` / `123456`
- Master: `master@forgepets.com` / `123456`

Troque essas senhas antes de colocar clientes reais.

## Publicação no GitHub

```bash
git init
git add .
git commit -m "Base SaaS ForgePets v8.0"
git branch -M main
git remote add origin SEU_REPOSITORIO
git push -u origin main
```

## Publicação na Vercel

1. Importe o repositório na Vercel.
2. Cadastre `DATABASE_URL` e `AUTH_SECRET` em Environment Variables.
3. Faça o deploy.
4. No primeiro uso do banco, execute `npx prisma db push` e `npm run db:seed` localmente apontando para o Neon.

## Próxima etapa recomendada

Migrar nesta ordem:

1. Empresas e usuários
2. Tutores e pets
3. Serviços e agenda
4. Atendimento, contas a receber e caixa
5. Estoque e financeiro
6. Fidelidade por plano
7. Painel Master e Forge Connect


## Novidades da v8.2

- Login profissional com mostrar senha, manter conectado, cadastro e recuperação de senha.
- Cadastro público em duas etapas com escolha de plano.
- Criação automática da empresa e do usuário proprietário.
- Período de teste configurável pelo registro `SaaSSettings`.
- Assistente de primeiro acesso para dados comerciais e serviços oferecidos.
- Recuperação de senha com token de uso único, hash SHA-256 e validade de 1 hora.

### Envio de e-mail

A segurança e o fluxo de recuperação já estão implementados. Enquanto um provedor de e-mail não estiver configurado, o link de recuperação é exibido apenas no log do servidor. Antes da produção, conecte Resend, Zoho SMTP ou outro provedor transacional dentro de `app/api/auth/esqueci-senha/route.ts`.

### Após atualizar o projeto

Execute:

```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```


## Período de teste

Novas contas recebem 2 dias de teste gratuito.
