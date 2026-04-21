import { ExternalLink, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, LoadingState } from '@/components/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ContractWithRelations } from '@/services/contratos';
import type { ContractStatus } from '@/types/database';

interface TabContratosProps {
    contracts: ContractWithRelations[];
    isLoading: boolean;
}

const statusConfig: Record<ContractStatus, { label: string; className: string }> = {
    criado: { label: 'Criado', className: 'badge-neutral' },
    em_aprovacao: { label: 'Em Aprovação', className: 'badge-warning' },
    aprovado: { label: 'Aprovado', className: 'badge-primary' },
    ativo: { label: 'Ativo', className: 'badge-success' },
    pendente: { label: 'Pendente', className: 'badge-warning' },
    encerrado: { label: 'Encerrado', className: 'badge-neutral' },
    rejeitado: { label: 'Rejeitado', className: 'badge-danger' },
};

export function TabContratos({ contracts, isLoading }: TabContratosProps) {
    if (isLoading) return <LoadingState />;
    if (contracts.length === 0) return <EmptyState icon={FileText} message="Nenhum contrato encontrado" />;

    return (
        <div className="card-financial overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground font-medium">Título</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Início</th>
                        <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Produto</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
                        <th className="p-3" />
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {contracts.map((contract) => {
                        const sc = statusConfig[contract.status] ?? { label: contract.status, className: 'badge-neutral' };
                        return (
                            <tr key={contract.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-3 font-medium text-foreground truncate max-w-[200px]">
                                    {contract.title}
                                </td>
                                <td className="p-3 text-muted-foreground hidden sm:table-cell">
                                    {formatDate(contract.start_date)}
                                </td>
                                <td className="p-3 text-muted-foreground hidden md:table-cell">
                                    {contract.product?.name ?? '—'}
                                </td>
                                <td className="p-3 text-right font-mono-numbers font-semibold text-foreground">
                                    {formatCurrency(contract.value)}
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`badge ${sc.className}`}>{sc.label}</span>
                                </td>
                                <td className="p-3">
                                    <Link
                                        to="/vendas"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                        title="Ver contratos"
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
    );
}
