# TODO - Sistema FinControl

> Análise realizada em: 15/01/2026  
> Status geral: ~70-75% do escopo implementado

---

## Legenda

- [ ] Pendente
- [x] Concluído
- [~] Em andamento / Parcial

---

## 1. Login e Controle de Usuário

- [x] Tela de login funcional
- [x] Identificação por unidade/loja
- [ ] **Controle de sessão única** - Impedir login simultâneo do mesmo usuário
  - Criar tabela `active_sessions` no Supabase
  - Verificar sessão ativa antes de permitir novo login
  - Invalidar sessão anterior ou bloquear novo acesso
  - Implementar cleanup de sessões expiradas
- [~] Logo na tela de login - Atualmente usa ícone Wallet, substituir por logo real
  - Arquivo: `src/pages/Login.tsx`
  - Usar imagem de `public/logo.jpeg`

---

## 2. Dashboard Geral e por Filial

- [x] Painéis com gráficos e indicadores
- [x] Resumo financeiro (receitas, despesas, saldo)
- [x] Dashboard por loja (filtro por unidade)
- [~] Resumo de atendimentos e vendas
  - Adicionar cards de atendimentos quando módulo de vendas estiver pronto
  - Integrar com metas de vendedores

---

## 3. Financeiro Completo

- [x] Lançamentos a pagar e receber
- [x] CRUD completo de lançamentos
- [x] Programação de pagamentos (calendário)
- [x] Status: pendente, pago, atrasado, cancelado
- [x] Lançamentos recorrentes (diário/semanal/mensal/anual)
- [~] **Tela detalhada de pagamento**
  - Criar página `/financeiro/:id` com detalhes completos
  - Histórico de alterações
  - Documentos anexados
  - Timeline de status
- [~] Relatórios internos na programação
  - Adicionar resumo por categoria no calendário
  - Exportar programação do período

---

## 4. Planejamento Orçamentário

- [x] Planejamento mensal/diário/semanal/anual
- [x] Distribuição automática por 12 meses
- [x] Comparativo planejado x realizado

---

## 5. Planejamento de Metas de Vendedores

- [x] Metas por vendedor
- [~] Comissões e premiações
  - Campos existem (`commission_rate`, `bonus_rate`)
  - [ ] Implementar cálculo automático de comissões
  - [ ] Relatório de comissões por período
  - [ ] Dashboard de premiações
- [ ] **Cruzamento com vendas**
  - Integrar vendas (contratos) com metas
  - Atualizar `achieved_amount` automaticamente
  - Vincular vendedor ao contrato

---

## 6. Cadastros (Atendimento e Vendas)

- [x] Cadastro PF/PJ (clientes, funcionários, fornecedores)
- [x] Upload de documentos
- [x] Listas com filtros
- [~] **Captura de foto via webcam**
  - Adicionar botão de captura no form de favorecido
  - Usar API MediaDevices.getUserMedia()
  - Preview antes de salvar
  - Suporte a câmera frontal em dispositivos móveis
- [ ] **Cadastro de Produtos** (ALTA PRIORIDADE)
  - Criar tabela `products` no banco
    ```sql
    CREATE TABLE products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR NOT NULL,
      description TEXT,
      category_id UUID REFERENCES categories(id),
      bank_value DECIMAL(15,2) DEFAULT 0,
      bank_percentage DECIMAL(5,2) DEFAULT 0,
      company_value DECIMAL(15,2) DEFAULT 0,
      company_percentage DECIMAL(5,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    ```
  - Criar service `products.ts`
  - Criar hook `useProducts.ts`
  - Criar página `Produtos/` com CRUD completo
  - Adicionar rota no `App.tsx`
  - Adicionar no menu lateral

---

## 7. Sistema de Contratos

- [x] Área segura para arquivos (Supabase Storage)
- [x] Upload de arquivos
- [~] Assinatura digital
  - Campos `signed_by` e `signed_at` existem
  - [ ] Integrar com serviço de assinatura (DocuSign, ClickSign, etc.)
  - [ ] Fluxo de aprovação de assinatura
- [ ] **Geração automática de contratos** (ALTA PRIORIDADE)
  - Criar tabela `contract_templates`
  - Editor de templates com variáveis
  - Substituição automática de dados do cliente
  - Geração de PDF a partir do template
  - Variáveis suportadas: nome, documento, endereço, valor, data, etc.
- [ ] **Impressão de contratos**
  - Botão de imprimir na listagem
  - Preview de impressão
  - Configuração de layout

---

## 8. Categorias e Subcategorias

- [x] Cadastro de categorias
- [x] Subcategorias
- [x] Uso em planejamento e relatórios

---

## 9. Relatórios

- [x] Relatórios com gráficos e tabelas
- [x] Por categoria/subcategoria
- [x] DRE (Demonstrativo de Resultado do Exercício)
- [x] Previsão financeira com gráfico
- [x] Relatório Aging
- [~] Por favorecido
  - Função `getTopFavorecidos` existe
  - [ ] Adicionar aba "Por Favorecido" na página de relatórios
  - [ ] Exibir ranking de clientes/fornecedores
- [ ] **Busca avançada** (MÉDIA PRIORIDADE)
  - Criar componente `AdvancedSearch`
  - Filtros disponíveis:
    - [ ] Por cliente
    - [ ] Por fornecedor
    - [ ] Por telefone
    - [ ] Por período (datas)
    - [ ] Por produto (quando implementado)
    - [ ] Por categoria e subcategoria
    - [ ] Por banco/conta
  - Salvar filtros favoritos
  - Exportar resultados filtrados

---

## 10. Importação e Exportação

- [x] Importação XLS/CSV
- [x] Importação XML (NF-e)
- [x] Exportação XLS
- [x] Exportação PDF
- [ ] **Exportação XML**
  - Criar função `exportToXML` em `importExport.ts`
  - Suportar formatos:
    - XML genérico
    - Layout bancário (CNAB)
    - Integração contábil

---

## Funcionalidades Extras (Já Implementadas)

- [x] Conciliação Bancária
- [x] Contas Bancárias
- [x] Gestão de Filiais
- [x] Agenda e Notificações
- [x] Logs de Atividade

---

## Priorização

### Sprint 1 - Alta Prioridade
1. [ ] Controle de sessão única
2. [ ] Cadastro de produtos
3. [ ] Tela detalhada de pagamento
4. [ ] Geração automática de contratos

### Sprint 2 - Média Prioridade
5. [ ] Captura de foto via webcam
6. [ ] Busca avançada em relatórios
7. [ ] Cálculo automático de comissões
8. [ ] Exportação XML

### Sprint 3 - Baixa Prioridade
9. [ ] Impressão de contratos
10. [ ] Relatórios internos na programação
11. [ ] Integração assinatura digital
12. [ ] Usar logo real na tela de login

---

## Notas Técnicas

### Stack Atual
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **State**: Zustand + TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Gráficos**: Recharts
- **Exportação**: xlsx, jspdf, papaparse

### Arquivos Principais
- `src/App.tsx` - Rotas principais
- `src/stores/` - Estado global (auth, branch)
- `src/services/` - Chamadas ao Supabase
- `src/hooks/` - Hooks customizados (React Query)
- `src/pages/` - Páginas/módulos do sistema
- `src/components/` - Componentes reutilizáveis
- `supabase/migrations/` - Migrações do banco

### Convenções
- Páginas seguem padrão Container/View pattern
- Hooks de página: `use[NomePagina]Page.ts`
- Services exportam funções assíncronas para Supabase
- Types centralizados em `src/types/database.ts`
