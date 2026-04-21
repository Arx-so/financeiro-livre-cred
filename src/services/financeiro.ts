import { supabase } from '@/lib/supabase';
import type {
    FinancialEntry,
    FinancialEntryInsert,
    FinancialEntryUpdate,
    EntryType,
    EntryStatus
} from '@/types/database';

export interface FinancialEntryWithRelations extends FinancialEntry {
  category?: { id: string; name: string; color: string } | null;
  subcategory?: { id: string; name: string } | null;
  favorecido?: { id: string; name: string } | null;
  bank_account?: { id: string; name: string; bank_name: string } | null;
}

export interface FinancialFilters {
  branchId?: string;
  type?: EntryType;
  status?: EntryStatus;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  favorecidoId?: string;
}

export interface FinancialSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  pendentes: number;
  atrasados: number;
}

// Get all financial entries with filters
export async function getFinancialEntries(filters: FinancialFilters = {}): Promise<FinancialEntryWithRelations[]> {
    let query = supabase
        .from('financial_entries')
        .select(`
      *,
      category:categories(id, name, color),
      subcategory:subcategories(id, name),
      favorecido:favorecidos(id, name),
      bank_account:bank_accounts(id, name, bank_name)
    `)
        .order('due_date', { ascending: false });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.type) {
        query = query.eq('type', filters.type);
    }

    if (filters.status) {
        query = query.eq('status', filters.status);
    }

    if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
    }

    if (filters.startDate) {
        query = query.gte('due_date', filters.startDate);
    }

    if (filters.endDate) {
        query = query.lte('due_date', filters.endDate);
    }

    if (filters.search) {
        query = query.or(`description.ilike.%${filters.search}%`);
    }

    if (filters.favorecidoId) {
        query = query.eq('favorecido_id', filters.favorecidoId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching financial entries:', error);
        throw error;
    }

    return data || [];
}

// Get single financial entry
export async function getFinancialEntry(id: string): Promise<FinancialEntryWithRelations | null> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
      *,
      category:categories(id, name, color),
      subcategory:subcategories(id, name),
      favorecido:favorecidos(id, name),
      bank_account:bank_accounts(id, name, bank_name)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching financial entry:', error);
        throw error;
    }

    return data;
}

// Create financial entry
export async function createFinancialEntry(entry: FinancialEntryInsert): Promise<FinancialEntry> {
    const { data, error } = await supabase
        .from('financial_entries')
        .insert(entry)
        .select()
        .single();

    if (error) {
        console.error('Error creating financial entry:', error);
        throw error;
    }

    return data;
}

// Create multiple financial entries (for recurring entries)
export async function createFinancialEntries(entries: FinancialEntryInsert[]): Promise<FinancialEntry[]> {
    if (entries.length === 0) return [];

    const { data, error } = await supabase
        .from('financial_entries')
        .insert(entries)
        .select();

    if (error) {
        console.error('Error creating financial entries:', error);
        throw error;
    }

    return data || [];
}

// Create recurring financial entries with group linking via recurring_parent_id
export async function createRecurringFinancialEntries(entries: FinancialEntryInsert[]): Promise<FinancialEntry[]> {
    if (entries.length === 0) return [];
    if (entries.length === 1) return [await createFinancialEntry(entries[0])];

    // Create the first entry to obtain its ID, which becomes the group parent
    const firstEntry = await createFinancialEntry(entries[0]);

    // Create the remaining entries pointing back to the first entry
    const { data, error } = await supabase
        .from('financial_entries')
        .insert(entries.slice(1).map((e) => ({ ...e, recurring_parent_id: firstEntry.id })))
        .select();

    if (error) {
        console.error('Error creating recurring financial entries:', error);
        throw error;
    }

    return [firstEntry, ...(data || [])];
}

// Get all entries belonging to the same recurring group as the given entry
export async function getRecurringGroup(entry: {
    id: string;
    recurring_parent_id: string | null;
}): Promise<FinancialEntry[]> {
    // If the entry has a parent, use that as root; otherwise the entry itself is the root
    const rootId = entry.recurring_parent_id ?? entry.id;

    const { data, error } = await supabase
        .from('financial_entries')
        .select('*')
        .or(`id.eq.${rootId},recurring_parent_id.eq.${rootId}`)
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Error fetching recurring group:', error);
        throw error;
    }

    return data || [];
}

