import { supabase } from '@/lib/supabase';
import type { Payroll, PayrollInsert, PayrollUpdate, FinancialEntryInsert } from '@/types/database';

export interface PayrollWithEmployee extends Payroll {
    employee?: {
        id: string;
        name: string;
        document: string | null;
    } | null;
}

export interface PayrollFilters {
    branchId?: string;
    employeeId?: string;
    month?: number;
    year?: number;
    status?: 'pendente' | 'pago';
}

/**
 * Busca todas as folhas de pagamento com filtros opcionais
 */
export async function getPayrolls(filters: PayrollFilters = {}): Promise<PayrollWithEmployee[]> {
    let query = supabase
        .from('payroll')
        .select(`
            *,
            employee:favorecidos(id, name, document)
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
export async function getPayrollSummary(branchId: string, month?: number, year?: number): Promise<{
    total: number;
    pending: number;
    paid: number;
    totalValue: number;
}> {
    let query = supabase
        .from('payroll')
        .select('status, net_salary')
        .eq('branch_id', branchId);

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
