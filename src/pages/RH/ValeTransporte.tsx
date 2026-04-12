import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Bus, Download } from 'lucide-react';
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
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { useVtRecharges, useVtMonthlyReport, useCreateVtRecharge } from '@/hooks/useValeTransporte';
import { useCreateFavorecido, useUploadFavorecidoPhoto } from '@/hooks/useCadastros';
import { exportVTMonthlyReportToCSV } from '@/services/hrValeTransporte';
import { useBranchStore } from '@/stores';
import type { VtRechargeInsert } from '@/types/database';

const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR = new Date().getFullYear();

const MONTHS = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
];

const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    try {
        return format(new Date(`${date}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return date;
    }
}

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface VtFormData {
    employee_id: string;
    recharge_date: string;
    recharge_amount: number;
    notes: string;
    // calculated fields (not stored directly — recharge_amount is stored)
    daily_rate: number;
    working_days: number;
}

const DEFAULT_FORM: VtFormData = {
    employee_id: '',
    recharge_date: new Date().toISOString().split('T')[0],
    recharge_amount: 0,
    notes: '',
    daily_rate: 9.00,
    working_days: 24,
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

export default function ValeTransporte() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';
    const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<VtFormData>(DEFAULT_FORM);

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
            handleFormChange('employee_id', newFav.id);
            toast.success('Funcionário cadastrado!');
            setIsFavorecidoModalOpen(false);
            resetFavorecidoForm();
        } catch {
            toast.error('Erro ao cadastrar funcionário');
        }
    };

    const { data: recharges, isLoading: rechargesLoading } = useVtRecharges({
        month: selectedMonth,
        year: selectedYear,
    });

    const { data: monthlyReport, isLoading: reportLoading } = useVtMonthlyReport(selectedMonth, selectedYear);

    const createMutation = useCreateVtRecharge();

    const handleFormChange = (field: keyof VtFormData, value: string | number) => {
        setFormData((prev) => {
            const updated = { ...prev, [field]: value };
            if (field === 'daily_rate' || field === 'working_days') {
                updated.recharge_amount = Number(updated.daily_rate) * Number(updated.working_days);
            }
            return updated;
        });
    };

    const handleSubmit = () => {
        if (!formData.employee_id || !formData.recharge_date || formData.recharge_amount <= 0) {
            toast.error('Preencha os campos obrigatórios: funcionário, data e valor.');
            return;
        }

        const insertData: VtRechargeInsert = {
            branch_id: branchId,
            employee_id: formData.employee_id,
            recharge_date: formData.recharge_date,
            recharge_amount: formData.recharge_amount,
            notes: formData.notes || null,
        };

        createMutation.mutate(insertData, {
            onSuccess: () => { toast.success('Recarga de VT registrada.'); setIsModalOpen(false); },
            onError: () => toast.error('Erro ao registrar recarga.'),
        });
    };

    const handleExportCSV = () => {
        const allRecharges = recharges ?? [];
        if (allRecharges.length === 0) {
            toast.error('Nenhuma recarga para exportar no período.');
            return;
        }
        const csvContent = exportVTMonthlyReportToCSV(allRecharges, selectedMonth, selectedYear);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `vt_${selectedMonth}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Relatório exportado com sucesso.');
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Vale Transporte" description="Controle de recargas de Vale Transporte">
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button onClick={() => { setFormData(DEFAULT_FORM); setIsModalOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Recarregamento
                    </Button>
                </PageHeader>

                {/* Period Selector */}
                <div className="flex gap-3">
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
                </div>

                <Tabs defaultValue="relatorio">
                    <TabsList>
                        <TabsTrigger value="relatorio">Relatório Mensal</TabsTrigger>
                        <TabsTrigger value="recargas">Recargas Individuais</TabsTrigger>
                    </TabsList>

                    <TabsContent value="relatorio" className="mt-4">
                        {reportLoading ? (
                            <LoadingState message="Gerando relatório..." />
                        ) : !monthlyReport || monthlyReport.rows.length === 0 ? (
                            <EmptyState icon={Bus} message="Nenhuma recarga registrada no período." />
                        ) : (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Funcionário</TableHead>
                                            <TableHead className="text-right">Nº de Recargas</TableHead>
                                            <TableHead className="text-right">Total VT</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {monthlyReport.rows.map((row) => (
                                            <TableRow key={row.employee_id}>
                                                <TableCell className="font-medium">{row.employee_name}</TableCell>
                                                <TableCell className="text-right text-sm">
                                                    {row.recharge_count}
                                                </TableCell>
                                                <TableCell className="text-right font-mono-numbers">
                                                    {formatCurrency(row.total_amount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-semibold">
                                            <TableCell>Total Geral</TableCell>
                                            <TableCell />
                                            <TableCell className="text-right font-mono-numbers">
                                                {formatCurrency(monthlyReport.grand_total)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="recargas" className="mt-4">
                        {rechargesLoading ? (
                            <LoadingState message="Carregando recargas..." />
                        ) : !recharges || recharges.length === 0 ? (
                            <EmptyState icon={Bus} message="Nenhuma recarga encontrada no período." />
                        ) : (
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Funcionário</TableHead>
                                            <TableHead>Data</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead>Observações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recharges.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="font-medium">
                                                    {r.employee?.name ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(r.recharge_date)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono-numbers">
                                                    {formatCurrency(r.recharge_amount)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {r.notes ?? '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
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
                        <DialogTitle>Novo Recarregamento de VT</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                        <div className="sm:col-span-2">
                            <Label>Funcionário *</Label>
                            <div className="flex gap-2">
                                <FavorecidoSelect
                                    value={formData.employee_id}
                                    onChange={(id) => handleFormChange('employee_id', id)}
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
                            <Label htmlFor="recharge_date">Data da Recarga *</Label>
                            <Input
                                id="recharge_date"
                                type="date"
                                value={formData.recharge_date}
                                onChange={(e) => handleFormChange('recharge_date', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="daily_rate">Valor Diário (R$)</Label>
                            <CurrencyInput
                                id="daily_rate"
                                value={formData.daily_rate}
                                onChange={(val) => handleFormChange('daily_rate', val)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="working_days">Dias de Trabalho</Label>
                            <Input
                                id="working_days"
                                type="number"
                                min="1"
                                max="31"
                                value={formData.working_days}
                                onChange={(e) => handleFormChange('working_days', Number(e.target.value))}
                            />
                        </div>

                        <div>
                            <Label htmlFor="recharge_amount">Total VT (R$)</Label>
                            <CurrencyInput
                                id="recharge_amount"
                                value={formData.recharge_amount}
                                onChange={(val) => handleFormChange('recharge_amount', val)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatCurrency(formData.daily_rate)}
                                {' × '}
                                {formData.working_days}
                                {' dias = '}
                                {formatCurrency(formData.daily_rate * formData.working_days)}
                            </p>
                        </div>

                        <div className="sm:col-span-2">
                            <Label htmlFor="vt_notes">Observações</Label>
                            <Textarea
                                id="vt_notes"
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => handleFormChange('notes', e.target.value)}
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