// Update multiple financial entries at once
export async function updateFinancialEntries(ids: string[], update: FinancialEntryUpdate): Promise<void> {
    if (ids.length === 0) return;

    const { error } = await supabase
        .from('financial_entries')
        .update(update)
        .in('id', ids);

    if (error) {
        console.error('Error updating financial entries:', error);
        throw error;
    }
}

// Helper function to calculate next recurrence dates
export function calculateRecurringDates(
    startDate: string,
    recurrenceType: 'diario' | 'semanal' | 'mensal' | 'anual',
    recurrenceDay: number | null | undefined,
    endDateOrCount: string | number = 12
): string[] {
    const dates: string[] = [];
    const start = new Date(`${startDate}T12:00:00`); // Use noon to avoid timezone issues

    // If no recurrence day specified for mensal, use the day from the start date
    const effectiveRecurrenceDay = recurrenceDay ?? start.getDate();

    // Calculate the end date and max iterations
    let endDate: Date | null = null;
    let maxIterations = 120; // Safety limit

    if (typeof endDateOrCount === 'string') {
        // It's an end date string
        endDate = new Date(`${endDateOrCount}T12:00:00`);
    } else {
        // It's a count
        maxIterations = endDateOrCount;
    }

    // Include the first date
    dates.push(start.toISOString().split('T')[0]);

    let i = 1;
    while (i <= maxIterations) {
        const nextDate = new Date(start);
        let lastDay: number;

        switch (recurrenceType) {
            case 'diario':
                nextDate.setDate(start.getDate() + i);
                break;
            case 'semanal':
                nextDate.setDate(start.getDate() + (i * 7));
                break;
            case 'mensal':
                nextDate.setMonth(start.getMonth() + i);
                // Set the day to the recurrence day, handling months with fewer days
                lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                nextDate.setDate(Math.min(effectiveRecurrenceDay, lastDay));
                break;
            case 'anual':
                nextDate.setFullYear(start.getFullYear() + i);
                // For annual, also respect the recurrence day
                lastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
                nextDate.setDate(Math.min(effectiveRecurrenceDay, lastDay));
                break;
            default:
                break;
        }

        // Stop if we've passed the end date
        if (endDate && nextDate > endDate) {
            break;
        }

        dates.push(nextDate.toISOString().split('T')[0]);
        i++;
    }

    return dates;
}

// Update financial entry
export async function updateFinancialEntry(id: string, entry: FinancialEntryUpdate): Promise<FinancialEntry> {
    const { data, error } = await supabase
        .from('financial_entries')
        .update(entry)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating financial entry:', error);
        throw error;
    }

    return data;
}

// Delete financial entry
export async function deleteFinancialEntry(id: string): Promise<void> {
    const { error } = await supabase
        .from('financial_entries')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting financial entry:', error);
        throw error;
    }
}

// Delete multiple financial entries
export async function deleteFinancialEntries(ids: string[]): Promise<void> {
    const { error } = await supabase
        .from('financial_entries')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Error deleting financial entries:', error);
        throw error;
    }
}

// Mark entry as paid
export async function markAsPaid(id: string, paymentDate?: string): Promise<FinancialEntry> {
    return updateFinancialEntry(id, {
        status: 'pago',
        payment_date: paymentDate || new Date().toISOString().split('T')[0],
    });
}

