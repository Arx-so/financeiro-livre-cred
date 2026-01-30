import { TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function VendasValor() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Vendas - Valor</h2>
            <p className="text-muted-foreground">
                Análise de vendas por valor.
            </p>
            <EmptyState icon={TrendingUp} message="Relatório em desenvolvimento" />
        </div>
    );
}
