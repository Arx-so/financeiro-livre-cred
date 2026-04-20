import { useState, useEffect, useRef } from 'react';
import { Plus, CheckCircle, Printer } from 'lucide-react';
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
import { useCreateCreditCardSale } from '@/hooks/useSalesCreditCard';
import { useCreateFavorecido, useUploadFavorecidoPhoto } from '@/hooks/useCadastros';
import { useBranchStore, useAuthStore } from '@/stores';
import type { SalesCreditCardInsert, SalesCreditCard } from '@/types/database';
import { getCreditCardSaleById, generateFinancialEntriesFromCreditCardSale } from '@/services/salesCreditCard';
import {
    TERMINALS, TERMINAL_LABELS,
    CARD_BRANDS, CARD_BRAND_LABELS,
    PAYMENT_METHODS, PAYMENT_METHOD_LABELS,
    TRANSFER_SOURCES, TRANSFER_SOURCE_LABELS,
    SALE_TYPES, SALE_TYPE_LABELS,
    PAYMENT_METHODS_REQUIRING_ACCOUNT,
} from '@/constants/sales';

interface CreditCardSaleModalProps {
    open: boolean;
    onClose: () => void;
    onSaved?: (saleId: string) => void;
}

interface FormData {
    client_id: string;
    seller_id: string;
    sale_value: number;
    terminal_amount: number;
    terminal: string;
    card_brand: string;
    card_last_four: string;
    card_holder_name: string;
    sale_type: string;
    payment_method: string;
    payment_account: string;
    installments: number;
    sale_date: string;
    discount_amount: number;
    saturday_refund: number;
    lacre: string;
    notes: string;
}

function todayISO(): string {
    return new Date().toISOString().split('T')[0];
}

