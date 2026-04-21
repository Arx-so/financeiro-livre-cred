import { Link } from 'react-router-dom';
import { ExternalLink, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { StatCard, EmptyState, LoadingState } from '@/components/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { FinancialEntryWithRelations } from '@/services/financeiro';
import type { EntryStatus } from '@/types/database';

interface TabFinanceiroProps {
    entries: FinancialEntryWithRelations[];
    isLoading: boolean;
    kpis: { totalReceita: number; totalDespesa: number; totalPendente: number };
}

const statusConfig: Record<EntryStatus, { label: string; className: string }> = {
    pago: { label: 'Pago', className: 'badge-success' },
    pendente: { label: 'Pendente', className: 'badge-warning' },
    atrasado: { label: 'Atrasado', className: 'badge-danger' },
    cancelado: { label: 'Cancelado', className: 'badge-neutral' },
};

export function TabFinanceiro({ entries, isLoading, kpis }: TabFinanceiroProps) {
    if (isLoading) return <LoadingState />;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard label="Total Receitas" value={formatCurrency(kpis.totalReceita)} icon={TrendingUp} variant="income" />
                <StatCard label="Total Despesas" value={formatCurrency(kpis.totalDespesa)} icon={TrendingDown} variant="expense" />
                <StatCard label="Pendente" value={formatCurrency(kpis.totalPendente)} icon={Clock} variant="pending" />
            </div>

            {entries.length === 0 ? (
                <EmptyState icon={TrendingUp} message="Nenhum lançamento encontrado" />
            ) : (
                <div className="card-financial overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left p-3 text-muted-foreground font-medium">Descrição</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Vencimento</th>
                                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Tipo</th>
                                <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
                                <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                                <th className="p-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {entries.map((entry) => {
                                const sc = statusConfig[entry.status] ?? { label: entry.status, className: 'badge-neutral' };
                                return (
                                    <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-medium text-foreground truncate max-w-[180px]">
                                            {entry.description}
                                        </td>
                                        <td className="p-3 text-muted-foreground hidden sm:table-cell">
                                            {formatDate(entry.due_date)}
                                        </td>
                                        <td className="p-3 hidden md:table-cell">
                                            <span className={entry.type === 'receita' ? 'text-income text-xs font-medium' : 'text-expense text-xs font-medium'}>
                                                {entry.type === 'receita' ? 'Receita' : 'Despesa'}
                                            </span>
                                        </td>
                                        <td className={`p-3 text-right font-mono-numbers font-semibold ${entry.type === 'receita' ? 'text-income' : 'text-expense'}`}>
                                            {formatCurrency(entry.value)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`badge ${sc.className}`}>{sc.label}</span>
                                        </td>
                                        <td className="p-3">
                                            <Link
                                                to={`/financeiro/${entry.id}`}
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                                title="Ver detalhe"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
