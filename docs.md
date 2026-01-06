# 📚 Fiscal Compass - Documentação do Usuário

Bem-vindo ao **Fiscal Compass**! Este guia completo irá ajudá-lo a entender todas as funcionalidades do sistema de gestão financeira.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Dashboard](#dashboard)
3. [Financeiro](#financeiro)
4. [Cadastros](#cadastros)
5. [Conciliação Bancária](#conciliação-bancária)
6. [Contratos](#contratos)
7. [Relatórios](#relatórios)
8. [Previsão de Caixa](#previsão-de-caixa)
9. [Planejamento](#planejamento)
10. [Programação Financeira](#programação-financeira)
11. [Configurações e Permissões](#configurações-e-permissões)

---

## 🏠 Visão Geral

O Fiscal Compass é um sistema completo de gestão financeira empresarial que permite:

- ✅ Controlar receitas e despesas
- ✅ Gerenciar múltiplas filiais
- ✅ Conciliar extratos bancários
- ✅ Gerar relatórios financeiros
- ✅ Criar lançamentos recorrentes
- ✅ Planejar orçamentos e metas
- ✅ Gerenciar contratos e documentos

### Seleção de Filial

O sistema permite trabalhar com múltiplas filiais. Utilize o seletor no topo da página para alternar entre as unidades. Todos os dados exibidos serão filtrados pela filial selecionada.

---

## 📊 Dashboard

A página inicial oferece uma visão consolidada das finanças.

### Recursos Disponíveis:

| Recurso | Descrição |
|---------|-----------|
| **Resumo Financeiro** | Cards com total de receitas, despesas e saldo |
| **Gráfico de Evolução** | Visualização mensal de receitas vs despesas |
| **Próximos Pagamentos** | Lista de contas a vencer nos próximos dias |
| **Transações Recentes** | Últimos lançamentos registrados |
| **Filtro por Ano** | Selecione o ano para visualizar dados históricos |

### Dicas:
- 💡 Clique em "Ver todos" para acessar a lista completa de lançamentos
- 💡 Os valores em verde indicam receitas, vermelho indicam despesas

---

## 💰 Financeiro

Módulo principal para gerenciamento de contas a pagar e receber.

### Funcionalidades:

#### 1. Criar Novo Lançamento
Clique em **"Novo Lançamento"** e preencha:

- **Tipo**: Receita ou Despesa
- **Valor**: Valor em reais
- **Status**: Pendente, Pago, Atrasado ou Cancelado
- **Descrição**: Identificação do lançamento
- **Data de Vencimento**: Quando a conta vence
- **Favorecido**: Cliente ou fornecedor relacionado
- **Categoria/Subcategoria**: Classificação para relatórios
- **Conta Bancária**: Para conciliação
- **Observações**: Notas adicionais

#### 2. Lançamentos Recorrentes 🔄

Para criar lançamentos que se repetem (aluguel, salários, assinaturas):

1. Marque a opção **"Lançamento recorrente"**
2. Escolha o **tipo de recorrência**:
   - Diário
   - Semanal
   - Mensal
   - Anual
3. Defina o **dia** da recorrência (ex: dia 10 do mês)
4. Opcionalmente, defina uma **data de término**

> 📌 **Importante**: Ao criar um lançamento recorrente, o sistema gera automaticamente os próximos **12 lançamentos**.

#### 3. Filtros

- **Por Mês**: Selecione o mês/ano desejado
- **Por Tipo**: Todos, Receitas ou Despesas
- **Busca**: Pesquise por descrição, favorecido ou categoria

#### 4. Ações em Lote

- Selecione múltiplos lançamentos usando os checkboxes
- Exclua vários itens de uma vez

#### 5. Ações Individuais

| Ícone | Ação |
|-------|------|
| ✓ (verde) | Marcar como pago |
| 🚫 | Cancelar lançamento |
| ✏️ | Editar lançamento |

#### 6. Importação e Exportação

- **Importar XML**: Importe notas fiscais eletrônicas (NF-e)
- **Exportar**: Gere arquivos Excel (.xlsx) ou CSV

---

## 📁 Cadastros

Gerenciamento de dados mestres do sistema.

### Abas Disponíveis:

#### 1. Favorecidos (Clientes/Fornecedores)

Cadastre pessoas físicas ou jurídicas:

- **Dados Básicos**: Nome, CPF/CNPJ, tipo
- **Contato**: E-mail, telefone
- **Endereço**: CEP (preenchimento automático), rua, cidade, etc.
- **Foto**: Upload de imagem do cadastro
- **Documentos**: Anexe contratos, comprovantes, etc.

**Filtros disponíveis**:
- Clientes
- Fornecedores
- Funcionários
- Outros

#### 2. Categorias

Organize seus lançamentos por categorias:

- **Nome da categoria**
- **Tipo**: Receita, Despesa ou Ambos
- **Cor**: Para identificação visual
- **Subcategorias**: Crie subdivisões
- **Recorrência padrão**: Defina se a categoria é recorrente por padrão

> 💡 Ao selecionar uma categoria com recorrência padrão em um lançamento, os campos de recorrência são preenchidos automaticamente.

#### 3. Filiais (apenas Admin/Gerente)

Gerencie as unidades da empresa:

- Nome da filial
- CNPJ
- Endereço completo
- Telefone e e-mail
- Ativar/Desativar filiais

#### 4. Contas Bancárias (apenas Admin/Gerente)

Cadastre as contas da empresa:

- **Nome**: Identificação da conta
- **Banco**: Nome do banco
- **Agência e Conta**: Dados bancários
- **Saldo Inicial**: Para conciliação

---

## 🏦 Conciliação Bancária

Compare extratos bancários com lançamentos do sistema.

### Como usar:

#### 1. Selecionar Conta Bancária
Escolha a conta que deseja conciliar.

#### 2. Importar Extrato
- Clique em **"Importar Extrato"**
- Selecione arquivo Excel (.xlsx) ou CSV
- O sistema irá processar as transações

**Formato esperado do arquivo**:
| Data | Descricao | Valor | Tipo | Saldo |
|------|-----------|-------|------|-------|
| 2026-01-05 | PIX RECEBIDO | 1500.00 | credito | 5000.00 |

#### 3. Conciliar Itens

Para cada item do extrato:

- **Correspondência encontrada**: Clique em **"Conciliar"** para vincular
- **Sem correspondência**: Clique em **"Criar Lançamento"** para criar um novo lançamento a partir do extrato

#### 4. Visualizar Resumo
Acompanhe:
- Total conciliado
- Pendentes do extrato
- Pendentes do sistema

---

## 📝 Contratos

Gerencie contratos com clientes e fornecedores.

### Funcionalidades:

#### Criar Contrato
- **Título e descrição**
- **Favorecido**: Cliente ou fornecedor
- **Valor do contrato**
- **Datas**: Início, fim e vencimento
- **Status**: Rascunho, Ativo, Vencido, Cancelado, Encerrado

#### Gestão de Documentos
- Upload de arquivos (PDF, imagens, etc.)
- Download dos documentos
- Exclusão de arquivos

#### Assinatura Digital
- Registre a data de assinatura
- Acompanhe contratos assinados vs pendentes

#### Resumo
- Cards com valores por status
- Contratos ativos vs vencidos

---

## 📈 Relatórios

Análises financeiras detalhadas.

### Tipos de Relatórios:

#### 1. DRE - Demonstração do Resultado

Visão consolidada de receitas e despesas:
- Total de receitas
- Total de despesas
- Resultado líquido
- Margem percentual

#### 2. Por Categoria

Gráficos de pizza e barras mostrando:
- Distribuição de gastos por categoria
- Comparativo receitas vs despesas por categoria

#### 3. Comparativo Mensal

Gráfico de evolução ao longo do ano:
- Linha de receitas
- Linha de despesas
- Tendências

#### 4. Fluxo de Caixa

Projeção de entradas e saídas:
- Saldo diário projetado
- Alertas de saldo negativo

#### 5. Aging (Vencimentos)

Análise de contas por período de vencimento:
- A vencer
- Vencido 1-30 dias
- Vencido 31-60 dias
- Vencido 61-90 dias
- Vencido > 90 dias

### Exportação
- **PDF**: Para impressão ou compartilhamento
- **Excel**: Para análises adicionais

---

## 🔮 Previsão de Caixa

Projete o fluxo de caixa futuro.

### Como usar:

1. **Defina o período**: Data inicial e final da projeção
2. **Informe o saldo inicial**: Valor atual em caixa
3. **Visualize o gráfico**: 
   - Linha verde: Entradas previstas
   - Linha vermelha: Saídas previstas
   - Área azul: Saldo projetado
   - Linha de referência: Linha do zero

### Alertas:
- ⚠️ O sistema alerta quando o saldo projetado fica negativo
- 📊 Totais de entradas, saídas e saldo final

---

## 🎯 Planejamento

Defina orçamentos e metas de vendas.

### Abas:

#### 1. Orçamento Anual

Planeje gastos por categoria:
- Selecione categoria e mês
- Defina valor orçado
- Compare orçado vs realizado
- Visualize variação percentual

**Gráfico comparativo**: Barras lado a lado de orçado vs realizado por categoria.

#### 2. Metas de Vendas

Gerencie metas de vendedores:
- Nome do vendedor
- Meta mensal em valor
- Valor de comissão por venda
- Acompanhe realizado vs meta
- Calcule comissões automaticamente

---

## 📅 Programação Financeira

Visualize lançamentos em formato de calendário.

### Recursos:

- **Calendário mensal**: Navegue entre os meses
- **Marcadores**: Veja quais dias têm lançamentos pendentes
- **Cores**: 
  - 🟢 Verde: Receitas
  - 🔴 Vermelho: Despesas
- **Clique no dia**: Veja detalhes dos lançamentos
- **Ação rápida**: Marque como pago diretamente do calendário

### Resumo Lateral:
- Total de receitas do mês
- Total de despesas do mês
- Saldo do mês

---

## ⚙️ Configurações e Permissões

### Níveis de Acesso:

| Perfil | Permissões |
|--------|------------|
| **Admin** | Acesso total, gerencia filiais e usuários |
| **Gerente** | Gerencia contas bancárias, visualiza relatórios |
| **Operador** | Lançamentos e cadastros básicos |
| **Visualizador** | Apenas consulta, sem edição |

### Tema
- Alterne entre modo claro e escuro usando o ícone 🌙/☀️ no cabeçalho

---

## ❓ Dúvidas Frequentes

### Como criar um lançamento recorrente?
1. Acesse **Financeiro > Novo Lançamento**
2. Marque **"Lançamento recorrente"**
3. Configure tipo, dia e período
4. Salve - o sistema criará 12 lançamentos automaticamente

### Como importar um extrato bancário?
1. Acesse **Conciliação Bancária**
2. Selecione a conta
3. Clique em **"Importar Extrato"**
4. Selecione arquivo .xlsx ou .csv

### Como ver lançamentos de meses anteriores?
No módulo **Financeiro**, use o seletor de mês ou clique em "Todos" para ver todos os períodos.

### Como exportar relatórios?
Em cada módulo há botões de **"Exportar"** para gerar arquivos Excel, CSV ou PDF.

---

## 🆘 Suporte

Em caso de dúvidas ou problemas:
- Verifique esta documentação
- Entre em contato com o administrador do sistema

---

*Fiscal Compass - Gestão Financeira Inteligente* 🧭
