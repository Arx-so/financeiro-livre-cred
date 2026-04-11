import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Plus, Download, CreditCard, Banknote, Search,
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
import {
    useCreditCardSales, useUpdateCreditCardSaleStatus,
} from '@/hooks/useSalesCreditCard';
import { useDPlusSales, useUpdateDPlusSaleStatus } from '@/hooks/useSalesDPlus';
import { CreditCardSaleModal } from './CreditCardSaleModal';
import { DPlusSaleModal } from './DPlusSaleModal';
import { SaleReceipt } from './SaleReceipt';
import { TERMINAL_LABELS, CARD_BRAND_LABELS, PAYMENT_METHOD_LABELS } from '@/constants/sales';
import { useBranchStore } from '@/stores';
import type { SalesCreditCardWithRelations } from '@/services/salesCreditCard';
import type { SalesDPlusWithRelations } from '@/services/salesDPlus';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string): string {
    try {
        return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return date;
    }
}

const CC_STATUS_LABELS: Record<string, string> = {
    pendente: 'Pendente',
    pago: 'Pago',
    cancelado: 'Cancelado',
};

const CC_STATUS_COLORS: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    pago: 'bg-green-100 text-green-800 border-green-200',
    cancelado: 'bg-red-100 text-red-800 border-red-200',
};

const DPLUS_STATUS_LABELS: Record<string, string> = {
    pendente: 'Pendente',
    ativo: 'Ativo',
    cancelado: 'Cancelado',
};

const DPLUS_STATUS_COLORS: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ativo: 'bg-green-100 text-green-800 border-green-200',
    cancelado: 'bg-red-100 text-red-800 border-red-200',
};

// ────────────────────────────────────────────────────────────────────────────
// CSV export helpers
// ────────────────────────────────────────────────────────────────────────────

