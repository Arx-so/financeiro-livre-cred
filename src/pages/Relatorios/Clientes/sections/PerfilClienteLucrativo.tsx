import { TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function PerfilClienteLucrativo() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Perfil de Cliente mais Lucrativo</h2>
            <p className="text-muted-foreground">
                Análise do perfil dos clientes mais lucrativos.
            </p>
            <EmptyState icon={TrendingUp} message="Relatório em desenvolvimento" />
        </div>
    );
}
