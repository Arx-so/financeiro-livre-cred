import { Building2 } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function MetaEquipe() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Meta × Realizado - Equipe</h2>
            <p className="text-muted-foreground">
                Comparativo de meta da equipe (filial) versus realizado.
            </p>
            <EmptyState icon={Building2} message="Relatório em desenvolvimento" />
        </div>
    );
}
