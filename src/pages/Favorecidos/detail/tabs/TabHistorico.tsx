import { History, Clock } from 'lucide-react';
import { EmptyState, LoadingState } from '@/components/shared';
import { getActionText, formatLogDetails } from '@/services/activityLogs';
import type { ActivityLog } from '@/types/database';

interface TabHistoricoProps {
    logs: ActivityLog[];
    isLoading: boolean;
}

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function TabHistorico({ logs, isLoading }: TabHistoricoProps) {
    if (isLoading) return <LoadingState />;
    if (logs.length === 0) return <EmptyState icon={History} message="Nenhum registro de atividade encontrado" />;

    return (
        <div className="card-financial divide-y divide-border">
            {logs.map((log) => {
                const details = formatLogDetails(log.details);
                return (
                    <div key={log.id} className="flex items-start gap-3 p-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <p className="text-sm font-medium text-foreground">
                                    {getActionText(log.action)}
                                    {log.user_name && (
                                        <span className="font-normal text-muted-foreground"> por {log.user_name}</span>
                                    )}
                                </p>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {formatDateTime(log.created_at)}
                                </span>
                            </div>
                            {details && (
                                <p className="text-xs text-muted-foreground mt-0.5">{details}</p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
