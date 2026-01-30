import { Package } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function VendasQuantidade() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Vendas - Quantidade</h2>
            <p className="text-muted-foreground">
                Análise de vendas por quantidade.
            </p>
            <EmptyState icon={Package} message="Relatório em desenvolvimento" />
        </div>
    );
}
