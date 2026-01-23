import { useState } from 'react';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Bell,
    Cake,
    PartyPopper,
    CalendarDays,
    Loader2,
    Edit,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuthStore, useBranchStore } from '@/stores';
import {
    useMonthEvents,
    useBirthdays,
    useCreateAgendaEvent,
    useUpdateAgendaEvent,
    useDeleteAgendaEvent
} from '@/hooks/useAgenda';
import { getEventTypeText, getEventTypeBadgeClass } from '@/services/agenda';
import type { AgendaEventType, AgendaEventInsert, AgendaEvent } from '@/types/database';

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function Agenda() {
    const user = useAuthStore((state) => state.user);
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null);

    const { confirm, dialogProps } = useConfirmDialog();
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: 'lembrete' as AgendaEventType,
        event_date: '',
        event_time: '',
        recurrence_type: '' as 'yearly' | 'monthly' | 'weekly' | 'none' | '',
        notify_before_days: '1',
    });

    // Fetch data
    const { data: events, isLoading: eventsLoading } = useMonthEvents(currentYear, currentMonth, unidadeAtual?.id);
    const { data: birthdays } = useBirthdays(currentMonth);

    // Mutations
    const createEvent = useCreateAgendaEvent();
    const updateEvent = useUpdateAgendaEvent();
    const deleteEvent = useDeleteAgendaEvent();

    // Calendar calculations
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    // Generate calendar days
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    // Get events for a specific day
    const getEventsForDay = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return (events || []).filter((e) => e.event_date === dateStr);
    };

    // Get birthdays for a specific day
    const getBirthdaysForDay = (day: number) => (birthdays || []).filter((b) => {
        if (!b.birth_date) return false;
        // Evita problemas de timezone: extrai o dia direto da string "YYYY-MM-DD"
        const birthDay = parseInt(b.birth_date.split('-')[2], 10);
        const birthMonth = parseInt(b.birth_date.split('-')[1], 10);
        return birthDay === day && birthMonth === currentMonth;
    });

    // Navigation
    const goToPreviousMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToToday = () => {
        setCurrentMonth(today.getMonth() + 1);
        setCurrentYear(today.getFullYear());
    };

    // Form handling
    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            event_type: 'lembrete',
            event_date: '',
            event_time: '',
            recurrence_type: '',
            notify_before_days: '1',
        });
        setEditingEvent(null);
    };

    const openNewEventModal = (date?: string) => {
        resetForm();
        if (date) {
            setFormData((prev) => ({ ...prev, event_date: date }));
        }
        setIsModalOpen(true);
    };

    const openEditModal = (event: AgendaEvent) => {
        setFormData({
            title: event.title,
            description: event.description || '',
            event_type: event.event_type,
            event_date: event.event_date,
            event_time: event.event_time || '',
            recurrence_type: (event.recurrence_type as 'yearly' | 'monthly' | 'weekly' | 'none') || '',
            notify_before_days: String(event.notify_before_days || 1),
        });
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const eventData: AgendaEventInsert = {
            title: formData.title,
            description: formData.description || null,
            event_type: formData.event_type,
            event_date: formData.event_date,
            event_time: formData.event_time || null,
            recurrence_type: formData.recurrence_type || null,
            notify_before_days: parseInt(formData.notify_before_days, 10) || 1,
            created_by: user?.id,
            branch_id: unidadeAtual?.id || null,
            is_active: true,
        };

        try {
            if (editingEvent) {
                await updateEvent.mutateAsync({ id: editingEvent.id, event: eventData });
                toast.success('Evento atualizado!');
            } else {
                await createEvent.mutateAsync(eventData);
                toast.success('Evento criado!');
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Erro ao salvar evento');
        }
    };

    const handleDelete = (event: AgendaEvent) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteEvent.mutateAsync(event.id);
                toast.success('Evento excluído!');
                setSelectedDate(null);
            } catch (error) {
                toast.error('Erro ao excluir evento');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir evento',
            description: `Tem certeza que deseja excluir "${event.title}"?`,
            confirmText: 'Excluir',
        });
    };

    const getEventIcon = (eventType: AgendaEventType) => {
        switch (eventType) {
            case 'aniversario':
                return <Cake className="w-4 h-4" />;
            case 'festividade':
                return <PartyPopper className="w-4 h-4" />;
            case 'feriado':
                return <CalendarDays className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    // Get selected day events
    const selectedDayEvents = selectedDate
        ? (events || []).filter((e) => e.event_date === selectedDate)
        : [];

    const selectedDayBirthdays = selectedDate
        ? (birthdays || []).filter((b) => {
            if (!b.birth_date) return false;
            const birthDay = new Date(b.birth_date).getDate();
            const selectedDay = parseInt(selectedDate.split('-')[2], 10);
            return birthDay === selectedDay;
        })
        : [];

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
                        <p className="text-muted-foreground">Lembretes, aniversários e eventos</p>
                    </div>
                    <button className="btn-primary" onClick={() => openNewEventModal()}>
                        <Plus className="w-4 h-4" />
                        Novo Evento
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Calendar */}
                    <div className="lg:col-span-2 card-financial p-6">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <button
                                    className="p-2 hover:bg-muted rounded-lg"
                                    onClick={goToPreviousMonth}
                                >
                                    <ChevronLeft className="w-5 h-5 text-foreground" />
                                </button>
                                <h2 className="text-xl font-semibold text-foreground">
                                    {MONTHS[currentMonth - 1]}
                                    {' '}
                                    {currentYear}
                                </h2>
                                <button
                                    className="p-2 hover:bg-muted rounded-lg"
                                    onClick={goToNextMonth}
                                >
                                    <ChevronRight className="w-5 h-5 text-foreground" />
                                </button>
                            </div>
                            <button
                                className="btn-secondary"
                                onClick={goToToday}
                            >
                                Hoje
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        {eventsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 gap-1">
                                {/* Weekday headers */}
                                {WEEKDAYS.map((day) => (
                                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                                        {day}
                                    </div>
                                ))}

                                {/* Calendar days */}
                                {calendarDays.map((day, index) => {
                                    if (day === null) {
                                        return <div key={`empty-${index}`} className="p-2" />;
                                    }

                                    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                    const dayEvents = getEventsForDay(day);
                                    const dayBirthdays = getBirthdaysForDay(day);
                                    const isToday = day === today.getDate() && currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();
                                    const isSelected = dateStr === selectedDate;
                                    const hasEvents = dayEvents.length > 0 || dayBirthdays.length > 0;

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={`
                        p-2 min-h-[80px] rounded-lg text-left transition-colors relative
                        ${isToday ? 'bg-primary/10 ring-2 ring-primary' : 'hover:bg-muted'}
                        ${isSelected ? 'bg-primary/20' : ''}
                      `}
                                        >
                                            <span className={`
                        text-sm font-medium
                        ${isToday ? 'text-primary' : 'text-foreground'}
                      `}
                                            >
                                                {day}
                                            </span>

                                            {/* Event indicators */}
                                            {hasEvents && (
                                                <div className="mt-1 space-y-1">
                                                    {dayEvents.slice(0, 2).map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className={`text-xs px-1 py-0.5 rounded truncate ${getEventTypeBadgeClass(event.event_type)}`}
                                                        >
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                    {dayBirthdays.slice(0, 1).map((b) => (
                                                        <div
                                                            key={b.id}
                                                            className="text-xs px-1 py-0.5 rounded truncate bg-income-muted text-income"
                                                        >
                                                            🎂
                                                            {' '}
                                                            {b.name.split(' ')[0]}
                                                        </div>
                                                    ))}
                                                    {(dayEvents.length + dayBirthdays.length) > 3 && (
                                                        <div className="text-xs text-muted-foreground">
                                                            +
                                                            {dayEvents.length + dayBirthdays.length - 3}
                                                            {' '}
                                                            mais
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Selected Day Details */}
                    <div className="card-financial p-6">
                        <h3 className="font-semibold text-foreground mb-4">
                            {selectedDate
                                ? formatDate(selectedDate)
                                : 'Selecione uma data'}
                        </h3>

                        {selectedDate ? (
                            <div className="space-y-4">
                                {/* Events for selected day */}
                                {selectedDayEvents.length === 0 && selectedDayBirthdays.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>Nenhum evento neste dia</p>
                                        <button
                                            className="btn-secondary mt-4"
                                            onClick={() => openNewEventModal(selectedDate)}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Adicionar Evento
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Birthdays */}
                                        {selectedDayBirthdays.map((b) => (
                                            <div
                                                key={b.id}
                                                className="p-3 rounded-lg bg-income-muted/30 border border-income/30"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Cake className="w-4 h-4 text-income" />
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-income/20 text-income">
                                                        Aniversário
                                                    </span>
                                                </div>
                                                <p className="font-medium text-foreground">{b.name}</p>
                                            </div>
                                        ))}

                                        {/* Events */}
                                        {selectedDayEvents.map((event) => (
                                            <div
                                                key={event.id}
                                                className={`p-3 rounded-lg border ${
                                                    event.event_type === 'feriado' ? 'bg-expense-muted/30 border-expense/30'
                                                        : event.event_type === 'festividade' ? 'bg-pending-muted/30 border-pending/30'
                                                            : 'bg-muted/50 border-border'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        {getEventIcon(event.event_type)}
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getEventTypeBadgeClass(event.event_type)}`}>
                                                            {getEventTypeText(event.event_type)}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            className="p-1 hover:bg-muted rounded"
                                                            onClick={() => openEditModal(event)}
                                                        >
                                                            <Edit className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                        <button
                                                            className="p-1 hover:bg-destructive/10 rounded"
                                                            onClick={() => handleDelete(event)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="font-medium text-foreground">{event.title}</p>
                                                {event.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                                                )}
                                                {event.event_time && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        🕐
                                                        {' '}
                                                        {event.event_time}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            className="btn-secondary w-full"
                                            onClick={() => openNewEventModal(selectedDate)}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Adicionar Evento
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Clique em uma data no calendário para ver os eventos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Event Modal */}
            <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
                        <DialogDescription>
                            {editingEvent ? 'Atualize os dados do evento.' : 'Crie um novo evento na agenda.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Título *</label>
                            <input
                                type="text"
                                className="input-financial"
                                placeholder="Título do evento"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Tipo *</label>
                                <select
                                    className="input-financial"
                                    value={formData.event_type}
                                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value as AgendaEventType })}
                                    required
                                >
                                    <option value="lembrete">Lembrete</option>
                                    <option value="aniversario">Aniversário</option>
                                    <option value="festividade">Festividade</option>
                                    <option value="feriado">Feriado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Data *</label>
                                <input
                                    type="date"
                                    className="input-financial"
                                    value={formData.event_date}
                                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Horário</label>
                                <input
                                    type="time"
                                    className="input-financial"
                                    value={formData.event_time}
                                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Recorrência</label>
                                <select
                                    className="input-financial"
                                    value={formData.recurrence_type}
                                    onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as 'yearly' | 'monthly' | 'weekly' | 'none' | '' })}
                                >
                                    <option value="">Não repete</option>
                                    <option value="yearly">Anual</option>
                                    <option value="monthly">Mensal</option>
                                    <option value="weekly">Semanal</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Lembrar antes (dias)</label>
                            <input
                                type="number"
                                min="0"
                                max="30"
                                className="input-financial"
                                value={formData.notify_before_days}
                                onChange={(e) => setFormData({ ...formData, notify_before_days: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
                            <textarea
                                className="input-financial min-h-[80px]"
                                placeholder="Descrição do evento"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" className="btn-secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={createEvent.isPending || updateEvent.isPending}
                            >
                                {(createEvent.isPending || updateEvent.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingEvent ? 'Atualizar' : 'Criar'}
                                {' '}
                                Evento
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
