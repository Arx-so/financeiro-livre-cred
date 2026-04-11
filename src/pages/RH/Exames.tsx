import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Upload, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { FavorecidoSelect } from '@/components/shared/FavorecidoSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useExames, useCreateExame, useUpdateExame, useDeleteExame, useUploadExameDocument } from '@/hooks/useExames';
import { useBranchStore } from '@/stores';
import type { OccupationalExamInsert, OccupationalExamUpdate } from '@/types/database';
import { EXAM_TYPES, EXAM_TYPE_LABELS } from '@/constants/hr';
import type { ExamWithEmployee } from '@/services/hrExames';

function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        return format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return date;
    }
}

function getExpiryClass(date: string | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 'text-destructive font-medium';
    if (diff <= 30) return 'text-yellow-600 font-medium';
    return '';
}

interface ExameFormData {
    employee_id: string;
    exam_type: 'admissional' | 'periodico' | 'demissional';
    exam_date: string;
    exam_expiry_date: string;
    notes: string;
    document_url: string;
    document_name: string;
}

const DEFAULT_FORM: ExameFormData = {
    employee_id: '',
    exam_type: EXAM_TYPES.ADMISSIONAL,
    exam_date: '',
    exam_expiry_date: '',
    notes: '',
    document_url: '',
    document_name: '',
};

