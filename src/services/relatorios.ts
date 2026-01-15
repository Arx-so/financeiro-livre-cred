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
