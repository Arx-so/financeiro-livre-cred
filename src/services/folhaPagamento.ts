import { supabase } from '@/lib/supabase';
import type {
    Payroll, PayrollInsert, PayrollUpdate, FinancialEntryInsert
} from '@/types/database';

export interface PayrollWithEmployee extends Payroll {
    employee?: {
        id: string;
        name: string;
        document: string | null;
        categoria_contratacao?: string | null;
    } | null;
}

export interface PayrollFilters {
    branchId?: string;
    employeeId?: string;
    month?: number;
    year?: number;
    status?: 'pendente' | 'pago';
    categoriaContratacao?: string;
}

export interface BatchPayrollConfig {
    branch_id: string;
    employee_ids?: string[];
    categoria_contratacao?: string;
    reference_month: number;
    reference_year: number;
    base_salary: number;
    overtime_hours?: number;
    overtime_value?: number;
    transport_allowance?: number;
    meal_allowance?: number;
    other_benefits?: number;
    inss_discount?: number;
    irrf_discount?: number;
    other_discounts?: number;
    notes?: string;
    is_recurring?: boolean;
    recurrence_type?: 'infinite' | 'fixed_months';
    recurrence_months?: number;
}

/**
 * Busca todas as folhas de pagamento com filtros opcionais
 */
export async function getPayrolls(filters: PayrollFilters = {}): Promise<PayrollWithEmployee[]> {
    let query = supabase
        .from('payroll')
        .select(`
            *,
            employee:favorecidos(id, name, document, categoria_contratacao)
        `)
        .order('reference_year', { ascending: false })
        .order('reference_month', { ascending: false });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
    }

    if (filters.month) {
        query = query.eq('reference_month', filters.month);
    }

    if (filters.year) {
        query = query.eq('reference_year', filters.year);
    }

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching payrolls:', error);
        throw error;
    }

    // Filter by categoria_contratacao if needed (after fetching to use join data)
    if (filters.categoriaContratacao && data) {
        return data.filter((p) => p.employee?.categoria_contratacao === filters.categoriaContratacao);
    }

    return data || [];
}

/**
 * Busca uma folha de pagamento pelo ID
 */
