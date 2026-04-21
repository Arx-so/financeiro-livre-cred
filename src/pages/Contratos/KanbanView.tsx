import {
    CheckCircle, XCircle, Send, User, Calendar, Tag,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getContractStatusBadge } from '@/components/shared/StatusBadge';
import type { ContractWithRelations } from '@/services/contratos';
import type { ContractStatusType } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

interface KanbanViewProps {
    contracts: ContractWithRelations[];
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onResubmit: (id: string) => void;
    isApprovePending: boolean;
    isRejectPending: boolean;
    isResubmitPending: boolean;
}

const COLUMNS = [
    {
        key: 'em_aprovacao' as const,
        label: 'Em Análise',
        emptyMessage: 'Nenhum contrato aguardando aprovação',
        headerClass: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
        bodyClass: 'bg-blue-500/5',
        countClass: 'bg-blue-500 text-white',
    },
    {
        key: 'aprovado' as const,
        label: 'Aprovados',
        emptyMessage: 'Nenhum contrato aprovado',
        headerClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        bodyClass: 'bg-emerald-500/5',
        countClass: 'bg-emerald-500 text-white',
    },
    {
        key: 'rejeitado' as const,
        label: 'Rejeitados',
        emptyMessage: 'Nenhum contrato rejeitado',
        headerClass: 'bg-destructive/10 border-destructive/20 text-destructive',
        bodyClass: 'bg-destructive/5',
        countClass: 'bg-destructive text-white',
    },
] as const;

type ColumnKey = typeof COLUMNS[number]['key'];

function getColumnContracts(contracts: ContractWithRelations[], key: ColumnKey) {
    if (key === 'em_aprovacao') return contracts.filter((c) => c.status === 'em_aprovacao');
    if (key === 'aprovado') return contracts.filter((c) => c.status === 'aprovado' || c.status === 'ativo');
    return contracts.filter((c) => c.status === 'rejeitado');
}

interface CardProps {
    contract: ContractWithRelations;
    columnKey: ColumnKey;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onResubmit: (id: string) => void;
    isApprovePending: boolean;
    isRejectPending: boolean;
    isResubmitPending: boolean;
}

function KanbanCard({
    contract,
    columnKey,
    onApprove,
    onReject,
    onResubmit,
    isApprovePending,
    isRejectPending,
    isResubmitPending,
}: CardProps) {

    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
            {/* Title + badge */}
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-foreground text-sm leading-snug">{contract.title}</h4>
                {getContractStatusBadge(contract.status as ContractStatusType)}
            </div>

            {/* Value */}
            <p className="font-mono font-bold text-lg text-foreground">
                {formatCurrency(contract.value)}
            </p>

            {/* Info */}
            <div className="space-y-1.5">
                {contract.favorecido && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{contract.favorecido.name}</span>
                    </div>
                )}
                {contract.product && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                            {contract.product.name}
                            {contract.product.code ? ` (${contract.product.code})` : ''}
                        </span>
                    </div>
                )}
                {contract.seller && (
                    <div className="flex items-center gap-1.5 text-xs text-primary">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                            Vendedor:
                            {' '}
                            {contract.seller.name}
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>
                        {formatDate(contract.start_date)}
                        {contract.end_date ? ` – ${formatDate(contract.end_date)}` : ''}
                    </span>
                </div>
                {contract.approved_at && columnKey === 'aprovado' && (
                    <div className="text-xs text-muted-foreground">
                        Aprovado por
                        {' '}
                        {contract.approver?.name}
                        {' '}
                        em
                        {' '}
                        {formatDate(contract.approved_at)}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                {columnKey === 'em_aprovacao' && (
                    <>
                        <button
                            className="btn-primary py-1.5 px-3 text-xs"
                            onClick={() => onApprove(contract.id)}
                            disabled={isApprovePending}
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Aprovar
                        </button>
                        <button
                            className="btn-secondary py-1.5 px-3 text-xs text-destructive"
                            onClick={() => onReject(contract.id)}
                            disabled={isRejectPending}
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Rejeitar
                        </button>
                    </>
                )}

                {columnKey === 'rejeitado' && (
                    <button
                        className="btn-secondary py-1.5 px-3 text-xs"
                        onClick={() => onResubmit(contract.id)}
                        disabled={isResubmitPending}
                    >
                        <Send className="w-3.5 h-3.5" />
                        Re-enviar p/ Aprovação
                    </button>
                )}
            </div>
        </div>
    );
}

export function KanbanView({
    contracts,
    onApprove,
    onReject,
    onResubmit,
    isApprovePending,
    isRejectPending,
    isResubmitPending,
}: KanbanViewProps) {
    return (
        <div className="grid grid-cols-3 gap-4">
            {COLUMNS.map((column) => {
                const columnContracts = getColumnContracts(contracts, column.key);

                return (
                    <div key={column.key} className="flex flex-col gap-3">
                        {/* Column header */}
                        <div className={cn('flex items-center justify-between px-4 py-2.5 rounded-xl border', column.headerClass)}>
                            <span className="font-semibold text-sm">{column.label}</span>
                            <span className={cn('text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center', column.countClass)}>
                                {columnContracts.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className={cn('flex flex-col gap-3 min-h-48 rounded-xl p-3', column.bodyClass)}>
                            {columnContracts.length === 0 ? (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground text-center px-4">
                                    {column.emptyMessage}
                                </div>
                            ) : (
                                columnContracts.map((contract) => (
                                    <KanbanCard
                                        key={contract.id}
                                        contract={contract}
                                        columnKey={column.key}
                                        onApprove={onApprove}
                                        onReject={onReject}
                                        onResubmit={onResubmit}
                                        isApprovePending={isApprovePending}
                                        isRejectPending={isRejectPending}
                                        isResubmitPending={isResubmitPending}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
