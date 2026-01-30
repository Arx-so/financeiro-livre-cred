import { DollarSign } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function ComissaoResultado() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Comissão × Resultado</h2>
            <p className="text-muted-foreground">
                Comparativo entre comissões pagas e resultados obtidos.
            </p>
            <EmptyState icon={DollarSign} message="Relatório em desenvolvimento" />
        </div>
    );
}
