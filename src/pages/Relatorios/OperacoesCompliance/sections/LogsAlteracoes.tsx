import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function LogsAlteracoes() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Logs de Alterações</h2>
            <p className="text-muted-foreground">
                Histórico de alterações realizadas no sistema.
            </p>
            <EmptyState icon={FileText} message="Relatório em desenvolvimento" />
        </div>
    );
}
