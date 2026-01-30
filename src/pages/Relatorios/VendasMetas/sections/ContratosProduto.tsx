import { Package } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function ContratosProduto() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Contratos Fechados - Por Produto</h2>
            <p className="text-muted-foreground">
                Análise de contratos fechados por produto.
            </p>
            <EmptyState icon={Package} message="Relatório em desenvolvimento" />
        </div>
    );
}
