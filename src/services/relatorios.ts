import { supabase } from '@/lib/supabase';
import type { EntryType } from '@/types/database';

export interface DREItem {
  account: string;
  planned: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface DREReport {
  receita_bruta: number;
  deducoes: number;
  receita_liquida: number;
  custos_operacionais: number;
  despesas_administrativas: number;
  despesas_totais: number;
  resultado_liquido: number;
  items: DREItem[];
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface MonthlyComparison {
  month: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface CashFlowProjection {
  date: string;
  balance: number;
  income: number;
  expenses: number;
}

// Get DRE (Income Statement) data
export async function getDREData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<DREReport> {
    // Get all entries for the period
    const { data: entries, error } = await supabase
        .from('financial_entries')
        .select(`
      type,
      value,
      status,
      category:categories(name, type)
    `)
        .eq('branch_id', branchId)
        .gte('due_date', startDate)
        .lte('due_date', endDate);

    if (error) {
        console.error('Error fetching DRE data:', error);
        throw error;
    }

    // Get budget data for planned values
    const year = new Date(startDate).getFullYear();
    const { data: budgetItems } = await supabase
        .from('budget_items')
        .select(`
      budgeted_amount,
      actual_amount,
      category:categories(name, type)
    `)
        .eq('branch_id', branchId)
        .eq('year', year);

    // Calculate DRE items
    let receitaBruta = 0;
    let deducoes = 0;
    let custosMercadorias = 0;
    let despesasOperacionais = 0;
    let despesasFinanceiras = 0;

    let receitaBrutaPlanejada = 0;
    let deducoesPlanejadas = 0;
    let custosMercadoriasPlanejados = 0;
    let despesasOperacionaisPlanejadas = 0;
    let despesasFinanceirasPlanejadas = 0;

    for (const entry of entries || []) {
        const value = Number(entry.value);
        const categoryName = (entry.category as any)?.name || '';

        if (entry.type === 'receita') {
            receitaBruta += value;
        } else if (categoryName.toLowerCase().includes('imposto') || categoryName.toLowerCase().includes('dedu')) {
            deducoes += value;
        } else if (categoryName.toLowerCase().includes('custo') || categoryName.toLowerCase().includes('cmv')) {
            custosMercadorias += value;
        } else if (categoryName.toLowerCase().includes('financ')) {
            despesasFinanceiras += value;
        } else {
            despesasOperacionais += value;
        }
    }

    // Aggregate budget data
    for (const item of budgetItems || []) {
        const value = Number(item.budgeted_amount);
        const categoryType = (item.category as any)?.type;
        const categoryName = (item.category as any)?.name || '';

        if (categoryType === 'receita') {
            receitaBrutaPlanejada += value;
        } else if (categoryName.toLowerCase().includes('imposto')) {
            deducoesPlanejadas += value;
        } else if (categoryName.toLowerCase().includes('custo')) {
            custosMercadoriasPlanejados += value;
        } else if (categoryName.toLowerCase().includes('financ')) {
            despesasFinanceirasPlanejadas += value;
        } else {
            despesasOperacionaisPlanejadas += value;
        }
    }

    const receitaLiquida = receitaBruta - deducoes;
    const receitaLiquidaPlanejada = receitaBrutaPlanejada - deducoesPlanejadas;

    const lucroBruto = receitaLiquida - custosMercadorias;
    const lucroBrutoPlanejado = receitaLiquidaPlanejada - custosMercadoriasPlanejados;

    const lucroOperacional = lucroBruto - despesasOperacionais;
    const lucroOperacionalPlanejado = lucroBrutoPlanejado - despesasOperacionaisPlanejadas;

    const lucroLiquido = lucroOperacional - despesasFinanceiras;
    const lucroLiquidoPlanejado = lucroOperacionalPlanejado - despesasFinanceirasPlanejadas;

    const despesasTotais = deducoes + custosMercadorias + despesasOperacionais + despesasFinanceiras;

    const createDREItem = (account: string, planned: number, actual: number): DREItem => {
        const variance = actual - planned;
        const variancePercent = planned !== 0 ? (variance / Math.abs(planned)) * 100 : 0;
        return {
            account, planned, actual, variance, variancePercent
        };
    };

    const items = [
        createDREItem('Receita Bruta', receitaBrutaPlanejada, receitaBruta),
        createDREItem('(-) Deduções', deducoesPlanejadas, deducoes),
        createDREItem('Receita Líquida', receitaLiquidaPlanejada, receitaLiquida),
        createDREItem('(-) CMV', custosMercadoriasPlanejados, custosMercadorias),
        createDREItem('Lucro Bruto', lucroBrutoPlanejado, lucroBruto),
        createDREItem('(-) Despesas Operacionais', despesasOperacionaisPlanejadas, despesasOperacionais),
        createDREItem('Lucro Operacional', lucroOperacionalPlanejado, lucroOperacional),
        createDREItem('(-) Despesas Financeiras', despesasFinanceirasPlanejadas, despesasFinanceiras),
        createDREItem('Lucro Líquido', lucroLiquidoPlanejado, lucroLiquido),
    ];

    return {
        receita_bruta: receitaBruta,
        deducoes,
        receita_liquida: receitaLiquida,
        custos_operacionais: custosMercadorias,
        despesas_administrativas: despesasOperacionais,
        despesas_totais: despesasTotais,
        resultado_liquido: lucroLiquido,
        items,
    };
}

// Get category breakdown
export async function getCategoryBreakdown(
    branchId: string,
    type: EntryType,
    startDate: string,
    endDate: string
): Promise<CategoryBreakdown[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
      value,
      category:categories(name, color)
    `)
        .eq('branch_id', branchId)
        .eq('type', type)
        .gte('due_date', startDate)
        .lte('due_date', endDate);

    if (error) {
        console.error('Error fetching category breakdown:', error);
        throw error;
    }

    // Group by category
    const categoryTotals = new Map<string, { value: number; color: string }>();
    let total = 0;

    for (const entry of data || []) {
        const categoryName = (entry.category as any)?.name || 'Sem Categoria';
        const color = (entry.category as any)?.color || '#888888';
        const value = Number(entry.value);

        total += value;

        if (!categoryTotals.has(categoryName)) {
            categoryTotals.set(categoryName, { value: 0, color });
        }

        const current = categoryTotals.get(categoryName)!;
        current.value += value;
    }

    return Array.from(categoryTotals.entries()).map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color,
        percentage: total > 0 ? (data.value / total) * 100 : 0,
    }));
}

// Get monthly comparison
export async function getMonthlyComparison(
    branchId: string,
    year: number
): Promise<MonthlyComparison[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .eq('branch_id', branchId)
        .gte('due_date', `${year}-01-01`)
        .lte('due_date', `${year}-12-31`);

    if (error) {
        console.error('Error fetching monthly comparison:', error);
        throw error;
    }

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData = months.map((month) => ({
        month,
        receitas: 0,
        despesas: 0,
        saldo: 0,
    }));

    for (const entry of data || []) {
        const monthIndex = new Date(entry.due_date).getMonth();
        const value = Number(entry.value);

        if (entry.type === 'receita') {
            monthlyData[monthIndex].receitas += value;
        } else {
            monthlyData[monthIndex].despesas += value;
        }
    }

    // Calculate saldo
    for (const month of monthlyData) {
        month.saldo = month.receitas - month.despesas;
    }

    return monthlyData;
}

// Get cash flow projection
export async function getCashFlowProjection(
    branchId: string,
    startDate: string,
    endDate: string,
    initialBalance: number = 0
): Promise<CashFlowProjection[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .eq('branch_id', branchId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date');

    if (error) {
        console.error('Error fetching cash flow projection:', error);
        throw error;
    }

    // Group by date
    const dailyData = new Map<string, { income: number; expenses: number }>();

    for (const entry of data || []) {
        const date = entry.due_date;

        if (!dailyData.has(date)) {
            dailyData.set(date, { income: 0, expenses: 0 });
        }

        const day = dailyData.get(date)!;
        const value = Number(entry.value);

        if (entry.type === 'receita') {
            day.income += value;
        } else {
            day.expenses += value;
        }
    }

    // Calculate running balance
    let balance = initialBalance;
    const projection: CashFlowProjection[] = [];

    // Sort by date
    const sortedDates = Array.from(dailyData.keys()).sort();

    for (const date of sortedDates) {
        const day = dailyData.get(date)!;
        balance += day.income - day.expenses;

        projection.push({
            date,
            balance,
            income: day.income,
            expenses: day.expenses,
        });
    }

    return projection;
}

// Get top clients/suppliers by value
export async function getTopFavorecidos(
    branchId: string,
    type: EntryType,
    limit: number = 10
): Promise<{ name: string; value: number; count: number }[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
      value,
      favorecido:favorecidos(name)
    `)
        .eq('branch_id', branchId)
        .eq('type', type);

    if (error) {
        console.error('Error fetching top favorecidos:', error);
        throw error;
    }

    // Group by favorecido
    const favorecidoTotals = new Map<string, { value: number; count: number }>();

    for (const entry of data || []) {
        const name = (entry.favorecido as any)?.name || 'Não informado';
        const value = Number(entry.value);

        if (!favorecidoTotals.has(name)) {
            favorecidoTotals.set(name, { value: 0, count: 0 });
        }

        const current = favorecidoTotals.get(name)!;
        current.value += value;
        current.count++;
    }

    return Array.from(favorecidoTotals.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}

export interface AgingReportItem {
  range: string;
  total: number;
}

// ============================================
// RELATÓRIOS EXECUTIVOS - Interfaces
// ============================================

export interface DashboardGeralData {
  receitaBruta: number;
  receitaLiquida: number;
  despesasTotais: number;
  lucroOperacional: number;
  margemBruta: number;
  margemLiquida: number;
  ticketMedio: number;
  totalVendas: number;
  totalContratos: number;
}

export interface FaturamentoData {
  date: string;
  bruto: number;
  liquido: number;
  deducoes: number;
}

export interface MargemProdutoData {
  produto: string;
  receita: number;
  custo: number;
  margem: number;
  margemPercent: number;
  quantidade: number;
}

export interface TicketMedioData {
  date: string;
  ticketMedio: number;
  quantidadeVendas: number;
  receitaTotal: number;
}

export interface ReceitaProdutoData {
  produto: string;
  receita: number;
  quantidade: number;
  percentual: number;
}

export interface CustosFixosVariaveisData {
  tipo: 'fixo' | 'variavel';
  categoria: string;
  valor: number;
  percentual: number;
}

export interface ComissoesData {
  vendedor: string;
  valor: number;
  quantidade: number;
  percentual: number;
}

export interface LucroOperacionalData {
  date: string;
  lucro: number;
  receita: number;
  despesas: number;
}

export interface ComparativoPeriodoData {
  periodo: string;
  previsto: number;
  realizado: number;
  variacao: number;
  variacaoPercent: number;
}

export interface CrescimentoRetracaoData {
  periodo: string;
  valor: number;
  crescimento: number;
  crescimentoPercent: number;
}

// ============================================
// RELATÓRIOS FINANCEIROS - Interfaces
// ============================================

export interface FluxoCaixaData {
  date: string;
  entrada: number;
  saida: number;
  saldo: number;
  saldoAcumulado: number;
}

export interface ContasPagarReceberData {
  tipo: 'pagar' | 'receber';
  total: number;
  pago: number;
  pendente: number;
  atrasado: number;
  detalhes: Array<{
    favorecido: string;
    valor: number;
    vencimento: string;
    status: string;
  }>;
}

export interface ReceitaProdutoConvenioData {
  produto: string;
  convenio: string;
  receita: number;
  quantidade: number;
}

export interface ComissoesReportData {
  vendedor?: string;
  produto?: string;
  periodo?: string;
  valor: number;
  quantidade: number;
  percentual: number;
}

export interface InadimplenciaData {
  cliente: string;
  valor: number;
  diasAtraso: number;
  ultimoPagamento: string;
}

export interface ValorExpostoData {
  total: number;
  porPeriodo: Array<{
    periodo: string;
    valor: number;
  }>;
}

export interface CustoOperacionalVendaData {
  venda: string;
  custoOperacional: number;
  receita: number;
  margem: number;
}

export interface MargemLiquidaContratoData {
  contrato: string;
  receita: number;
  custos: number;
  margem: number;
  margemPercent: number;
}

// ============================================
// RELATÓRIOS DE VENDAS E METAS - Interfaces
// ============================================

export interface VendasVendedorData {
  vendedor: string;
  quantidade: number;
  valor: number;
  produtos: number;
}

export interface VendasProdutoData {
  produto: string;
  quantidade: number;
  valor: number;
  vendedores: number;
}

export interface MetaRealizadoData {
  vendedor?: string;
  equipe?: string;
  unidade?: string;
  meta: number;
  realizado: number;
  percentual: number;
  diferenca: number;
}

export interface ContratosFechadosData {
  periodo: string;
  quantidade: number;
  valor: number;
}

export interface RankingVendasData {
  posicao: number;
  vendedor: string;
  valor: number;
  quantidade: number;
  percentual: number;
}

// ============================================
// RELATÓRIOS DE CLIENTES/CRM - Interfaces
// ============================================

export interface BaseAtivaClientesData {
  total: number;
  ativos: number;
  inativos: number;
  novos: number;
  crescimento: number;
}

export interface ClientesProdutoData {
  produto: string;
  quantidade: number;
  receita: number;
}

export interface HistoricoFinanceiroClienteData {
  cliente: string;
  periodo: string;
  receita: number;
  despesas: number;
  saldo: number;
}

export interface LifetimeValueData {
  cliente: string;
  receitaTotal: number;
  custos: number;
  ltv: number;
  quantidadeContratos: number;
}

export interface PerfilClienteLucrativoData {
  cliente: string;
  receita: number;
  margem: number;
  frequencia: number;
  score: number;
}

export interface ClientesInativosData {
  cliente: string;
  ultimoContrato: string;
  diasInativo: number;
  receitaHistorica: number;
}

export interface RetencaoRecompraData {
  periodo: string;
  retencao: number;
  recompra: number;
  taxaRetencao: number;
}

// ============================================
// RELATÓRIOS DE RH - Interfaces
// ============================================

export interface ProdutividadeFuncionarioData {
  funcionario: string;
  vendas: number;
  contratos: number;
  receita: number;
  produtividade: number;
}

export interface ComissaoResultadoData {
  funcionario: string;
  comissao: number;
  resultado: number;
  eficiencia: number;
}

export interface RankingPerformanceData {
  posicao: number;
  funcionario: string;
  score: number;
  vendas: number;
  metas: number;
}

// ============================================
// RELATÓRIOS DE OPERAÇÕES - Interfaces
// ============================================

export interface ContratosAprovadosReprovadosData {
  aprovados: number;
  reprovados: number;
  pendentes: number;
  taxaAprovacao: number;
  detalhes: Array<{
    contrato: string;
    status: string;
    valor: number;
    data: string;
  }>;
}

export interface LogsAlteracoesData {
  data: string;
  usuario: string;
  acao: string;
  entidade: string;
  detalhes: string;
}

// ============================================
// RELATÓRIOS DE MARKETING - Interfaces
// ============================================

export interface IndicadoresCrescimentoData {
  periodo: string;
  clientes: number;
  receita: number;
  crescimento: number;
}

export interface OrigemClienteData {
  origem: string;
  quantidade: number;
  receita: number;
  percentual: number;
}

// ============================================
// RELATÓRIOS ESTRATÉGICOS - Interfaces
// ============================================

export interface ScorePerformanceVendedorData {
  vendedor: string;
  score: number;
  vendas: number;
  metas: number;
  eficiencia: number;
}

export interface MetaRiscoData {
  vendedor: string;
  meta: number;
  realizado: number;
  percentual: number;
  diasRestantes: number;
  risco: 'alto' | 'medio' | 'baixo';
}

export interface CaixaCriticoData {
  data: string;
  saldo: number;
  projecao: number;
  alerta: boolean;
}

export interface VendedorForaPadraoData {
  vendedor: string;
  metricas: {
    vendas: number;
    media: number;
    desvio: number;
  };
  anomalia: string;
}

// Get aging report (contas a pagar/receber por idade)
export async function getAgingReport(
    branchId: string,
    type: EntryType
): Promise<AgingReportItem[]> {
    const today = new Date();

    const { data, error } = await supabase
        .from('financial_entries')
        .select('value, due_date')
        .eq('branch_id', branchId)
        .eq('type', type)
        .eq('status', 'pendente');

    if (error) {
        console.error('Error fetching aging report:', error);
        throw error;
    }

    const aging = {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        over90: 0,
    };

    for (const entry of data || []) {
        const dueDate = new Date(entry.due_date);
        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const value = Number(entry.value);

        if (diffDays <= 0) {
            aging.current += value;
        } else if (diffDays <= 30) {
            aging.days1to30 += value;
        } else if (diffDays <= 60) {
            aging.days31to60 += value;
        } else if (diffDays <= 90) {
            aging.days61to90 += value;
        } else {
            aging.over90 += value;
        }
    }

    // Return as array with range labels
    return [
        { range: 'A vencer', total: aging.current },
        { range: '1-30 dias', total: aging.days1to30 },
        { range: '31-60 dias', total: aging.days31to60 },
        { range: '61-90 dias', total: aging.days61to90 },
        { range: 'Mais de 90 dias', total: aging.over90 },
    ].filter((item) => item.total > 0);
}

// ============================================
// RELATÓRIOS EXECUTIVOS - Funções
// ============================================

export async function getDashboardGeralData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<DashboardGeralData> {
    const { data: entries, error } = await supabase
        .from('financial_entries')
        .select('type, value, status')
        .eq('branch_id', branchId)
        .gte('due_date', startDate)
        .lte('due_date', endDate);

    if (error) throw error;

    const { data: contracts } = await supabase
        .from('contracts')
        .select('value, status')
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate);

    let receitaBruta = 0;
    let despesasTotais = 0;
    let totalVendas = 0;

    for (const entry of entries || []) {
        const value = Number(entry.value);
        if (entry.type === 'receita') {
            receitaBruta += value;
            totalVendas += value;
        } else {
            despesasTotais += value;
        }
    }

    const deducoes = despesasTotais * 0.1; // Estimativa
    const receitaLiquida = receitaBruta - deducoes;
    const lucroOperacional = receitaLiquida - despesasTotais;
    const margemBruta = receitaBruta > 0 ? (receitaLiquida / receitaBruta) * 100 : 0;
    const margemLiquida = receitaBruta > 0 ? (lucroOperacional / receitaBruta) * 100 : 0;
    const totalContratos = contracts?.length || 0;
    const ticketMedio = totalContratos > 0 ? totalVendas / totalContratos : 0;

    return {
        receitaBruta,
        receitaLiquida,
        despesasTotais,
        lucroOperacional,
        margemBruta,
        margemLiquida,
        ticketMedio,
        totalVendas,
        totalContratos,
    };
}

export async function getFaturamentoData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<FaturamentoData[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .eq('branch_id', branchId)
        .eq('type', 'receita')
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date');

    if (error) throw error;

    const dailyData = new Map<string, { bruto: number; deducoes: number }>();

    for (const entry of data || []) {
        const date = entry.due_date;
        const value = Number(entry.value);
        const deducao = value * 0.1; // Estimativa

        if (!dailyData.has(date)) {
            dailyData.set(date, { bruto: 0, deducoes: 0 });
        }

        const day = dailyData.get(date)!;
        day.bruto += value;
        day.deducoes += deducao;
    }

    return Array.from(dailyData.entries())
        .map(([date, data]) => ({
            date,
            bruto: data.bruto,
            liquido: data.bruto - data.deducoes,
            deducoes: data.deducoes,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getMargemProdutoData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<MargemProdutoData[]> {
    const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
            value,
            type,
            category:categories(name)
        `)
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo');

    if (error) throw error;

    const produtoData = new Map<string, { receita: number; quantidade: number }>();

    for (const contract of contracts || []) {
        const produto = (contract.category as any)?.name || contract.type || 'Outros';
        const valor = Number(contract.value);

        if (!produtoData.has(produto)) {
            produtoData.set(produto, { receita: 0, quantidade: 0 });
        }

        const data = produtoData.get(produto)!;
        data.receita += valor;
        data.quantidade += 1;
    }

    return Array.from(produtoData.entries()).map(([produto, data]) => {
        const custo = data.receita * 0.6; // Estimativa de 60% de custo
        const margem = data.receita - custo;
        const margemPercent = data.receita > 0 ? (margem / data.receita) * 100 : 0;

        return {
            produto,
            receita: data.receita,
            custo,
            margem,
            margemPercent,
            quantidade: data.quantidade,
        };
    });
}

export async function getTicketMedioData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<TicketMedioData[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select('value, start_date')
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo')
        .order('start_date');

    if (error) throw error;

    const dailyData = new Map<string, { receita: number; quantidade: number }>();

    for (const contract of data || []) {
        const date = contract.start_date;
        const valor = Number(contract.value);

        if (!dailyData.has(date)) {
            dailyData.set(date, { receita: 0, quantidade: 0 });
        }

        const day = dailyData.get(date)!;
        day.receita += valor;
        day.quantidade += 1;
    }

    return Array.from(dailyData.entries())
        .map(([date, data]) => ({
            date,
            ticketMedio: data.quantidade > 0 ? data.receita / data.quantidade : 0,
            quantidadeVendas: data.quantidade,
            receitaTotal: data.receita,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getReceitaProdutoData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<ReceitaProdutoData[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            value,
            type,
            category:categories(name)
        `)
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo');

    if (error) throw error;

    const produtoData = new Map<string, { receita: number; quantidade: number }>();
    let totalReceita = 0;

    for (const contract of data || []) {
        const produto = (contract.category as any)?.name || contract.type || 'Outros';
        const valor = Number(contract.value);
        totalReceita += valor;

        if (!produtoData.has(produto)) {
            produtoData.set(produto, { receita: 0, quantidade: 0 });
        }

        const data = produtoData.get(produto)!;
        data.receita += valor;
        data.quantidade += 1;
    }

    return Array.from(produtoData.entries())
        .map(([produto, data]) => ({
            produto,
            receita: data.receita,
            quantidade: data.quantidade,
            percentual: totalReceita > 0 ? (data.receita / totalReceita) * 100 : 0,
        }))
        .sort((a, b) => b.receita - a.receita);
}

export async function getCustosFixosVariaveisData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<CustosFixosVariaveisData[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
            value,
            category:categories(name)
        `)
        .eq('branch_id', branchId)
        .eq('type', 'despesa')
        .gte('due_date', startDate)
        .lte('due_date', endDate);

    if (error) throw error;

    const categoriaData = new Map<string, number>();
    let total = 0;

    for (const entry of data || []) {
        const categoria = (entry.category as any)?.name || 'Sem Categoria';
        const valor = Number(entry.value);
        total += valor;

        if (!categoriaData.has(categoria)) {
            categoriaData.set(categoria, 0);
        }

        categoriaData.set(categoria, categoriaData.get(categoria)! + valor);
    }

    const result: CustosFixosVariaveisData[] = [];

    for (const [categoria, valor] of categoriaData.entries()) {
        // Classificar como fixo ou variável baseado no nome da categoria
        const isFixo = categoria.toLowerCase().includes('fixo') || 
                      categoria.toLowerCase().includes('salario') ||
                      categoria.toLowerCase().includes('aluguel');

        result.push({
            tipo: isFixo ? 'fixo' : 'variavel',
            categoria,
            valor,
            percentual: total > 0 ? (valor / total) * 100 : 0,
        });
    }

    return result.sort((a, b) => b.valor - a.valor);
}

export async function getComissoesData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<ComissoesData[]> {
    const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
            value,
            seller:profiles!seller_id(name)
        `)
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo')
        .not('seller_id', 'is', null);

    if (error) throw error;

    const vendedorData = new Map<string, { valor: number; quantidade: number }>();
    let totalComissoes = 0;

    for (const contract of contracts || []) {
        const vendedor = (contract.seller as any)?.name || 'Não informado';
        const valor = Number(contract.value);
        const comissao = valor * 0.05; // 5% de comissão estimada
        totalComissoes += comissao;

        if (!vendedorData.has(vendedor)) {
            vendedorData.set(vendedor, { valor: 0, quantidade: 0 });
        }

        const data = vendedorData.get(vendedor)!;
        data.valor += comissao;
        data.quantidade += 1;
    }

    return Array.from(vendedorData.entries())
        .map(([vendedor, data]) => ({
            vendedor,
            valor: data.valor,
            quantidade: data.quantidade,
            percentual: totalComissoes > 0 ? (data.valor / totalComissoes) * 100 : 0,
        }))
        .sort((a, b) => b.valor - a.valor);
}

export async function getLucroOperacionalData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<LucroOperacionalData[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .eq('branch_id', branchId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date');

    if (error) throw error;

    const dailyData = new Map<string, { receita: number; despesas: number }>();

    for (const entry of data || []) {
        const date = entry.due_date;
        const value = Number(entry.value);

        if (!dailyData.has(date)) {
            dailyData.set(date, { receita: 0, despesas: 0 });
        }

        const day = dailyData.get(date)!;
        if (entry.type === 'receita') {
            day.receita += value;
        } else {
            day.despesas += value;
        }
    }

    return Array.from(dailyData.entries())
        .map(([date, data]) => ({
            date,
            lucro: data.receita - data.despesas,
            receita: data.receita,
            despesas: data.despesas,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getComparativoPeriodoData(
    branchId: string,
    periodo: 'mensal' | 'trimestral' | 'anual',
    ano: number
): Promise<ComparativoPeriodoData[]> {
    const { data: entries } = await supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .eq('branch_id', branchId)
        .gte('due_date', `${ano}-01-01`)
        .lte('due_date', `${ano}-12-31`);

    const { data: budget } = await supabase
        .from('budget_items')
        .select('budgeted_amount, actual_amount, month')
        .eq('branch_id', branchId)
        .eq('year', ano);

    const periodos: ComparativoPeriodoData[] = [];

    if (periodo === 'mensal') {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        for (let i = 0; i < 12; i++) {
            const monthEntries = entries?.filter(e => new Date(e.due_date).getMonth() === i) || [];
            const monthBudget = budget?.filter(b => b.month === i + 1) || [];
            
            const realizado = monthEntries
                .filter(e => e.type === 'receita')
                .reduce((sum, e) => sum + Number(e.value), 0);
            
            const previsto = monthBudget.reduce((sum, b) => sum + Number(b.budgeted_amount), 0);
            const variacao = realizado - previsto;
            const variacaoPercent = previsto > 0 ? (variacao / previsto) * 100 : 0;

            periodos.push({
                periodo: months[i],
                previsto,
                realizado,
                variacao,
                variacaoPercent,
            });
        }
    }

    return periodos;
}

export async function getCrescimentoRetracaoData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<CrescimentoRetracaoData[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .eq('branch_id', branchId)
        .eq('type', 'receita')
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date');

    if (error) throw error;

    const monthlyData = new Map<string, number>();

    for (const entry of data || []) {
        const month = entry.due_date.substring(0, 7); // YYYY-MM
        const value = Number(entry.value);

        if (!monthlyData.has(month)) {
            monthlyData.set(month, 0);
        }

        monthlyData.set(month, monthlyData.get(month)! + value);
    }

    const sortedMonths = Array.from(monthlyData.keys()).sort();
    const result: CrescimentoRetracaoData[] = [];
    let previousValue = 0;

    for (const month of sortedMonths) {
        const valor = monthlyData.get(month)!;
        const crescimento = previousValue > 0 ? valor - previousValue : 0;
        const crescimentoPercent = previousValue > 0 ? (crescimento / previousValue) * 100 : 0;

        result.push({
            periodo: month,
            valor,
            crescimento,
            crescimentoPercent,
        });

        previousValue = valor;
    }

    return result;
}

// ============================================
// RELATÓRIOS FINANCEIROS - Funções
// ============================================

export async function getFluxoCaixaData(
    branchId: string,
    startDate: string,
    endDate: string,
    periodo: 'diario' | 'semanal' | 'mensal' = 'diario'
): Promise<FluxoCaixaData[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .eq('branch_id', branchId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date');

    if (error) throw error;

    const groupedData = new Map<string, { entrada: number; saida: number }>();

    for (const entry of data || []) {
        let key = entry.due_date;
        if (periodo === 'semanal') {
            const date = new Date(entry.due_date);
            const week = Math.ceil(date.getDate() / 7);
            key = `${entry.due_date.substring(0, 7)}-W${week}`;
        } else if (periodo === 'mensal') {
            key = entry.due_date.substring(0, 7);
        }

        if (!groupedData.has(key)) {
            groupedData.set(key, { entrada: 0, saida: 0 });
        }

        const day = groupedData.get(key)!;
        const value = Number(entry.value);

        if (entry.type === 'receita') {
            day.entrada += value;
        } else {
            day.saida += value;
        }
    }

    const sortedKeys = Array.from(groupedData.keys()).sort();
    let saldoAcumulado = 0;
    const result: FluxoCaixaData[] = [];

    for (const key of sortedKeys) {
        const data = groupedData.get(key)!;
        saldoAcumulado += data.entrada - data.saida;

        result.push({
            date: key,
            entrada: data.entrada,
            saida: data.saida,
            saldo: data.entrada - data.saida,
            saldoAcumulado,
        });
    }

    return result;
}

export async function getContasPagarReceberData(
    branchId: string
): Promise<ContasPagarReceberData> {
    const { data: receber, error: errorReceber } = await supabase
        .from('financial_entries')
        .select(`
            value,
            status,
            due_date,
            favorecido:favorecidos(name)
        `)
        .eq('branch_id', branchId)
        .eq('type', 'receita');

    const { data: pagar, error: errorPagar } = await supabase
        .from('financial_entries')
        .select(`
            value,
            status,
            due_date,
            favorecido:favorecidos(name)
        `)
        .eq('branch_id', branchId)
        .eq('type', 'despesa');

    if (errorReceber || errorPagar) throw errorReceber || errorPagar;

    const processEntries = (entries: any[], tipo: 'pagar' | 'receber') => {
        let total = 0;
        let pago = 0;
        let pendente = 0;
        let atrasado = 0;
        const detalhes: any[] = [];

        for (const entry of entries || []) {
            const valor = Number(entry.value);
            total += valor;

            if (entry.status === 'pago') {
                pago += valor;
            } else if (entry.status === 'pendente') {
                const dueDate = new Date(entry.due_date);
                const today = new Date();
                if (dueDate < today) {
                    atrasado += valor;
                } else {
                    pendente += valor;
                }
            }

            detalhes.push({
                favorecido: (entry.favorecido as any)?.name || 'Não informado',
                valor,
                vencimento: entry.due_date,
                status: entry.status,
            });
        }

        return { total, pago, pendente, atrasado, detalhes };
    };

    const receberData = processEntries(receber || [], 'receber');
    const pagarData = processEntries(pagar || [], 'pagar');

    return {
        tipo: 'receber',
        total: receberData.total,
        pago: receberData.pago,
        pendente: receberData.pendente,
        atrasado: receberData.atrasado,
        detalhes: receberData.detalhes,
    };
}

export async function getReceitaProdutoConvenioData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<ReceitaProdutoConvenioData[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            value,
            type,
            category:categories(name),
            favorecido:favorecidos(name)
        `)
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo');

    if (error) throw error;

    const produtoConvenioData = new Map<string, { receita: number; quantidade: number }>();

    for (const contract of data || []) {
        const produto = (contract.category as any)?.name || contract.type || 'Outros';
        const convenio = (contract.favorecido as any)?.name || 'Sem Convênio';
        const key = `${produto}|${convenio}`;
        const valor = Number(contract.value);

        if (!produtoConvenioData.has(key)) {
            produtoConvenioData.set(key, { receita: 0, quantidade: 0 });
        }

        const data = produtoConvenioData.get(key)!;
        data.receita += valor;
        data.quantidade += 1;
    }

    return Array.from(produtoConvenioData.entries()).map(([key, data]) => {
        const [produto, convenio] = key.split('|');
        return {
            produto,
            convenio,
            receita: data.receita,
            quantidade: data.quantidade,
        };
    });
}

export async function getComissoesReportData(
    branchId: string,
    startDate: string,
    endDate: string,
    filtro?: { vendedor?: string; produto?: string }
): Promise<ComissoesReportData[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            value,
            seller:profiles!seller_id(name),
            category:categories(name),
            start_date
        `)
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo');

    if (error) throw error;

    if (filtro?.vendedor) {
        // Filtrar por vendedor específico
    }

    const comissoesData = new Map<string, { valor: number; quantidade: number }>();
    let totalComissoes = 0;

    for (const contract of data || []) {
        const vendedor = (contract.seller as any)?.name || 'Não informado';
        const produto = (contract.category as any)?.name || contract.type || 'Outros';
        const periodo = contract.start_date.substring(0, 7);
        const valor = Number(contract.value);
        const comissao = valor * 0.05;

        const key = filtro?.vendedor ? vendedor : filtro?.produto ? produto : periodo;
        totalComissoes += comissao;

        if (!comissoesData.has(key)) {
            comissoesData.set(key, { valor: 0, quantidade: 0 });
        }

        const data = comissoesData.get(key)!;
        data.valor += comissao;
        data.quantidade += 1;
    }

    return Array.from(comissoesData.entries()).map(([key, data]) => ({
        vendedor: filtro?.vendedor ? key : undefined,
        produto: filtro?.produto ? key : undefined,
        periodo: !filtro?.vendedor && !filtro?.produto ? key : undefined,
        valor: data.valor,
        quantidade: data.quantidade,
        percentual: totalComissoes > 0 ? (data.valor / totalComissoes) * 100 : 0,
    }));
}

export async function getInadimplenciaData(
    branchId: string
): Promise<InadimplenciaData[]> {
    const today = new Date();
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
            value,
            due_date,
            status,
            favorecido:favorecidos(name)
        `)
        .eq('branch_id', branchId)
        .eq('type', 'receita')
        .eq('status', 'pendente');

    if (error) throw error;

    const inadimplentes: InadimplenciaData[] = [];

    for (const entry of data || []) {
        const dueDate = new Date(entry.due_date);
        const diffTime = today.getTime() - dueDate.getTime();
        const diasAtraso = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diasAtraso > 0) {
            inadimplentes.push({
                cliente: (entry.favorecido as any)?.name || 'Não informado',
                valor: Number(entry.value),
                diasAtraso,
                ultimoPagamento: entry.due_date,
            });
        }
    }

    return inadimplentes.sort((a, b) => b.diasAtraso - a.diasAtraso);
}

export async function getValorExpostoData(
    branchId: string
): Promise<ValorExpostoData> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select('value, due_date')
        .eq('branch_id', branchId)
        .eq('type', 'receita')
        .eq('status', 'pendente');

    if (error) throw error;

    let total = 0;
    const porPeriodo = new Map<string, number>();

    for (const entry of data || []) {
        const valor = Number(entry.value);
        total += valor;

        const month = entry.due_date.substring(0, 7);
        if (!porPeriodo.has(month)) {
            porPeriodo.set(month, 0);
        }
        porPeriodo.set(month, porPeriodo.get(month)! + valor);
    }

    return {
        total,
        porPeriodo: Array.from(porPeriodo.entries())
            .map(([periodo, valor]) => ({ periodo, valor }))
            .sort((a, b) => a.periodo.localeCompare(b.periodo)),
    };
}

export async function getCustoOperacionalVendaData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<CustoOperacionalVendaData[]> {
    const { data: contracts, error: errorContracts } = await supabase
        .from('contracts')
        .select('id, value, title')
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo');

    const { data: expenses, error: errorExpenses } = await supabase
        .from('financial_entries')
        .select('value')
        .eq('branch_id', branchId)
        .eq('type', 'despesa')
        .gte('due_date', startDate)
        .lte('due_date', endDate);

    if (errorContracts || errorExpenses) throw errorContracts || errorExpenses;

    const totalDespesas = (expenses || []).reduce((sum, e) => sum + Number(e.value), 0);
    const totalVendas = (contracts || []).length;
    const custoPorVenda = totalVendas > 0 ? totalDespesas / totalVendas : 0;

    return (contracts || []).map(contract => {
        const receita = Number(contract.value);
        return {
            venda: contract.title,
            custoOperacional: custoPorVenda,
            receita,
            margem: receita - custoPorVenda,
        };
    });
}

export async function getMargemLiquidaContratoData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<MargemLiquidaContratoData[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            id,
            title,
            value,
            category:categories(name)
        `)
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo');

    if (error) throw error;

    return (data || []).map(contract => {
        const receita = Number(contract.value);
        const custos = receita * 0.6; // Estimativa
        const margem = receita - custos;
        const margemPercent = receita > 0 ? (margem / receita) * 100 : 0;

        return {
            contrato: contract.title,
            receita,
            custos,
            margem,
            margemPercent,
        };
    });
}

// ============================================
// RELATÓRIOS DE VENDAS E METAS - Funções
// ============================================

export async function getVendasVendedorData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<VendasVendedorData[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            value,
            seller:profiles!seller_id(name),
            category:categories(name)
        `)
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo')
        .not('seller_id', 'is', null);

    if (error) throw error;

    const vendedorData = new Map<string, { valor: number; quantidade: number; produtos: Set<string> }>();

    for (const contract of data || []) {
        const vendedor = (contract.seller as any)?.name || 'Não informado';
        const produto = (contract.category as any)?.name || contract.type || 'Outros';
        const valor = Number(contract.value);

        if (!vendedorData.has(vendedor)) {
            vendedorData.set(vendedor, { valor: 0, quantidade: 0, produtos: new Set() });
        }

        const data = vendedorData.get(vendedor)!;
        data.valor += valor;
        data.quantidade += 1;
        data.produtos.add(produto);
    }

    return Array.from(vendedorData.entries())
        .map(([vendedor, data]) => ({
            vendedor,
            quantidade: data.quantidade,
            valor: data.valor,
            produtos: data.produtos.size,
        }))
        .sort((a, b) => b.valor - a.valor);
}

export async function getVendasProdutoData(
    branchId: string,
    startDate: string,
    endDate: string,
    tipo: 'quantidade' | 'valor' | 'produto'
): Promise<VendasProdutoData[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            value,
            category:categories(name),
            seller:profiles!seller_id(name)
        `)
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo');

    if (error) throw error;

    const produtoData = new Map<string, { quantidade: number; valor: number; vendedores: Set<string> }>();

    for (const contract of data || []) {
        const produto = (contract.category as any)?.name || contract.type || 'Outros';
        const vendedor = (contract.seller as any)?.name || 'Não informado';
        const valor = Number(contract.value);

        if (!produtoData.has(produto)) {
            produtoData.set(produto, { quantidade: 0, valor: 0, vendedores: new Set() });
        }

        const data = produtoData.get(produto)!;
        data.quantidade += 1;
        data.valor += valor;
        data.vendedores.add(vendedor);
    }

    return Array.from(produtoData.entries())
        .map(([produto, data]) => ({
            produto,
            quantidade: data.quantidade,
            valor: data.valor,
            vendedores: data.vendedores.size,
        }))
        .sort((a, b) => (tipo === 'quantidade' ? b.quantidade - a.quantidade : b.valor - a.valor));
}

export async function getMetaRealizadoData(
    branchId: string,
    tipo: 'individual' | 'equipe' | 'unidade',
    periodo: { year: number; month?: number }
): Promise<MetaRealizadoData[]> {
    const { data: targets, error: errorTargets } = await supabase
        .from('sales_targets')
        .select(`
            target_amount,
            actual_amount,
            seller:favorecidos!seller_id(name),
            branch:branches(name)
        `)
        .eq('branch_id', branchId)
        .eq('year', periodo.year);

    if (errorTargets) throw errorTargets;

    const { data: contracts } = await supabase
        .from('contracts')
        .select(`
            value,
            seller:profiles!seller_id(name),
            start_date
        `)
        .eq('branch_id', branchId)
        .gte('start_date', `${periodo.year}-01-01`)
        .lte('start_date', `${periodo.year}-12-31`)
        .eq('status', 'ativo');

    const result: MetaRealizadoData[] = [];

    if (tipo === 'individual') {
        const vendedorData = new Map<string, { meta: number; realizado: number }>();

        for (const target of targets || []) {
            const vendedor = (target.seller as any)?.name || 'Não informado';
            const meta = Number(target.target_amount);
            const realizado = Number(target.actual_amount);

            vendedorData.set(vendedor, { meta, realizado });
        }

        for (const [vendedor, data] of vendedorData.entries()) {
            const percentual = data.meta > 0 ? (data.realizado / data.meta) * 100 : 0;
            result.push({
                vendedor,
                meta: data.meta,
                realizado: data.realizado,
                percentual,
                diferenca: data.realizado - data.meta,
            });
        }
    } else if (tipo === 'equipe') {
        // Equipe = filial
        const totalMeta = (targets || []).reduce((sum, t) => sum + Number(t.target_amount), 0);
        const totalRealizado = (targets || []).reduce((sum, t) => sum + Number(t.actual_amount), 0);
        const percentual = totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : 0;

        result.push({
            equipe: (targets?.[0]?.branch as any)?.name || 'Equipe',
            meta: totalMeta,
            realizado: totalRealizado,
            percentual,
            diferenca: totalRealizado - totalMeta,
        });
    }

    return result;
}

export async function getContratosFechadosData(
    branchId: string,
    startDate: string,
    endDate: string,
    agrupamento?: 'vendedor' | 'canal' | 'produto'
): Promise<ContratosFechadosData[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            value,
            start_date,
            seller:profiles!seller_id(name),
            category:categories(name),
            type
        `)
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .eq('status', 'ativo');

    if (error) throw error;

    if (!agrupamento) {
        const monthlyData = new Map<string, { quantidade: number; valor: number }>();

        for (const contract of data || []) {
            const month = contract.start_date.substring(0, 7);
            const valor = Number(contract.value);

            if (!monthlyData.has(month)) {
                monthlyData.set(month, { quantidade: 0, valor: 0 });
            }

            const data = monthlyData.get(month)!;
            data.quantidade += 1;
            data.valor += valor;
        }

        return Array.from(monthlyData.entries())
            .map(([periodo, data]) => ({
                periodo,
                quantidade: data.quantidade,
                valor: data.valor,
            }))
            .sort((a, b) => a.periodo.localeCompare(b.periodo));
    }

    const groupedData = new Map<string, { quantidade: number; valor: number }>();

    for (const contract of data || []) {
        let key = '';
        if (agrupamento === 'vendedor') {
            key = (contract.seller as any)?.name || 'Não informado';
        } else if (agrupamento === 'produto') {
            key = (contract.category as any)?.name || contract.type || 'Outros';
        } else {
            key = contract.type || 'Outros';
        }

        const valor = Number(contract.value);

        if (!groupedData.has(key)) {
            groupedData.set(key, { quantidade: 0, valor: 0 });
        }

        const data = groupedData.get(key)!;
        data.quantidade += 1;
        data.valor += valor;
    }

    return Array.from(groupedData.entries())
        .map(([periodo, data]) => ({
            periodo,
            quantidade: data.quantidade,
            valor: data.valor,
        }))
        .sort((a, b) => b.valor - a.valor);
}

export async function getRankingVendasData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<RankingVendasData[]> {
    const vendas = await getVendasVendedorData(branchId, startDate, endDate);
    const total = vendas.reduce((sum, v) => sum + v.valor, 0);

    return vendas.map((venda, index) => ({
        posicao: index + 1,
        vendedor: venda.vendedor,
        valor: venda.valor,
        quantidade: venda.quantidade,
        percentual: total > 0 ? (venda.valor / total) * 100 : 0,
    }));
}

// ============================================
// RELATÓRIOS DE CLIENTES/CRM - Funções
// ============================================

export async function getBaseAtivaClientesData(
    branchId: string
): Promise<BaseAtivaClientesData> {
    const { data: clientes, error } = await supabase
        .from('favorecidos')
        .select('id, tipo, created_at')
        .eq('tipo', 'cliente');

    if (error) throw error;

    const hoje = new Date();
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());

    const ativos = (clientes || []).filter(c => {
        const created = new Date(c.created_at);
        return created <= mesPassado;
    }).length;

    const novos = (clientes || []).filter(c => {
        const created = new Date(c.created_at);
        return created > mesPassado;
    }).length;

    const inativos = 0; // Calcular baseado em contratos

    return {
        total: clientes?.length || 0,
        ativos,
        inativos,
        novos,
        crescimento: novos > 0 ? (novos / (clientes?.length || 1)) * 100 : 0,
    };
}

export async function getClientesProdutoData(
    branchId: string
): Promise<ClientesProdutoData[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select(`
            value,
            favorecido:favorecidos(id, name),
            category:categories(name)
        `)
        .eq('branch_id', branchId)
        .eq('status', 'ativo');

    if (error) throw error;

    const produtoData = new Map<string, { clientes: Set<string>; receita: number }>();

    for (const contract of data || []) {
        const produto = (contract.category as any)?.name || contract.type || 'Outros';
        const cliente = (contract.favorecido as any)?.id || '';
        const valor = Number(contract.value);

        if (!produtoData.has(produto)) {
            produtoData.set(produto, { clientes: new Set(), receita: 0 });
        }

        const data = produtoData.get(produto)!;
        data.clientes.add(cliente);
        data.receita += valor;
    }

    return Array.from(produtoData.entries())
        .map(([produto, data]) => ({
            produto,
            quantidade: data.clientes.size,
            receita: data.receita,
        }))
        .sort((a, b) => b.quantidade - a.quantidade);
}

export async function getHistoricoFinanceiroClienteData(
    branchId: string,
    clienteId: string,
    startDate: string,
    endDate: string
): Promise<HistoricoFinanceiroClienteData[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .eq('branch_id', branchId)
        .eq('favorecido_id', clienteId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date');

    if (error) throw error;

    const monthlyData = new Map<string, { receita: number; despesas: number }>();

    for (const entry of data || []) {
        const month = entry.due_date.substring(0, 7);
        const value = Number(entry.value);

        if (!monthlyData.has(month)) {
            monthlyData.set(month, { receita: 0, despesas: 0 });
        }

        const data = monthlyData.get(month)!;
        if (entry.type === 'receita') {
            data.receita += value;
        } else {
            data.despesas += value;
        }
    }

    return Array.from(monthlyData.entries())
        .map(([periodo, data]) => ({
            cliente: '',
            periodo,
            receita: data.receita,
            despesas: data.despesas,
            saldo: data.receita - data.despesas,
        }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
}

export async function getLifetimeValueData(
    branchId: string
): Promise<LifetimeValueData[]> {
    const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
            value,
            favorecido:favorecidos(id, name)
        `)
        .eq('branch_id', branchId)
        .eq('status', 'ativo');

    if (error) throw error;

    const clienteData = new Map<string, { receita: number; quantidade: number }>();

    for (const contract of contracts || []) {
        const clienteId = contract.favorecido_id || '';
        const cliente = (contract.favorecido as any)?.name || 'Não informado';
        const key = `${clienteId}|${cliente}`;
        const valor = Number(contract.value);

        if (!clienteData.has(key)) {
            clienteData.set(key, { receita: 0, quantidade: 0 });
        }

        const data = clienteData.get(key)!;
        data.receita += valor;
        data.quantidade += 1;
    }

    return Array.from(clienteData.entries()).map(([key, data]) => {
        const [, cliente] = key.split('|');
        const custos = data.receita * 0.3; // Estimativa de 30% de custos
        const ltv = data.receita - custos;

        return {
            cliente,
            receitaTotal: data.receita,
            custos,
            ltv,
            quantidadeContratos: data.quantidade,
        };
    }).sort((a, b) => b.ltv - a.ltv);
}

export async function getPerfilClienteLucrativoData(
    branchId: string
): Promise<PerfilClienteLucrativoData[]> {
    const ltvData = await getLifetimeValueData(branchId);

    return ltvData.map(cliente => {
        const score = (cliente.ltv / 1000) + (cliente.quantidadeContratos * 10);
        return {
            cliente: cliente.cliente,
            receita: cliente.receitaTotal,
            margem: cliente.ltv,
            frequencia: cliente.quantidadeContratos,
            score,
        };
    }).sort((a, b) => b.score - a.score).slice(0, 10);
}

export async function getClientesInativosData(
    branchId: string,
    diasInativo: number = 90
): Promise<ClientesInativosData[]> {
    const hoje = new Date();
    const dataLimite = new Date(hoje.getTime() - diasInativo * 24 * 60 * 60 * 1000);

    const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
            end_date,
            value,
            favorecido:favorecidos(id, name)
        `)
        .eq('branch_id', branchId)
        .order('end_date', { ascending: false });

    if (error) throw error;

    const clienteData = new Map<string, { ultimoContrato: string; receita: number }>();

    for (const contract of contracts || []) {
        const clienteId = contract.favorecido_id || '';
        const cliente = (contract.favorecido as any)?.name || 'Não informado';
        const key = `${clienteId}|${cliente}`;
        const endDate = new Date(contract.end_date);

        if (endDate < dataLimite) {
            if (!clienteData.has(key)) {
                clienteData.set(key, { ultimoContrato: contract.end_date, receita: 0 });
            }

            const data = clienteData.get(key)!;
            data.receita += Number(contract.value);
            if (new Date(data.ultimoContrato) < endDate) {
                data.ultimoContrato = contract.end_date;
            }
        }
    }

    return Array.from(clienteData.entries()).map(([key, data]) => {
        const [, cliente] = key.split('|');
        const ultimoContrato = new Date(data.ultimoContrato);
        const diasInativo = Math.floor((hoje.getTime() - ultimoContrato.getTime()) / (1000 * 60 * 60 * 24));

        return {
            cliente,
            ultimoContrato: data.ultimoContrato,
            diasInativo,
            receitaHistorica: data.receita,
        };
    }).sort((a, b) => b.diasInativo - a.diasInativo);
}

export async function getRetencaoRecompraData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<RetencaoRecompraData[]> {
    const { data: contracts, error } = await supabase
        .from('contracts')
        .select('favorecido_id, start_date, end_date')
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate);

    if (error) throw error;

    const clienteContratos = new Map<string, string[]>();

    for (const contract of contracts || []) {
        const clienteId = contract.favorecido_id || '';
        if (!clienteContratos.has(clienteId)) {
            clienteContratos.set(clienteId, []);
        }
        clienteContratos.get(clienteId)!.push(contract.start_date);
    }

    const monthlyData = new Map<string, { retencao: number; recompra: number }>();

    for (const [clienteId, datas] of clienteContratos.entries()) {
        if (datas.length > 1) {
            const month = datas[0].substring(0, 7);
            if (!monthlyData.has(month)) {
                monthlyData.set(month, { retencao: 0, recompra: 0 });
            }
            monthlyData.get(month)!.retencao += 1;
            monthlyData.get(month)!.recompra += datas.length - 1;
        }
    }

    return Array.from(monthlyData.entries())
        .map(([periodo, data]) => ({
            periodo,
            retencao: data.retencao,
            recompra: data.recompra,
            taxaRetencao: data.retencao > 0 ? (data.recompra / data.retencao) * 100 : 0,
        }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
}

// ============================================
// RELATÓRIOS DE RH - Funções
// ============================================

export async function getProdutividadeFuncionarioData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<ProdutividadeFuncionarioData[]> {
    const vendas = await getVendasVendedorData(branchId, startDate, endDate);

    return vendas.map(venda => ({
        funcionario: venda.vendedor,
        vendas: venda.quantidade,
        contratos: venda.quantidade,
        receita: venda.valor,
        produtividade: venda.quantidade > 0 ? venda.valor / venda.quantidade : 0,
    }));
}

export async function getComissaoResultadoData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<ComissaoResultadoData[]> {
    const comissoes = await getComissoesData(branchId, startDate, endDate);
    const vendas = await getVendasVendedorData(branchId, startDate, endDate);

    const vendedorData = new Map<string, { comissao: number; resultado: number }>();

    for (const comissao of comissoes) {
        vendedorData.set(comissao.vendedor, { comissao: comissao.valor, resultado: 0 });
    }

    for (const venda of vendas) {
        if (vendedorData.has(venda.vendedor)) {
            vendedorData.get(venda.vendedor)!.resultado = venda.valor;
        }
    }

    return Array.from(vendedorData.entries()).map(([funcionario, data]) => ({
        funcionario,
        comissao: data.comissao,
        resultado: data.resultado,
        eficiencia: data.resultado > 0 ? (data.comissao / data.resultado) * 100 : 0,
    }));
}

export async function getRankingPerformanceData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<RankingPerformanceData[]> {
    const vendas = await getVendasVendedorData(branchId, startDate, endDate);
    const { data: targets } = await supabase
        .from('sales_targets')
        .select('target_amount, actual_amount, seller:favorecidos!seller_id(name)')
        .eq('branch_id', branchId);

    const vendedorData = new Map<string, { vendas: number; metas: number }>();

    for (const venda of vendas) {
        vendedorData.set(venda.vendedor, { vendas: venda.valor, metas: 0 });
    }

    for (const target of targets || []) {
        const vendedor = (target.seller as any)?.name || 'Não informado';
        if (vendedorData.has(vendedor)) {
            vendedorData.get(vendedor)!.metas = Number(target.target_amount);
        }
    }

    return Array.from(vendedorData.entries())
        .map(([funcionario, data], index) => {
            const score = data.metas > 0 ? (data.vendas / data.metas) * 100 : 0;
            return {
                posicao: index + 1,
                funcionario,
                score,
                vendas: data.vendas,
                metas: data.metas,
            };
        })
        .sort((a, b) => b.score - a.score);
}

// ============================================
// RELATÓRIOS DE OPERAÇÕES - Funções
// ============================================

export async function getContratosAprovadosReprovadosData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<ContratosAprovadosReprovadosData> {
    const { data, error } = await supabase
        .from('contracts')
        .select('id, title, value, status, start_date')
        .eq('branch_id', branchId)
        .gte('start_date', startDate)
        .lte('start_date', endDate);

    if (error) throw error;

    let aprovados = 0;
    let reprovados = 0;
    let pendentes = 0;
    const detalhes: any[] = [];

    for (const contract of data || []) {
        if (contract.status === 'aprovado' || contract.status === 'ativo') {
            aprovados += 1;
        } else if (contract.status === 'encerrado') {
            reprovados += 1;
        } else {
            pendentes += 1;
        }

        detalhes.push({
            contrato: contract.title,
            status: contract.status,
            valor: Number(contract.value),
            data: contract.start_date,
        });
    }

    const total = aprovados + reprovados + pendentes;
    const taxaAprovacao = total > 0 ? (aprovados / total) * 100 : 0;

    return {
        aprovados,
        reprovados,
        pendentes,
        taxaAprovacao,
        detalhes,
    };
}

export async function getLogsAlteracoesData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<LogsAlteracoesData[]> {
    const { data, error } = await supabase
        .from('activity_logs')
        .select('created_at, user_name, action, entity_type, details')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) throw error;

    return (data || []).map(log => ({
        data: log.created_at,
        usuario: log.user_name || 'Sistema',
        acao: log.action,
        entidade: log.entity_type,
        detalhes: JSON.stringify(log.details || {}),
    }));
}

// ============================================
// RELATÓRIOS DE MARKETING - Funções
// ============================================

export async function getIndicadoresCrescimentoData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<IndicadoresCrescimentoData[]> {
    const { data: clientes, error: errorClientes } = await supabase
        .from('favorecidos')
        .select('created_at')
        .eq('tipo', 'cliente')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

    const { data: receitas, error: errorReceitas } = await supabase
        .from('financial_entries')
        .select('value, due_date')
        .eq('branch_id', branchId)
        .eq('type', 'receita')
        .gte('due_date', startDate)
        .lte('due_date', endDate);

    if (errorClientes || errorReceitas) throw errorClientes || errorReceitas;

    const monthlyData = new Map<string, { clientes: number; receita: number }>();

    for (const cliente of clientes || []) {
        const month = cliente.created_at.substring(0, 7);
        if (!monthlyData.has(month)) {
            monthlyData.set(month, { clientes: 0, receita: 0 });
        }
        monthlyData.get(month)!.clientes += 1;
    }

    for (const receita of receitas || []) {
        const month = receita.due_date.substring(0, 7);
        if (!monthlyData.has(month)) {
            monthlyData.set(month, { clientes: 0, receita: 0 });
        }
        monthlyData.get(month)!.receita += Number(receita.value);
    }

    let previousClientes = 0;
    let previousReceita = 0;

    return Array.from(monthlyData.entries())
        .map(([periodo, data]) => {
            const crescimentoClientes = previousClientes > 0 ? data.clientes - previousClientes : 0;
            const crescimentoReceita = previousReceita > 0 ? data.receita - previousReceita : 0;
            previousClientes = data.clientes;
            previousReceita = data.receita;

            return {
                periodo,
                clientes: data.clientes,
                receita: data.receita,
                crescimento: crescimentoClientes + crescimentoReceita,
            };
        })
        .sort((a, b) => a.periodo.localeCompare(b.periodo));
}

export async function getOrigemClienteData(
    branchId: string
): Promise<OrigemClienteData[]> {
    // Nota: Requer campo 'origem' na tabela favorecidos
    // Por enquanto, usando tipo como proxy
    const { data, error } = await supabase
        .from('favorecidos')
        .select('tipo')
        .eq('tipo', 'cliente');

    if (error) throw error;

    // Simulação de origem - em produção, usar campo 'origem' real
    const origemData = new Map<string, number>();
    const origens = ['Indicação', 'Internet', 'WhatsApp'];

    for (const cliente of data || []) {
        // Distribuição aleatória para demonstração
        const origem = origens[Math.floor(Math.random() * origens.length)];
        origemData.set(origem, (origemData.get(origem) || 0) + 1);
    }

    const total = data?.length || 0;
    const { data: contracts } = await supabase
        .from('contracts')
        .select('value, favorecido_id')
        .eq('branch_id', branchId)
        .eq('status', 'ativo');

    const origemReceita = new Map<string, number>();

    for (const contract of contracts || []) {
        const origem = origens[Math.floor(Math.random() * origens.length)];
        const valor = Number(contract.value);
        origemReceita.set(origem, (origemReceita.get(origem) || 0) + valor);
    }

    return Array.from(origemData.entries()).map(([origem, quantidade]) => ({
        origem,
        quantidade,
        receita: origemReceita.get(origem) || 0,
        percentual: total > 0 ? (quantidade / total) * 100 : 0,
    }));
}

// ============================================
// RELATÓRIOS ESTRATÉGICOS - Funções
// ============================================

export async function getScorePerformanceVendedorData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<ScorePerformanceVendedorData[]> {
    const vendas = await getVendasVendedorData(branchId, startDate, endDate);
    const { data: targets } = await supabase
        .from('sales_targets')
        .select('target_amount, actual_amount, seller:favorecidos!seller_id(name)')
        .eq('branch_id', branchId);

    const vendedorData = new Map<string, { vendas: number; metas: number }>();

    for (const venda of vendas) {
        vendedorData.set(venda.vendedor, { vendas: venda.valor, metas: 0 });
    }

    for (const target of targets || []) {
        const vendedor = (target.seller as any)?.name || 'Não informado';
        if (vendedorData.has(vendedor)) {
            vendedorData.get(vendedor)!.metas = Number(target.target_amount);
        }
    }

    return Array.from(vendedorData.entries()).map(([vendedor, data]) => {
        const eficiencia = data.metas > 0 ? (data.vendas / data.metas) * 100 : 0;
        const score = (eficiencia * 0.5) + (data.vendas / 10000 * 0.5); // Fórmula de score

        return {
            vendedor,
            score,
            vendas: data.vendas,
            metas: data.metas,
            eficiencia,
        };
    }).sort((a, b) => b.score - a.score);
}

export async function getMetaRiscoData(
    branchId: string,
    year: number,
    month: number
): Promise<MetaRiscoData[]> {
    const hoje = new Date();
    const fimMes = new Date(year, month, 0);
    const diasRestantes = Math.max(0, Math.ceil((fimMes.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));

    const { data: targets, error } = await supabase
        .from('sales_targets')
        .select(`
            target_amount,
            actual_amount,
            seller:favorecidos!seller_id(name)
        `)
        .eq('branch_id', branchId)
        .eq('year', year)
        .eq('month', month);

    if (error) throw error;

    return (targets || []).map(target => {
        const meta = Number(target.target_amount);
        const realizado = Number(target.actual_amount);
        const percentual = meta > 0 ? (realizado / meta) * 100 : 0;
        const necessario = meta - realizado;
        const mediaDiaria = diasRestantes > 0 ? necessario / diasRestantes : 0;
        const mediaAtual = realizado / (30 - diasRestantes);

        let risco: 'alto' | 'medio' | 'baixo' = 'baixo';
        if (percentual < 50 || mediaDiaria > mediaAtual * 1.5) {
            risco = 'alto';
        } else if (percentual < 75 || mediaDiaria > mediaAtual) {
            risco = 'medio';
        }

        return {
            vendedor: (target.seller as any)?.name || 'Não informado',
            meta,
            realizado,
            percentual,
            diasRestantes,
            risco,
        };
    }).filter(m => m.risco !== 'baixo').sort((a, b) => {
        const riscoOrder = { alto: 3, medio: 2, baixo: 1 };
        return riscoOrder[b.risco] - riscoOrder[a.risco];
    });
}

export async function getCaixaCriticoData(
    branchId: string
): Promise<CaixaCriticoData[]> {
    const hoje = new Date();
    const proximos30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .eq('branch_id', branchId)
        .gte('due_date', hoje.toISOString().split('T')[0])
        .lte('due_date', proximos30Dias.toISOString().split('T')[0])
        .order('due_date');

    if (error) throw error;

    const dailyData = new Map<string, { entrada: number; saida: number }>();

    for (const entry of data || []) {
        const date = entry.due_date;
        const value = Number(entry.value);

        if (!dailyData.has(date)) {
            dailyData.set(date, { entrada: 0, saida: 0 });
        }

        const day = dailyData.get(date)!;
        if (entry.type === 'receita') {
            day.entrada += value;
        } else {
            day.saida += value;
        }
    }

    let saldo = 0;
    const result: CaixaCriticoData[] = [];

    for (const [date, data] of Array.from(dailyData.entries()).sort()) {
        saldo += data.entrada - data.saida;
        const projecao = saldo;

        result.push({
            data: date,
            saldo,
            projecao,
            alerta: saldo < 0,
        });
    }

    return result;
}

export async function getVendedorForaPadraoData(
    branchId: string,
    startDate: string,
    endDate: string
): Promise<VendedorForaPadraoData[]> {
    const vendas = await getVendasVendedorData(branchId, startDate, endDate);

    if (vendas.length === 0) return [];

    const valores = vendas.map(v => v.valor);
    const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
    const variancia = valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length;
    const desvio = Math.sqrt(variancia);

    const limiteSuperior = media + (2 * desvio);
    const limiteInferior = media - (2 * desvio);

    return vendas
        .filter(v => v.valor > limiteSuperior || v.valor < limiteInferior)
        .map(v => ({
            vendedor: v.vendedor,
            metricas: {
                vendas: v.valor,
                media,
                desvio,
            },
            anomalia: v.valor > limiteSuperior ? 'Performance excepcional' : 'Performance abaixo do esperado',
        }));
}
