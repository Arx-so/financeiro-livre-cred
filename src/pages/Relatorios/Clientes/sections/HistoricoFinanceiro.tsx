import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function HistoricoFinanceiro() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Histórico Financeiro do Cliente</h2>
            <p className="text-muted-foreground">
                Histórico completo de transações financeiras do cliente.
            </p>
            <EmptyState icon={FileText} message="Relatório em desenvolvimento" />
        </div>
    );
}
