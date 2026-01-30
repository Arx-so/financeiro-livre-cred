import { Users } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function ContratosVendedor() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Contratos Fechados - Por Vendedor</h2>
            <p className="text-muted-foreground">
                Análise de contratos fechados por vendedor.
            </p>
            <EmptyState icon={Users} message="Relatório em desenvolvimento" />
        </div>
    );
}
