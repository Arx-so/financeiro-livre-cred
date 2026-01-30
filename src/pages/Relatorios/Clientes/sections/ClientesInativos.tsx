import { UserX } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function ClientesInativos() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Clientes Inativos</h2>
            <p className="text-muted-foreground">
                Lista de clientes inativos (quando acaba o contrato).
            </p>
            <EmptyState icon={UserX} message="Relatório em desenvolvimento" />
        </div>
    );
}
