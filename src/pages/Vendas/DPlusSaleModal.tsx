import { useState, useEffect, useRef } from 'react';
import { Plus, Paperclip, X, Printer, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
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
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDPlusSale } from '@/hooks/useSalesDPlus';
import { useCreateFavorecido, useUploadFavorecidoPhoto } from '@/hooks/useCadastros';
import { useBranchStore, useAuthStore } from '@/stores';
import type { SalesDPlusProductInsert, SalesDPlusProduct } from '@/types/database';
import {
    DPLUS_SALE_STATUSES,
    DPLUS_PAYMENT_METHODS,
    DPLUS_PAYMENT_METHOD_LABELS,
    DPLUS_PAYMENT_METHODS_WITH_INFO,
} from '@/constants/sales';
import { uploadDPlusDocument, generateFinancialEntriesFromDPlusSale, getDPlusSaleById } from '@/services/salesDPlus';
import { supabase } from '@/lib/supabase';

const DPLUS_STATUS_LABELS: Record<string, string> = {
    pendente: 'Pendente',
    ativo: 'Ativo',
    cancelado: 'Cancelado',
};

interface DPlusSaleModalProps {
    open: boolean;
    onClose: () => void;
    onSaved?: (saleId: string) => void;
}

interface FormData {
    client_id: string;
    seller_id: string;
    proposal_number: string;
    contract_value: number;
    bank_info: string;
    table_info: string;
    status: string;
    payment_method: string;
    payment_info: string;
    notes: string;
}

const DEFAULT_FORM: FormData = {
    client_id: '',
    seller_id: '',
    proposal_number: '',
    contract_value: 0,
    bank_info: '',
    table_info: '',
    status: DPLUS_SALE_STATUSES.PENDENTE,
    payment_method: '',
    payment_info: '',
    notes: '',
};

