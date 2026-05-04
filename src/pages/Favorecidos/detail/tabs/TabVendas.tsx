import { ShoppingCart, FileText } from 'lucide-react';
import { EmptyState, LoadingState } from '@/components/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import type { SalesCreditCardWithRelations } from '@/services/salesCreditCard';
import type { SalesDPlusWithRelations } from '@/services/salesDPlus';

interface TabVendasProps {
    creditCardSales: SalesCreditCardWithRelations[];
    dplusSales: SalesDPlusWithRelations[];
    ccLoading: boolean;
    dplusLoading: boolean;
}

const terminalLabel: Record<string, string> = {
    sumup_w: 'SumUp W',
    sumup_r: 'SumUp R',
    sumup_h: 'SumUp H',
    laranjinha_h: 'Laranjinha H',
    c6_r: 'C6 R',
    pague_veloz: 'PagueVeloz',
    mercado_pago_r: 'Mercado Pago R',
    pagbank_h: 'PagBank H',
};

const ccStatusConfig: Record<string, { label: string; className: string }> = {
    pendente: { label: 'Pendente', className: 'badge-warning' },
    pago: { label: 'Pago', className: 'badge-success' },
    cancelado: { label: 'Cancelado', className: 'badge-neutral' },
};

const dplusStatusConfig: Record<string, { label: string; className: string }> = {
    pendente: { label: 'Pendente', className: 'badge-warning' },
    ativo: { label: 'Ativo', className: 'badge-success' },
    cancelado: { label: 'Cancelado', className: 'badge-neutral' },
};

function MaquininhaTab({ sales, isLoading }: { sales: SalesCreditCardWithRelations[]; isLoading: boolean }) {
    if (isLoading) return <LoadingState />;
    if (sales.length === 0) return <EmptyState icon={ShoppingCart} message="Nenhuma venda de maquininha encontrada" />;

    return (
        <div className="card-financial overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground font-medium">Data</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Terminal</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Bandeira</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
                        <th className="text-right p-3 text-muted-foreground font-medium hidden md:table-cell">Comissão</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {sales.map((sale) => {
                        const sc = ccStatusConfig[sale.status] ?? { label: sale.status, className: 'badge-neutral' };
                        return (
                            <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-3 text-foreground">{formatDate(sale.sale_date)}</td>
                                <td className="p-3 text-muted-foreground hidden md:table-cell">
                                    {terminalLabel[sale.terminal] ?? sale.terminal}
                                </td>
                                <td className="p-3 text-muted-foreground hidden sm:table-cell uppercase">
                                    {sale.card_brand}
                                </td>
                                <td className="p-3 text-right font-mono-numbers font-semibold text-income">
                                    {formatCurrency(sale.terminal_amount)}
                                </td>
                                <td className="p-3 text-right font-mono-numbers text-muted-foreground hidden md:table-cell">
                                    {sale.commission_amount != null ? formatCurrency(sale.commission_amount) : '—'}
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`badge ${sc.className}`}>{sc.label}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function DPlusTab({ sales, isLoading }: { sales: SalesDPlusWithRelations[]; isLoading: boolean }) {
    if (isLoading) return <LoadingState />;
    if (sales.length === 0) return <EmptyState icon={FileText} message="Nenhum produto D+ encontrado" />;

    return (
        <div className="card-financial overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground font-medium">Proposta</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Banco</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {sales.map((sale) => {
                        const sc = dplusStatusConfig[sale.status] ?? { label: sale.status, className: 'badge-neutral' };
                        return (
                            <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-3 font-medium text-foreground">{sale.proposal_number}</td>
                                <td className="p-3 text-muted-foreground hidden sm:table-cell">{sale.bank_info ?? '—'}</td>
                                <td className="p-3 text-right font-mono-numbers font-semibold text-income">
                                    {formatCurrency(sale.contract_value)}
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`badge ${sc.className}`}>{sc.label}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export function TabVendas({
    creditCardSales, dplusSales, ccLoading, dplusLoading,
}: TabVendasProps) {
    return (
        <Tabs defaultValue="maquininha">
            <TabsList className="mb-4">
                <TabsTrigger value="maquininha">
                    Maquininha (
                    {creditCardSales.length}
                    )
                </TabsTrigger>
                <TabsTrigger value="dplus">
                    Produtos D+ (
                    {dplusSales.length}
                    )
                </TabsTrigger>
            </TabsList>
            <TabsContent value="maquininha">
                <MaquininhaTab sales={creditCardSales} isLoading={ccLoading} />
            </TabsContent>
            <TabsContent value="dplus">
                <DPlusTab sales={dplusSales} isLoading={dplusLoading} />
            </TabsContent>
        </Tabs>
    );
}
