import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { FavorecidoSelect } from '@/components/shared/FavorecidoSelect';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    useFerias, useCreateFerias, useUpdateFerias, useDeleteFerias,
} from '@/hooks/useFerias';
import { useBranchStore } from '@/stores';
import type { EmployeeVacationInsert, EmployeeVacationUpdate } from '@/types/database';
import { VACATION_STATUSES, VACATION_STATUS_LABELS } from '@/constants/hr';
import type { VacationWithEmployee } from '@/services/hrFerias';

const STATUS_BADGE_VARIANTS: Record<string, string> = {
    pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    programada: 'bg-blue-100 text-blue-800 border-blue-200',
    em_andamento: 'bg-green-100 text-green-800 border-green-200',
    concluida: 'bg-gray-100 text-gray-700 border-gray-200',
};

function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        return format(new Date(`${date}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return date;
    }
}

function isExpiringSoon(expiryDate: string | null | undefined): boolean {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diff = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
}

interface FeriasFormData {
    employee_id: string;
    admission_date: string;
    last_vacation_period_end: string;
    vacation_expiry_date: string;
    max_grant_deadline: string;
    vacation_start_date: string;
    vacation_end_date: string;
    status: 'pendente' | 'programada' | 'em_andamento' | 'concluida';
    notes: string;
}

const DEFAULT_FORM: FeriasFormData = {
    employee_id: '',
    admission_date: '',
    last_vacation_period_end: '',
    vacation_expiry_date: '',
    max_grant_deadline: '',
    vacation_start_date: '',
    vacation_end_date: '',
    status: VACATION_STATUSES.PENDENTE,
    notes: '',
};

export default function Ferias() {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id) ?? '';
    const [searchEmployee, setSearchEmployee] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FeriasFormData>(DEFAULT_FORM);

    const { data: vacations, isLoading } = useFerias({
        status: filterStatus === 'all' ? undefined : filterStatus,
        search: searchEmployee || undefined,
    });

    const createMutation = useCreateFerias();
    const updateMutation = useUpdateFerias();
    const deleteMutation = useDeleteFerias();

    const openCreate = () => {
        setEditingId(null);
        setFormData(DEFAULT_FORM);
        setIsModalOpen(true);
    };

    const openEdit = (vacation: VacationWithEmployee) => {
        setEditingId(vacation.id);
        setFormData({
            employee_id: vacation.employee_id,
            admission_date: vacation.admission_date,
            last_vacation_period_end: vacation.last_vacation_period_end ?? '',
            vacation_expiry_date: vacation.vacation_expiry_date,
            max_grant_deadline: vacation.max_grant_deadline ?? '',
            vacation_start_date: vacation.vacation_start_date ?? '',
            vacation_end_date: vacation.vacation_end_date ?? '',
            status: vacation.status,
            notes: vacation.notes ?? '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.employee_id || !formData.admission_date || !formData.vacation_expiry_date) {
            toast.error('Preencha os campos obrigatórios: funcionário, admissão e vencimento.');
            return;
        }

        if (editingId) {
            const updateData: EmployeeVacationUpdate = {
                admission_date: formData.admission_date,
                last_vacation_period_end: formData.last_vacation_period_end || null,
                vacation_expiry_date: formData.vacation_expiry_date,
                max_grant_deadline: formData.max_grant_deadline || null,
                vacation_start_date: formData.vacation_start_date || null,
                vacation_end_date: formData.vacation_end_date || null,
                status: formData.status,
                notes: formData.notes || null,
            };
            updateMutation.mutate({ id: editingId, data: updateData }, {
                onSuccess: () => { toast.success('Férias atualizadas.'); setIsModalOpen(false); },
                onError: () => toast.error('Erro ao atualizar férias.'),
            });
        } else {
            const insertData: EmployeeVacationInsert = {
                branch_id: branchId,
                employee_id: formData.employee_id,
                admission_date: formData.admission_date,
                last_vacation_period_end: formData.last_vacation_period_end || null,
                vacation_expiry_date: formData.vacation_expiry_date,
                max_grant_deadline: formData.max_grant_deadline || null,
                vacation_start_date: formData.vacation_start_date || null,
                vacation_end_date: formData.vacation_end_date || null,
                status: formData.status,
                notes: formData.notes || null,
            };
            createMutation.mutate(insertData, {
                onSuccess: () => { toast.success('Férias registradas.'); setIsModalOpen(false); },
                onError: () => toast.error('Erro ao registrar férias.'),
            });
        }
    };

    const handleDelete = (id: string) => {
        if (!window.confirm('Confirma exclusão deste registro?')) return;
        deleteMutation.mutate(id, {
            onSuccess: () => toast.success('Registro excluído.'),
            onError: () => toast.error('Erro ao excluir registro.'),
        });
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Férias" description="Controle de férias dos funcionários">
                    <Button onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Férias
                    </Button>
                </PageHeader>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                        placeholder="Buscar funcionário..."
                        value={searchEmployee}
                        onChange={(e) => setSearchEmployee(e.target.value)}
                        className="sm:max-w-xs"
                    />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="sm:w-48">
                            <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os status</SelectItem>
                            {Object.entries(VACATION_STATUS_LABELS).map(([val, label]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                {isLoading ? (
                    <LoadingState message="Carregando férias..." />
                ) : !vacations || vacations.length === 0 ? (
                    <EmptyState icon={Calendar} message="Nenhum registro de férias encontrado." />
                ) : (
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Funcionário</TableHead>
                                    <TableHead>Admissão</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Período de Gozo</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-24">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vacations.map((v) => (
                                    <TableRow key={v.id}>
                                        <TableCell className="font-medium">
                                            {v.employee?.name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-sm">{formatDate(v.admission_date)}</TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-2">
                                                {formatDate(v.vacation_expiry_date)}
                                                {isExpiringSoon(v.vacation_expiry_date) && (
                                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {v.vacation_start_date
                                                ? `${formatDate(v.vacation_start_date)} — ${formatDate(v.vacation_end_date)}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE_VARIANTS[v.status] ?? ''}`}>
                                                {VACATION_STATUS_LABELS[v.status] ?? v.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => openEdit(v)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-destructive"
                                                    onClick={() => handleDelete(v.id)}
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
            </div>

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Férias' : 'Nova Férias'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        <div className="sm:col-span-2">
                            <Label htmlFor="employee">Funcionário *</Label>
                            <FavorecidoSelect
                                value={formData.employee_id}
                                onChange={(id) => setFormData((prev) => ({ ...prev, employee_id: id }))}
                                placeholder="Selecionar funcionário"
                                filterType="funcionario"
                                disabled={!!editingId}
                            />
                        </div>

                        <div>
                            <Label htmlFor="admission_date">Data de Admissão *</Label>
                            <Input
                                id="admission_date"
                                type="date"
                                value={formData.admission_date}
                                onChange={(e) => setFormData((prev) => ({ ...prev, admission_date: e.target.value }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="last_vacation_period_end">Último Período de Férias</Label>
                            <Input
                                id="last_vacation_period_end"
                                type="date"
                                value={formData.last_vacation_period_end}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev, last_vacation_period_end: e.target.value,
                                }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="vacation_expiry_date">Vencimento das Férias *</Label>
                            <Input
                                id="vacation_expiry_date"
                                type="date"
                                value={formData.vacation_expiry_date}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev, vacation_expiry_date: e.target.value,
                                }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="max_grant_deadline">Prazo Máximo para Concessão</Label>
                            <Input
                                id="max_grant_deadline"
                                type="date"
                                value={formData.max_grant_deadline}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev, max_grant_deadline: e.target.value,
                                }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="vacation_start_date">Início do Gozo</Label>
                            <Input
                                id="vacation_start_date"
                                type="date"
                                value={formData.vacation_start_date}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev, vacation_start_date: e.target.value,
                                }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="vacation_end_date">Fim do Gozo</Label>
                            <Input
                                id="vacation_end_date"
                                type="date"
                                value={formData.vacation_end_date}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev, vacation_end_date: e.target.value,
                                }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="status">Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(v) => setFormData((prev) => ({
                                    ...prev, status: v as FeriasFormData['status'],
                                }))}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(VACATION_STATUS_LABELS).map(([val, label]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                                id="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder="Observações sobre as férias..."
                            />
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
