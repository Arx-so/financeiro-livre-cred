# TODO - Sistema LivreCred

> Análise realizada em: 15/01/2026  
> Status geral: ~85% do escopo implementado  
> Sprint 1 concluído em: 15/01/2026

---

## Legenda

- [ ] Pendente
- [x] Concluído
- [~] Em andamento / Parcial

---

## 1. Login e Controle de Usuário

- [x] Tela de login funcional
- [x] Identificação por unidade/loja
- [x] **Controle de sessão única** - Impedir login simultâneo do mesmo usuário ✅
  - [x] Tabela `active_sessions` criada (migração 010)
  - [x] Service `sessions.ts` com funções de gerenciamento
  - [x] Verificação de sessão ativa antes de permitir novo login
  - [x] Bloqueio de novo login quando sessão existe
  - [x] Cleanup de sessões expiradas via função SQL
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
- [x] **Tela detalhada de pagamento** ✅
  - [x] Página `/financeiro/:id` com detalhes completos
  - [x] Histórico de alterações (activity logs)
  - [x] Timeline de status
  - [x] Botões de ação (marcar pago, cancelar)
  - [x] Link clicável na listagem de lançamentos
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
- [x] **Cadastro de Produtos** ✅
  - [x] Tabela `products` criada (migração 011)
  - [x] Service `products.ts` com CRUD completo
  - [x] Hook `useProducts.ts` com React Query
  - [x] Página `Produtos/` com Container/View pattern
  - [x] Rota `/produtos` adicionada
  - [x] Item "Produtos" adicionado no menu lateral

---

## 7. Sistema de Contratos

- [x] Área segura para arquivos (Supabase Storage)
- [x] Upload de arquivos
- [~] Assinatura digital
  - Campos `signed_by` e `signed_at` existem
  - [ ] Integrar com serviço de assinatura (DocuSign, ClickSign, etc.)
  - [ ] Fluxo de aprovação de assinatura
- [x] **Geração automática de contratos** ✅
  - [x] Tabela `contract_templates` criada (migração 012)
  - [x] Página `/vendas/templates` para gerenciar templates
  - [x] Editor de templates com variáveis
  - [x] Substituição automática de dados do cliente
  - [x] Geração de PDF com jsPDF
  - [x] Variáveis suportadas: {{nome}}, {{documento}}, {{email}}, {{telefone}}, {{endereco}}, {{valor}}, {{data}}, {{descricao}}
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

### Sprint 1 - Alta Prioridade ✅ CONCLUÍDO
1. [x] Controle de sessão única
2. [x] Cadastro de produtos
3. [x] Tela detalhada de pagamento
4. [x] Geração automática de contratos

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

### Migrações Recentes (Sprint 1)
- `010_active_sessions.sql` - Tabela de sessões ativas para controle de login único
- `011_products.sql` - Tabela de produtos com valores banco/empresa
- `012_contract_templates.sql` - Tabela de templates de contrato

### Services Adicionados (Sprint 1)
- `sessions.ts` - Gerenciamento de sessões ativas
- `products.ts` - CRUD de produtos
- `contractTemplates.ts` - Templates e geração de PDF
