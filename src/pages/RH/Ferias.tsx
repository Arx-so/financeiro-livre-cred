import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Plus, AlertTriangle, Calendar, List,
} from 'lucide-react';
import { toast } from 'sonner';
import { confirmDelete } from '@/lib/confirmDelete';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { FavorecidoSelect } from '@/components/shared/FavorecidoSelect';
import { FavorecidoForm } from '@/pages/Favorecidos/components/FavorecidoForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
    useFerias, useCreateFerias, useUpdateFerias, useDeleteFerias,
} from '@/hooks/useFerias';
import { useCreateFavorecido, useUploadFavorecidoPhoto } from '@/hooks/useCadastros';
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

const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Returns true if the vacation period overlaps with any day in the given month/year. */
function vacationOverlapsMonth(
    startDate: string | null | undefined,
    endDate: string | null | undefined,
    year: number,
    month: number, // 0-indexed
): boolean {
    if (!startDate || !endDate) return false;
    const start = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); // last day of month
    return start <= monthEnd && end >= monthStart;
}

interface ProgramacaoAnualProps {
    vacations: VacationWithEmployee[];
    selectedYear: number;
    onYearChange: (year: number) => void;
}

function ProgramacaoAnual({ vacations, selectedYear, onYearChange }: ProgramacaoAnualProps) {
    // Collect unique employees across all vacation records
    const employeeMap = new Map<string, string>();
    for (const v of vacations) {
        if (v.employee_id && v.employee?.name) {
            employeeMap.set(v.employee_id, v.employee.name);
        }
    }
    const employees = Array.from(employeeMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));

    if (employees.length === 0) {
        return (
            <EmptyState
                icon={Calendar}
                message="Nenhum funcionário com férias registradas."
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onYearChange(selectedYear - 1)}
                >
                    ‹
                </Button>
                <span className="font-semibold text-lg w-16 text-center">{selectedYear}</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onYearChange(selectedYear + 1)}
                >
                    ›
                </Button>
            </div>
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">
                                Funcionário
                            </TableHead>
                            {MONTH_ABBR.map((m) => (
                                <TableHead key={m} className="text-center min-w-[56px]">{m}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map(([empId, empName]) => {
                            const empVacations = vacations.filter((v) => v.employee_id === empId);
                            return (
                                <TableRow key={empId}>
                                    <TableCell
                                        className="sticky left-0 bg-background font-medium text-sm z-10"
                                    >
                                        {empName}
                                    </TableCell>
                                    {MONTH_ABBR.map((monthAbbr, monthIdx) => {
                                        const overlapping = empVacations.filter((v) => (
                                            vacationOverlapsMonth(
                                                v.vacation_start_date,
                                                v.vacation_end_date,
                                                selectedYear,
                                                monthIdx,
                                            )
                                        ));
                                        const hasVacation = overlapping.length > 0;
                                        const status = overlapping[0]?.status;
                                        const cellColor = hasVacation
                                            ? STATUS_BADGE_VARIANTS[status ?? ''] ?? 'bg-blue-100 text-blue-800'
                                            : '';
                                        return (
                                            <TableCell
                                                key={monthAbbr}
                                                className={`text-center text-xs p-1 ${hasVacation ? `${cellColor} rounded font-medium` : ''}`}
                                                title={hasVacation
                                                    ? overlapping.map((v) => (
                                                        `${v.employee?.name ?? ''}: ${v.vacation_start_date} — ${v.vacation_end_date}`
                                                    )).join('\n')
                                                    : undefined}
                                            >
                                                {hasVacation ? '●' : ''}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {Object.entries(STATUS_BADGE_VARIANTS).map(([status, cls]) => (
                    <span key={status} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${cls}`}>
                        ●
                        {' '}
                        {VACATION_STATUS_LABELS[status] ?? status}
                    </span>
                ))}
            </div>
        </div>
    );
}

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

const EMPTY_FAVORECIDO_FORM = {
    type: 'funcionario',
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    category: '',
    categoria_contratacao: '',
    notes: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: '',
    pix_key: '',
    pix_key_type: '',
    preferred_payment_type: '',
    birth_date: '',
};

export default function Ferias() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';
    const [searchEmployee, setSearchEmployee] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FeriasFormData>(DEFAULT_FORM);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // --- Inline Favorecido creation ---
    const [isFavorecidoModalOpen, setIsFavorecidoModalOpen] = useState(false);
    const [favorecidoFormData, setFavorecidoFormData] = useState<any>(EMPTY_FAVORECIDO_FORM);
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const favorecidoFileInputRef = useRef<HTMLInputElement>(null);
    const favorecidoCameraInputRef = useRef<HTMLInputElement>(null);
    const favorecidoDocumentInputRef = useRef<HTMLInputElement>(null);
    const createFavorecido = useCreateFavorecido();
    const uploadPhoto = useUploadFavorecidoPhoto();

    const resetFavorecidoForm = () => {
        setFavorecidoFormData(EMPTY_FAVORECIDO_FORM);
        setSelectedPhoto(null);
        setPhotoPreview(null);
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => { setPhotoPreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitFavorecido = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newFav = await createFavorecido.mutateAsync({
                branch_id: unidadeAtual?.id || null,
                type: favorecidoFormData.type,
                name: favorecidoFormData.name,
                document: favorecidoFormData.document || null,
                email: favorecidoFormData.email || null,
                phone: favorecidoFormData.phone || null,
                address: favorecidoFormData.address || null,
                city: favorecidoFormData.city || null,
                state: favorecidoFormData.state || null,
                zip_code: favorecidoFormData.zip_code || null,
                notes: favorecidoFormData.notes || null,
            });
            if (selectedPhoto && newFav.id) {
                await uploadPhoto.mutateAsync({ favorecidoId: newFav.id, file: selectedPhoto });
            }
            setFormData((prev) => ({ ...prev, employee_id: newFav.id }));
            toast.success('Funcionário cadastrado!');
            setIsFavorecidoModalOpen(false);
            resetFavorecidoForm();
        } catch {
            toast.error('Erro ao cadastrar funcionário');
        }
    };

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
        confirmDelete('Remover este registro de férias?', () => {
            deleteMutation.mutate(id, {
                onSuccess: () => toast.success('Registro excluído.'),
                onError: () => toast.error('Erro ao excluir registro.'),
            });
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

                <Tabs defaultValue="lista">
                    <TabsList>
                        <TabsTrigger value="lista" className="flex items-center gap-1.5">
                            <List className="w-3.5 h-3.5" />
                            Lista
                        </TabsTrigger>
                        <TabsTrigger value="programacao" className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Programação Anual
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="lista" className="mt-4 space-y-4">
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
                                                <TableCell className="text-sm">
                                                    {formatDate(v.admission_date)}
                                                </TableCell>
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
                    </TabsContent>

                    <TabsContent value="programacao" className="mt-4">
                        {isLoading ? (
                            <LoadingState message="Carregando férias..." />
                        ) : (
                            <ProgramacaoAnual
                                vacations={vacations ?? []}
                                selectedYear={selectedYear}
                                onYearChange={setSelectedYear}
                            />
                        )}
                    </TabsContent>
                </Tabs>
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
                            <div className="flex gap-2">
                                <FavorecidoSelect
                                    value={formData.employee_id}
                                    onChange={(id) => setFormData((prev) => ({ ...prev, employee_id: id }))}
                                    placeholder="Selecionar funcionário"
                                    filterType="funcionario"
                                    disabled={!!editingId}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsFavorecidoModalOpen(true)}
                                    title="Cadastrar novo funcionário"
                                    disabled={!!editingId}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
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
            {/* Inline Favorecido creation modal */}
            <Dialog
                open={isFavorecidoModalOpen}
                onOpenChange={(open) => { setIsFavorecidoModalOpen(open); if (!open) resetFavorecidoForm(); }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Funcionário</DialogTitle>
                        <DialogDescription>
                            Cadastre um novo funcionário para usar neste registro.
                        </DialogDescription>
                    </DialogHeader>
                    <FavorecidoForm
                        formData={favorecidoFormData}
                        setFormData={setFavorecidoFormData}
                        editingId={null}
                        photoPreview={photoPreview}
                        fileInputRef={favorecidoFileInputRef}
                        cameraInputRef={favorecidoCameraInputRef}
                        documentInputRef={favorecidoDocumentInputRef}
                        favorecidoDocuments={[]}
                        documentsLoading={false}
                        favorecidoLogs={[]}
                        logsLoading={false}
                        isUploadingDocument={false}
                        isDeletingPhoto={false}
                        isSaving={createFavorecido.isPending}
                        onPhotoSelect={handlePhotoSelect}
                        onRemovePhoto={() => { setSelectedPhoto(null); setPhotoPreview(null); }}
                        onDocumentUpload={() => {}}
                        onDeleteDocument={() => {}}
                        onSubmit={handleSubmitFavorecido}
                        onCancel={() => { setIsFavorecidoModalOpen(false); resetFavorecidoForm(); }}
                    />
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
