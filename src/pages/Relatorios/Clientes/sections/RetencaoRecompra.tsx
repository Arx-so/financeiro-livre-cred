import { RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function RetencaoRecompra() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Retenção e Recompra</h2>
            <p className="text-muted-foreground">
                Análise de retenção e recompra de clientes.
            </p>
            <EmptyState icon={RefreshCw} message="Relatório em desenvolvimento" />
        </div>
    );
}