export async function getPayroll(id: string): Promise<PayrollWithEmployee | null> {
    const { data, error } = await supabase
        .from('payroll')
        .select(`
            *,
            employee:favorecidos(id, name, document)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching payroll:', error);
        throw error;
    }

    return data;
}

/**
 * Cria uma nova folha de pagamento
 */
export async function createPayroll(payroll: PayrollInsert): Promise<Payroll> {
    const { data, error } = await supabase
        .from('payroll')
        .insert(payroll)
        .select()
        .single();

    if (error) {
        console.error('Error creating payroll:', error);
        throw error;
    }

    return data;
}

/**
 * Atualiza uma folha de pagamento
 */
export async function updatePayroll(id: string, payroll: PayrollUpdate): Promise<Payroll> {
    const { data, error } = await supabase
        .from('payroll')
        .update(payroll)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating payroll:', error);
        throw error;
    }

    return data;
}

/**
 * Deleta uma folha de pagamento
 */
export async function deletePayroll(id: string): Promise<void> {
    const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting payroll:', error);
        throw error;
    }
}

/**
 * Gera um lançamento financeiro a partir da folha de pagamento
 */
export async function generateFinancialEntry(payrollId: string): Promise<Payroll> {
    // Buscar a folha de pagamento
    const payroll = await getPayroll(payrollId);
    if (!payroll) {
        throw new Error('Folha de pagamento não encontrada');
    }

    if (payroll.financial_entry_id) {
        throw new Error('Lançamento financeiro já foi gerado para esta folha');
    }

    // Criar o lançamento financeiro
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const entryData: FinancialEntryInsert = {
        branch_id: payroll.branch_id,
        type: 'despesa',
        description: `Folha de Pagamento - ${payroll.employee?.name || 'Funcionário'} - ${monthNames[payroll.reference_month - 1]}/${payroll.reference_year}`,
        value: payroll.net_salary,
        due_date: `${payroll.reference_year}-${String(payroll.reference_month).padStart(2, '0')}-05`,
        status: 'pendente',
        favorecido_id: payroll.employee_id,
        notes: `Folha de pagamento gerada automaticamente. Salário líquido.`,
    };

    const { data: entry, error: entryError } = await supabase
        .from('financial_entries')
        .insert(entryData)
        .select()
        .single();

    if (entryError) {
        console.error('Error creating financial entry:', entryError);
        throw entryError;
    }

    // Atualizar a folha de pagamento com o ID do lançamento
    const updatedPayroll = await updatePayroll(payrollId, {
        financial_entry_id: entry.id,
    });

    return updatedPayroll;
}

const monthNamesService = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Busca folhas de pagamento em um intervalo de meses para geração em lote
 */
export async function getPayrollsInRange(
    branchId: string | undefined,
    employeeIds: string[] | undefined,
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number,
): Promise<PayrollWithEmployee[]> {
    let query = supabase
        .from('payroll')
        .select('*, employee:favorecidos(id, name, document, categoria_contratacao)')
        .gte('reference_year', startYear)
        .lte('reference_year', endYear)
        .order('reference_year', { ascending: true })
        .order('reference_month', { ascending: true });

    if (branchId) query = query.eq('branch_id', branchId);
    if (employeeIds && employeeIds.length > 0) query = query.in('employee_id', employeeIds);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching payrolls in range:', error);
        throw error;
    }

    const startIndex = startYear * 12 + startMonth;
    const endIndex = endYear * 12 + endMonth;

    return (data || []).filter((p) => {
        const index = p.reference_year * 12 + p.reference_month;
        return index >= startIndex && index <= endIndex;
    });
}

export interface BatchGenerationResultItem {
    payrollId: string;
    employeeName: string;
    period: string;
    value: number;
    status: 'created' | 'error';
    error?: string;
}

/**
 * Gera lançamentos financeiros em lote a partir de uma lista de folhas
 * Folhas que já têm lançamento terão o antigo removido e um novo criado
 */
export async function generateFinancialEntriesBatch(
    selectedPayrolls: PayrollWithEmployee[],
): Promise<BatchGenerationResultItem[]> {
    const results: BatchGenerationResultItem[] = [];

    for (const payroll of selectedPayrolls) {
        const employeeName = payroll.employee?.name || 'Funcionário';
        const period = `${monthNamesService[payroll.reference_month - 1]}/${payroll.reference_year}`;

        try {
            // Remove lançamento anterior se existir
            if (payroll.financial_entry_id) {
                const { error: deleteError } = await supabase
                    .from('financial_entries')
                    .delete()
                    .eq('id', payroll.financial_entry_id);
                if (deleteError) throw deleteError;
            }

            const entryData: FinancialEntryInsert = {
                branch_id: payroll.branch_id,
                type: 'despesa',
                description: `Folha de Pagamento - ${employeeName} - ${period}`,
                value: payroll.net_salary,
                due_date: `${payroll.reference_year}-${String(payroll.reference_month).padStart(2, '0')}-05`,
                status: 'pendente',
                favorecido_id: payroll.employee_id,
                notes: 'Folha de pagamento gerada automaticamente. Salário líquido.',
            };

            const { data: entry, error: entryError } = await supabase
                .from('financial_entries')
                .insert(entryData)
                .select()
                .single();

            if (entryError) throw entryError;

            await updatePayroll(payroll.id, { financial_entry_id: entry.id });

            results.push({
                payrollId: payroll.id, employeeName, period, value: payroll.net_salary, status: 'created',
            });
        } catch (err: any) {
            results.push({
                payrollId: payroll.id,
                employeeName,
                period,
                value: payroll.net_salary,
                status: 'error',
                error: err?.message || 'Erro desconhecido',
            });
        }
    }

    return results;
}

/**
 * Calcula o salário líquido
 */
export function calculateNetSalary(data: {
    base_salary: number;
    overtime_value: number;
    transport_allowance: number;
    meal_allowance: number;
    other_benefits: number;
    inss_discount: number;
    irrf_discount: number;
    other_discounts: number;
}): number {
    const totalBenefits = data.base_salary
        + data.overtime_value
        + data.transport_allowance
        + data.meal_allowance
        + data.other_benefits;

    const totalDiscounts = data.inss_discount
        + data.irrf_discount
        + data.other_discounts;

    return totalBenefits - totalDiscounts;
}

/**
 * Obtém o resumo das folhas de pagamento
 */
export async function getPayrollSummary(branchId: string | undefined, month?: number, year?: number): Promise<{
    total: number;
    pending: number;
    paid: number;
    totalValue: number;
}> {
    let query = supabase
        .from('payroll')
        .select('status, net_salary');

    if (branchId) {
        query = query.eq('branch_id', branchId);
    }

    if (month) {
        query = query.eq('reference_month', month);
    }

    if (year) {
        query = query.eq('reference_year', year);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching payroll summary:', error);
        throw error;
    }

    const payrolls = data || [];
    return {
        total: payrolls.length,
        pending: payrolls.filter((p) => p.status === 'pendente').length,
        paid: payrolls.filter((p) => p.status === 'pago').length,
        totalValue: payrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0),
    };
}

/**
 * Busca IDs de funcionários por categoria de contratação
 */
async function getEmployeeIdsByCategory(categoriaContratacao: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('favorecidos')
        .select('id')
        .eq('type', 'funcionario')
        .eq('categoria_contratacao', categoriaContratacao)
        .eq('is_active', true);

    if (error) {
        console.error('Error fetching employees by category:', error);
        throw error;
    }

    return (data || []).map((e) => e.id);
}

/**
 * Busca funcionários por filtros (branch_id e/ou categoria_contratacao)
 */
export async function getEmployeesByFilters(filters: {
    branch_id?: string;
    categoria_contratacao?: string;
}): Promise<Array<{ id: string; name: string; document: string | null; categoria_contratacao: string | null }>> {
    let query = supabase
        .from('favorecidos')
        .select('id, name, document, categoria_contratacao')
        .eq('type', 'funcionario')
        .eq('is_active', true);

    if (filters.categoria_contratacao) {
        query = query.eq('categoria_contratacao', filters.categoria_contratacao);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching employees:', error);
        throw error;
    }

    return data || [];
}

/**
 * Busca categorias de contratação únicas
 */
export async function getHiringCategories(): Promise<string[]> {
    const { data, error } = await supabase
        .from('favorecidos')
        .select('categoria_contratacao')
        .eq('type', 'funcionario')
        .eq('is_active', true)
        .not('categoria_contratacao', 'is', null);

    if (error) {
        console.error('Error fetching hiring categories:', error);
        throw error;
    }

    const categories = new Set<string>();
    (data || []).forEach((item) => {
        if (item.categoria_contratacao) {
            categories.add(item.categoria_contratacao);
        }
    });

    return Array.from(categories).sort();
}

/**
 * Cria folhas de pagamento em lote
 */
export async function createBatchPayroll(config: BatchPayrollConfig): Promise<Payroll[]> {
    // Calcular salário líquido
    const netSalary = calculateNetSalary({
        base_salary: config.base_salary,
        overtime_value: config.overtime_value || 0,
        transport_allowance: config.transport_allowance || 0,
        meal_allowance: config.meal_allowance || 0,
        other_benefits: config.other_benefits || 0,
        inss_discount: config.inss_discount || 0,
        irrf_discount: config.irrf_discount || 0,
        other_discounts: config.other_discounts || 0,
    });

    // Buscar funcionários baseado nos filtros
    let employeeIds: string[] = [];

    if (config.employee_ids && config.employee_ids.length > 0) {
        employeeIds = config.employee_ids;
    } else {
        const employees = await getEmployeesByFilters({
            categoria_contratacao: config.categoria_contratacao,
        });
        employeeIds = employees.map((e) => e.id);
    }

    if (employeeIds.length === 0) {
        throw new Error('Nenhum funcionário encontrado com os filtros especificados');
    }

    // Gerar batch_group_id
    const batchGroupId = crypto.randomUUID();

    // Preparar dados das folhas
    const payrollsToCreate: PayrollInsert[] = [];
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    // Se for recorrente com meses fixos, criar folhas futuras
    if (config.is_recurring && config.recurrence_type === 'fixed_months' && config.recurrence_months) {
        for (let monthOffset = 0; monthOffset < config.recurrence_months; monthOffset++) {
            let targetMonth = config.reference_month + monthOffset;
            let targetYear = config.reference_year;

            while (targetMonth > 12) {
                targetMonth -= 12;
                targetYear += 1;
            }

            for (const employeeId of employeeIds) {
                payrollsToCreate.push({
                    branch_id: config.branch_id,
                    employee_id: employeeId,
                    reference_month: targetMonth,
                    reference_year: targetYear,
                    base_salary: config.base_salary,
                    overtime_hours: config.overtime_hours || 0,
                    overtime_value: config.overtime_value || 0,
                    transport_allowance: config.transport_allowance || 0,
                    meal_allowance: config.meal_allowance || 0,
                    other_benefits: config.other_benefits || 0,
                    inss_discount: config.inss_discount || 0,
                    irrf_discount: config.irrf_discount || 0,
                    other_discounts: config.other_discounts || 0,
                    net_salary: netSalary,
                    status: 'pendente',
                    notes: config.notes || null,
                    is_batch: true,
                    batch_group_id: batchGroupId,
                    is_recurring: config.is_recurring,
                    recurrence_type: config.recurrence_type || null,
                    recurrence_months: config.recurrence_months || null,
                    recurrence_end_date: config.recurrence_months
                        ? calculateRecurrenceEndDate(config.reference_year, config.reference_month, config.recurrence_months)
                        : null,
                    is_recurring_template: false,
                });
            }
        }
    } else {
        // Criar folha única ou template recorrente
        for (const employeeId of employeeIds) {
            payrollsToCreate.push({
                branch_id: config.branch_id,
                employee_id: employeeId,
                reference_month: config.reference_month,
                reference_year: config.reference_year,
                base_salary: config.base_salary,
                overtime_hours: config.overtime_hours || 0,
                overtime_value: config.overtime_value || 0,
                transport_allowance: config.transport_allowance || 0,
                meal_allowance: config.meal_allowance || 0,
                other_benefits: config.other_benefits || 0,
                inss_discount: config.inss_discount || 0,
                irrf_discount: config.irrf_discount || 0,
                other_discounts: config.other_discounts || 0,
                net_salary: netSalary,
                status: 'pendente',
                notes: config.notes || null,
                is_batch: true,
                batch_group_id: batchGroupId,
                is_recurring: config.is_recurring || false,
                recurrence_type: config.recurrence_type || null,
                recurrence_months: config.recurrence_months || null,
                recurrence_end_date: config.recurrence_months
                    ? calculateRecurrenceEndDate(config.reference_year, config.reference_month, config.recurrence_months)
                    : null,
                is_recurring_template: config.is_recurring && config.recurrence_type === 'infinite',
            });
        }
    }

    // Inserir todas as folhas
    const { data, error } = await supabase
        .from('payroll')
        .insert(payrollsToCreate)
        .select();

    if (error) {
        console.error('Error creating batch payroll:', error);
        throw error;
    }

    return data || [];
}

/**
 * Calcula a data final da recorrência
 */
function calculateRecurrenceEndDate(startYear: number, startMonth: number, months: number): string {
    let endMonth = startMonth + months - 1;
    let endYear = startYear;

    while (endMonth > 12) {
        endMonth -= 12;
        endYear += 1;
    }

    // Último dia do mês
    const lastDay = new Date(endYear, endMonth, 0).getDate();
    return `${endYear}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}
