import { supabase } from '@/lib/supabase';
import type {
    CorporateHoliday,
    CorporateHolidayInsert,
    CorporateHolidayUpdate,
} from '@/types/database';

export interface HolidayFilters {
    branchId?: string;
    year?: number;
    month?: number;
}

export async function getCorporateHolidays(
    filters: HolidayFilters = {},
): Promise<CorporateHoliday[]> {
    let query = supabase
        .from('corporate_holidays')
        .select('*')
        .order('holiday_date', { ascending: true });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.year) {
        query = query
            .gte('holiday_date', `${filters.year}-01-01`)
            .lte('holiday_date', `${filters.year}-12-31`);
    }

    if (filters.month && filters.year) {
        const start = `${filters.year}-${String(filters.month).padStart(2, '0')}-01`;
        const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
        query = query.gte('holiday_date', start).lte('holiday_date', end);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
}

export async function createHoliday(data: CorporateHolidayInsert): Promise<CorporateHoliday> {
    const { data: created, error } = await supabase
        .from('corporate_holidays')
        .insert(data)
        .select()
        .single();

    if (error) throw error;
    return created;
}

export async function updateHoliday(
    id: string,
    data: CorporateHolidayUpdate,
): Promise<CorporateHoliday> {
    const { data: updated, error } = await supabase
        .from('corporate_holidays')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updated;
}

export async function deleteHoliday(id: string): Promise<void> {
    const { error } = await supabase.from('corporate_holidays').delete().eq('id', id);
    if (error) throw error;
}
