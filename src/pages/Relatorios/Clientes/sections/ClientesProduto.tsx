import { Package } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function ClientesProduto() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Clientes por Produto</h2>
            <p className="text-muted-foreground">
                Análise de clientes por produto.
            </p>
            <EmptyState icon={Package} message="Relatório em desenvolvimento" />
        </div>
    );
}
