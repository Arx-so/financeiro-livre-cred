import { DollarSign } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function CaixaCritico() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Caixa Crítico</h2>
            <p className="text-muted-foreground">
                Alertas de situação crítica de caixa.
            </p>
            <EmptyState icon={DollarSign} message="Relatório em desenvolvimento" />
        </div>
    );
}
