import { getCreditCardSales, type SalesCreditCardWithRelations } from '@/services/salesCreditCard';
import { getDPlusSales, type SalesDPlusWithRelations } from '@/services/salesDPlus';
import { TERMINAL_LABELS, CARD_BRAND_LABELS } from '@/constants/sales';

// ─── Filter interface ─────────────────────────────────────────────────────────

export interface SalesReportFilters {
    branchId: string;
    dateFrom: string; // YYYY-MM-DD
    dateTo: string; // YYYY-MM-DD
    terminals?: string[];
    sellerIds?: string[];
}

// ─── Breakdown types ──────────────────────────────────────────────────────────

export interface TerminalBreakdown {
    terminal: string;
    terminal_label: string;
    count: number;
    sale_value_sum: number;
    terminal_amount_sum: number;
    fee_sum: number;
    fee_pct: number;
}

export interface BrandBreakdown {
    card_brand: string;
    card_brand_label: string;
    count: number;
    sale_value_sum: number;
    terminal_amount_sum: number;
    fee_sum: number;
    pct_of_total: number;
}

export interface SellerBreakdown {
    seller_id: string | null;
    seller_name: string;
    cc_count: number;
    cc_value: number;
    dplus_count: number;
    dplus_commission: number;
    total: number;
}

export interface SalesReportKPIs {
    total_bruto: number;
    total_liquido: number;
    total_taxa: number;
    total_transacoes: number;
    total_dplus: number;
}

// ─── Pure aggregation functions ───────────────────────────────────────────────

export function buildTerminalBreakdown(sales: SalesCreditCardWithRelations[]): TerminalBreakdown[] {
    const map = new Map<string, TerminalBreakdown>();

    for (const s of sales) {
        const key = s.terminal;
        if (!map.has(key)) {
            map.set(key, {
                terminal: key,
                terminal_label: TERMINAL_LABELS[key] ?? key,
                count: 0,
                sale_value_sum: 0,
                terminal_amount_sum: 0,
                fee_sum: 0,
                fee_pct: 0,
            });
        }
        const entry = map.get(key)!;
        entry.count += 1;
        entry.sale_value_sum += s.sale_value;
        entry.terminal_amount_sum += s.terminal_amount;
        entry.fee_sum += s.terminal_amount - s.sale_value;
    }

    const result = Array.from(map.values()).sort((a, b) => a.terminal_label.localeCompare(b.terminal_label));

    for (const row of result) {
        row.fee_pct = row.terminal_amount_sum > 0
            ? (row.fee_sum / row.terminal_amount_sum) * 100
            : 0;
    }

    return result;
}

export function buildBrandBreakdown(sales: SalesCreditCardWithRelations[]): BrandBreakdown[] {
    const map = new Map<string, BrandBreakdown>();
    const grandTotal = sales.reduce((sum, s) => sum + s.sale_value, 0);

    for (const s of sales) {
        const key = s.card_brand;
        if (!map.has(key)) {
            map.set(key, {
                card_brand: key,
                card_brand_label: CARD_BRAND_LABELS[key] ?? key,
                count: 0,
                sale_value_sum: 0,
                terminal_amount_sum: 0,
                fee_sum: 0,
                pct_of_total: 0,
            });
        }
        const entry = map.get(key)!;
        entry.count += 1;
        entry.sale_value_sum += s.sale_value;
        entry.terminal_amount_sum += s.terminal_amount;
        entry.fee_sum += s.terminal_amount - s.sale_value;
    }

    const result = Array.from(map.values()).sort((a, b) => a.card_brand_label.localeCompare(b.card_brand_label));

    for (const row of result) {
        row.pct_of_total = grandTotal > 0 ? (row.sale_value_sum / grandTotal) * 100 : 0;
    }

    return result;
}

