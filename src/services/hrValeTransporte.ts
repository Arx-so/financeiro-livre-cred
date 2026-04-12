import { supabase } from '@/lib/supabase';
import type {
    VtRecharge,
    VtRechargeInsert,
    Favorecido,
} from '@/types/database';

export interface VtRechargeWithEmployee extends VtRecharge {
    employee?: Pick<Favorecido, 'id' | 'name' | 'document'> | null;
}

export interface VtFilters {
    branchId?: string;
    employeeId?: string;
    month?: number;
    year?: number;
    search?: string;
}

export interface VtMonthlyReportRow {
    employee_id: string;
    employee_name: string;
    employee_document: string | null;
    recharge_count: number;
    total_amount: number;
    recharges: VtRechargeWithEmployee[];
}

export interface VtMonthlyReport {
    month: number;
    year: number;
    branch_id: string;
    rows: VtMonthlyReportRow[];
    grand_total: number;
}

export async function getVtRecharges(filters: VtFilters = {}): Promise<VtRechargeWithEmployee[]> {
    let query = supabase
        .from('vt_recharges')
        .select(`
            *,
            employee:favorecidos(id, name, document)
        `)
        .order('recharge_date', { ascending: false });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
    }

    if (filters.month && filters.year) {
        const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
        const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
        query = query.gte('recharge_date', start).lte('recharge_date', end);
    }

    const { data, error } = await query;
    if (error) throw error;

    let results = (data ?? []) as VtRechargeWithEmployee[];

    if (filters.search) {
        const term = filters.search.toLowerCase();
        results = results.filter((r) => (
            r.employee?.name?.toLowerCase().includes(term)
            || r.employee?.document?.toLowerCase().includes(term)
        ));
    }

    return results;
}

export async function createVtRecharge(data: VtRechargeInsert): Promise<VtRecharge> {
    const { data: created, error } = await supabase
        .from('vt_recharges')
        .insert(data)
        .select()
        .single();

    if (error) throw error;
    return created;
}

const MONTH_NAMES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function exportVTMonthlyReportToCSV(
    recharges: VtRechargeWithEmployee[],
    month: number,
    year: number,
): string {
    const header = ['Funcionário', 'Documento', 'Total VT', 'Data Recarga'];

    const rows = recharges.map((r) => [
        r.employee?.name ?? '',
        r.employee?.document ?? '',
        r.recharge_amount.toFixed(2),
        r.recharge_date ?? '',
    ]);

    const allRows = [header, ...rows];
    const csvContent = allRows
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    return `${bom}Relatório VT — ${MONTH_NAMES_PT[month - 1]} ${year}\n\n${csvContent}`;
}

export async function generateVtMonthlyReport(
    branchId: string,
    month: number,
    year: number,
): Promise<VtMonthlyReport> {
    const recharges = await getVtRecharges({ branchId, month, year });

    const byEmployee = new Map<string, VtMonthlyReportRow>();

    for (const r of recharges) {
        if (!r.employee_id) continue;
        const existing = byEmployee.get(r.employee_id);
        if (existing) {
            existing.total_amount += r.recharge_amount;
            existing.recharge_count += 1;
            existing.recharges.push(r);
        } else {
            byEmployee.set(r.employee_id, {
                employee_id: r.employee_id,
                employee_name: r.employee?.name ?? '',
                employee_document: r.employee?.document ?? null,
                recharge_count: 1,
                total_amount: r.recharge_amount,
                recharges: [r],
            });
        }
    }

    const rows = Array.from(byEmployee.values()).sort(
        (a, b) => a.employee_name.localeCompare(b.employee_name),
    );

    return {
        month,
        year,
        branch_id: branchId,
        rows,
        grand_total: rows.reduce((acc, r) => acc + r.total_amount, 0),
    };
}