const DEFAULT_FORM: FormData = {
    client_id: '',
    seller_id: '',
    sale_value: 0,
    terminal_amount: 0,
    terminal: TERMINALS.SUMUP_W,
    card_brand: CARD_BRANDS.VISA,
    card_last_four: '',
    card_holder_name: '',
    sale_type: SALE_TYPES.VENDA_NOVA,
    payment_method: PAYMENT_METHODS.PIX,
    payment_account: TRANSFER_SOURCES.TF_RENTA,
    installments: 1,
    sale_date: todayISO(),
    discount_amount: 0,
    saturday_refund: 0,
    lacre: '',
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

function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcFeeRate(saleValue: number, terminalAmount: number): number {
    if (saleValue <= 0) return 0;
    return ((terminalAmount - saleValue) / saleValue) * 100;
}

export function CreditCardSaleModal({ open, onClose, onSaved }: CreditCardSaleModalProps) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';
    const userId = useAuthStore((state) => state.user?.id) ?? '';
    const createMutation = useCreateCreditCardSale();
    const createFavorecido = useCreateFavorecido();
    const uploadPhoto = useUploadFavorecidoPhoto();
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

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
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!open) {
            setFormData({ ...DEFAULT_FORM, sale_date: todayISO() });
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

    const handleFieldChange = (field: keyof FormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const feeRate = calcFeeRate(formData.sale_value, formData.terminal_amount);
    const fee = formData.terminal_amount - formData.sale_value;
    const requiresAccount = PAYMENT_METHODS_REQUIRING_ACCOUNT.includes(formData.payment_method);

    const handleSubmit = async () => {
        if (!formData.client_id) { toast.error('Selecione o cliente.'); return; }
        if (!formData.seller_id) { toast.error('Selecione o vendedor.'); return; }
        if (formData.sale_value <= 0) { toast.error('Informe o valor da venda.'); return; }
        if (formData.terminal_amount <= 0) { toast.error('Informe o valor da maquineta.'); return; }
        if (!formData.card_last_four || formData.card_last_four.length !== 4) {
            toast.error('Informe os 4 últimos dígitos do cartão.');
            return;
        }

        const insertData: SalesCreditCardInsert = {
            branch_id: branchId,
            client_id: formData.client_id,
            seller_id: formData.seller_id,
            sale_value: formData.sale_value,
            terminal_amount: formData.terminal_amount,
            fee_rate: feeRate / 100,
            terminal: formData.terminal as SalesCreditCardInsert['terminal'],
            card_brand: formData.card_brand as SalesCreditCardInsert['card_brand'],
            card_last_four: formData.card_last_four,
            card_holder_name: formData.card_holder_name || null,
            sale_type: formData.sale_type as SalesCreditCardInsert['sale_type'],
            payment_method: formData.payment_method as SalesCreditCardInsert['payment_method'],
            payment_account: requiresAccount ? formData.payment_account || null : null,
            installments: formData.installments || 1,
            sale_date: formData.sale_date || todayISO(),
            discount_amount: formData.discount_amount || 0,
            saturday_refund: formData.saturday_refund || 0,
            lacre: formData.lacre || null,
            notes: formData.notes || null,
            created_by: userId || null,
            status: 'pendente',
        };

        setIsGenerating(true);
        try {
            await new Promise<void>((resolve, reject) => {
                createMutation.mutate(insertData, {
                    onSuccess: async (created: SalesCreditCard) => {
                        try {
                            const saleWithRelations = await getCreditCardSaleById(created.id);
                            if (saleWithRelations) {
                                await generateFinancialEntriesFromCreditCardSale(saleWithRelations);
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
            toast.error('Erro ao registrar venda.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrint = () => window.print();

    const handleCloseCompleted = () => {
        setCompletedSaleId(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Venda — Cartão de Crédito</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 1. Cliente */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            1. Cliente
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

                    {/* 2. Valores */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            2. Valores
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="sale_date">Data da Venda *</Label>
                                <Input
                                    id="sale_date"
                                    type="date"
                                    value={formData.sale_date}
                                    onChange={(e) => handleFieldChange('sale_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="sale_value">Valor da Venda (R$) *</Label>
                                <CurrencyInput
                                    id="sale_value"
                                    value={formData.sale_value}
                                    onChange={(val) => handleFieldChange('sale_value', val)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="terminal_amount">Valor da Maquineta (R$) *</Label>
                                <CurrencyInput
                                    id="terminal_amount"
                                    value={formData.terminal_amount}
                                    onChange={(val) => handleFieldChange('terminal_amount', val)}
                                />
                            </div>
                            <div>
                                <Label>Taxa / Taxa Aplicada</Label>
                                <div className="input-financial flex items-center justify-between bg-muted/50 cursor-default">
                                    <span className="font-mono-numbers">
                                        {feeRate.toFixed(1)}
                                        %
                                    </span>
                                    <span className="text-muted-foreground text-sm">
                                        {fee > 0 ? `+${formatCurrency(fee)}` : '—'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="installments">Parcelas</Label>
                                <Input
                                    id="installments"
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={formData.installments}
                                    onChange={(e) => handleFieldChange('installments', parseInt(e.target.value, 10) || null)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Terminal e Cartão */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            3. Terminal e Cartão
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="terminal">Maquineta *</Label>
                                <Select
                                    value={formData.terminal}
                                    onValueChange={(v) => handleFieldChange('terminal', v)}
                                >
                                    <SelectTrigger id="terminal">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(TERMINAL_LABELS).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="card_brand">Bandeira *</Label>
                                <Select
                                    value={formData.card_brand}
                                    onValueChange={(v) => handleFieldChange('card_brand', v)}
                                >
                                    <SelectTrigger id="card_brand">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(CARD_BRAND_LABELS).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="card_last_four">Final do Cartão (4 dígitos) *</Label>
                                <Input
                                    id="card_last_four"
                                    maxLength={4}
                                    value={formData.card_last_four}
                                    onChange={(e) => handleFieldChange('card_last_four', e.target.value.replace(/\D/g, ''))}
                                    placeholder="1234"
                                    className="font-mono-numbers"
                                />
                            </div>
                            <div>
                                <Label htmlFor="card_holder_name">Titular do Cartão</Label>
                                <Input
                                    id="card_holder_name"
                                    value={formData.card_holder_name}
                                    onChange={(e) => handleFieldChange('card_holder_name', e.target.value)}
                                    placeholder="Nome como no cartão"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. Vendedor */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            4. Vendedor
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label>Vendedor *</Label>
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
                            <div>
                                <Label htmlFor="sale_type">Tipo de Venda</Label>
                                <Select
                                    value={formData.sale_type}
                                    onValueChange={(v) => handleFieldChange('sale_type', v)}
                                >
                                    <SelectTrigger id="sale_type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SALE_TYPE_LABELS).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* 5. Pagamento */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                            5. Pagamento
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="payment_method">Forma de Pagamento *</Label>
                                <Select
                                    value={formData.payment_method}
                                    onValueChange={(v) => handleFieldChange('payment_method', v)}
                                >
                                    <SelectTrigger id="payment_method">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                                            <SelectItem key={val} value={val}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {requiresAccount && (
                                <div>
                                    <Label htmlFor="payment_account">Realizador</Label>
                                    <Select
                                        value={formData.payment_account}
                                        onValueChange={(v) => handleFieldChange('payment_account', v)}
                                    >
                                        <SelectTrigger id="payment_account">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TRANSFER_SOURCE_LABELS).map(([val, label]) => (
                                                <SelectItem key={val} value={val}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 6. Observações */}
                    <div>
                        <Label htmlFor="cc_notes">Observações</Label>
                        <Textarea
                            id="cc_notes"
                            rows={2}
                            value={formData.notes}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={createMutation.isPending || isGenerating}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending || isGenerating}>
                        {(createMutation.isPending || isGenerating) ? 'Salvando...' : 'Salvar Venda'}
                    </Button>
                </DialogFooter>

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
                            <p>A venda de cartão de crédito foi registrada com sucesso.</p>
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
            </DialogContent>
        </Dialog>
    );
}
