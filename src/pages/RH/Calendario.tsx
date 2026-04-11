import { useState } from 'react';
import {
    format, getDaysInMonth, startOfMonth, getDay, isSameDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Plus, ChevronLeft, ChevronRight, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    useCorporateHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday,
} from '@/hooks/useCalendario';
import { useBranchStore } from '@/stores';
import type { CorporateHolidayInsert, CorporateHolidayUpdate, CorporateHoliday } from '@/types/database';
import { HOLIDAY_TYPES, HOLIDAY_TYPE_LABELS } from '@/constants/hr';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const HOLIDAY_TYPE_COLORS: Record<string, string> = {
    nacional: 'bg-red-100 text-red-800 border-red-200',
    estadual: 'bg-orange-100 text-orange-800 border-orange-200',
    municipal: 'bg-blue-100 text-blue-800 border-blue-200',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDate(date: string): string {
    try {
        return format(new Date(`${date}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return date;
    }
}

interface HolidayFormData {
    holiday_date: string;
    description: string;
    holiday_type: 'nacional' | 'estadual' | 'municipal';
}

const DEFAULT_FORM: HolidayFormData = {
    holiday_date: '',
    description: '',
    holiday_type: HOLIDAY_TYPES.NACIONAL,
};

export default function Calendario() {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id) ?? '';
    const [viewMonth, setViewMonth] = useState(CURRENT_MONTH);
    const [viewYear, setViewYear] = useState(CURRENT_YEAR);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<HolidayFormData>(DEFAULT_FORM);

    const { data: holidays, isLoading } = useCorporateHolidays({
        year: viewYear,
        month: viewMonth,
    });

    const createMutation = useCreateHoliday();
    const updateMutation = useUpdateHoliday();
    const deleteMutation = useDeleteHoliday();

    const openCreate = () => {
        setEditingId(null);
        setFormData(DEFAULT_FORM);
        setIsModalOpen(true);
    };

    const openEdit = (holiday: CorporateHoliday) => {
        setEditingId(holiday.id);
        setFormData({
            holiday_date: holiday.holiday_date,
            description: holiday.description,
            holiday_type: holiday.holiday_type,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.holiday_date || !formData.description) {
            toast.error('Preencha os campos obrigatórios: data e descrição.');
            return;
        }

        if (editingId) {
            const updateData: CorporateHolidayUpdate = {
                holiday_date: formData.holiday_date,
                description: formData.description,
                holiday_type: formData.holiday_type,
            };
            updateMutation.mutate({ id: editingId, data: updateData }, {
                onSuccess: () => { toast.success('Feriado atualizado.'); setIsModalOpen(false); },
                onError: () => toast.error('Erro ao atualizar feriado.'),
            });
        } else {
            const insertData: CorporateHolidayInsert = {
                branch_id: branchId,
                holiday_date: formData.holiday_date,
                description: formData.description,
                holiday_type: formData.holiday_type,
            };
            createMutation.mutate(insertData, {
                onSuccess: () => { toast.success('Feriado cadastrado.'); setIsModalOpen(false); },
                onError: () => toast.error('Erro ao cadastrar feriado.'),
            });
        }
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Confirma exclusão deste feriado?')) return;
        deleteMutation.mutate(id, {
            onSuccess: () => toast.success('Feriado excluído.'),
            onError: () => toast.error('Erro ao excluir feriado.'),
        });
    };

    const prevMonth = () => {
        if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1); }
        else setViewMonth((m) => m - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1); }
        else setViewMonth((m) => m + 1);
    };

    // Build calendar grid
    const firstDay = startOfMonth(new Date(viewYear, viewMonth - 1, 1));
    const daysInMonth = getDaysInMonth(firstDay);
    const startDow = getDay(firstDay);
    const calendarCells: (Date | null)[] = [
        ...Array(startDow).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewYear, viewMonth - 1, i + 1)),
    ];

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Calendário Corporativo"
                    description="Feriados e datas comemorativas da empresa"
                >
                    <Button onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Feriado
                    </Button>
                </PageHeader>

                {/* Month navigator */}
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-base font-semibold min-w-40 text-center">
                        {format(new Date(viewYear, viewMonth - 1, 1), 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                {isLoading ? (
                    <LoadingState message="Carregando calendário..." />
                ) : (
                    <Tabs defaultValue="calendario">
                        <TabsList>
                            <TabsTrigger value="calendario">Calendário</TabsTrigger>
                            <TabsTrigger value="lista">Lista</TabsTrigger>
                        </TabsList>

                        <TabsContent value="calendario" className="mt-4">
                            {/* Calendar Grid */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="grid grid-cols-7 bg-muted">
                                    {WEEKDAYS.map((wd) => (
                                        <div key={wd} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                                            {wd}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7">
                                    {calendarCells.map((day, idx) => {
                                        const holiday = day
                                            ? holidays?.find(
                                                (h) => isSameDay(new Date(`${h.holiday_date}T12:00:00`), day),
                                            )
                                            : undefined;

                                        return (
                                            <div
                                                key={idx}
                                                className={`min-h-16 p-1 border-b border-r text-sm ${!day ? 'bg-muted/30' : ''} ${holiday ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                                            >
                                                {day && (
                                                    <>
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            {day.getDate()}
                                                        </span>
                                                        {holiday && (
                                                            <p className="text-xs mt-1 font-medium text-red-700 dark:text-red-400 line-clamp-2">
                                                                {holiday.description}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="lista" className="mt-4">
                            {!holidays || holidays.length === 0 ? (
                                <EmptyState icon={Calendar} message="Nenhum feriado cadastrado neste mês." />
                            ) : (
                                <div className="border rounded-lg overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Data</TableHead>
                                                <TableHead>Descrição</TableHead>
                                                <TableHead>Tipo</TableHead>
                                                <TableHead className="w-24">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {holidays.map((h) => (
                                                <TableRow key={h.id}>
                                                    <TableCell className="font-medium">
                                                        {formatDate(h.holiday_date)}
                                                    </TableCell>
                                                    <TableCell>{h.description}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${HOLIDAY_TYPE_COLORS[h.holiday_type] ?? ''}`}>
                                                            {HOLIDAY_TYPE_LABELS[h.holiday_type] ?? h.holiday_type}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs"
                                                                onClick={() => openEdit(h)}
                                                            >
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs text-destructive"
                                                                onClick={() => handleDelete(h.id)}
                                                                disabled={deleteMutation.isPending}
                                                            >
                                                                Excluir
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Feriado' : 'Adicionar Feriado'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="holiday_date">Data *</Label>
                            <Input
                                id="holiday_date"
                                type="date"
                                value={formData.holiday_date}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev, holiday_date: e.target.value,
                                }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Descrição *</Label>
                            <Input
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev, description: e.target.value,
                                }))}
                                placeholder="Nome do feriado..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="holiday_type">Tipo *</Label>
                            <Select
                                value={formData.holiday_type}
                                onValueChange={(v) => setFormData((prev) => ({
                                    ...prev, holiday_type: v as HolidayFormData['holiday_type'],
                                }))}
                            >
                                <SelectTrigger id="holiday_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(HOLIDAY_TYPE_LABELS).map(([val, label]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