// Get financial summary for branch
export async function getFinancialSummary(branchId: string | undefined, startDate?: string, endDate?: string): Promise<FinancialSummary> {
    let query = supabase
        .from('financial_entries')
        .select('type, status, value');

    if (branchId) {
        query = query.eq('branch_id', branchId);
    }

    if (startDate) {
        query = query.gte('due_date', startDate);
    }

    if (endDate) {
        query = query.lte('due_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching financial summary:', error);
        throw error;
    }

    const summary = (data || []).reduce(
        (acc, entry) => {
            if (entry.type === 'receita') {
                acc.totalReceitas += Number(entry.value);
            } else {
                acc.totalDespesas += Number(entry.value);
            }

            if (entry.status === 'pendente') {
                acc.pendentes += Number(entry.value);
            } else if (entry.status === 'atrasado') {
                acc.atrasados += Number(entry.value);
            }

            return acc;
        },
        {
            totalReceitas: 0, totalDespesas: 0, pendentes: 0, atrasados: 0, saldo: 0
        }
    );

    summary.saldo = summary.totalReceitas - summary.totalDespesas;

    return summary;
}

// Get monthly data for charts
export async function getMonthlyData(branchId: string | undefined, year: number): Promise<{ month: string; receitas: number; despesas: number }[]> {
    let monthlyQuery = supabase
        .from('financial_entries')
        .select('type, value, due_date')
        .gte('due_date', `${year}-01-01`)
        .lte('due_date', `${year}-12-31`);

    if (branchId) {
        monthlyQuery = monthlyQuery.eq('branch_id', branchId);
    }

    const { data, error } = await monthlyQuery;

    if (error) {
        console.error('Error fetching monthly data:', error);
        throw error;
    }

    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyData = months.map((month, index) => ({
        month,
        receitas: 0,
        despesas: 0,
    }));

    (data || []).forEach((entry) => {
        const monthIndex = new Date(entry.due_date).getMonth();
        if (entry.type === 'receita') {
            monthlyData[monthIndex].receitas += Number(entry.value);
        } else {
            monthlyData[monthIndex].despesas += Number(entry.value);
        }
    });

    return monthlyData;
}

// Get upcoming payments
export async function getUpcomingPayments(branchId: string | undefined, days: number = 30): Promise<FinancialEntryWithRelations[]> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    let upcomingQuery = supabase
        .from('financial_entries')
        .select(`
      *,
      category:categories(id, name, color),
      favorecido:favorecidos(id, name)
    `)
        .eq('status', 'pendente')
        .gte('due_date', today)
        .lte('due_date', futureDateStr)
        .order('due_date', { ascending: true });

    if (branchId) {
        upcomingQuery = upcomingQuery.eq('branch_id', branchId);
    }

    const { data, error } = await upcomingQuery;

    if (error) {
        console.error('Error fetching upcoming payments:', error);
        throw error;
    }

    return data || [];
}

// Get recent transactions
export async function getRecentTransactions(branchId: string | undefined, limit: number = 10, year?: number): Promise<FinancialEntryWithRelations[]> {
    let query = supabase
        .from('financial_entries')
        .select(`
      *,
      category:categories(id, name, color),
      favorecido:favorecidos(id, name)
    `);

    if (branchId) {
        query = query.eq('branch_id', branchId);
    }

    // Filter by year if provided
    if (year) {
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;
        query = query.gte('due_date', yearStart).lte('due_date', yearEnd);
    }

    const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent transactions:', error);
        throw error;
    }

    return data || [];
}

// Update overdue entries
export async function updateOverdueEntries(branchId: string | undefined): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    let overdueQuery = supabase
        .from('financial_entries')
        .update({ status: 'atrasado' })
        .eq('status', 'pendente')
        .lt('due_date', today);

    if (branchId) {
        overdueQuery = overdueQuery.eq('branch_id', branchId);
    }

    const { data, error } = await overdueQuery.select();

    if (error) {
        console.error('Error updating overdue entries:', error);
        throw error;
    }

    return data?.length || 0;
}

// Get financial entries linked to a specific contract
export async function getFinancialEntriesByContractId(
    contractId: string
): Promise<FinancialEntryWithRelations[]> {
    const { data, error } = await supabase
        .from('financial_entries')
        .select(`
            *,
            category:categories(id, name, color),
            subcategory:subcategories(id, name),
            favorecido:favorecidos(id, name),
            bank_account:bank_accounts(id, name, bank_name)
        `)
        .eq('contract_id', contractId)
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Error fetching entries by contract:', error);
        throw error;
    }

    return data || [];
}
