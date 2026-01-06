import { AppLayout } from '@/components/layout/AppLayout';
import { 
  BookOpen, 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Building2, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Repeat,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { useState } from 'react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState('visao-geral');

  const sections: DocSection[] = [
    {
      id: 'visao-geral',
      title: 'Visão Geral',
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Bem-vindo ao Fiscal Compass!</h2>
          <p className="text-muted-foreground">
            O Fiscal Compass é um sistema completo de gestão financeira empresarial que permite controlar 
            todas as operações financeiras da sua empresa de forma simples e eficiente.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-income/10 rounded-lg border border-income/20">
              <CheckCircle2 className="w-6 h-6 text-income mb-2" />
              <h4 className="font-semibold text-foreground">Controle de Receitas e Despesas</h4>
              <p className="text-sm text-muted-foreground">Registre e acompanhe todos os lançamentos financeiros</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <Building2 className="w-6 h-6 text-primary mb-2" />
              <h4 className="font-semibold text-foreground">Múltiplas Filiais</h4>
              <p className="text-sm text-muted-foreground">Gerencie várias unidades em um único sistema</p>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <Repeat className="w-6 h-6 text-warning mb-2" />
              <h4 className="font-semibold text-foreground">Lançamentos Recorrentes</h4>
              <p className="text-sm text-muted-foreground">Automatize despesas e receitas que se repetem</p>
            </div>
            <div className="p-4 bg-info/10 rounded-lg border border-info/20">
              <BarChart3 className="w-6 h-6 text-info mb-2" />
              <h4 className="font-semibold text-foreground">Relatórios Completos</h4>
              <p className="text-sm text-muted-foreground">Análises detalhadas para tomada de decisão</p>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Dica: Seletor de Filial</h4>
                <p className="text-sm text-muted-foreground">
                  Use o seletor no topo da página para alternar entre as filiais. 
                  Todos os dados exibidos serão filtrados pela unidade selecionada.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            A página inicial oferece uma visão consolidada das finanças da sua empresa.
          </p>

          <h3 className="text-lg font-semibold text-foreground mt-6">Recursos Disponíveis</h3>
          <div className="space-y-3">
            <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Resumo Financeiro</h4>
                <p className="text-sm text-muted-foreground">Cards com total de receitas, despesas e saldo do período</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Gráfico de Evolução</h4>
                <p className="text-sm text-muted-foreground">Visualização mensal de receitas vs despesas ao longo do ano</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Próximos Pagamentos</h4>
                <p className="text-sm text-muted-foreground">Lista de contas a vencer nos próximos dias</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
              <ChevronRight className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Transações Recentes</h4>
                <p className="text-sm text-muted-foreground">Últimos lançamentos registrados no sistema</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Dica</h4>
                <p className="text-sm text-muted-foreground">
                  Use o seletor de ano para visualizar dados históricos. 
                  Clique em "Ver todos" para acessar a lista completa de lançamentos.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: Wallet,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
          <p className="text-muted-foreground">
            Módulo principal para gerenciamento de contas a pagar e receber.
          </p>

          <h3 className="text-lg font-semibold text-foreground">Criar Novo Lançamento</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Clique em <strong>"Novo Lançamento"</strong> e preencha os seguintes campos:
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium text-foreground">Campo</th>
                  <th className="text-left py-2 px-3 font-medium text-foreground">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr><td className="py-2 px-3 text-foreground">Tipo</td><td className="py-2 px-3 text-muted-foreground">Receita ou Despesa</td></tr>
                <tr><td className="py-2 px-3 text-foreground">Valor</td><td className="py-2 px-3 text-muted-foreground">Valor em reais</td></tr>
                <tr><td className="py-2 px-3 text-foreground">Status</td><td className="py-2 px-3 text-muted-foreground">Pendente, Pago, Atrasado ou Cancelado</td></tr>
                <tr><td className="py-2 px-3 text-foreground">Descrição</td><td className="py-2 px-3 text-muted-foreground">Identificação do lançamento</td></tr>
                <tr><td className="py-2 px-3 text-foreground">Data de Vencimento</td><td className="py-2 px-3 text-muted-foreground">Quando a conta vence</td></tr>
                <tr><td className="py-2 px-3 text-foreground">Favorecido</td><td className="py-2 px-3 text-muted-foreground">Cliente ou fornecedor relacionado</td></tr>
                <tr><td className="py-2 px-3 text-foreground">Categoria</td><td className="py-2 px-3 text-muted-foreground">Classificação para relatórios</td></tr>
                <tr><td className="py-2 px-3 text-foreground">Conta Bancária</td><td className="py-2 px-3 text-muted-foreground">Para conciliação bancária</td></tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-6 flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Lançamentos Recorrentes
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para criar lançamentos que se repetem (aluguel, salários, assinaturas):
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Marque a opção <strong>"Lançamento recorrente"</strong></li>
            <li>Escolha o <strong>tipo de recorrência</strong>: Diário, Semanal, Mensal ou Anual</li>
            <li>Defina o <strong>dia</strong> da recorrência (ex: dia 10 do mês)</li>
            <li>Opcionalmente, defina uma <strong>data de término</strong></li>
          </ol>

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Importante</h4>
                <p className="text-sm text-muted-foreground">
                  Ao criar um lançamento recorrente, o sistema gera automaticamente os próximos <strong>12 lançamentos</strong>.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-6">Filtros</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Por Mês:</strong> Selecione o mês/ano desejado</li>
            <li><strong>Por Tipo:</strong> Todos, Receitas ou Despesas</li>
            <li><strong>Busca:</strong> Pesquise por descrição, favorecido ou categoria</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mt-6">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-income/10 rounded-lg text-center">
              <CheckCircle2 className="w-6 h-6 text-income mx-auto mb-1" />
              <p className="text-sm font-medium text-foreground">Marcar como Pago</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <FileText className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-medium text-foreground">Editar</p>
            </div>
            <div className="p-3 bg-expense/10 rounded-lg text-center">
              <AlertCircle className="w-6 h-6 text-expense mx-auto mb-1" />
              <p className="text-sm font-medium text-foreground">Cancelar</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'cadastros',
      title: 'Cadastros',
      icon: Users,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Cadastros</h2>
          <p className="text-muted-foreground">
            Gerenciamento de dados mestres do sistema.
          </p>

          <h3 className="text-lg font-semibold text-foreground">Favorecidos (Clientes/Fornecedores)</h3>
          <p className="text-sm text-muted-foreground mb-3">Cadastre pessoas físicas ou jurídicas:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Dados Básicos:</strong> Nome, CPF/CNPJ, tipo (Cliente, Fornecedor, Funcionário, Outro)</li>
            <li><strong>Contato:</strong> E-mail, telefone</li>
            <li><strong>Endereço:</strong> CEP (preenchimento automático), rua, cidade, etc.</li>
            <li><strong>Foto:</strong> Upload de imagem do cadastro</li>
            <li><strong>Documentos:</strong> Anexe contratos, comprovantes, etc.</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mt-6">Categorias</h3>
          <p className="text-sm text-muted-foreground mb-3">Organize seus lançamentos por categorias:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Nome e Cor:</strong> Para identificação visual</li>
            <li><strong>Tipo:</strong> Receita, Despesa ou Ambos</li>
            <li><strong>Subcategorias:</strong> Crie subdivisões mais específicas</li>
            <li><strong>Recorrência padrão:</strong> Defina se a categoria é recorrente por padrão</li>
          </ul>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Dica</h4>
                <p className="text-sm text-muted-foreground">
                  Ao selecionar uma categoria com recorrência padrão em um lançamento, 
                  os campos de recorrência são preenchidos automaticamente.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-6">Filiais (Admin/Gerente)</h3>
          <p className="text-sm text-muted-foreground mb-3">Gerencie as unidades da empresa:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Nome da filial e CNPJ</li>
            <li>Endereço completo</li>
            <li>Telefone e e-mail</li>
            <li>Ativar/Desativar filiais</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mt-6">Contas Bancárias (Admin/Gerente)</h3>
          <p className="text-sm text-muted-foreground mb-3">Cadastre as contas da empresa:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Nome (identificação da conta)</li>
            <li>Banco, Agência e Conta</li>
            <li>Saldo Inicial (para conciliação)</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'conciliacao',
      title: 'Conciliação Bancária',
      icon: Building2,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Conciliação Bancária</h2>
          <p className="text-muted-foreground">
            Compare extratos bancários com lançamentos do sistema para garantir que todos os 
            valores estão corretamente registrados.
          </p>

          <h3 className="text-lg font-semibold text-foreground">Como Usar</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
            <li>
              <strong>Selecione a Conta Bancária</strong>
              <p className="ml-5 mt-1">Escolha a conta que deseja conciliar no seletor.</p>
            </li>
            <li>
              <strong>Importe o Extrato</strong>
              <p className="ml-5 mt-1">Clique em "Importar Extrato" e selecione um arquivo Excel (.xlsx) ou CSV.</p>
            </li>
            <li>
              <strong>Concilie os Itens</strong>
              <p className="ml-5 mt-1">Para cada item do extrato, vincule ao lançamento correspondente no sistema.</p>
            </li>
          </ol>

          <h3 className="text-lg font-semibold text-foreground mt-6">Formato do Arquivo de Extrato</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead className="bg-muted">
                <tr>
                  <th className="py-2 px-3 text-left font-medium text-foreground">Data</th>
                  <th className="py-2 px-3 text-left font-medium text-foreground">Descricao</th>
                  <th className="py-2 px-3 text-left font-medium text-foreground">Valor</th>
                  <th className="py-2 px-3 text-left font-medium text-foreground">Tipo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="py-2 px-3 text-muted-foreground">2026-01-05</td>
                  <td className="py-2 px-3 text-muted-foreground">PIX RECEBIDO</td>
                  <td className="py-2 px-3 text-muted-foreground">1500.00</td>
                  <td className="py-2 px-3 text-muted-foreground">credito</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-6">Ações Disponíveis</h3>
          <div className="space-y-3">
            <div className="flex gap-3 p-3 bg-income/10 rounded-lg border border-income/20">
              <CheckCircle2 className="w-5 h-5 text-income shrink-0" />
              <div>
                <h4 className="font-medium text-foreground">Conciliar</h4>
                <p className="text-sm text-muted-foreground">Vincule um item do extrato ao lançamento correspondente</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h4 className="font-medium text-foreground">Criar Lançamento</h4>
                <p className="text-sm text-muted-foreground">Crie um novo lançamento a partir de um item do extrato sem correspondência</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'contratos',
      title: 'Contratos',
      icon: FileText,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Contratos</h2>
          <p className="text-muted-foreground">
            Gerencie contratos com clientes e fornecedores.
          </p>

          <h3 className="text-lg font-semibold text-foreground">Criar Contrato</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>Título e descrição:</strong> Identificação do contrato</li>
            <li><strong>Favorecido:</strong> Cliente ou fornecedor vinculado</li>
            <li><strong>Valor:</strong> Valor total do contrato</li>
            <li><strong>Datas:</strong> Início, fim e vencimento</li>
            <li><strong>Status:</strong> Rascunho, Ativo, Vencido, Cancelado, Encerrado</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mt-6">Gestão de Documentos</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Upload de arquivos (PDF, imagens, etc.)</li>
            <li>Download dos documentos anexados</li>
            <li>Exclusão de arquivos</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mt-6">Assinatura Digital</h3>
          <p className="text-sm text-muted-foreground">
            Registre a data de assinatura e acompanhe contratos assinados vs pendentes.
          </p>
        </div>
      ),
    },
    {
      id: 'relatorios',
      title: 'Relatórios',
      icon: BarChart3,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-muted-foreground">
            Análises financeiras detalhadas para tomada de decisão.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">DRE - Demonstração do Resultado</h4>
              <p className="text-sm text-muted-foreground">
                Visão consolidada de receitas e despesas, resultado líquido e margem percentual.
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Por Categoria</h4>
              <p className="text-sm text-muted-foreground">
                Gráficos de pizza e barras mostrando distribuição de gastos por categoria.
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Comparativo Mensal</h4>
              <p className="text-sm text-muted-foreground">
                Gráfico de evolução de receitas e despesas ao longo do ano.
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Fluxo de Caixa</h4>
              <p className="text-sm text-muted-foreground">
                Projeção de entradas e saídas com alertas de saldo negativo.
              </p>
            </div>
            <div className="p-4 border border-border rounded-lg md:col-span-2">
              <h4 className="font-semibold text-foreground mb-2">Aging (Vencimentos)</h4>
              <p className="text-sm text-muted-foreground">
                Análise de contas por período de vencimento: A vencer, 1-30 dias, 31-60 dias, 61-90 dias, {'>'}90 dias.
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-6">Exportação</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li><strong>PDF:</strong> Para impressão ou compartilhamento</li>
            <li><strong>Excel:</strong> Para análises adicionais em planilhas</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'previsao',
      title: 'Previsão de Caixa',
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Previsão de Caixa</h2>
          <p className="text-muted-foreground">
            Projete o fluxo de caixa futuro da sua empresa.
          </p>

          <h3 className="text-lg font-semibold text-foreground">Como Usar</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>Defina o período:</strong> Data inicial e final da projeção</li>
            <li><strong>Informe o saldo inicial:</strong> Valor atual disponível em caixa</li>
            <li><strong>Visualize o gráfico:</strong> Veja entradas, saídas e saldo projetado</li>
          </ol>

          <h3 className="text-lg font-semibold text-foreground mt-6">Legenda do Gráfico</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-income"></div>
              <span className="text-sm text-muted-foreground">Linha verde: Entradas previstas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-expense"></div>
              <span className="text-sm text-muted-foreground">Linha vermelha: Saídas previstas</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded bg-primary"></div>
              <span className="text-sm text-muted-foreground">Área azul: Saldo projetado</span>
            </div>
          </div>

          <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Alertas</h4>
                <p className="text-sm text-muted-foreground">
                  O sistema alerta quando o saldo projetado fica negativo, 
                  permitindo ações preventivas.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'programacao',
      title: 'Programação Financeira',
      icon: Calendar,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Programação Financeira</h2>
          <p className="text-muted-foreground">
            Visualize seus lançamentos em formato de calendário.
          </p>

          <h3 className="text-lg font-semibold text-foreground">Recursos</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>Calendário mensal:</strong> Navegue entre os meses usando as setas</li>
            <li><strong>Marcadores coloridos:</strong> Veja quais dias têm lançamentos pendentes</li>
            <li><strong>Cores:</strong> Verde para receitas, vermelho para despesas</li>
            <li><strong>Detalhes:</strong> Clique no dia para ver os lançamentos</li>
            <li><strong>Ação rápida:</strong> Marque como pago diretamente do calendário</li>
          </ul>

          <h3 className="text-lg font-semibold text-foreground mt-6">Resumo Lateral</h3>
          <p className="text-sm text-muted-foreground">
            Ao lado do calendário, você verá um resumo com:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Total de receitas do mês</li>
            <li>Total de despesas do mês</li>
            <li>Saldo do mês</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'permissoes',
      title: 'Permissões',
      icon: Users,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Permissões de Acesso</h2>
          <p className="text-muted-foreground">
            O sistema possui diferentes níveis de acesso baseados no perfil do usuário.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead className="bg-muted">
                <tr>
                  <th className="py-3 px-4 text-left font-medium text-foreground">Perfil</th>
                  <th className="py-3 px-4 text-left font-medium text-foreground">Permissões</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4 font-medium text-foreground">Admin</td>
                  <td className="py-3 px-4 text-muted-foreground">Acesso total, gerencia filiais e usuários</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-foreground">Gerente</td>
                  <td className="py-3 px-4 text-muted-foreground">Gerencia contas bancárias, visualiza relatórios</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-foreground">Operador</td>
                  <td className="py-3 px-4 text-muted-foreground">Lançamentos e cadastros básicos</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-foreground">Visualizador</td>
                  <td className="py-3 px-4 text-muted-foreground">Apenas consulta, sem edição</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-foreground mt-6">Tema</h3>
          <p className="text-sm text-muted-foreground">
            Alterne entre modo claro e escuro usando o ícone de lua/sol no cabeçalho da página.
          </p>
        </div>
      ),
    },
    {
      id: 'faq',
      title: 'Dúvidas Frequentes',
      icon: HelpCircle,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Dúvidas Frequentes</h2>
          
          <div className="space-y-4">
            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Como criar um lançamento recorrente?</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Acesse Financeiro → Novo Lançamento</li>
                <li>Marque "Lançamento recorrente"</li>
                <li>Configure tipo, dia e período</li>
                <li>Salve - o sistema criará 12 lançamentos automaticamente</li>
              </ol>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Como importar um extrato bancário?</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Acesse Conciliação Bancária</li>
                <li>Selecione a conta</li>
                <li>Clique em "Importar Extrato"</li>
                <li>Selecione arquivo .xlsx ou .csv</li>
              </ol>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Como ver lançamentos de meses anteriores?</h4>
              <p className="text-sm text-muted-foreground">
                No módulo Financeiro, use o seletor de mês ou clique em "Todos" para ver todos os períodos.
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Como exportar relatórios?</h4>
              <p className="text-sm text-muted-foreground">
                Em cada módulo há botões de "Exportar" para gerar arquivos Excel, CSV ou PDF.
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">Como alterar minha filial?</h4>
              <p className="text-sm text-muted-foreground">
                Use o seletor de filial no canto superior da tela para alternar entre as unidades disponíveis.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const activeContent = sections.find(s => s.id === activeSection);

  return (
    <AppLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0">
          <div className="card-financial p-4 sticky top-20">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Documentação
            </h2>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="card-financial p-6">
            {activeContent?.content}
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