function exportCCSalesCSV(sales: SalesCreditCardWithRelations[]) {
    const headers = [
        'Data', 'Cliente', 'Vendedor', 'Terminal', 'Bandeira', 'Pagamento',
        'Valor Venda', 'Valor Maquineta', 'Taxa %', 'Status',
    ];
    const rows = sales.map((s) => [
        formatDate(s.created_at),
        s.client?.name ?? '',
        s.seller?.name ?? '',
        TERMINAL_LABELS[s.terminal] ?? s.terminal,
        CARD_BRAND_LABELS[s.card_brand] ?? s.card_brand,
        PAYMENT_METHOD_LABELS[s.payment_method] ?? s.payment_method,
        s.sale_value.toFixed(2),
        s.terminal_amount.toFixed(2),
        (s.fee_rate * 100).toFixed(2),
        CC_STATUS_LABELS[s.status] ?? s.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas-cartao-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportDPlusSalesCSV(sales: SalesDPlusWithRelations[]) {
    const headers = ['Data', 'Cliente', 'Vendedor', 'Proposta', 'Banco', 'Tabela', 'Valor Contrato', 'Status'];
    const rows = sales.map((s) => [
        formatDate(s.created_at),
        s.client?.name ?? '',
        s.seller?.name ?? '',
        s.proposal_number,
        s.bank_info ?? '',
        s.table_info ?? '',
        s.contract_value.toFixed(2),
        DPLUS_STATUS_LABELS[s.status] ?? s.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(';')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas-dplus-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────────────────────────────────
// Credit Card Tab
// ────────────────────────────────────────────────────────────────────────────

function CreditCardTab() {
    const branchName = useBranchStore((state) => state.unidadeAtual?.name);
    const [ccModalOpen, setCcModalOpen] = useState(false);
    const [receiptSale, setReceiptSale] = useState<SalesCreditCardWithRelations | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const updateStatus = useUpdateCreditCardSaleStatus();

    const { data: sales = [], isLoading } = useCreditCardSales({
        search: search || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    const totalValue = sales.reduce((sum, s) => sum + s.sale_value, 0);
    const totalTerminal = sales.reduce((sum, s) => sum + s.terminal_amount, 0);

    const handleStatusChange = (id: string, status: string) => {
        updateStatus.mutate({ id, status }, {
            onSuccess: () => toast.success('Status atualizado.'),
            onError: () => toast.error('Erro ao atualizar status.'),
        });
    };

    return (
        <>
            <div className="space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="Total de Vendas" value={sales.length} icon={CreditCard} />
                    <StatCard label="Valor Total" value={formatCurrency(totalValue)} icon={CreditCard} variant="income" />
                    <StatCard label="Total Maquineta" value={formatCurrency(totalTerminal)} icon={CreditCard} variant="primary" />
                    <StatCard
                        label="Total de Taxas"
                        value={formatCurrency(totalTerminal - totalValue)}
                        icon={CreditCard}
                        variant={totalTerminal - totalValue > 0 ? 'expense' : 'default'}
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-48">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cliente, proposta..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="w-36">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todos</SelectItem>
                                {Object.entries(CC_STATUS_LABELS).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-36"
                        />
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-36"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportCCSalesCSV(sales)}
                        disabled={sales.length === 0}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button onClick={() => setCcModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Venda
                    </Button>
                </div>

                {/* Table */}
                {isLoading ? (
                    <LoadingState message="Carregando vendas..." />
                ) : sales.length === 0 ? (
                    <EmptyState
                        icon={CreditCard}
                        message="Nenhuma venda encontrada"
                        description="Registre a primeira venda de cartão de crédito."
                    />
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead>Terminal</TableHead>
                                    <TableHead>Bandeira</TableHead>
                                    <TableHead>Pagamento</TableHead>
                                    <TableHead className="text-right">Valor Venda</TableHead>
                                    <TableHead className="text-right">Maquineta</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-8" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map((sale) => (
                                    <TableRow
                                        key={sale.id}
                                        className="cursor-pointer hover:bg-accent/50"
                                        onClick={() => setReceiptSale(sale)}
                                    >
                                        <TableCell className="text-sm">{formatDate(sale.created_at)}</TableCell>
                                        <TableCell className="font-medium text-sm">{sale.client?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{sale.seller?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm">
                                            {TERMINAL_LABELS[sale.terminal] ?? sale.terminal}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {CARD_BRAND_LABELS[sale.card_brand] ?? sale.card_brand}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {PAYMENT_METHOD_LABELS[sale.payment_method] ?? sale.payment_method}
                                        </TableCell>
                                        <TableCell className="text-right font-mono-numbers text-sm">
                                            {formatCurrency(sale.sale_value)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono-numbers text-sm">
                                            {formatCurrency(sale.terminal_amount)}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Select
                                                value={sale.status}
                                                onValueChange={(v) => handleStatusChange(sale.id, v)}
                                            >
                                                <SelectTrigger className="h-7 w-28 text-xs">
                                                    <span
                                                        className={`px-1.5 py-0.5 rounded text-xs border ${CC_STATUS_COLORS[sale.status] ?? ''}`}
                                                    >
                                                        {CC_STATUS_LABELS[sale.status] ?? sale.status}
                                                    </span>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(CC_STATUS_LABELS).map(([val, label]) => (
                                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <CreditCardSaleModal open={ccModalOpen} onClose={() => setCcModalOpen(false)} />
            {receiptSale && (
                <SaleReceipt
                    sale={receiptSale}
                    branchName={branchName}
                    open={!!receiptSale}
                    onClose={() => setReceiptSale(null)}
                />
            )}
        </>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// D+ Tab
// ────────────────────────────────────────────────────────────────────────────

function DPlusTab() {
    const [dPlusModalOpen, setDPlusModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const updateStatus = useUpdateDPlusSaleStatus();

    const { data: sales = [], isLoading } = useDPlusSales({
        search: search || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    const totalValue = sales.reduce((sum, s) => sum + s.contract_value, 0);

    const handleStatusChange = (id: string, status: string) => {
        updateStatus.mutate({ id, status }, {
            onSuccess: () => toast.success('Status atualizado.'),
            onError: () => toast.error('Erro ao atualizar status.'),
        });
    };

    return (
        <>
            <div className="space-y-4">
                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <StatCard label="Total de Propostas" value={sales.length} icon={Banknote} />
                    <StatCard label="Valor Total de Contratos" value={formatCurrency(totalValue)} icon={Banknote} variant="income" />
                    <StatCard
                        label="Ativos"
                        value={sales.filter((s) => s.status === 'ativo').length}
                        icon={Banknote}
                        variant="primary"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-48">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cliente, proposta..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="w-36">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todos</SelectItem>
                                {Object.entries(DPLUS_STATUS_LABELS).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-36"
                        />
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-36"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportDPlusSalesCSV(sales)}
                        disabled={sales.length === 0}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button onClick={() => setDPlusModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Proposta
                    </Button>
                </div>

                {/* Table */}
                {isLoading ? (
                    <LoadingState message="Carregando propostas..." />
                ) : sales.length === 0 ? (
                    <EmptyState
                        icon={Banknote}
                        message="Nenhuma proposta encontrada"
                        description="Registre a primeira proposta de produto D+."
                    />
                ) : (
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead>Proposta</TableHead>
                                    <TableHead>Banco</TableHead>
                                    <TableHead>Tabela</TableHead>
                                    <TableHead className="text-right">Valor Contrato</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map((sale) => (
                                    <TableRow key={sale.id}>
                                        <TableCell className="text-sm">{formatDate(sale.created_at)}</TableCell>
                                        <TableCell className="font-medium text-sm">{sale.client?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{sale.seller?.name ?? '—'}</TableCell>
                                        <TableCell className="font-mono-numbers text-sm">{sale.proposal_number}</TableCell>
                                        <TableCell className="text-sm">{sale.bank_info ?? '—'}</TableCell>
                                        <TableCell className="text-sm">{sale.table_info ?? '—'}</TableCell>
                                        <TableCell className="text-right font-mono-numbers text-sm">
                                            {formatCurrency(sale.contract_value)}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={sale.status}
                                                onValueChange={(v) => handleStatusChange(sale.id, v)}
                                            >
                                                <SelectTrigger className="h-7 w-28 text-xs">
                                                    <span
                                                        className={`px-1.5 py-0.5 rounded text-xs border ${DPLUS_STATUS_COLORS[sale.status] ?? ''}`}
                                                    >
                                                        {DPLUS_STATUS_LABELS[sale.status] ?? sale.status}
                                                    </span>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(DPLUS_STATUS_LABELS).map(([val, label]) => (
                                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <DPlusSaleModal open={dPlusModalOpen} onClose={() => setDPlusModalOpen(false)} />
        </>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────

export default function VendasNovo() {
    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Vendas"
                    description="Cartão de crédito e produtos D+"
                />

                <Tabs defaultValue="cartao">
                    <TabsList>
                        <TabsTrigger value="cartao" className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Cartão de Crédito
                        </TabsTrigger>
                        <TabsTrigger value="dplus" className="flex items-center gap-2">
                            <Banknote className="w-4 h-4" />
                            Produtos D+
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="cartao" className="mt-4">
                        <CreditCardTab />
                    </TabsContent>
                    <TabsContent value="dplus" className="mt-4">
                        <DPlusTab />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
