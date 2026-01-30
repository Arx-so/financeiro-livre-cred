import { DollarSign } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function LifetimeValue() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Lifetime Value (LTV)</h2>
            <p className="text-muted-foreground">
                Receita total gerada por um cliente menos os custos para atendê-lo.
            </p>
            <EmptyState icon={DollarSign} message="Relatório em desenvolvimento" />
        </div>
    );
}