export function buildSellerBreakdown(
    cc: SalesCreditCardWithRelations[],
    dplus: SalesDPlusWithRelations[],
): SellerBreakdown[] {
    const map = new Map<string, SellerBreakdown>();

    const getOrCreate = (sellerId: string | null, sellerName: string): SellerBreakdown => {
        const key = sellerId ?? '__null__';
        if (!map.has(key)) {
            map.set(key, {
                seller_id: sellerId,
                seller_name: sellerName || '[Sem Vendedor]',
                cc_count: 0,
                cc_value: 0,
                dplus_count: 0,
                dplus_commission: 0,
                total: 0,
            });
        }
        return map.get(key)!;
    };

    for (const s of cc) {
        const entry = getOrCreate(s.seller_id ?? null, s.seller?.name ?? '');
        entry.cc_count += 1;
        entry.cc_value += s.sale_value;
        entry.total += s.sale_value;
    }

    for (const s of dplus) {
        const entry = getOrCreate(s.seller_id ?? null, s.seller?.name ?? '');
        entry.dplus_count += 1;
        entry.dplus_commission += s.commission_value ?? s.contract_value;
        entry.total += s.commission_value ?? s.contract_value;
    }

    return Array.from(map.values()).sort((a, b) => {
        if (a.seller_id === null) return 1;
        if (b.seller_id === null) return -1;
        return a.seller_name.localeCompare(b.seller_name);
    });
}

