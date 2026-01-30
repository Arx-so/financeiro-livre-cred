import { Award } from 'lucide-react';
import { EmptyState } from '@/components/shared';

export function RankingPerformance() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Ranking de Performance</h2>
            <p className="text-muted-foreground">
                Ranking de performance em forma de gráfico.
            </p>
            <EmptyState icon={Award} message="Relatório em desenvolvimento" />
        </div>
    );
}