const EMPTY_FAVORECIDO_FORM = {
    type: 'cliente',
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

function paymentInfoLabel(method: string): string {
    if (method === DPLUS_PAYMENT_METHODS.PIX) return 'Chave PIX';
    if (method === DPLUS_PAYMENT_METHODS.TRANSFERENCIA) return 'Dados Bancários (Banco / Agência / Conta)';
    return 'Informação de Pagamento';
}

function paymentInfoPlaceholder(method: string): string {
    if (method === DPLUS_PAYMENT_METHODS.PIX) return 'Ex: 11999998888 ou cpf@banco.com';
    if (method === DPLUS_PAYMENT_METHODS.TRANSFERENCIA) return 'Ex: Banco do Brasil / Ag 0001 / CC 12345-6';
    return '';
}

export function DPlusSaleModal({ open, onClose, onSaved }: DPlusSaleModalProps) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';
    const userId = useAuthStore((state) => state.user?.id) ?? '';
    const createMutation = useCreateDPlusSale();
    const createFavorecido = useCreateFavorecido();
    const uploadPhoto = useUploadFavorecidoPhoto();
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

    // Document attachments
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Inline Cliente (Favorecido) creation ---
    const [isFavorecidoModalOpen, setIsFavorecidoModalOpen] = useState(false);
    const [favorecidoFormData, setFavorecidoFormData] = useState<any>(EMPTY_FAVORECIDO_FORM);
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const favorecidoFileInputRef = useRef<HTMLInputElement>(null);
    const favorecidoCameraInputRef = useRef<HTMLInputElement>(null);
    const favorecidoDocumentInputRef = useRef<HTMLInputElement>(null);

    // --- Inline Vendedor (Funcionário) creation ---
    const [isVendedorModalOpen, setIsVendedorModalOpen] = useState(false);
    const [vendedorFormData, setVendedorFormData] = useState<any>({ ...EMPTY_FAVORECIDO_FORM, type: 'funcionario' });
    const [selectedVendedorPhoto, setSelectedVendedorPhoto] = useState<File | null>(null);
    const [vendedorPhotoPreview, setVendedorPhotoPreview] = useState<string | null>(null);
    const vendedorFileInputRef = useRef<HTMLInputElement>(null);
    const vendedorCameraInputRef = useRef<HTMLInputElement>(null);
    const vendedorDocumentInputRef = useRef<HTMLInputElement>(null);

    // --- Completion modal ---
    const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);
    const [isSavingDocs, setIsSavingDocs] = useState(false);

    useEffect(() => {
        if (!open) {
            setFormData(DEFAULT_FORM);
            setSelectedFiles([]);
            setCompletedSaleId(null);
        }
    }, [open]);

    const resetFavorecidoForm = () => {
        setFavorecidoFormData({ ...EMPTY_FAVORECIDO_FORM, type: 'cliente' });
        setSelectedPhoto(null);
        setPhotoPreview(null);
    };

    const resetVendedorForm = () => {
        setVendedorFormData({ ...EMPTY_FAVORECIDO_FORM, type: 'funcionario' });
        setSelectedVendedorPhoto(null);
        setVendedorPhotoPreview(null);
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

    const handleVendedorPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedVendedorPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => { setVendedorPhotoPreview(reader.result as string); };
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
            setFormData((prev) => ({ ...prev, client_id: newFav.id }));
            toast.success('Cliente criado!');
            setIsFavorecidoModalOpen(false);
            resetFavorecidoForm();
        } catch {
            toast.error('Erro ao criar cliente');
        }
    };

    const handleSubmitVendedor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newVendedor = await createFavorecido.mutateAsync({
                branch_id: unidadeAtual?.id || null,
                type: 'funcionario',
                name: vendedorFormData.name,
                document: vendedorFormData.document || null,
                email: vendedorFormData.email || null,
                phone: vendedorFormData.phone || null,
                address: vendedorFormData.address || null,
                city: vendedorFormData.city || null,
                state: vendedorFormData.state || null,
                zip_code: vendedorFormData.zip_code || null,
                notes: vendedorFormData.notes || null,
            });
            if (selectedVendedorPhoto && newVendedor.id) {
                await uploadPhoto.mutateAsync({ favorecidoId: newVendedor.id, file: selectedVendedorPhoto });
            }
            setFormData((prev) => ({ ...prev, seller_id: newVendedor.id }));
            toast.success('Vendedor criado!');
            setIsVendedorModalOpen(false);
            resetVendedorForm();
        } catch {
            toast.error('Erro ao criar vendedor');
        }
    };

    const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        setSelectedFiles((prev) => [...prev, ...files]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileRemove = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleFieldChange = (field: keyof FormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const showPaymentInfo = DPLUS_PAYMENT_METHODS_WITH_INFO.includes(formData.payment_method);

    const handleSubmit = async () => {
        if (!formData.client_id) { toast.error('Selecione o cliente.'); return; }
        if (!formData.seller_id) { toast.error('Selecione o vendedor.'); return; }
        if (!formData.proposal_number.trim()) { toast.error('Informe o número da proposta.'); return; }
        if (formData.contract_value <= 0) { toast.error('Informe o valor do contrato.'); return; }

        const insertData: SalesDPlusProductInsert = {
            branch_id: branchId,
            client_id: formData.client_id,
            seller_id: formData.seller_id,
            proposal_number: formData.proposal_number.trim(),
            contract_value: formData.contract_value,
            bank_info: formData.bank_info.trim() || null,
            table_info: formData.table_info.trim() || null,
            status: formData.status as SalesDPlusProductInsert['status'],
            payment_method: formData.payment_method || null,
            payment_info: showPaymentInfo ? (formData.payment_info.trim() || null) : null,
            notes: formData.notes.trim() || null,
            created_by: userId || null,
        };

        setIsSavingDocs(true);
        try {
            await new Promise<void>((resolve, reject) => {
                createMutation.mutate(insertData, {
                    onSuccess: async (created: SalesDPlusProduct) => {
                        try {
                            // Upload documents if any
                            if (selectedFiles.length > 0) {
                                const urls = await Promise.all(
                                    selectedFiles.map((f) => uploadDPlusDocument(f, branchId, created.id)),
                                );
                                await supabase
                                    .from('sales_d_plus_products')
                                    .update({ document_urls: urls })
                                    .eq('id', created.id);
                            }

                            // Auto-generate financial entries
                            const saleWithRelations = await getDPlusSaleById(created.id);
                            if (saleWithRelations) {
                                await generateFinancialEntriesFromDPlusSale(saleWithRelations);
                            }

                            onSaved?.(created.id);
                            setCompletedSaleId(created.id);
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    },
                    onError: (err) => reject(err),
                });
            });
        } catch {
            toast.error('Erro ao registrar venda D+.');
        } finally {
            setIsSavingDocs(false);
        }
    };

    const handlePrint = () => window.print();

    const handleCloseCompleted = () => {
        setCompletedSaleId(null);
        onClose();
    };

    const isSaving = createMutation.isPending || isSavingDocs;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Venda — Produto D+</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 1. Cliente */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            1. Cliente *
                        </h3>
                        <div className="flex gap-2">
                            <FavorecidoSelect
                                value={formData.client_id}
                                onChange={(id) => handleFieldChange('client_id', id)}
                                placeholder="Buscar cliente por nome, CPF, telefone..."
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                type="button"
                                onClick={() => setIsFavorecidoModalOpen(true)}
                                title="Novo cliente"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* 2. Vendedor */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            2. Vendedor *
                        </h3>
                        <div className="flex gap-2">
                            <FavorecidoSelect
                                value={formData.seller_id}
                                onChange={(id) => handleFieldChange('seller_id', id)}
                                filterType="funcionario"
                                placeholder="Buscar vendedor..."
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                type="button"
                                onClick={() => setIsVendedorModalOpen(true)}
                                title="Novo vendedor"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* 3. Proposta */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            3. Proposta
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="proposal_number">Número da Proposta *</Label>
                                <Input
                                    id="proposal_number"
                                    value={formData.proposal_number}
                                    onChange={(e) => handleFieldChange('proposal_number', e.target.value)}
                                    placeholder="Ex: 2024001234"
                                    className="font-mono-numbers"
                                />
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => handleFieldChange('status', v)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(DPLUS_STATUS_LABELS).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* 4. Contrato */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            4. Contrato
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="contract_value">Valor do Contrato (R$) *</Label>
                                <CurrencyInput
                                    id="contract_value"
                                    value={formData.contract_value}
                                    onChange={(val) => handleFieldChange('contract_value', val)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="bank_info">Banco</Label>
                                <Input
                                    id="bank_info"
                                    value={formData.bank_info}
                                    onChange={(e) => handleFieldChange('bank_info', e.target.value)}
                                    placeholder="Ex: Caixa Econômica"
                                />
                            </div>
                            <div>
                                <Label htmlFor="table_info">Tabela</Label>
                                <Input
                                    id="table_info"
                                    value={formData.table_info}
                                    onChange={(e) => handleFieldChange('table_info', e.target.value)}
                                    placeholder="Ex: Tabela A"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. Forma de Pagamento */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            5. Forma de Pagamento
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="payment_method">Forma de Pagamento</Label>
                                <Select
                                    value={formData.payment_method || '__none__'}
                                    onValueChange={(v) => {
                                        handleFieldChange('payment_method', v === '__none__' ? '' : v);
                                        handleFieldChange('payment_info', '');
                                    }}
                                >
                                    <SelectTrigger id="payment_method">
                                        <SelectValue placeholder="Selecionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">— Não informar —</SelectItem>
                                        {Object.entries(DPLUS_PAYMENT_METHOD_LABELS).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {showPaymentInfo && (
                                <div>
                                    <Label htmlFor="payment_info">{paymentInfoLabel(formData.payment_method)}</Label>
                                    <Input
                                        id="payment_info"
                                        value={formData.payment_info}
                                        onChange={(e) => handleFieldChange('payment_info', e.target.value)}
                                        placeholder={paymentInfoPlaceholder(formData.payment_method)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 6. Documentos */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            6. Documentos
                        </h3>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileAdd}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="w-4 h-4 mr-2" />
                            Anexar arquivos
                        </Button>
                        {selectedFiles.length > 0 && (
                            <ul className="mt-3 space-y-1">
                                {selectedFiles.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                        <span className="flex-1 truncate">{f.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleFileRemove(i)}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* 7. Observações */}
                    <div>
                        <Label htmlFor="dplus_notes">Observações</Label>
                        <Textarea
                            id="dplus_notes"
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar Venda D+'}
                    </Button>
                </DialogFooter>

                {/* Inline Cliente creation modal */}
                <Dialog
                    open={isFavorecidoModalOpen}
                    onOpenChange={(openState) => {
                        setIsFavorecidoModalOpen(openState);
                        if (!openState) resetFavorecidoForm();
                    }}
                >
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Novo Cliente / Favorecido</DialogTitle>
                            <DialogDescription>
                                Cadastre um novo cliente para usar nesta venda.
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

                {/* Inline Vendedor (Funcionário) creation modal */}
                <Dialog
                    open={isVendedorModalOpen}
                    onOpenChange={(openState) => { setIsVendedorModalOpen(openState); if (!openState) resetVendedorForm(); }}
                >
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Novo Vendedor</DialogTitle>
                            <DialogDescription>
                                Cadastre um novo funcionário para usar como vendedor nesta venda.
                            </DialogDescription>
                        </DialogHeader>
                        <FavorecidoForm
                            formData={vendedorFormData}
                            setFormData={setVendedorFormData}
                            editingId={null}
                            photoPreview={vendedorPhotoPreview}
                            fileInputRef={vendedorFileInputRef}
                            cameraInputRef={vendedorCameraInputRef}
                            documentInputRef={vendedorDocumentInputRef}
                            favorecidoDocuments={[]}
                            documentsLoading={false}
                            favorecidoLogs={[]}
                            logsLoading={false}
                            isUploadingDocument={false}
                            isDeletingPhoto={false}
                            isSaving={createFavorecido.isPending}
                            onPhotoSelect={handleVendedorPhotoSelect}
                            onRemovePhoto={() => { setSelectedVendedorPhoto(null); setVendedorPhotoPreview(null); }}
                            onDocumentUpload={() => {}}
                            onDeleteDocument={() => {}}
                            onSubmit={handleSubmitVendedor}
                            onCancel={() => { setIsVendedorModalOpen(false); resetVendedorForm(); }}
                        />
                    </DialogContent>
                </Dialog>

                {/* Completion modal */}
                <Dialog open={!!completedSaleId} onOpenChange={() => handleCloseCompleted()}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Venda Registrada!
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-3 text-sm text-muted-foreground">
                            <p>
                                A venda D+ foi registrada com sucesso.
                            </p>
                            <p className="font-medium text-foreground">
                                Lançamento financeiro criado automaticamente.
                            </p>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-2">
                            <Button variant="outline" onClick={handlePrint} className="gap-2">
                                <Printer className="w-4 h-4" />
                                Imprimir Comprovante
                            </Button>
                            <Button onClick={handleCloseCompleted}>Fechar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
