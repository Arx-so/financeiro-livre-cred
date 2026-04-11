import { supabase } from '@/lib/supabase';
import type {
    SalesDPlusProduct,
    SalesDPlusProductInsert,
    SalesDPlusProductUpdate,
    Favorecido,
} from '@/types/database';

export interface SalesDPlusWithRelations extends SalesDPlusProduct {
    client?: Pick<Favorecido, 'id' | 'name' | 'document' | 'phone'> | null;
    seller?: Pick<Favorecido, 'id' | 'name'> | null;
}

export interface DPlusSaleFilters {
    branchId?: string;
    clientId?: string;
    sellerId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

export async function getDPlusSales(
    filters: DPlusSaleFilters = {},
): Promise<SalesDPlusWithRelations[]> {
    let query = supabase
        .from('sales_d_plus_products')
        .select(`
            *,
            client:favorecidos!sales_d_plus_products_client_id_fkey(id, name, document, phone),
            seller:favorecidos!sales_d_plus_products_seller_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.clientId) query = query.eq('client_id', filters.clientId);
    if (filters.sellerId) query = query.eq('seller_id', filters.sellerId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', `${filters.dateTo}T23:59:59`);

    const { data, error } = await query;
    if (error) throw error;

    let results = (data ?? []) as SalesDPlusWithRelations[];

    if (filters.search) {
        const term = filters.search.toLowerCase();
        results = results.filter((s) => (
            s.client?.name?.toLowerCase().includes(term)
            || s.client?.document?.toLowerCase().includes(term)
            || s.proposal_number?.toLowerCase().includes(term)
        ));
    }

    return results;
}

export async function getDPlusSaleById(id: string): Promise<SalesDPlusWithRelations | null> {
    const { data, error } = await supabase
        .from('sales_d_plus_products')
        .select(`
            *,
            client:favorecidos!sales_d_plus_products_client_id_fkey(id, name, document, phone),
            seller:favorecidos!sales_d_plus_products_seller_id_fkey(id, name)
        `)
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data as SalesDPlusWithRelations | null;
}

export async function createDPlusSale(data: SalesDPlusProductInsert): Promise<SalesDPlusProduct> {
    const { data: created, error } = await supabase
        .from('sales_d_plus_products')
        .insert(data)
        .select()
        .single();

    if (error) throw error;
    return created;
}

export async function updateDPlusSaleStatus(
    id: string,
    data: Pick<SalesDPlusProductUpdate, 'status'>,
): Promise<SalesDPlusProduct> {
    const { data: updated, error } = await supabase
        .from('sales_d_plus_products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updated;
}

export interface DPlusReportSummary {
    total_contract_value: number;
    sale_count: number;
    by_seller: Record<string, { seller_name: string; count: number; contract_value: number }>;
    by_bank: Record<string, { count: number; contract_value: number }>;
}

export async function getDPlusSalesReport(
    filters: DPlusSaleFilters,
): Promise<DPlusReportSummary> {
    const sales = await getDPlusSales(filters);

    const summary: DPlusReportSummary = {
        total_contract_value: 0,
        sale_count: sales.length,
        by_seller: {},
        by_bank: {},
    };

    for (const s of sales) {
        summary.total_contract_value += s.contract_value;

        if (s.seller_id) {
            if (!summary.by_seller[s.seller_id]) {
                summary.by_seller[s.seller_id] = {
                    seller_name: s.seller?.name ?? '',
                    count: 0,
                    contract_value: 0,
                };
            }
            summary.by_seller[s.seller_id].count += 1;
            summary.by_seller[s.seller_id].contract_value += s.contract_value;
        }

        const bank = s.bank_info ?? 'Não informado';
        if (!summary.by_bank[bank]) {
            summary.by_bank[bank] = { count: 0, contract_value: 0 };
        }
        summary.by_bank[bank].count += 1;
        summary.by_bank[bank].contract_value += s.contract_value;
    }

    return summary;
}
