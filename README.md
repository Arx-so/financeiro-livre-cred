# FinControl - Sistema de Gestão Financeira

Sistema completo de gestão financeira empresarial desenvolvido com React, TypeScript e Supabase.

## Funcionalidades

### Núcleo do Sistema
- **Autenticação e Controle de Acesso**: Login com controle de usuários e permissões (Admin, Gerente, Usuário)
- **Dashboard**: Visão geral e por filial
- **Gestão Financeira**: Contas a pagar/receber, lançamentos e relatórios
- **Planejamento Orçamentário**: Controle de metas de vendedores
- **Cadastros**: Clientes, funcionários e fornecedores com upload de foto
- **Contratos**: Gestão de contratos e categorias/subcategorias
- **Relatórios**: DRE e previsão financeira
- **Importação/Exportação**: XLS/CSV, PDF e XML

### Conciliação Bancária (Manual)
- Importação manual de extrato bancário em XLS/CSV
- Pareamento simples com lançamentos internos
- Regra básica por valor, data e descrição

## Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Backend/Auth**: Supabase
- **Gráficos**: Recharts
- **Formulários**: React Hook Form + Zod
- **Estado**: TanStack React Query

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Supabase

# Iniciar servidor de desenvolvimento
npm run dev
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Visualiza build de produção
- `npm run lint` - Executa linter

## Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
│   ├── layout/     # Layout e navegação
│   └── ui/         # Componentes shadcn/ui
├── contexts/       # Contextos React (Auth, etc.)
├── hooks/          # Custom hooks
├── lib/            # Utilitários e configurações
├── pages/          # Páginas da aplicação
├── services/       # Serviços de API (Supabase)
└── types/          # Definições de tipos TypeScript
```

## Licença

Projeto proprietário. Todos os direitos reservados.
