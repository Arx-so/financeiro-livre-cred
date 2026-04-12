import { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
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
import type { SalesCreditCardInsert } from '@/types/database';
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
    notes: string;
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

    // --- Inline Favorecido creation ---
    const [isFavorecidoModalOpen, setIsFavorecidoModalOpen] = useState(false);
    const [favorecidoModalType, setFavorecidoModalType] = useState<'cliente' | 'funcionario'>('cliente');
    const [favorecidoTargetField, setFavorecidoTargetField] = useState<'client_id' | 'seller_id'>('client_id');
    const [favorecidoFormData, setFavorecidoFormData] = useState<any>(EMPTY_FAVORECIDO_FORM);
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const favorecidoFileInputRef = useRef<HTMLInputElement>(null);
    const favorecidoCameraInputRef = useRef<HTMLInputElement>(null);
    const favorecidoDocumentInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) setFormData(DEFAULT_FORM);
    }, [open]);

    const resetFavorecidoForm = () => {
        setFavorecidoFormData({ ...EMPTY_FAVORECIDO_FORM, type: favorecidoModalType });
        setSelectedPhoto(null);
        setPhotoPreview(null);
    };

    const openFavorecidoModal = (type: 'cliente' | 'funcionario', targetField: 'client_id' | 'seller_id') => {
        setFavorecidoModalType(type);
        setFavorecidoTargetField(targetField);
        setFavorecidoFormData({ ...EMPTY_FAVORECIDO_FORM, type });
        setIsFavorecidoModalOpen(true);
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
            setFormData((prev) => ({ ...prev, [favorecidoTargetField]: newFav.id }));
            toast.success('Favorecido criado!');
            setIsFavorecidoModalOpen(false);
            resetFavorecidoForm();
        } catch {
            toast.error('Erro ao criar favorecido');
        }
    };

    const handleFieldChange = (field: keyof FormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const feeRate = calcFeeRate(formData.sale_value, formData.terminal_amount);
    const fee = formData.terminal_amount - formData.sale_value;
    const requiresAccount = PAYMENT_METHODS_REQUIRING_ACCOUNT.includes(formData.payment_method);

    const handleSubmit = () => {
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
            notes: formData.notes || null,
            created_by: userId || null,
            status: 'pendente',
        };

        createMutation.mutate(insertData, {
            onSuccess: (created) => {
                toast.success('Venda registrada.');
                onSaved?.(created.id);
                onClose();
            },
            onError: () => toast.error('Erro ao registrar venda.'),
        });
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
                                onClick={() => openFavorecidoModal('cliente', 'client_id')}
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
                                        placeholder="Selecionar vendedor"
                                        filterType="funcionario"
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        onClick={() => openFavorecidoModal('funcionario', 'seller_id')}
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
                                    <Label htmlFor="payment_account">Conta</Label>
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
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Salvando...' : 'Salvar Venda'}
                    </Button>
                </DialogFooter>

                {/* Inline Favorecido creation modal */}
                <Dialog
                    open={isFavorecidoModalOpen}
                    onOpenChange={(openState) => {
                        setIsFavorecidoModalOpen(openState);
                        if (!openState) resetFavorecidoForm();
                    }}
                >
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {favorecidoModalType === 'funcionario' ? 'Novo Funcionário' : 'Novo Cliente / Favorecido'}
                            </DialogTitle>
                            <DialogDescription>
                                Cadastre um novo favorecido para usar nesta venda.
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
            </DialogContent>
        </Dialog>
    );
}
