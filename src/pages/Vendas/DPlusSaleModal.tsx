import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { FavorecidoSelect } from '@/components/shared/FavorecidoSelect';
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
import { useCreateFavorecido } from '@/hooks/useCadastros';
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

const DEFAULT_NEW_FAV = { name: '', type: 'cliente' as 'cliente' | 'funcionario', document: '' };

export function DPlusSaleModal({ open, onClose, onSaved }: DPlusSaleModalProps) {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id) ?? '';
    const userId = useAuthStore((state) => state.user?.id) ?? '';
    const createMutation = useCreateDPlusSale();
    const createFavorecido = useCreateFavorecido();
    const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);

    const [newClienteOpen, setNewClienteOpen] = useState(false);
    const [newVendedorOpen, setNewVendedorOpen] = useState(false);
    const [newFavData, setNewFavData] = useState(DEFAULT_NEW_FAV);
    const [isSavingFav, setIsSavingFav] = useState(false);

    useEffect(() => {
        if (!open) setFormData(DEFAULT_FORM);
    }, [open]);

    const handleSaveNewFav = async (targetField: 'client_id' | 'seller_id') => {
        if (!newFavData.name.trim()) { toast.error('Informe o nome do favorecido.'); return; }
        setIsSavingFav(true);
        try {
            const created = await createFavorecido.mutateAsync({
                branch_id: branchId || null,
                name: newFavData.name.trim(),
                type: newFavData.type,
                document: newFavData.document.trim() || null,
            });
            setFormData((prev) => ({ ...prev, [targetField]: created.id }));
            toast.success('Favorecido criado com sucesso.');
            setNewClienteOpen(false);
            setNewVendedorOpen(false);
            setNewFavData(DEFAULT_NEW_FAV);
        } catch {
            toast.error('Erro ao criar favorecido.');
        } finally {
            setIsSavingFav(false);
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
                            <div className="flex-1">
                                <FavorecidoSelect
                                    value={formData.client_id}
                                    onChange={(id) => handleFieldChange('client_id', id)}
                                    placeholder="Buscar cliente por nome, CPF, telefone..."
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                type="button"
                                onClick={() => {
                                    setNewFavData({ ...DEFAULT_NEW_FAV, type: 'cliente' });
                                    setNewClienteOpen(true);
                                }}
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
                            <div className="flex-1">
                                <FavorecidoSelect
                                    value={formData.seller_id}
                                    onChange={(id) => handleFieldChange('seller_id', id)}
                                    placeholder="Selecionar vendedor"
                                    filterType="funcionario"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                type="button"
                                onClick={() => {
                                    setNewFavData({ ...DEFAULT_NEW_FAV, type: 'funcionario' });
                                    setNewVendedorOpen(true);
                                }}
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

                {/* Inline: Novo Cliente */}
                <Dialog
                    open={newClienteOpen}
                    onOpenChange={(v) => { setNewClienteOpen(v); if (!v) setNewFavData(DEFAULT_NEW_FAV); }}
                >
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Novo Cliente</DialogTitle>
                            <DialogDescription>
                                Cadastre um novo cliente para usar nesta venda.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div>
                                <Label htmlFor="dp_cliente_name">Nome *</Label>
                                <Input
                                    id="dp_cliente_name"
                                    value={newFavData.name}
                                    onChange={(e) => setNewFavData((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="Nome completo"
                                />
                            </div>
                            <div>
                                <Label htmlFor="dp_cliente_doc">CPF / Documento</Label>
                                <Input
                                    id="dp_cliente_doc"
                                    value={newFavData.document}
                                    onChange={(e) => setNewFavData((p) => ({ ...p, document: e.target.value }))}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => { setNewClienteOpen(false); setNewFavData(DEFAULT_NEW_FAV); }}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={() => handleSaveNewFav('client_id')} disabled={isSavingFav}>
                                {isSavingFav ? 'Salvando...' : 'Criar Cliente'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Inline: Novo Vendedor */}
                <Dialog
                    open={newVendedorOpen}
                    onOpenChange={(v) => { setNewVendedorOpen(v); if (!v) setNewFavData(DEFAULT_NEW_FAV); }}
                >
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Novo Vendedor</DialogTitle>
                            <DialogDescription>Cadastre um novo funcionário/vendedor.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div>
                                <Label htmlFor="dp_vendedor_name">Nome *</Label>
                                <Input
                                    id="dp_vendedor_name"
                                    value={newFavData.name}
                                    onChange={(e) => setNewFavData((p) => ({ ...p, name: e.target.value }))}
                                    placeholder="Nome completo"
                                />
                            </div>
                            <div>
                                <Label htmlFor="dp_vendedor_doc">CPF / Documento</Label>
                                <Input
                                    id="dp_vendedor_doc"
                                    value={newFavData.document}
                                    onChange={(e) => setNewFavData((p) => ({ ...p, document: e.target.value }))}
                                    placeholder="000.000.000-00"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => { setNewVendedorOpen(false); setNewFavData(DEFAULT_NEW_FAV); }}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={() => handleSaveNewFav('seller_id')} disabled={isSavingFav}>
                                {isSavingFav ? 'Salvando...' : 'Criar Vendedor'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
