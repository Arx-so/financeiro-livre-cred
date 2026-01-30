import { Target } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function MetaIndividual() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Meta × Realizado - Individual</h2>
            <p className="text-muted-foreground">
                Comparativo de meta individual versus realizado.
            </p>
            <EmptyState icon={Target} message="Relatório em desenvolvimento" />
        </div>
    );
}
