import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Cake, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card, CardContent,
} from '@/components/ui/card';
import {
    Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { useBirthdaysByMonth, useUpcomingBirthdays, useBirthdaysToday } from '@/hooks/useAniversarios';
import type { FavorecidoWithBirthday } from '@/services/hrAniversarios';

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const TYPE_LABELS: Record<string, string> = {
    funcionario: 'Funcionário',
    ambos: 'Funcionário / Cliente',
    cliente: 'Cliente',
    fornecedor: 'Fornecedor',
};

// Computed once at module load — stable for the lifetime of the page session
const TODAY_ISO = new Date().toISOString().split('T')[0];

function formatBirthdayDate(birthDate: string | null): string {
    if (!birthDate) return '—';
    try {
        const d = new Date(`${birthDate}T12:00:00`);
        return format(d, "d 'de' MMMM", { locale: ptBR });
    } catch {
        return birthDate;
    }
}

function isTodayBirthday(birthdayThisYear: string): boolean {
    return birthdayThisYear === TODAY_ISO;
}

interface BirthdayCardProps {
    person: FavorecidoWithBirthday;
}

function BirthdayCard({ person }: BirthdayCardProps) {
    const isToday = isTodayBirthday(person.birthdayThisYear);

    return (
        <Card className={isToday ? 'border-primary ring-1 ring-primary' : ''}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{person.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {TYPE_LABELS[person.type] ?? person.type}
                            {person.category ? ` — ${person.category}` : ''}
                        </p>
                        <p className="text-sm mt-2">
                            {formatBirthdayDate(person.birth_date)}
                            <span className="text-muted-foreground text-xs ml-2">
                                (
                                {person.age}
                                {' anos em '}
                                {new Date().getFullYear()}
                                )
                            </span>
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <Cake className="w-5 h-5 text-muted-foreground" />
                        {isToday && (
                            <Badge className="text-xs whitespace-nowrap">
                                Hoje!
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

type FilterMode = 'mes' | 'hoje' | 'proximos30';

export default function Aniversarios() {
    const currentMonth = new Date().getMonth() + 1;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [filterMode, setFilterMode] = useState<FilterMode>('mes');

    const { data: byMonth, isLoading: monthLoading } = useBirthdaysByMonth(selectedMonth);
    const { data: upcoming, isLoading: upcomingLoading } = useUpcomingBirthdays(30);
    const { data: today, isLoading: todayLoading } = useBirthdaysToday();

    const prevMonth = () => setSelectedMonth((m) => (m === 1 ? 12 : m - 1));
    const nextMonth = () => setSelectedMonth((m) => (m === 12 ? 1 : m + 1));

    const activeData = (() => {
        if (filterMode === 'hoje') return today ?? [];
        if (filterMode === 'proximos30') return upcoming ?? [];
        return byMonth ?? [];
    })();

    const isLoading = (() => {
        if (filterMode === 'hoje') return todayLoading;
        if (filterMode === 'proximos30') return upcomingLoading;
        return monthLoading;
    })();

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Aniversários" description="Aniversariantes dos funcionários" />

                <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as FilterMode)}>
                    <TabsList>
                        <TabsTrigger value="mes">Por Mês</TabsTrigger>
                        <TabsTrigger value="hoje">Hoje</TabsTrigger>
                        <TabsTrigger value="proximos30">Próximos 30 dias</TabsTrigger>
                    </TabsList>
                </Tabs>

                {filterMode === 'mes' && (
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mês anterior">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium w-28 text-center">
                            {MONTH_NAMES[selectedMonth - 1]}
                        </span>
                        <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Próximo mês">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {isLoading ? (
                    <LoadingState message="Carregando aniversariantes..." />
                ) : activeData.length === 0 ? (
                    <EmptyState
                        icon={Cake}
                        message={
                            filterMode === 'hoje'
                                ? 'Nenhum aniversariante hoje.'
                                : filterMode === 'proximos30'
                                    ? 'Nenhum aniversariante nos próximos 30 dias.'
                                    : `Nenhum aniversariante em ${MONTH_NAMES[selectedMonth - 1]}.`
                        }
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {activeData.map((person) => (
                            <BirthdayCard key={person.id} person={person} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
