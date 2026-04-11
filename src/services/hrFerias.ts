import { supabase } from '@/lib/supabase';
import type {
    EmployeeVacation,
    EmployeeVacationInsert,
    EmployeeVacationUpdate,
    Favorecido,
} from '@/types/database';

export interface VacationWithEmployee extends EmployeeVacation {
    employee?: Pick<Favorecido, 'id' | 'name' | 'document'> | null;
}

export interface VacationFilters {
    branchId?: string;
    employeeId?: string;
    status?: string;
    month?: number;
    year?: number;
    search?: string;
}

export async function getEmployeeVacations(
    filters: VacationFilters = {},
): Promise<VacationWithEmployee[]> {
    let query = supabase
        .from('employee_vacations')
        .select(`
            *,
            employee:favorecidos(id, name, document)
        `)
        .order('vacation_expiry_date', { ascending: true });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
    }

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    if (filters.month) {
        query = query
            .gte('vacation_start_date', `${filters.year ?? new Date().getFullYear()}-${String(filters.month).padStart(2, '0')}-01`)
            .lte(
                'vacation_start_date',
                `${filters.year ?? new Date().getFullYear()}-${String(filters.month).padStart(2, '0')}-31`,
            );
    }

    const { data, error } = await query;

    if (error) throw error;

    let results = (data ?? []) as VacationWithEmployee[];

    if (filters.search) {
        const term = filters.search.toLowerCase();
        results = results.filter((v) => (
            v.employee?.name?.toLowerCase().includes(term)
            || v.employee?.document?.toLowerCase().includes(term)
        ));
    }

    return results;
}

export async function getVacationById(id: string): Promise<VacationWithEmployee | null> {
    const { data, error } = await supabase
        .from('employee_vacations')
        .select(`
            *,
            employee:favorecidos(id, name, document)
        `)
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data as VacationWithEmployee | null;
}

export async function createVacation(data: EmployeeVacationInsert): Promise<EmployeeVacation> {
    const { data: created, error } = await supabase
        .from('employee_vacations')
        .insert(data)
        .select()
        .single();

    if (error) throw error;
    return created;
}

export async function updateVacation(
    id: string,
    data: EmployeeVacationUpdate,
): Promise<EmployeeVacation> {
    const { data: updated, error } = await supabase
        .from('employee_vacations')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updated;
}

export async function deleteVacation(id: string): Promise<void> {
    const { error } = await supabase
        .from('employee_vacations')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Returns vacations expiring within the next `days` calendar days
 * and vacations already expired with status still pendente.
 */
export async function getExpiringVacations(
    branchId: string,
    days = 30,
): Promise<VacationWithEmployee[]> {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + days);
    const futureStr = future.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('employee_vacations')
        .select(`
            *,
            employee:favorecidos(id, name, document)
        `)
        .eq('branch_id', branchId)
        .in('status', ['pendente', 'programada'])
        .lte('vacation_expiry_date', futureStr)
        .order('vacation_expiry_date', { ascending: true });

    if (error) throw error;

    const results = (data ?? []) as VacationWithEmployee[];
    return results.map((v) => ({
        ...v,
        _isExpired: v.vacation_expiry_date < today,
    } as VacationWithEmployee));
}
