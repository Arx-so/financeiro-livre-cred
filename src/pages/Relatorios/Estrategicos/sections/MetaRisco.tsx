import { AlertTriangle } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function MetaRisco() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Meta em Risco</h2>
            <p className="text-muted-foreground">
                Alertas de metas que estão em risco de não serem atingidas.
            </p>
            <EmptyState icon={AlertTriangle} message="Relatório em desenvolvimento" />
        </div>
    );
}
