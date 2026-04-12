import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
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
    Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAtestados, useAtestadosReport, useCreateAtestado } from '@/hooks/useAtestados';
import { useCreateFavorecido, useUploadFavorecidoPhoto } from '@/hooks/useCadastros';
import { useBranchStore } from '@/stores';
import type { MedicalCertificateInsert } from '@/types/database';
import { CERTIFICATE_TYPES, CERTIFICATE_TYPE_LABELS } from '@/constants/hr';

const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR = new Date().getFullYear();

const MONTHS = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
];

function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        return format(new Date(`${date}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return date;
    }
}

const CERT_TYPE_COLORS: Record<string, string> = {
    atestado: 'bg-blue-100 text-blue-800 border-blue-200',
    declaracao: 'bg-purple-100 text-purple-800 border-purple-200',
};

interface AtestadoFormData {
    employee_id: string;
    certificate_date: string;
    absence_days: number;
    certificate_type: 'atestado' | 'declaracao';
    notes: string;
}

const DEFAULT_FORM: AtestadoFormData = {
    employee_id: '',
    certificate_date: new Date().toISOString().split('T')[0],
    absence_days: 1,
    certificate_type: CERTIFICATE_TYPES.ATESTADO,
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

export default function Atestados() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [filterType, setFilterType] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<AtestadoFormData>(DEFAULT_FORM);

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

    const { data: certificates, isLoading } = useAtestados({
        month: selectedMonth,
        year: selectedYear,
        certificateType: filterType === 'all' ? undefined : filterType,
    });

    const { data: report } = useAtestadosReport({
        month: selectedMonth,
        year: selectedYear,
    });

    const createMutation = useCreateAtestado();

    const handleSubmit = () => {
        if (!formData.employee_id || !formData.certificate_date || formData.absence_days <= 0) {
            toast.error('Preencha os campos obrigatórios: funcionário, data e dias.');
            return;
        }

        const insertData: MedicalCertificateInsert = {
            branch_id: branchId,
            employee_id: formData.employee_id,
            certificate_date: formData.certificate_date,
            absence_days: formData.absence_days,
            certificate_type: formData.certificate_type,
            notes: formData.notes || null,
        };

        createMutation.mutate(insertData, {
            onSuccess: () => { toast.success('Atestado registrado.'); setIsModalOpen(false); },
            onError: () => toast.error('Erro ao registrar atestado.'),
        });
    };

    const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Atestados" description="Controle de atestados médicos e declarações">
                    <Button onClick={() => { setFormData(DEFAULT_FORM); setIsModalOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Atestado
                    </Button>
                </PageHeader>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m) => (
                                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-28">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {YEARS.map((y) => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            {Object.entries(CERTIFICATE_TYPE_LABELS).map(([val, label]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Summary */}
                {report && (
                    <div className="flex gap-6 p-4 bg-muted/50 rounded-lg text-sm">
                        <div>
                            <span className="text-muted-foreground">Total de registros: </span>
                            <span className="font-semibold">{report.total_records}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Total de dias de ausência: </span>
                            <span className="font-semibold">
                                {report.total_days}
                                {' dias'}
                            </span>
                        </div>
                    </div>
                )}

                <Tabs defaultValue="lista">
                    <TabsList>
                        <TabsTrigger value="lista">Lista Detalhada</TabsTrigger>
                        <TabsTrigger value="relatorio">Relatório por Funcionário</TabsTrigger>
                    </TabsList>

                    <TabsContent value="lista" className="mt-4">
                        {isLoading ? (
                            <LoadingState message="Carregando atestados..." />
                        ) : !certificates || certificates.length === 0 ? (
                            <EmptyState icon={FileText} message="Nenhum atestado encontrado no período." />
                        ) : (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Funcionário</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Dias</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Observações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {certificates.map((cert) => (
                                            <TableRow key={cert.id}>
                                                <TableCell className="font-medium">
                                                    {cert.employee?.name ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(cert.certificate_date)}
                                                </TableCell>
                                                <TableCell className="text-sm font-mono-numbers">
                                                    {cert.absence_days}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CERT_TYPE_COLORS[cert.certificate_type] ?? ''}`}>
                                                        {CERTIFICATE_TYPE_LABELS[cert.certificate_type] ?? cert.certificate_type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {cert.notes ?? '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="relatorio" className="mt-4">
                        {!report || report.rows.length === 0 ? (
                            <EmptyState icon={FileText} message="Nenhum registro no período." />
                        ) : (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Funcionário</TableHead>
                                            <TableHead className="text-right">Registros</TableHead>
                                            <TableHead className="text-right">Total de Dias</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {report.rows.map((row) => (
                                            <TableRow key={row.employee_id}>
                                                <TableCell className="font-medium">{row.employee_name}</TableCell>
                                                <TableCell className="text-right text-sm">{row.record_count}</TableCell>
                                                <TableCell className="text-right font-mono-numbers">
                                                    {row.total_days}
                                                    {' dias'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-semibold">
                                            <TableCell>Total</TableCell>
                                            <TableCell className="text-right">{report.total_records}</TableCell>
                                            <TableCell className="text-right font-mono-numbers">
                                                {report.total_days}
                                                {' dias'}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Novo Atestado</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        <div className="sm:col-span-2">
                            <Label>Funcionário *</Label>
                            <div className="flex gap-2">
                                <FavorecidoSelect
                                    value={formData.employee_id}
                                    onChange={(id) => setFormData((prev) => ({ ...prev, employee_id: id }))}
                                    placeholder="Selecionar funcionário"
                                    filterType="funcionario"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsFavorecidoModalOpen(true)}
                                    title="Cadastrar novo funcionário"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="certificate_date">Data do Atestado *</Label>
                            <Input
                                id="certificate_date"
                                type="date"
                                value={formData.certificate_date}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev, certificate_date: e.target.value,
                                }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="absence_days">Dias de Ausência *</Label>
                            <Input
                                id="absence_days"
                                type="number"
                                min="1"
                                value={formData.absence_days}
                                onChange={(e) => setFormData((prev) => ({
                                    ...prev, absence_days: Number(e.target.value),
                                }))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="certificate_type">Tipo *</Label>
                            <Select
                                value={formData.certificate_type}
                                onValueChange={(v) => setFormData((prev) => ({
                                    ...prev, certificate_type: v as AtestadoFormData['certificate_type'],
                                }))}
                            >
                                <SelectTrigger id="certificate_type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CERTIFICATE_TYPE_LABELS).map(([val, label]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="cert_notes">Observações</Label>
                            <Textarea
                                id="cert_notes"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Salvando...' : 'Salvar'}
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
