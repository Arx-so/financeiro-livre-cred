import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    ArrowLeft,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    User,
    Tag,
    Building2,
    FileText,
    Clock,
    Check,
    Ban,
    Edit,
    History,
    Loader2,
    Repeat,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/shared';
import { getFinancialEntry, markAsPaid, updateFinancialEntry } from '@/services/financeiro';
import { getEntityLogs, getActionText, formatLogDetails } from '@/services/activityLogs';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { EntryStatus } from '@/types/database';

function getStatusConfig(status: EntryStatus) {
    switch (status) {
        case 'pago':
            return { label: 'Pago', className: 'badge-success', icon: Check };
        case 'pendente':
            return { label: 'Pendente', className: 'badge-warning', icon: Clock };
        case 'atrasado':
            return { label: 'Atrasado', className: 'badge-danger', icon: Clock };
        case 'cancelado':
            return { label: 'Cancelado', className: 'badge-neutral', icon: Ban };
        default:
            return { label: status, className: 'badge-neutral', icon: Clock };
    }
}

export default function FinanceiroDetalhe() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Fetch entry
    const { data: entry, isLoading, error } = useQuery({
        queryKey: ['financial-entry', id],
        queryFn: () => getFinancialEntry(id!),
        enabled: !!id,
    });

    // Fetch activity logs
    const { data: logs } = useQuery({
        queryKey: ['activity-logs', 'entity', 'financial_entry', id],
        queryFn: () => getEntityLogs('financial_entry', id!),
        enabled: !!id,
    });

    // Mutations
    const markPaidMutation = useMutation({
        mutationFn: () => markAsPaid(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-entry', id] });
            queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
            toast.success('Lançamento marcado como pago!');
        },
        onError: () => toast.error('Erro ao marcar como pago'),
    });

    const cancelMutation = useMutation({
        mutationFn: () => updateFinancialEntry(id!, { status: 'cancelado' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financial-entry', id] });
            queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
            toast.success('Lançamento cancelado!');
        },
        onError: () => toast.error('Erro ao cancelar lançamento'),
    });

    if (isLoading) {
        return (
            <AppLayout>
                <LoadingState />
            </AppLayout>
        );
    }

    if (error || !entry) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        Lançamento não encontrado
                    </h2>
                    <p className="text-muted-foreground mb-4">
                        O lançamento solicitado não existe ou foi removido.
                    </p>
                    <button className="btn-primary" onClick={() => navigate('/financeiro')}>
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Financeiro
                    </button>
                </div>
            </AppLayout>
        );
    }

    const statusConfig = getStatusConfig(entry.status);
    const StatusIcon = statusConfig.icon;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            className="btn-secondary p-2"
                            onClick={() => navigate('/financeiro')}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                {entry.type === 'receita' ? (
                                    <ArrowUpRight className="w-6 h-6 text-income" />
                                ) : (
                                    <ArrowDownRight className="w-6 h-6 text-expense" />
                                )}
                                {entry.description}
                            </h1>
                            <p className="text-muted-foreground">
                                Detalhes do lançamento financeiro
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {entry.status === 'pendente' && (
                            <button
                                className="btn-primary"
                                onClick={() => markPaidMutation.mutate()}
                                disabled={markPaidMutation.isPending}
                            >
                                {markPaidMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Marcar como Pago
                            </button>
                        )}
                        {entry.status !== 'cancelado' && (
                            <button
                                className="btn-secondary text-destructive"
                                onClick={() => cancelMutation.mutate()}
                                disabled={cancelMutation.isPending}
                            >
                                {cancelMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Ban className="w-4 h-4" />
                                )}
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Summary Card */}
                        <div className="card-financial p-6">
                            <div className="flex items-center justify-between mb-6">
                                <span className={`${statusConfig.className} flex items-center gap-1.5`}>
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    {statusConfig.label}
                                </span>
                                <span className={`text-3xl font-bold font-mono ${entry.type === 'receita' ? 'text-income' : 'text-expense'}`}>
                                    {entry.type === 'despesa' && '-'}
                                    {formatCurrency(entry.value)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        Vencimento
                                    </p>
                                    <p className="font-medium text-foreground">
                                        {formatDate(entry.due_date)}
                                    </p>
                                </div>

                                {entry.payment_date && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                                            <Check className="w-4 h-4" />
                                            Data Pagamento
                                        </p>
                                        <p className="font-medium text-foreground">
                                            {formatDate(entry.payment_date)}
                                        </p>
                                    </div>
                                )}

                                {entry.favorecido && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                                            <User className="w-4 h-4" />
                                            Favorecido
                                        </p>
                                        <p className="font-medium text-foreground">
                                            {entry.favorecido.name}
                                        </p>
                                    </div>
                                )}

                                {entry.category && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                                            <Tag className="w-4 h-4" />
                                            Categoria
                                        </p>
                                        <span
                                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs"
                                            style={{
                                                backgroundColor: `${entry.category.color}20`,
                                                color: entry.category.color,
                                            }}
                                        >
                                            <span
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: entry.category.color }}
                                            />
                                            {entry.category.name}
                                        </span>
                                    </div>
                                )}

                                {entry.bank_account && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4" />
                                            Conta Bancária
                                        </p>
                                        <p className="font-medium text-foreground">
                                            {entry.bank_account.name} - {entry.bank_account.bank_name}
                                        </p>
                                    </div>
                                )}

                                {entry.document_number && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                                            <FileText className="w-4 h-4" />
                                            Nº Documento
                                        </p>
                                        <p className="font-medium text-foreground font-mono">
                                            {entry.document_number}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {entry.is_recurring && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                                        <Repeat className="w-4 h-4 text-primary" />
                                        Lançamento Recorrente
                                    </p>
                                    <p className="font-medium text-foreground">
                                        {entry.recurrence_type === 'diario' && 'Diário'}
                                        {entry.recurrence_type === 'semanal' && 'Semanal'}
                                        {entry.recurrence_type === 'mensal' && `Mensal (dia ${entry.recurrence_day})`}
                                        {entry.recurrence_type === 'anual' && 'Anual'}
                                    </p>
                                </div>
                            )}

                            {entry.notes && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground mb-1">Observações</p>
                                    <p className="text-foreground whitespace-pre-wrap">
                                        {entry.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Status Timeline */}
                        <div className="card-financial p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Timeline de Status
                            </h3>
                            <div className="space-y-4">
                                <TimelineItem
                                    status="pendente"
                                    label="Criado"
                                    date={entry.created_at}
                                    isActive={true}
                                />
                                {entry.status === 'pago' && entry.payment_date && (
                                    <TimelineItem
                                        status="pago"
                                        label="Pago"
                                        date={entry.payment_date}
                                        isActive={true}
                                    />
                                )}
                                {entry.status === 'atrasado' && (
                                    <TimelineItem
                                        status="atrasado"
                                        label="Atrasado"
                                        date={entry.due_date}
                                        isActive={true}
                                    />
                                )}
                                {entry.status === 'cancelado' && (
                                    <TimelineItem
                                        status="cancelado"
                                        label="Cancelado"
                                        date={entry.updated_at}
                                        isActive={true}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="card-financial p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                                Ações Rápidas
                            </h3>
                            <div className="space-y-2">
                                <Link
                                    to="/financeiro"
                                    className="btn-secondary w-full justify-start"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar para Lista
                                </Link>
                            </div>
                        </div>

                        {/* Activity Log */}
                        <div className="card-financial p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Histórico
                            </h3>
                            {logs && logs.length > 0 ? (
                                <div className="space-y-3">
                                    {logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="text-sm border-l-2 border-border pl-3 py-1"
                                        >
                                            <p className="font-medium text-foreground">
                                                {getActionText(log.action)}
                                            </p>
                                            {log.user_name && (
                                                <p className="text-muted-foreground text-xs">
                                                    por {log.user_name}
                                                </p>
                                            )}
                                            {log.details && (
                                                <p className="text-muted-foreground text-xs">
                                                    {formatLogDetails(log.details)}
                                                </p>
                                            )}
                                            <p className="text-muted-foreground text-xs">
                                                {formatDate(log.created_at)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma atividade registrada.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// Timeline Item Component
function TimelineItem({
    status,
    label,
    date,
    isActive,
}: {
    status: EntryStatus | 'criado';
    label: string;
    date: string;
    isActive: boolean;
}) {
    const getStatusColor = () => {
        switch (status) {
            case 'pago':
                return 'bg-income';
            case 'pendente':
                return 'bg-warning';
            case 'atrasado':
                return 'bg-expense';
            case 'cancelado':
                return 'bg-muted-foreground';
            default:
                return 'bg-primary';
        }
    };

    return (
        <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
                <div
                    className={`w-3 h-3 rounded-full ${isActive ? getStatusColor() : 'bg-muted'}`}
                />
                <div className="w-0.5 h-6 bg-border" />
            </div>
            <div className="flex-1 -mt-0.5">
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
            </div>
        </div>
    );
}