export function computeKPIs(
    cc: SalesCreditCardWithRelations[],
    dplus: SalesDPlusWithRelations[],
): SalesReportKPIs {
    const total_bruto = cc.reduce((sum, s) => sum + s.terminal_amount, 0);
    const total_liquido = cc.reduce((sum, s) => sum + s.sale_value, 0);
    const total_dplus = dplus.reduce((sum, s) => sum + (s.commission_value ?? s.contract_value), 0);

    return {
        total_bruto,
        total_liquido,
        total_taxa: total_bruto - total_liquido,
        total_transacoes: cc.length + dplus.length,
        total_dplus,
    };
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function exportReportToCSV(
    cc: SalesCreditCardWithRelations[],
    dplus: SalesDPlusWithRelations[],
    branchName: string,
    dateFrom: string,
    dateTo: string,
): void {
    const lines: string[] = [];
    const kpis = computeKPIs(cc, dplus);
    const termBreak = buildTerminalBreakdown(cc);
    const brandBreak = buildBrandBreakdown(cc);
    const sellerBreak = buildSellerBreakdown(cc, dplus);

    const fmt = (v: number) => v.toFixed(2);

    // Header
    lines.push('# Relatório de Vendas');
    lines.push(`# Período: ${dateFrom} até ${dateTo}`);
    lines.push(`# Unidade: ${branchName}`);
    lines.push(`# Data de Geração: ${new Date().toLocaleString('pt-BR')}`);
    lines.push('#');
    lines.push('# Resumo de KPIs');
    lines.push(`# Total Bruto,${fmt(kpis.total_bruto)}`);
    lines.push(`# Total Líquido,${fmt(kpis.total_liquido)}`);
    lines.push(`# Total de Taxas,${fmt(kpis.total_taxa)}`);
    lines.push(`# Transações,${kpis.total_transacoes}`);
    lines.push('');

    // Credit card section
    lines.push('# Cartão de Crédito');
    lines.push([
        'Data', 'Vendedor', 'Cliente', 'Terminal', 'Bandeira',
        'Final Cartão', 'Parcelas', 'Valor Venda', 'Valor Maquineta', 'Taxa', 'Status',
    ].join(','));
    for (const s of cc) {
        lines.push([
            escapeCSV(s.sale_date ?? s.created_at.split('T')[0]),
            escapeCSV(s.seller?.name ?? ''),
            escapeCSV(s.client?.name ?? ''),
            escapeCSV(TERMINAL_LABELS[s.terminal] ?? s.terminal),
            escapeCSV(CARD_BRAND_LABELS[s.card_brand] ?? s.card_brand),
            escapeCSV(s.card_final_digits ?? ''),
            escapeCSV(s.installments ?? 1),
            fmt(s.sale_value),
            fmt(s.terminal_amount),
            fmt(s.terminal_amount - s.sale_value),
            escapeCSV(s.status),
        ].join(','));
    }
    lines.push('');

    // D+ section
    lines.push('# D+ Produtos');
    lines.push(['Data', 'Vendedor', 'Cliente', 'Proposta', 'Banco', 'Tabela', 'Valor Contrato', 'Comissão', 'Status'].join(','));
    for (const s of dplus) {
        lines.push([
            escapeCSV(s.sale_date ?? s.created_at.split('T')[0]),
            escapeCSV(s.seller?.name ?? ''),
            escapeCSV(s.client?.name ?? ''),
            escapeCSV(s.proposal_number),
            escapeCSV(s.bank_info ?? ''),
            escapeCSV(s.table_info ?? ''),
            fmt(s.contract_value),
            fmt(s.commission_value ?? 0),
            escapeCSV(s.status),
        ].join(','));
    }
    lines.push('');

    // Terminal breakdown
    lines.push('# Resumo por Terminal');
    lines.push(['Terminal', 'Qtd', 'Valor Venda', 'Valor Maquineta', 'Taxa Total'].join(','));
    for (const r of termBreak) {
        lines.push([
            escapeCSV(r.terminal_label), r.count, fmt(r.sale_value_sum), fmt(r.terminal_amount_sum), fmt(r.fee_sum),
        ].join(','));
    }
    lines.push('');

    // Brand breakdown
    lines.push('# Resumo por Bandeira');
    lines.push(['Bandeira', 'Qtd', 'Valor Venda', 'Valor Maquineta', 'Taxa Total'].join(','));
    for (const r of brandBreak) {
        lines.push([
            escapeCSV(r.card_brand_label), r.count, fmt(r.sale_value_sum), fmt(r.terminal_amount_sum), fmt(r.fee_sum),
        ].join(','));
    }
    lines.push('');

    // Seller breakdown
    lines.push('# Resumo por Vendedor');
    lines.push(['Vendedor', 'Qtd CC', 'Valor CC', 'Qtd D+', 'D+ Comissão', 'Total Geral'].join(','));
    for (const r of sellerBreak) {
        lines.push([
            escapeCSV(r.seller_name), r.cc_count, fmt(r.cc_value), r.dplus_count, fmt(r.dplus_commission), fmt(r.total),
        ].join(','));
    }

    const csv = lines.join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_vendas_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Main service function (fetches both tables) ──────────────────────────────

export interface SalesReportData {
    ccSales: SalesCreditCardWithRelations[];
    dplusSales: SalesDPlusWithRelations[];
    kpis: SalesReportKPIs;
    terminalBreakdown: TerminalBreakdown[];
    brandBreakdown: BrandBreakdown[];
    sellerBreakdown: SellerBreakdown[];
}

export async function getSalesReport(filters: SalesReportFilters): Promise<SalesReportData> {
    const [ccSales, dplusSales] = await Promise.all([
        getCreditCardSales({
            branchId: filters.branchId,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            ...(filters.terminals?.length ? { terminal: filters.terminals[0] } : {}),
            ...(filters.sellerIds?.length ? { sellerId: filters.sellerIds[0] } : {}),
        }),
        getDPlusSales({
            branchId: filters.branchId,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            ...(filters.sellerIds?.length ? { sellerId: filters.sellerIds[0] } : {}),
        }),
    ]);

    // Apply multi-value terminal filter client-side (service only accepts single terminal)
    const filteredCC = filters.terminals?.length && filters.terminals.length > 1
        ? ccSales.filter((s) => filters.terminals!.includes(s.terminal))
        : ccSales;

    // Apply multi-value seller filter client-side for both types
    const filteredCCBySeller = filters.sellerIds?.length && filters.sellerIds.length > 1
        ? filteredCC.filter((s) => s.seller_id != null && filters.sellerIds!.includes(s.seller_id))
        : filteredCC;

    const filteredDplus = filters.sellerIds?.length && filters.sellerIds.length > 1
        ? dplusSales.filter((s) => s.seller_id != null && filters.sellerIds!.includes(s.seller_id))
        : dplusSales;

    // Use sale_date for filtering (existing services filter by created_at; re-filter here)
    const ccByDate = filteredCCBySeller.filter((s) => {
        const d = s.sale_date ?? s.created_at.split('T')[0];
        return d >= filters.dateFrom && d <= filters.dateTo;
    });

    const dplusByDate = filteredDplus.filter((s) => {
        const d = s.sale_date ?? s.created_at.split('T')[0];
        return d >= filters.dateFrom && d <= filters.dateTo;
    });

    return {
        ccSales: ccByDate,
        dplusSales: dplusByDate,
        kpis: computeKPIs(ccByDate, dplusByDate),
        terminalBreakdown: buildTerminalBreakdown(ccByDate),
        brandBreakdown: buildBrandBreakdown(ccByDate),
        sellerBreakdown: buildSellerBreakdown(ccByDate, dplusByDate),
    };
}
