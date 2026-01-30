import { useState } from 'react';
import {
    Calendar,
    Clock,
    DollarSign,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { useFinancialEntries, useMarkAsPaid } from '@/hooks/useFinanceiro';
import { formatCurrency, formatDate } from '@/lib/utils';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Programacao() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

    // Fetch entries for the month
    const { data: entries, isLoading } = useFinancialEntries({
        startDate,
        endDate,
        status: 'pendente',
    });

    const markPaid = useMarkAsPaid();

    // Group entries by date
    const entriesByDate = (entries || []).reduce((acc, entry) => {
        const date = entry.due_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(entry);
        return acc;
    }, {} as Record<string, typeof entries>);

    // Generate calendar days
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i);
    }

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
        setSelectedDate(null);
    };

    const handleMarkPaid = async (id: string) => {
        try {
            await markPaid.mutateAsync({ id });
            toast.success('Lançamento marcado como pago!');
        } catch {
            toast.error('Erro ao marcar como pago');
        }
    };

    // Calculate summary
    const summary = (entries || []).reduce((acc, entry) => {
        if (entry.type === 'receita') {
            acc.receitas += Number(entry.value);
        } else {
            acc.despesas += Number(entry.value);
        }
        return acc;
    }, { receitas: 0, despesas: 0 });

    const selectedEntries = selectedDate ? (entriesByDate[selectedDate] || []) : [];

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Programação</h1>
                        <p className="text-muted-foreground">Agenda de pagamentos e recebimentos</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat-card stat-card-income">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-income" />
                            <div>
                                <p className="text-sm text-muted-foreground">A Receber no Mês</p>
                                <p className="text-xl font-bold font-mono-numbers text-income">
                                    {formatCurrency(summary.receitas)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-expense">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-expense" />
                            <div>
                                <p className="text-sm text-muted-foreground">A Pagar no Mês</p>
                                <p className="text-xl font-bold font-mono-numbers text-expense">
                                    {formatCurrency(summary.despesas)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-primary">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Pendente</p>
                                <p className="text-xl font-bold text-foreground">
                                    {(entries || []).length}
                                    {' '}
                                    lançamentos
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div className="lg:col-span-2 card-financial p-6">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                            <button
                                className="btn-secondary p-2"
                                onClick={goToPrevMonth}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-lg font-semibold text-foreground">
                                {MONTHS[currentMonth]}
                                {' '}
                                {currentYear}
                            </h2>
                            <button
                                className="btn-secondary p-2"
                                onClick={goToNextMonth}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {WEEKDAYS.map((day) => (
                                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, index) => {
                                    if (day === null) {
                                        return (
                                            <div
                                                key={`empty-${currentYear}-${currentMonth}-${index}`}
                                                className="aspect-square"
                                            />
                                        );
                                    }

                                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayEntries = entriesByDate[dateStr] || [];
                                    const hasReceitas = dayEntries.some((e) => e.type === 'receita');
                                    const hasDespesas = dayEntries.some((e) => e.type === 'despesa');
                                    const isToday = dateStr === today.toISOString().split('T')[0];
                                    const isSelected = dateStr === selectedDate;
                                    const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0]);

                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={`aspect-square p-1 rounded-lg border transition-all ${
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : isToday
                                                        ? 'bg-primary/10 border-primary'
                                                        : 'border-transparent hover:bg-muted'
                                            }`}
                                        >
                                            <div className="flex flex-col h-full">
                                                <span className={`text-sm font-medium ${
                                                    isSelected ? 'text-primary-foreground'
                                                        : isPast ? 'text-muted-foreground' : 'text-foreground'
                                                }`}
                                                >
                                                    {day}
                                                </span>
                                                {dayEntries.length > 0 && (
                                                    <div className="flex gap-0.5 mt-2 justify-center">
                                                        {hasReceitas && (
                                                            <div className={`w-2 h-2 rounded-full ${
                                                                isSelected ? 'bg-primary-foreground' : 'bg-income'
                                                            }`}
                                                            />
                                                        )}
                                                        {hasDespesas && (
                                                            <div className={`w-2 h-2 rounded-full ${
                                                                isSelected ? 'bg-primary-foreground' : 'bg-expense'
                                                            }`}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Legend */}
                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-income" />
                                <span className="text-sm text-muted-foreground">Receitas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-expense" />
                                <span className="text-sm text-muted-foreground">Despesas</span>
                            </div>
                        </div>
                    </div>

                    {/* Selected Day Details */}
                    <div className="card-financial p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-foreground">
                                {selectedDate ? formatDate(selectedDate) : 'Selecione um dia'}
                            </h3>
                        </div>

                        {selectedDate ? (
                            <div className="space-y-3">
                                {selectedEntries.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Nenhum lançamento para este dia</p>
                                    </div>
                                ) : (
                                    selectedEntries.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className={`p-4 rounded-lg border ${
                                                entry.type === 'receita'
                                                    ? 'bg-income-muted/30 border-income/30'
                                                    : 'bg-expense-muted/30 border-expense/30'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                                    entry.type === 'receita'
                                                        ? 'bg-income/20 text-income'
                                                        : 'bg-expense/20 text-expense'
                                                }`}
                                                >
                                                    {entry.type === 'receita' ? 'Receita' : 'Despesa'}
                                                </span>
                                                <span className={`font-mono-numbers font-semibold ${
                                                    entry.type === 'receita' ? 'text-income' : 'text-expense'
                                                }`}
                                                >
                                                    {formatCurrency(Number(entry.value))}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-foreground">{entry.description}</p>
                                            {entry.favorecido && (
                                                <p className="text-xs text-muted-foreground mt-1">{entry.favorecido.name}</p>
                                            )}
                                            <button
                                                className="btn-secondary w-full mt-3 py-2"
                                                onClick={() => handleMarkPaid(entry.id)}
                                                disabled={markPaid.isPending}
                                            >
                                                {markPaid.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4" />
                                                )}
                                                Marcar como Pago
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Clique em um dia do calendário para ver os lançamentos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
