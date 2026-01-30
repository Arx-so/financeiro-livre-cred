import { UserX } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function VendedorForaPadrao() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Vendedor fora do Padrão</h2>
            <p className="text-muted-foreground">
                Identificação de vendedores com performance fora do padrão esperado.
            </p>
            <EmptyState icon={UserX} message="Relatório em desenvolvimento" />
        </div>
    );
}
