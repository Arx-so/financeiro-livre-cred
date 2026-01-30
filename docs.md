# 📚 Fiscal Compass - Documentação do Usuário

Bem-vindo ao **Fiscal Compass**! Este guia completo irá ajudá-lo a entender todas as funcionalidades do sistema de gestão financeira.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Dashboard](#dashboard)
3. [Financeiro](#financeiro)
4. [Produtos](#produtos)
5. [Cadastros](#cadastros)
6. [Conciliação Bancária](#conciliação-bancária)
7. [Contratos](#contratos)
8. [Templates de Contrato](#templates-de-contrato)
9. [Relatórios](#relatórios)
10. [Previsão de Caixa](#previsão-de-caixa)
11. [Planejamento](#planejamento)
12. [Programação Financeira](#programação-financeira)
13. [Configurações e Permissões](#configurações-e-permissões)

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
- ✅ Cadastrar e gerenciar produtos
- ✅ Gerar contratos automaticamente a partir de templates

### Segurança e Sessão Única

O sistema implementa **controle de sessão única** para garantir a segurança:

- 🔒 **Uma sessão por usuário**: Cada usuário pode estar logado em apenas um dispositivo por vez
- 🚫 **Bloqueio de login simultâneo**: Se você tentar fazer login enquanto já está logado em outro dispositivo, receberá uma mensagem de erro
- ⏰ **Sessões com expiração**: As sessões expiram automaticamente após 7 dias de inatividade

> 📌 **Dica**: Se precisar acessar de outro dispositivo, faça logout no dispositivo atual primeiro

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

#### 7. Página de Detalhes do Lançamento 🆕

Clique no título de qualquer lançamento para acessar a **página de detalhes** (`/financeiro/:id`):

| Seção | Informações |
|-------|-------------|
| **Informações Gerais** | Tipo, valor, status, datas de vencimento/pagamento |
| **Vínculos** | Favorecido, categoria, subcategoria, conta bancária |
| **Timeline de Status** | Histórico visual de mudanças de status com datas |
| **Atividades Recentes** | Log de todas as alterações feitas no lançamento |

**Ações disponíveis**:
- ✓ Marcar como pago (altera status para "pago")
- 🚫 Cancelar lançamento (altera status para "cancelado")
- ← Voltar para a listagem

---

## 📦 Produtos

Módulo completo para gerenciamento de produtos da empresa.

### Funcionalidades:

#### 1. Criar Novo Produto
Clique em **"Novo Produto"** e preencha:

- **Nome**: Nome do produto (obrigatório)
- **Descrição**: Descrição detalhada do produto
- **Categoria**: Classificação do produto
- **Valor Banco**: Valor referente ao banco
- **Percentual Banco**: Percentual do banco (%)
- **Valor Empresa**: Valor referente à empresa
- **Percentual Empresa**: Percentual da empresa (%)
- **Ativo**: Marcar se o produto está ativo

#### 2. Listagem de Produtos

Visualize todos os produtos cadastrados com:
- Nome e descrição
- Categoria vinculada
- Valores (banco e empresa)
- Status (ativo/inativo)

#### 3. Ações

| Ícone | Ação |
|-------|------|
| ✏️ | Editar produto |
| 🗑️ | Excluir produto |

### Dicas:
- 💡 Produtos inativos não aparecem nas seleções de contratos
- 💡 Os percentuais podem ser usados para cálculo automático de comissões

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
- **Status**: Criado, Em Aprovação, Aprovado, Ativo, Vencido, Cancelado, Encerrado

#### Regras para Contratos de Vendas 🆕

Quando um **vendedor** é selecionado no contrato:

- ✅ **Categoria automática**: A categoria é automaticamente definida como **"Vendas"**
  - O campo de categoria fica desabilitado quando há vendedor selecionado
  - A categoria "Vendas" deve existir no sistema
- ✅ **Produto obrigatório**: O campo "Tipo" se torna um **select de produtos**
  - Apenas produtos ativos aparecem na lista
  - O valor salvo é o nome do produto cadastrado
- 📌 **Importante**: Para contratos sem vendedor, a categoria e tipo podem ser escolhidos livremente

#### Fluxo de Aprovação 🆕

1. **Criar**: Contrato criado com status "Criado"
2. **Enviar para Aprovação**: Status muda para "Em Aprovação"
3. **Aprovar/Rejeitar**: 
   - Gerentes e Admins podem aprovar (status: "Aprovado")
   - Ou rejeitar (volta para "Criado")
4. **Assinar**: Após aprovação, o contrato pode ser assinado (status: "Ativo")
5. **Proteção**: 
   - ⚠️ **Contratos aprovados NÃO podem ser editados**
   - ⚠️ **Contratos aprovados NÃO podem ser excluídos**
   - Os botões de editar e excluir ficam ocultos para contratos aprovados

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

#### Exportar para PDF 🆕

Gere PDFs dos contratos usando templates:
1. Clique no botão **"Exportar PDF"** ao lado do contrato
2. Selecione o template desejado
3. O sistema substituirá as variáveis automaticamente
4. O PDF será baixado com os dados do cliente preenchidos

---

## 📄 Templates de Contrato

Crie e gerencie modelos de contratos para geração automática.

### Acessando Templates

Acesse através do menu **Vendas > Templates** ou pelo botão "Templates" na página de Contratos.

### Funcionalidades:

#### 1. Criar Template
Clique em **"Novo Template"** e preencha:

- **Nome**: Nome identificador do template
- **Descrição**: Descrição do propósito do template
- **Conteúdo**: Texto do contrato com variáveis

#### 2. Variáveis Disponíveis

Use variáveis entre chaves duplas que serão substituídas automaticamente:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{nome}}` | Nome do cliente | João Silva |
| `{{documento}}` | CPF ou CNPJ | 123.456.789-00 |
| `{{email}}` | E-mail do cliente | joao@email.com |
| `{{telefone}}` | Telefone | (11) 99999-9999 |
| `{{endereco}}` | Endereço completo | Rua A, 123 - Centro |
| `{{valor}}` | Valor do contrato | R$ 1.500,00 |
| `{{data}}` | Data atual | 15/01/2026 |
| `{{descricao}}` | Descrição do contrato | Serviço de consultoria |

#### 3. Exemplo de Template

```
CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Contratante: {{nome}}
CPF/CNPJ: {{documento}}
Endereço: {{endereco}}

Valor: {{valor}}
Data: {{data}}

Descrição do serviço:
{{descricao}}

Assinaturas:
_________________________
{{nome}}
```

#### 4. Gerar Contrato em PDF

1. Na página de **Contratos**, clique em **"Exportar PDF"** no contrato desejado
2. Selecione o template a ser usado
3. O sistema gerará um PDF com todas as variáveis substituídas pelos dados reais
4. O download será iniciado automaticamente

### Dicas:
- 💡 Crie templates diferentes para tipos de serviço (vendas, locação, consultoria)
- 💡 Sempre preencha o favorecido no contrato para que as variáveis sejam substituídas corretamente
- 💡 Templates inativos não aparecem na seleção de geração de PDF

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

### Como gerar um contrato em PDF a partir de um template?
1. Acesse **Vendas > Contratos**
2. Localize o contrato desejado
3. Clique no botão **"Exportar PDF"**
4. Selecione o template na lista
5. O PDF será gerado e baixado automaticamente

### Como criar um template de contrato?
1. Acesse **Vendas > Templates**
2. Clique em **"Novo Template"**
3. Preencha nome, descrição e conteúdo
4. Use variáveis como `{{nome}}`, `{{documento}}` no texto
5. Salve o template

### Por que não consigo fazer login?
Possíveis causas:
1. **Sessão ativa em outro dispositivo**: O sistema permite apenas uma sessão por usuário. Faça logout no outro dispositivo primeiro.
2. **Credenciais incorretas**: Verifique usuário e senha.
3. **Conta inativa**: Entre em contato com o administrador.

### Como cadastrar um produto?
1. Acesse **Cadastros > Produtos**
2. Clique em **"Novo Produto"**
3. Preencha nome, valores e categoria
4. Salve o produto

---

## 🆘 Suporte

Em caso de dúvidas ou problemas:
- Verifique esta documentação
- Entre em contato com o administrador do sistema

---

*Fiscal Compass - Gestão Financeira Inteligente* 🧭
