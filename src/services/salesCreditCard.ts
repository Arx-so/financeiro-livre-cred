import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/services/storage';
import { createFinancialEntries } from '@/services/financeiro';
import type {
    SalesCreditCard,
    SalesCreditCardInsert,
    SalesCreditCardUpdate,
    Favorecido,
} from '@/types/database';

export interface SalesCreditCardWithRelations extends SalesCreditCard {
    client?: Pick<Favorecido, 'id' | 'name' | 'document' | 'phone'> | null;
    seller?: Pick<Favorecido, 'id' | 'name'> | null;
}

export interface CreditCardSaleFilters {
    branchId?: string;
    clientId?: string;
    sellerId?: string;
    terminal?: string;
    paymentMethod?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

export interface SalesReportSummary {
    total_sale_value: number;
    total_terminal_amount: number;
    total_fee: number;
    sale_count: number;
    by_terminal: Record<string, { count: number; sale_value: number; terminal_amount: number }>;
    by_payment_method: Record<string, { count: number; amount: number }>;
    by_seller: Record<string, { seller_name: string; count: number; sale_value: number }>;
}

export async function getCreditCardSales(
    filters: CreditCardSaleFilters = {},
): Promise<SalesCreditCardWithRelations[]> {
    let query = supabase
        .from('sales_credit_card')
        .select(`
            *,
            client:favorecidos!sales_credit_card_client_id_fkey(id, name, document, phone),
            seller:favorecidos!sales_credit_card_seller_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.clientId) query = query.eq('client_id', filters.clientId);
    if (filters.sellerId) query = query.eq('seller_id', filters.sellerId);
    if (filters.terminal) query = query.eq('terminal', filters.terminal);
    if (filters.paymentMethod) query = query.eq('payment_method', filters.paymentMethod);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', `${filters.dateTo}T23:59:59`);

    const { data, error } = await query;
    if (error) throw error;

    let results = (data ?? []) as SalesCreditCardWithRelations[];

    if (filters.search) {
        const term = filters.search.toLowerCase();
        results = results.filter((s) => (
            s.client?.name?.toLowerCase().includes(term)
            || s.client?.document?.toLowerCase().includes(term)
            || s.seller?.name?.toLowerCase().includes(term)
        ));
    }

    return results;
}

export async function getCreditCardSaleById(
    id: string,
): Promise<SalesCreditCardWithRelations | null> {
    const { data, error } = await supabase
        .from('sales_credit_card')
        .select(`
            *,
            client:favorecidos!sales_credit_card_client_id_fkey(id, name, document, phone),
            seller:favorecidos!sales_credit_card_seller_id_fkey(id, name)
        `)
        .eq('id', id)
        .maybeSingle();

    if (error) throw error;
    return data as SalesCreditCardWithRelations | null;
}

export async function createCreditCardSale(
    data: SalesCreditCardInsert,
): Promise<SalesCreditCard> {
    // Auto-calculate fee_rate if not provided
    const feeRate = data.terminal_amount && data.sale_value
        ? (data.terminal_amount - data.sale_value) / data.sale_value
        : (data.fee_rate ?? 0);

    const { data: created, error } = await supabase
        .from('sales_credit_card')
        .insert({ ...data, fee_rate: feeRate })
        .select()
        .single();

    if (error) throw error;
    return created;
}

export async function updateCreditCardSaleStatus(
    id: string,
    data: Pick<SalesCreditCardUpdate, 'status' | 'payment_date'>,
): Promise<SalesCreditCard> {
    const { data: updated, error } = await supabase
        .from('sales_credit_card')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return updated;
}

export async function uploadSaleDocument(
    file: File,
    branchId: string,
    saleId: string,
): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `sales/${branchId}/${saleId}/${Date.now()}.${ext}`;
    return uploadFile('documents', path, file);
}

export async function getCreditCardSalesReport(
    filters: CreditCardSaleFilters,
): Promise<SalesReportSummary> {
    const sales = await getCreditCardSales(filters);

    const summary: SalesReportSummary = {
        total_sale_value: 0,
        total_terminal_amount: 0,
        total_fee: 0,
        sale_count: sales.length,
        by_terminal: {},
        by_payment_method: {},
        by_seller: {},
    };

    for (const s of sales) {
        summary.total_sale_value += s.sale_value;
        summary.total_terminal_amount += s.terminal_amount;
        summary.total_fee += s.terminal_amount - s.sale_value;

        // By terminal
        if (!summary.by_terminal[s.terminal]) {
            summary.by_terminal[s.terminal] = { count: 0, sale_value: 0, terminal_amount: 0 };
        }
        summary.by_terminal[s.terminal].count += 1;
        summary.by_terminal[s.terminal].sale_value += s.sale_value;
        summary.by_terminal[s.terminal].terminal_amount += s.terminal_amount;

        // By payment method
        if (!summary.by_payment_method[s.payment_method]) {
            summary.by_payment_method[s.payment_method] = { count: 0, amount: 0 };
        }
        summary.by_payment_method[s.payment_method].count += 1;
        summary.by_payment_method[s.payment_method].amount += s.sale_value;

        // By seller
        if (s.seller_id) {
            if (!summary.by_seller[s.seller_id]) {
                summary.by_seller[s.seller_id] = {
                    seller_name: s.seller?.name ?? '',
                    count: 0,
                    sale_value: 0,
                };
            }
            summary.by_seller[s.seller_id].count += 1;
            summary.by_seller[s.seller_id].sale_value += s.sale_value;
        }
    }

    return summary;
}

// ─── Financial entries generation ────────────────────────────────────────────

export interface CreditCardSaleEntriesPreview {
    receita: { description: string; value: number };
    despesa: { description: string; value: number };
}

/**
 * Preview the financial entries that would be generated for a credit card sale.
 * Does NOT create entries — used for the confirmation dialog.
 */
export function previewCreditCardSaleEntries(
    sale: SalesCreditCardWithRelations,
): CreditCardSaleEntriesPreview {
    const feeValue = sale.terminal_amount - sale.sale_value;

    return {
        receita: {
            description: `Cartão: ${sale.terminal} - ${sale.card_brand}`,
            value: sale.sale_value,
        },
        despesa: {
            description: `Taxa maquininha: ${sale.terminal}`,
            value: feeValue,
        },
    };
}

/**
 * Generate financial entries (receita + despesa) for a credit card sale and mark the sale as generated.
 * Returns the count of entries created.
 */
export async function generateFinancialEntriesFromCreditCardSale(
    sale: SalesCreditCardWithRelations,
): Promise<number> {
    const saleDate = sale.created_at.split('T')[0];
    const feeValue = sale.terminal_amount - sale.sale_value;

    await createFinancialEntries([
        {
            branch_id: sale.branch_id,
            type: 'receita',
            description: `Cartão: ${sale.terminal} - ${sale.card_brand}`,
            value: sale.sale_value,
            due_date: saleDate,
            status: 'pendente',
            favorecido_id: sale.client_id ?? undefined,
            credit_card_sale_id: sale.id,
        },
        {
            branch_id: sale.branch_id,
            type: 'despesa',
            description: `Taxa maquininha: ${sale.terminal}`,
            value: feeValue,
            due_date: saleDate,
            status: 'pendente',
            credit_card_sale_id: sale.id,
        },
    ]);

    const { error } = await supabase
        .from('sales_credit_card')
        .update({ financial_entries_generated: true })
        .eq('id', sale.id);

    if (error) throw error;

    return 2;
}
