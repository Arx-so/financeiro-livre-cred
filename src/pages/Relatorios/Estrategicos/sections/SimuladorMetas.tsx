import { Lightbulb } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function SimuladorMetas() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Simulador de Metas</h2>
            <p className="text-muted-foreground">
                Simulador para calcular e projetar metas.
            </p>
            <EmptyState icon={Lightbulb} message="Relatório em desenvolvimento" />
        </div>
    );
}
