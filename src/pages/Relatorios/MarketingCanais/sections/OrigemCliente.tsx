import { Users } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function OrigemCliente() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Origem do Cliente</h2>
            <p className="text-muted-foreground">
                Análise da origem dos clientes (Indicação, Internet, WhatsApp).
            </p>
            <EmptyState icon={Users} message="Relatório em desenvolvimento" />
        </div>
    );
}
