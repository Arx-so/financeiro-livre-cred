import { ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function ContratosCanal() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Contratos Fechados - Por Canal</h2>
            <p className="text-muted-foreground">
                Análise de contratos fechados por canal de venda.
            </p>
            <EmptyState icon={ShoppingCart} message="Relatório em desenvolvimento" />
        </div>
    );
}
