import { useState, useEffect, useRef } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FavorecidoSelect } from '@/components/shared/FavorecidoSelect';
import { VendedorSelect } from '@/components/shared/VendedorSelect';
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
import { useCreateFavorecido, useUploadFavorecidoPhoto, useVendedores } from '@/hooks/useCadastros';
import { useCreateUser } from '@/hooks/useUsers';
import { useBranchStore, useAuthStore } from '@/stores';
import type { SalesDPlusProductInsert } from '@/types/database';
import { DPLUS_SALE_STATUSES } from '@/constants/sales';

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

export function DPlusSaleModal({ open, onClose, onSaved }: DPlusSaleModalProps) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';
    const userId = useAuthStore((state) => state.user?.id) ?? '';
    const createMutation = useCreateDPlusSale();
    const createFavorecido = useCreateFavorecido();
    const uploadPhoto = useUploadFavorecidoPhoto();
    const { refetch: refetchVendedores } = useVendedores();
    const createUserMutation = useCreateUser();
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

    // --- Inline Cliente (Favorecido) creation ---
    const [isFavorecidoModalOpen, setIsFavorecidoModalOpen] = useState(false);
    const [favorecidoFormData, setFavorecidoFormData] = useState<any>(EMPTY_FAVORECIDO_FORM);
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const favorecidoFileInputRef = useRef<HTMLInputElement>(null);
    const favorecidoCameraInputRef = useRef<HTMLInputElement>(null);
    const favorecidoDocumentInputRef = useRef<HTMLInputElement>(null);

    // --- Inline Vendedor creation ---
    const [isVendedorModalOpen, setIsVendedorModalOpen] = useState(false);
    const [vendedorFormData, setVendedorFormData] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        if (!open) setFormData(DEFAULT_FORM);
    }, [open]);

    const resetFavorecidoForm = () => {
        setFavorecidoFormData({ ...EMPTY_FAVORECIDO_FORM, type: 'cliente' });
        setSelectedPhoto(null);
        setPhotoPreview(null);
    };

    const resetVendedorForm = () => {
        setVendedorFormData({ name: '', email: '', password: '' });
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
        if (!vendedorFormData.name.trim() || !vendedorFormData.email.trim() || !vendedorFormData.password.trim()) {
            toast.error('Preencha nome, email e senha');
            return;
        }
        if (vendedorFormData.password.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres');
            return;
        }
        try {
            const result = await createUserMutation.mutateAsync({
                email: vendedorFormData.email.trim(),
                password: vendedorFormData.password,
                name: vendedorFormData.name.trim(),
                role: 'vendas',
                branchIds: unidadeAtual?.id ? [unidadeAtual.id] : [],
            });
            if (!result.success) {
                toast.error(result.error || 'Erro ao criar vendedor');
                return;
            }
            await refetchVendedores();
            if (result.userId) {
                setFormData((prev) => ({ ...prev, seller_id: result.userId! }));
            }
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

    const handleSubmit = () => {
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
            notes: formData.notes.trim() || null,
            created_by: userId || null,
        };

        createMutation.mutate(insertData, {
            onSuccess: (created) => {
                toast.success('Venda D+ registrada.');
                onSaved?.(created.id);
                onClose();
            },
            onError: () => toast.error('Erro ao registrar venda D+.'),
        });
    };

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
                            <VendedorSelect
                                value={formData.seller_id}
                                onChange={(id) => handleFieldChange('seller_id', id)}
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

                    {/* 5. Observações */}
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
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Salvando...' : 'Salvar Venda D+'}
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

                {/* Inline Vendedor creation modal */}
                <Dialog
                    open={isVendedorModalOpen}
                    onOpenChange={(openState) => { setIsVendedorModalOpen(openState); if (!openState) resetVendedorForm(); }}
                >
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Novo Vendedor</DialogTitle>
                            <DialogDescription>
                                Crie um novo usuário com perfil de vendedor.
                            </DialogDescription>
                        </DialogHeader>
                        <form className="space-y-4 mt-4" onSubmit={handleSubmitVendedor}>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                                <input
                                    type="text"
                                    className="input-financial"
                                    value={vendedorFormData.name}
                                    onChange={(e) => setVendedorFormData({ ...vendedorFormData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                                <input
                                    type="email"
                                    className="input-financial"
                                    value={vendedorFormData.email}
                                    onChange={(e) => setVendedorFormData({ ...vendedorFormData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
                                <input
                                    type="password"
                                    className="input-financial"
                                    value={vendedorFormData.password}
                                    onChange={(e) => setVendedorFormData({ ...vendedorFormData, password: e.target.value })}
                                    minLength={6}
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => { setIsVendedorModalOpen(false); resetVendedorForm(); }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={createUserMutation.isPending}
                                >
                                    {createUserMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Criar Vendedor
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
