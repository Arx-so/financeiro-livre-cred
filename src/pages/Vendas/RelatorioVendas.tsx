import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    BarChart3, CreditCard, TrendingDown, Hash, TrendingUp, Download, Banknote, Tag, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useSalesReport } from '@/hooks/useSalesReport';
import { useCreditCardSales } from '@/hooks/useSalesCreditCard';
import { useDPlusSales } from '@/hooks/useSalesDPlus';
import { exportReportToCSV } from '@/services/salesReport';
import { TERMINAL_LABELS, CARD_BRAND_LABELS, PAYMENT_METHOD_LABELS } from '@/constants/sales';
import { useBranchStore } from '@/stores';
import type { SalesCreditCardWithRelations } from '@/services/salesCreditCard';
import type { SalesDPlusWithRelations } from '@/services/salesDPlus';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        // Handle both YYYY-MM-DD and ISO strings
        const d = date.includes('T') ? new Date(date) : new Date(`${date}T00:00:00`);
        return format(d, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return date;
    }
}

function todayISO(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

const CC_STATUS_LABELS: Record<string, string> = {
    pendente: 'Pendente',
    pago: 'Pago',
    cancelado: 'Cancelado',
};

const DPLUS_STATUS_LABELS: Record<string, string> = {
    pendente: 'Pendente',
    ativo: 'Ativo',
    cancelado: 'Cancelado',
};

// ─── Credit Card Detail Table ─────────────────────────────────────────────────

interface CreditCardTableProps {
    sales: SalesCreditCardWithRelations[];
}

function CreditCardTable({ sales }: CreditCardTableProps) {
    if (sales.length === 0) {
        return (
            <EmptyState
                icon={CreditCard}
                message="Nenhuma venda de cartão encontrada"
                description="Ajuste os filtros ou o período para visualizar transações."
            />
        );
    }

    // Group by terminal, then collect subtotals
    const grouped = new Map<string, SalesCreditCardWithRelations[]>();
    for (const s of sales) {
        if (!grouped.has(s.terminal)) grouped.set(s.terminal, []);
        grouped.get(s.terminal)!.push(s);
    }
    const sortedTerminals = Array.from(grouped.keys()).sort((a, b) => (
        (TERMINAL_LABELS[a] ?? a).localeCompare(TERMINAL_LABELS[b] ?? b)
    ));

    const grandTotalSale = sales.reduce((sum, s) => sum + s.sale_value, 0);
    const grandTotalMaq = sales.reduce((sum, s) => sum + s.terminal_amount, 0);
    const grandTotalDiscount = sales.reduce((sum, s) => sum + (s.discount_amount ?? 0), 0);
    const grandTotalSatRefund = sales.reduce((sum, s) => sum + (s.saturday_refund ?? 0), 0);

    return (
        <div className="border rounded-lg overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Terminal</TableHead>
                        <TableHead>Bandeira</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="text-center">Parcelas</TableHead>
                        <TableHead className="text-right">Valor Venda</TableHead>
                        <TableHead className="text-right">Maquineta</TableHead>
                        <TableHead className="text-right">Taxa</TableHead>
                        <TableHead className="text-right">Desconto</TableHead>
                        <TableHead className="text-right">Dev. Sábado</TableHead>
                        <TableHead>Lacre</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTerminals.map((terminal) => {
                        const rows = grouped.get(terminal)!;
                        const subSale = rows.reduce((sum, s) => sum + s.sale_value, 0);
                        const subMaq = rows.reduce((sum, s) => sum + s.terminal_amount, 0);
                        const subDiscount = rows.reduce((sum, s) => sum + (s.discount_amount ?? 0), 0);
                        const subSatRefund = rows.reduce((sum, s) => sum + (s.saturday_refund ?? 0), 0);
                        return (
                            <>
                                {rows.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="text-sm whitespace-nowrap">
                                            {formatDate(s.sale_date ?? s.created_at)}
                                        </TableCell>
                                        <TableCell className="text-sm">{s.seller?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{s.client?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm">
                                            {TERMINAL_LABELS[s.terminal] ?? s.terminal}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {CARD_BRAND_LABELS[s.card_brand] ?? s.card_brand}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {PAYMENT_METHOD_LABELS[s.payment_method] ?? s.payment_method}
                                        </TableCell>
                                        <TableCell className="text-center text-sm">
                                            {s.installments ?? 1}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono">
                                            {formatCurrency(s.sale_value)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono">
                                            {formatCurrency(s.terminal_amount)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono text-destructive">
                                            {formatCurrency(s.terminal_amount - s.sale_value)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono">
                                            {(s.discount_amount ?? 0) > 0
                                                ? formatCurrency(s.discount_amount ?? 0)
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono">
                                            {(s.saturday_refund ?? 0) > 0
                                                ? formatCurrency(s.saturday_refund ?? 0)
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono">
                                            {s.lacre ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {CC_STATUS_LABELS[s.status] ?? s.status}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/50 font-semibold text-sm">
                                    <TableCell colSpan={7}>
                                        {`Subtotal ${TERMINAL_LABELS[terminal] ?? terminal}`}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(subSale)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(subMaq)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-destructive">
                                        {formatCurrency(subMaq - subSale)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {subDiscount > 0 ? formatCurrency(subDiscount) : '—'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {subSatRefund > 0 ? formatCurrency(subSatRefund) : '—'}
                                    </TableCell>
                                    <TableCell />
                                    <TableCell />
                                </TableRow>
                            </>
                        );
                    })}
                    <TableRow className="bg-muted font-bold text-sm border-t-2">
                        <TableCell colSpan={7}>TOTAL GERAL</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(grandTotalSale)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(grandTotalMaq)}</TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                            {formatCurrency(grandTotalMaq - grandTotalSale)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                            {grandTotalDiscount > 0 ? formatCurrency(grandTotalDiscount) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                            {grandTotalSatRefund > 0 ? formatCurrency(grandTotalSatRefund) : '—'}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

// ─── D+ Detail Table ──────────────────────────────────────────────────────────

interface DPlusTableProps {
    sales: SalesDPlusWithRelations[];
}

function DPlusTable({ sales }: DPlusTableProps) {
    if (sales.length === 0) {
        return (
            <EmptyState
                icon={Banknote}
                message="Nenhuma proposta D+ encontrada"
                description="Ajuste os filtros ou o período para visualizar propostas."
            />
        );
    }

    // Group by seller
    const grouped = new Map<string, SalesDPlusWithRelations[]>();
    for (const s of sales) {
        const key = s.seller_id ?? '__null__';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(s);
    }

    const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
        if (a === '__null__') return 1;
        if (b === '__null__') return -1;
        const nameA = grouped.get(a)![0]?.seller?.name ?? '';
        const nameB = grouped.get(b)![0]?.seller?.name ?? '';
        return nameA.localeCompare(nameB);
    });

    const grandTotal = sales.reduce((sum, s) => sum + s.contract_value, 0);
    const grandComissao = sales.reduce((sum, s) => sum + (s.commission_value ?? 0), 0);

    return (
        <div className="border rounded-lg overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Proposta</TableHead>
                        <TableHead>Banco</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor Contrato</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedKeys.map((key) => {
                        const rows = grouped.get(key)!;
                        const sellerName = rows[0]?.seller?.name ?? '[Sem Vendedor]';
                        const subContract = rows.reduce((sum, s) => sum + s.contract_value, 0);
                        const subComissao = rows.reduce((sum, s) => sum + (s.commission_value ?? 0), 0);
                        return (
                            <>
                                {rows.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="text-sm whitespace-nowrap">
                                            {formatDate(s.sale_date ?? s.created_at)}
                                        </TableCell>
                                        <TableCell className="text-sm">{s.seller?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{s.client?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm font-mono">{s.proposal_number}</TableCell>
                                        <TableCell className="text-sm">{s.bank_info ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{s.product_type ?? '—'}</TableCell>
                                        <TableCell className="text-right text-sm font-mono">
                                            {formatCurrency(s.contract_value)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-mono">
                                            {s.commission_value != null ? formatCurrency(s.commission_value) : '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {DPLUS_STATUS_LABELS[s.status] ?? s.status}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="bg-muted/50 font-semibold text-sm">
                                    <TableCell colSpan={6}>{`Subtotal ${sellerName}`}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(subContract)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                        {formatCurrency(subComissao)}
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </>
                        );
                    })}
                    <TableRow className="bg-muted font-bold text-sm border-t-2">
                        <TableCell colSpan={6}>TOTAL GERAL</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(grandTotal)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(grandComissao)}</TableCell>
                        <TableCell />
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

// ─── Terminal Breakdown Table ─────────────────────────────────────────────────

interface TerminalBreakdownTableProps {
    data: ReturnType<typeof import('@/services/salesReport').buildTerminalBreakdown>;
}

function TerminalBreakdownTable({ data }: TerminalBreakdownTableProps) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon={BarChart3}
                message="Sem dados por terminal"
                description="Nenhuma venda de cartão no período selecionado."
            />
        );
    }

    const totalQty = data.reduce((sum, r) => sum + r.count, 0);
    const totalSale = data.reduce((sum, r) => sum + r.sale_value_sum, 0);
    const totalMaq = data.reduce((sum, r) => sum + r.terminal_amount_sum, 0);
    const totalFee = data.reduce((sum, r) => sum + r.fee_sum, 0);

    return (
        <div className="border rounded-lg overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Terminal</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">Valor Venda</TableHead>
                        <TableHead className="text-right">Maquineta</TableHead>
                        <TableHead className="text-right">Taxa %</TableHead>
                        <TableHead className="text-right">Taxa R$</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((r) => (
                        <TableRow key={r.terminal}>
                            <TableCell className="font-medium">{r.terminal_label}</TableCell>
                            <TableCell className="text-center">{r.count}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(r.sale_value_sum)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(r.terminal_amount_sum)}</TableCell>
                            <TableCell className="text-right">{`${r.fee_pct.toFixed(2)}%`}</TableCell>
                            <TableCell className="text-right font-mono text-destructive">
                                {formatCurrency(r.fee_sum)}
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold border-t-2">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-center">{totalQty}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totalSale)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totalMaq)}</TableCell>
                        <TableCell />
                        <TableCell className="text-right font-mono text-destructive">
                            {formatCurrency(totalFee)}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

// ─── Brand Breakdown Table ────────────────────────────────────────────────────

interface BrandBreakdownTableProps {
    data: ReturnType<typeof import('@/services/salesReport').buildBrandBreakdown>;
}

function BrandBreakdownTable({ data }: BrandBreakdownTableProps) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon={BarChart3}
                message="Sem dados por bandeira"
                description="Nenhuma venda de cartão no período selecionado."
            />
        );
    }

    const totalQty = data.reduce((sum, r) => sum + r.count, 0);
    const totalSale = data.reduce((sum, r) => sum + r.sale_value_sum, 0);
    const totalMaq = data.reduce((sum, r) => sum + r.terminal_amount_sum, 0);
    const totalFee = data.reduce((sum, r) => sum + r.fee_sum, 0);

    return (
        <div className="border rounded-lg overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Bandeira</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                        <TableHead className="text-right">Maquineta</TableHead>
                        <TableHead className="text-right">Taxa</TableHead>
                        <TableHead className="text-right">% do Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((r) => (
                        <TableRow key={r.card_brand}>
                            <TableCell className="font-medium">{r.card_brand_label}</TableCell>
                            <TableCell className="text-center">{r.count}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(r.sale_value_sum)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(r.terminal_amount_sum)}</TableCell>
                            <TableCell className="text-right font-mono text-destructive">
                                {formatCurrency(r.fee_sum)}
                            </TableCell>
                            <TableCell className="text-right">{`${r.pct_of_total.toFixed(1)}%`}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold border-t-2">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-center">{totalQty}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totalSale)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totalMaq)}</TableCell>
                        <TableCell className="text-right font-mono text-destructive">
                            {formatCurrency(totalFee)}
                        </TableCell>
                        <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

// ─── Seller Breakdown Table ───────────────────────────────────────────────────

interface SellerBreakdownTableProps {
    data: ReturnType<typeof import('@/services/salesReport').buildSellerBreakdown>;
}

function SellerBreakdownTable({ data }: SellerBreakdownTableProps) {
    if (data.length === 0) {
        return (
            <EmptyState
                icon={BarChart3}
                message="Sem dados por vendedor"
                description="Nenhuma venda no período selecionado."
            />
        );
    }

    const totCC = data.reduce((sum, r) => sum + r.cc_count, 0);
    const totCCVal = data.reduce((sum, r) => sum + r.cc_value, 0);
    const totDP = data.reduce((sum, r) => sum + r.dplus_count, 0);
    const totDPVal = data.reduce((sum, r) => sum + r.dplus_commission, 0);
    const totAll = data.reduce((sum, r) => sum + r.total, 0);

    return (
        <div className="border rounded-lg overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-center">Cartão Qtd</TableHead>
                        <TableHead className="text-right">Cartão Valor</TableHead>
                        <TableHead className="text-center">D+ Qtd</TableHead>
                        <TableHead className="text-right">D+ Comissão</TableHead>
                        <TableHead className="text-right">Total Geral</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((r) => (
                        <TableRow key={r.seller_id ?? '__null__'}>
                            <TableCell className="font-medium">{r.seller_name}</TableCell>
                            <TableCell className="text-center">{r.cc_count}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(r.cc_value)}</TableCell>
                            <TableCell className="text-center">{r.dplus_count}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(r.dplus_commission)}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                                {formatCurrency(r.total)}
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="bg-muted font-bold border-t-2">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-center">{totCC}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totCCVal)}</TableCell>
                        <TableCell className="text-center">{totDP}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totDPVal)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(totAll)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RelatorioVendas() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    const today = todayISO();
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);
    const [terminalFilter, setTerminalFilter] = useState<string>('all');
    const [sellerFilter, setSellerFilter] = useState<string>('all');

    // Build terminal/seller filter arrays from single-select values
    const terminals = terminalFilter !== 'all' ? [terminalFilter] : undefined;

    // Fetch data via existing hooks for seller list population
    const { data: allCCSales = [] } = useCreditCardSales({ dateFrom, dateTo });
    const { data: allDPlusSales = [] } = useDPlusSales({ dateFrom, dateTo });

    // Build seller options from both sale types
    const sellerOptions = useMemo(() => {
        const map = new Map<string, string>();
        for (const s of allCCSales) {
            if (s.seller_id && s.seller?.name) map.set(s.seller_id, s.seller.name);
        }
        for (const s of allDPlusSales) {
            if (s.seller_id && s.seller?.name) map.set(s.seller_id, s.seller.name);
        }
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [allCCSales, allDPlusSales]);

    const sellerIds = sellerFilter !== 'all' ? [sellerFilter] : undefined;

    const { data, isLoading, error } = useSalesReport({
        dateFrom,
        dateTo,
        terminals,
        sellerIds,
    });

    const handleExportCSV = () => {
        if (!data || (data.ccSales.length === 0 && data.dplusSales.length === 0)) {
            toast.error('Nenhum dado para exportar.');
            return;
        }
        try {
            exportReportToCSV(
                data.ccSales,
                data.dplusSales,
                unidadeAtual?.name ?? '',
                dateFrom,
                dateTo,
            );
            toast.success('CSV exportado com sucesso.');
        } catch {
            toast.error('Erro ao exportar CSV.');
        }
    };

    const hasData = data && (data.ccSales.length > 0 || data.dplusSales.length > 0);

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Relatório de Vendas"
                    description="Consolidado diário de cartão de crédito e produtos D+"
                    actions={(
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            disabled={!hasData}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                        </Button>
                    )}
                />

                {/* Filters Row */}
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium">De</span>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-36"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium">Até</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-36"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium">Terminal</span>
                        <Select value={terminalFilter} onValueChange={setTerminalFilter}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Todos os terminais" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os terminais</SelectItem>
                                {Object.entries(TERMINAL_LABELS).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium">Vendedor</span>
                        <Select value={sellerFilter} onValueChange={setSellerFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Todos os vendedores" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os vendedores</SelectItem>
                                {sellerOptions.map(([id, name]) => (
                                    <SelectItem key={id} value={id}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* KPI Cards */}
                {isLoading ? (
                    <LoadingState message="Carregando relatório..." />
                ) : error ? (
                    <EmptyState
                        icon={BarChart3}
                        message="Erro ao carregar relatório"
                        description="Verifique sua conexão e tente novamente."
                    />
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            <StatCard
                                label="Total Bruto (Maquineta)"
                                value={formatCurrency(data?.kpis.total_bruto ?? 0)}
                                icon={CreditCard}
                                variant="primary"
                            />
                            <StatCard
                                label="Total Líquido (Venda)"
                                value={formatCurrency(data?.kpis.total_liquido ?? 0)}
                                icon={TrendingUp}
                                variant="income"
                            />
                            <StatCard
                                label="Total de Taxas"
                                value={formatCurrency(data?.kpis.total_taxa ?? 0)}
                                icon={TrendingDown}
                                variant="expense"
                            />
                            <StatCard
                                label="Total Transações"
                                value={data?.kpis.total_transacoes ?? 0}
                                icon={Hash}
                                variant="default"
                            />
                            <StatCard
                                label="Total Descontos"
                                value={formatCurrency(data?.kpis.total_discount ?? 0)}
                                icon={Tag}
                                variant="expense"
                            />
                            <StatCard
                                label="Total Dev. Sábado"
                                value={formatCurrency(data?.kpis.total_saturday_refund ?? 0)}
                                icon={RotateCcw}
                                variant="expense"
                            />
                        </div>

                        {/* Tabs */}
                        <Tabs defaultValue="cartao">
                            <TabsList className="flex-wrap h-auto">
                                <TabsTrigger value="cartao" className="flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Cartão de Crédito
                                    {data && (
                                        <span className="ml-1 text-xs opacity-70">
                                            {`(${data.ccSales.length})`}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="dplus" className="flex items-center gap-1.5">
                                    <Banknote className="w-3.5 h-3.5" />
                                    Produtos D+
                                    {data && (
                                        <span className="ml-1 text-xs opacity-70">
                                            {`(${data.dplusSales.length})`}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="terminal">
                                    Por Terminal
                                </TabsTrigger>
                                <TabsTrigger value="bandeira">
                                    Por Bandeira
                                </TabsTrigger>
                                <TabsTrigger value="vendedor">
                                    Por Vendedor
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="cartao" className="mt-4">
                                <CreditCardTable sales={data?.ccSales ?? []} />
                            </TabsContent>

                            <TabsContent value="dplus" className="mt-4">
                                <DPlusTable sales={data?.dplusSales ?? []} />
                            </TabsContent>

                            <TabsContent value="terminal" className="mt-4">
                                <TerminalBreakdownTable data={data?.terminalBreakdown ?? []} />
                            </TabsContent>

                            <TabsContent value="bandeira" className="mt-4">
                                <BrandBreakdownTable data={data?.brandBreakdown ?? []} />
                            </TabsContent>

                            <TabsContent value="vendedor" className="mt-4">
                                <SellerBreakdownTable data={data?.sellerBreakdown ?? []} />
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