export default function Exames() {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id) ?? '';
    const [filterType, setFilterType] = useState('');
    const [filterExpiry, setFilterExpiry] = useState<'' | 'expiring' | 'expired'>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<ExameFormData>(DEFAULT_FORM);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { data: exams, isLoading } = useExames({
        examType: filterType || undefined,
        expiryStatus: filterExpiry || undefined,
    });

    const createMutation = useCreateExame();
    const updateMutation = useUpdateExame();
    const deleteMutation = useDeleteExame();
    const uploadMutation = useUploadExameDocument();

    const openCreate = () => {
        setEditingId(null);
        setFormData(DEFAULT_FORM);
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const openEdit = (exam: ExamWithEmployee) => {
        setEditingId(exam.id);
        setFormData({
            employee_id: exam.employee_id,
            exam_type: exam.exam_type,
            exam_date: exam.exam_date,
            exam_expiry_date: exam.exam_expiry_date ?? '',
            notes: exam.notes ?? '',
            document_url: exam.document_url ?? '',
            document_name: exam.document_name ?? '',
        });
        setSelectedFile(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.employee_id || !formData.exam_date) {
            toast.error('Preencha os campos obrigatórios: funcionário e data do exame.');
            return;
        }

        let docUrl = formData.document_url;
        let docName = formData.document_name;
        let docType = '';

        if (selectedFile) {
            try {
                const result = await uploadMutation.mutateAsync({
                    file: selectedFile,
                    branchId,
                    employeeId: formData.employee_id,
                });
                docUrl = result.url;
                docName = result.name;
                docType = result.type;
            } catch {
                toast.error('Erro ao fazer upload do documento.');
                return;
            }
        }

        if (editingId) {
            const updateData: OccupationalExamUpdate = {
                exam_type: formData.exam_type,
                exam_date: formData.exam_date,
                exam_expiry_date: formData.exam_expiry_date || null,
                notes: formData.notes || null,
                document_url: docUrl || null,
                document_name: docName || null,
                document_type: docType || null,
            };
            updateMutation.mutate({ id: editingId, data: updateData }, {
                onSuccess: () => { toast.success('Exame atualizado.'); setIsModalOpen(false); },
                onError: () => toast.error('Erro ao atualizar exame.'),
            });
        } else {
            const insertData: OccupationalExamInsert = {
                branch_id: branchId,
                employee_id: formData.employee_id,
                exam_type: formData.exam_type,
                exam_date: formData.exam_date,
                exam_expiry_date: formData.exam_expiry_date || null,
                notes: formData.notes || null,
                document_url: docUrl || null,
                document_name: docName || null,
                document_type: docType || null,
            };
            createMutation.mutate(insertData, {
                onSuccess: () => { toast.success('Exame registrado.'); setIsModalOpen(false); },
                onError: () => toast.error('Erro ao registrar exame.'),
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

    const isSaving = createMutation.isPending || updateMutation.isPending || uploadMutation.isPending;

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Exames Ocupacionais" description="Controle de exames dos funcionários">
                    <Button onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Exame
                    </Button>
                </PageHeader>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="sm:w-48">
                            <SelectValue placeholder="Tipo de exame" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todos os tipos</SelectItem>
                            {Object.entries(EXAM_TYPE_LABELS).map(([val, label]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterExpiry} onValueChange={(v) => setFilterExpiry(v as '' | 'expiring' | 'expired')}>
                        <SelectTrigger className="sm:w-48">
                            <SelectValue placeholder="Validade" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Qualquer validade</SelectItem>
                            <SelectItem value="expiring">Vencendo em 30 dias</SelectItem>
                            <SelectItem value="expired">Vencidos</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <LoadingState message="Carregando exames..." />
                ) : !exams || exams.length === 0 ? (
                    <EmptyState message="Nenhum exame encontrado." />
                ) : (
                    <div className="border rounded-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Funcionário</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Data do Exame</TableHead>
                                    <TableHead>Validade</TableHead>
                                    <TableHead>Documento</TableHead>
                                    <TableHead className="w-24">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exams.map((exam) => (
                                    <TableRow key={exam.id}>
                                        <TableCell className="font-medium">{exam.employee?.name ?? '—'}</TableCell>
                                        <TableCell className="text-sm">
                                            {EXAM_TYPE_LABELS[exam.exam_type] ?? exam.exam_type}
                                        </TableCell>
                                        <TableCell className="text-sm">{formatDate(exam.exam_date)}</TableCell>
                                        <TableCell className={`text-sm ${getExpiryClass(exam.exam_expiry_date)}`}>
                                            <div className="flex items-center gap-1">
                                                {formatDate(exam.exam_expiry_date)}
                                                {exam.exam_expiry_date && getExpiryClass(exam.exam_expiry_date) && (
                                                    <AlertTriangle className="w-3 h-3" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {exam.document_url ? (
                                                <a
                                                    href={exam.document_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1 text-primary text-sm hover:underline"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    {exam.document_name ?? 'Documento'}
                                                </a>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => openEdit(exam)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-destructive"
                                                    onClick={() => handleDelete(exam.id)}
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

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Exame' : 'Novo Exame'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        <div className="sm:col-span-2">
                            <Label>Funcionário *</Label>
                            <FavorecidoSelect
                                value={formData.employee_id}
                                onChange={(id) => setFormData((prev) => ({ ...prev, employee_id: id }))}
                                placeholder="Selecionar funcionário"
                                filterType="funcionario"
                                disabled={!!editingId}
                            />
                        </div>

                        <div>
                            <Label htmlFor="exam_type">Tipo de Exame *</Label>
                            <Select
                                value={formData.exam_type}
                                onValueChange={(v) => setFormData((prev) => ({
                                    ...prev, exam_type: v as ExameFormData['exam_type'],
                                }))}
                            >
                                <SelectTrigger id="exam_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(EXAM_TYPE_LABELS).map(([val, label]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="exam_date">Data do Exame *</Label>
                            <Input
                                id="exam_date"
                                type="date"
                                value={formData.exam_date}
                                onChange={(e) => setFormData((prev) => ({ ...prev, exam_date: e.target.value }))}
                            />
                        </div>

                        {formData.exam_type === EXAM_TYPES.PERIODICO && (
                            <div className="sm:col-span-2">
                                <Label htmlFor="exam_expiry_date">Data de Validade</Label>
                                <Input
                                    id="exam_expiry_date"
                                    type="date"
                                    value={formData.exam_expiry_date}
                                    onChange={(e) => setFormData((prev) => ({
                                        ...prev, exam_expiry_date: e.target.value,
                                    }))}
                                />
                            </div>
                        )}

                        <div className="sm:col-span-2">
                            <Label htmlFor="document">Documento (PDF/Imagem)</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="document"
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                                    className="flex-1"
                                />
                                {selectedFile && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Upload className="w-3 h-3" />
                                        {selectedFile.name}
                                    </span>
                                )}
                            </div>
                            {formData.document_name && !selectedFile && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Arquivo atual: {formData.document_name}
                                </p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="notes">Observações</Label>
                            <Textarea
                                id="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
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
