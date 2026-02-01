import {
    useState, useRef, useCallback, useMemo
} from 'react';
import { Link } from 'react-router-dom';
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    Upload,
    PenTool,
    Calendar,
    User,
    Loader2,
    Download,
    FileCode,
    CheckCircle,
    Send,
    Tag,
    Repeat,
    Printer,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuthStore, useBranchStore } from '@/stores';
import {
    getContracts,
    createContract,
    updateContract,
    deleteContract,
    uploadContractFile,
    signContract,
    getContractsSummary,
    ContractFilters,
    submitForApproval,
    approveContract,
    rejectContract,
} from '@/services/contratos';
import { useCategories } from '@/hooks/useCategorias';
import { useFavorecidos, useVendedores } from '@/hooks/useCadastros';
import { useProducts } from '@/hooks/useProducts';
import {
    PageHeader, EmptyState, LoadingState, StatCard, SearchInput
} from '@/components/shared';
import { getContractStatusBadge, ContractStatusType } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
    getTemplates,
    generateContractFromTemplate,
    exportContractToPDF,
} from '@/services/contractTemplates';
import type { ContractInsert, ContractRecurrenceType } from '@/types/database';

export default function Contratos() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterProductId, setFilterProductId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploadingContractId, setUploadingContractId] = useState<string | null>(null);

    // Confirmation dialog
    const { confirm, dialogProps } = useConfirmDialog();
    const [isDeleting, setIsDeleting] = useState(false);

    // Template modal state
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfContractId, setPdfContractId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        favorecido_id: '',
        type: '',
        value: '',
        start_date: '',
        end_date: '',
        notes: '',
        category_id: '',
        product_id: '',
        recurrence_type: 'unico' as ContractRecurrenceType,
        seller_id: '',
    });

    // Fetch data
    const filters: ContractFilters = useMemo(() => ({
        branchId: unidadeAtual?.id,
        search: searchTerm || undefined,
        productId: filterProductId || undefined,
    }), [unidadeAtual?.id, searchTerm, filterProductId]);

    const { data: contracts, isLoading } = useQuery({
        queryKey: ['contracts', filters],
        queryFn: () => getContracts(filters),
        enabled: !!unidadeAtual?.id,
    });

    const { data: summary } = useQuery({
        queryKey: ['contracts-summary', unidadeAtual?.id],
        queryFn: () => getContractsSummary(unidadeAtual!.id),
        enabled: !!unidadeAtual?.id,
    });

    const { data: favorecidos } = useFavorecidos({ isActive: true });
    const { data: categories } = useCategories();
    const { data: vendedores } = useVendedores();
    const { data: products } = useProducts({ isActive: true });

    // Find "Vendas" category
    const vendasCategory = useMemo(
        () => categories?.find((c) => c.name.toLowerCase() === 'vendas'),
        [categories]
    );

    // Check if user can approve contracts
    const canApprove = user?.role === 'admin' || user?.role === 'gerente';

    // Fetch templates for PDF generation
    const { data: templates } = useQuery({
        queryKey: ['contract-templates'],
        queryFn: () => getTemplates({ isActive: true }),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: createContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['contracts-summary'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Contrato criado!');
        },
        onError: () => toast.error('Erro ao criar contrato'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ContractInsert> }) => updateContract(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['contracts-summary'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Contrato atualizado!');
        },
        onError: (error: any) => {
            const message = error?.message || 'Erro ao atualizar contrato';
            toast.error(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['contracts-summary'] });
            toast.success('Contrato excluído!');
        },
        onError: (error: any) => {
            const message = error?.message || 'Erro ao excluir contrato';
            toast.error(message);
        },
    });

    const signMutation = useMutation({
        mutationFn: ({ contractId, signedBy }: { contractId: string; signedBy: string }) => (
            signContract(contractId, signedBy)
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Contrato assinado!');
        },
        onError: () => toast.error('Erro ao assinar contrato'),
    });

    const submitForApprovalMutation = useMutation({
        mutationFn: submitForApproval,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Contrato enviado para aprovação!');
        },
        onError: () => toast.error('Erro ao enviar para aprovação'),
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => approveContract(id, approvedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Contrato aprovado!');
        },
        onError: () => toast.error('Erro ao aprovar contrato'),
    });

    const rejectMutation = useMutation({
        mutationFn: rejectContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Contrato rejeitado!');
        },
        onError: () => toast.error('Erro ao rejeitar contrato'),
    });

    const uploadFileMutation = useMutation({
        mutationFn: ({ contractId, file }: { contractId: string; file: File }) => uploadContractFile(contractId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Arquivo anexado!');
        },
        onError: () => toast.error('Erro ao anexar arquivo'),
    });

    // Handlers
    const resetForm = useCallback(() => {
        setFormData({
            title: '',
            favorecido_id: '',
            type: '',
            value: '',
            start_date: '',
            end_date: '',
            notes: '',
            category_id: '',
            product_id: '',
            recurrence_type: 'unico',
            seller_id: '',
        });
        setEditingId(null);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!unidadeAtual?.id) {
            toast.error('Selecione uma filial');
            return;
        }

        const contractData: ContractInsert = {
            branch_id: unidadeAtual.id,
            title: formData.title,
            favorecido_id: formData.favorecido_id || null,
            type: formData.type || null,
            value: parseFloat(formData.value) || 0,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            notes: formData.notes || null,
            category_id: formData.category_id || null,
            product_id: formData.product_id || null,
            recurrence_type: formData.recurrence_type,
            seller_id: formData.seller_id || null,
            status: editingId ? undefined : 'criado',
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: contractData });
        } else {
            createMutation.mutate(contractData);
        }
    }, [formData, editingId, unidadeAtual?.id, createMutation, updateMutation]);

    const handleDelete = useCallback((id: string, title: string, status: string) => {
        if (status === 'aprovado') {
            toast.error('Não é possível excluir um contrato aprovado');
            return;
        }
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteMutation.mutateAsync(id);
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir contrato',
            description: `Tem certeza que deseja excluir "${title}"?`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteMutation]);

    const openEditModal = useCallback((contract: any) => {
        if (contract.status === 'aprovado') {
            toast.error('Não é possível editar um contrato aprovado');
            return;
        }
        setFormData({
            title: contract.title,
            favorecido_id: contract.favorecido_id || '',
            type: contract.type || '',
            value: contract.value?.toString() || '',
            start_date: contract.start_date,
            end_date: contract.end_date || '',
            notes: contract.notes || '',
            category_id: contract.category_id || '',
            product_id: contract.product_id || '',
            recurrence_type: contract.recurrence_type || 'unico',
            seller_id: contract.seller_id || '',
        });
        setEditingId(contract.id);
        setIsModalOpen(true);
    }, []);

    const handleSubmitForApproval = useCallback((contractId: string) => {
        submitForApprovalMutation.mutate(contractId);
    }, [submitForApprovalMutation]);

    const handleApprove = useCallback((contractId: string) => {
        if (!user?.id) {
            toast.error('Usuário não identificado');
            return;
        }
        approveMutation.mutate({ id: contractId, approvedBy: user.id });
    }, [user?.id, approveMutation]);

    const handleReject = useCallback((contractId: string) => {
        rejectMutation.mutate(contractId);
    }, [rejectMutation]);

    const handlePrint = useCallback((contract: any) => {
        // Open print dialog with contract info
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Contrato - ${contract.title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        h1 { color: #333; }
                        .info { margin: 10px 0; }
                        .label { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h1>${contract.title}</h1>
                    <div class="info"><span class="label">Cliente:</span> ${contract.favorecido?.name || 'N/A'}</div>
                    <div class="info"><span class="label">Valor:</span> ${formatCurrency(contract.value)}</div>
                    <div class="info"><span class="label">Data Início:</span> ${formatDate(contract.start_date)}</div>
                    ${contract.end_date ? `<div class="info"><span class="label">Data Fim:</span> ${formatDate(contract.end_date)}</div>` : ''}
                    <div class="info"><span class="label">Status:</span> ${contract.status}</div>
                    ${contract.category?.name ? `<div class="info"><span class="label">Categoria:</span> ${contract.category.name}</div>` : ''}
                    ${contract.product?.name ? `<div class="info"><span class="label">Produto:</span> ${contract.product.name}${contract.product.code ? ` (${contract.product.code})` : ''}</div>` : ''}
                    ${contract.seller?.name ? `<div class="info"><span class="label">Vendedor:</span> ${contract.seller.name}</div>` : ''}
                    ${contract.notes ? `<div class="info"><span class="label">Observações:</span> ${contract.notes}</div>` : ''}
                    ${contract.approved_by ? `<div class="info"><span class="label">Aprovado por:</span> ${contract.approver?.name || 'N/A'} em ${formatDate(contract.approved_at)}</div>` : ''}
                    ${contract.signed_by ? `<div class="info"><span class="label">Assinado por:</span> ${contract.signed_by} em ${formatDate(contract.signed_at)}</div>` : ''}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }, []);

    const handleSign = useCallback((contractId: string) => {
        if (!user?.name) {
            toast.error('Usuário não identificado');
            return;
        }
        signMutation.mutate({ contractId, signedBy: user.name });
    }, [user?.name, signMutation]);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, contractId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingContractId(contractId);
        try {
            await uploadFileMutation.mutateAsync({ contractId, file });
        } finally {
            setUploadingContractId(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [uploadFileMutation]);

    const isSaving = createMutation.isPending || updateMutation.isPending;

    // Handler para exportar PDF de um contrato
    const handleExportPdf = useCallback(async (contract: any) => {
        if (!templates || templates.length === 0) {
            toast.error('Nenhum template disponível. Crie um template primeiro.');
            return;
        }

        setPdfContractId(contract.id);
        setSelectedTemplateId(templates[0]?.id || '');
        setIsTemplateModalOpen(true);
    }, [templates]);

    // Handler para gerar o PDF
    const handleGeneratePdf = useCallback(async () => {
        if (!selectedTemplateId || !pdfContractId) {
            toast.error('Selecione um template');
            return;
        }

        const contract = contracts?.find((c) => c.id === pdfContractId);
        if (!contract) {
            toast.error('Contrato não encontrado');
            return;
        }

        setIsGeneratingPdf(true);
        try {
            const content = await generateContractFromTemplate(
                selectedTemplateId,
                contract.favorecido_id,
                { value: contract.value, date: contract.start_date }
            );
            exportContractToPDF(content, contract.title);
            toast.success('PDF gerado com sucesso!');
            setIsTemplateModalOpen(false);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Erro ao gerar PDF');
        } finally {
            setIsGeneratingPdf(false);
        }
    }, [selectedTemplateId, pdfContractId, contracts]);

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Vendas" description="Gerencie contratos e vendas">
                    <Link to="/vendas/templates" className="btn-secondary">
                        <FileCode className="w-4 h-4" />
                        Templates
                    </Link>
                    <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <button className="btn-primary">
                                <Plus className="w-4 h-4" />
                                Novo Contrato
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
                                <DialogDescription>
                                    Preencha os dados do contrato
                                </DialogDescription>
                            </DialogHeader>
                            <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Título</label>
                                    <input
                                        type="text"
                                        className="input-financial"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Cliente</label>
                                        <select
                                            className="input-financial"
                                            value={formData.favorecido_id}
                                            onChange={(e) => setFormData({ ...formData, favorecido_id: e.target.value })}
                                        >
                                            <option value="">Selecione</option>
                                            {favorecidos?.map((f) => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Valor</label>
                                        <CurrencyInput
                                            value={formData.value}
                                            onChange={(numValue) => setFormData({ ...formData, value: String(numValue) })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Data Início</label>
                                        <input
                                            type="date"
                                            className="input-financial"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Data Fim</label>
                                        <input
                                            type="date"
                                            className="input-financial"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Produto (cadastro)</label>
                                        <select
                                            className="input-financial"
                                            value={formData.product_id}
                                            onChange={(e) => {
                                                const productId = e.target.value;
                                                const product = products?.find((p) => p.id === productId);
                                                setFormData({
                                                    ...formData,
                                                    product_id: productId,
                                                    type: product?.name || formData.type,
                                                });
                                            }}
                                        >
                                            <option value="">Selecione um produto</option>
                                            {products?.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                    {p.code ? ` (${p.code})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Tipo / descrição</label>
                                        <input
                                            type="text"
                                            className="input-financial"
                                            placeholder="Ex: Empréstimo Consignado"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Recorrência</label>
                                        <select
                                            className="input-financial"
                                            value={formData.recurrence_type}
                                            onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as ContractRecurrenceType })}
                                        >
                                            <option value="unico">Único</option>
                                            <option value="mensal">Mensal</option>
                                            <option value="anual">Anual</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                                        <select
                                            className="input-financial"
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                            disabled={!!formData.seller_id}
                                            title={formData.seller_id ? 'Categoria definida automaticamente como "Vendas" para contratos com vendedor' : ''}
                                        >
                                            <option value="">Selecione</option>
                                            {categories?.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        {formData.seller_id && vendasCategory && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Categoria definida automaticamente: Vendas
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Vendedor</label>
                                        <select
                                            className="input-financial"
                                            value={formData.seller_id}
                                            onChange={(e) => {
                                                const sellerId = e.target.value;
                                                setFormData({
                                                    ...formData,
                                                    seller_id: sellerId,
                                                    // Auto-set category to "Vendas" when seller is selected
                                                    // Clear category if seller is removed and it was "Vendas"
                                                    category_id: sellerId && vendasCategory
                                                        ? vendasCategory.id
                                                        : (formData.category_id === vendasCategory?.id ? '' : formData.category_id)
                                                });
                                            }}
                                        >
                                            <option value="">Selecione</option>
                                            {vendedores?.map((v) => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                                    <textarea
                                        className="input-financial min-h-[80px]"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" className="btn-secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={isSaving}>
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingId ? 'Atualizar' : 'Criar'}
                                        {' '}
                                        Contrato
                                    </button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </PageHeader>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard label="Total Contratos" value={summary.total || 0} icon={FileText} />
                        <StatCard label="Ativos" value={summary.active || 0} icon={FileText} variant="income" />
                        <StatCard label="Pendentes" value={summary.pending || 0} icon={FileText} variant="pending" />
                        <StatCard label="Valor Total" value={formatCurrency(summary.totalValue || 0)} icon={FileText} variant="primary" />
                    </div>
                )}

                {/* Search and filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar contratos..."
                        className="max-w-md"
                    />
                    <select
                        className="input-financial w-auto min-w-[200px]"
                        value={filterProductId}
                        onChange={(e) => setFilterProductId(e.target.value)}
                    >
                        <option value="">Todos os produtos</option>
                        {products?.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                                {p.code ? ` (${p.code})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Contracts List */}
                {isLoading ? (
                    <LoadingState />
                ) : !contracts?.length ? (
                    <EmptyState icon={FileText} message="Nenhum contrato encontrado" />
                ) : (
                    <div className="grid gap-4">
                        {contracts.map((contract) => (
                            <div key={contract.id} className="card-financial p-5 group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-primary/10">
                                            <FileText className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{contract.title}</h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                {contract.favorecido && (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <User className="w-3.5 h-3.5" />
                                                        {contract.favorecido.name}
                                                    </span>
                                                )}
                                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(contract.start_date)}
                                                    {contract.end_date && ` - ${formatDate(contract.end_date)}`}
                                                </span>
                                                {contract.category && (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Tag className="w-3.5 h-3.5" />
                                                        {contract.category.name}
                                                    </span>
                                                )}
                                                {contract.product && (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Tag className="w-3.5 h-3.5" />
                                                        {contract.product.name}
                                                        {contract.product.code ? ` (${contract.product.code})` : ''}
                                                    </span>
                                                )}
                                                {contract.recurrence_type && contract.recurrence_type !== 'unico' && (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Repeat className="w-3.5 h-3.5" />
                                                        {contract.recurrence_type === 'mensal' ? 'Mensal' : 'Anual'}
                                                    </span>
                                                )}
                                                {contract.seller && (
                                                    <span className="text-sm text-primary flex items-center gap-1">
                                                        <User className="w-3.5 h-3.5" />
                                                        Vendedor:
                                                        {' '}
                                                        {contract.seller.name}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Approval info */}
                                            {contract.approved_at && (
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    Aprovado por
                                                    {' '}
                                                    {contract.approver?.name}
                                                    {' '}
                                                    em
                                                    {' '}
                                                    {formatDate(contract.approved_at)}
                                                </div>
                                            )}
                                            {contract.signed_at && (
                                                <div className="text-xs text-muted-foreground">
                                                    Assinado por
                                                    {' '}
                                                    {contract.signed_by}
                                                    {' '}
                                                    em
                                                    {' '}
                                                    {formatDate(contract.signed_at)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getContractStatusBadge(contract.status as ContractStatusType)}
                                        <span className="font-semibold font-mono text-foreground">
                                            {formatCurrency(contract.value)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                                    {contract.status !== 'aprovado' && (
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => openEditModal(contract)}
                                        >
                                            <Edit className="w-4 h-4" />
                                            Editar
                                        </button>
                                    )}

                                    {/* Workflow buttons based on status */}
                                    {contract.status === 'criado' && (
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => handleSubmitForApproval(contract.id)}
                                            disabled={submitForApprovalMutation.isPending}
                                        >
                                            <Send className="w-4 h-4" />
                                            Enviar p/ Aprovação
                                        </button>
                                    )}

                                    {contract.status === 'em_aprovacao' && canApprove && (
                                        <>
                                            <button
                                                className="btn-primary py-2"
                                                onClick={() => handleApprove(contract.id)}
                                                disabled={approveMutation.isPending}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Aprovar
                                            </button>
                                            <button
                                                className="btn-secondary py-2 text-destructive"
                                                onClick={() => handleReject(contract.id)}
                                                disabled={rejectMutation.isPending}
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Rejeitar
                                            </button>
                                        </>
                                    )}

                                    {(contract.status === 'aprovado' || contract.status === 'pendente') && (
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => handleSign(contract.id)}
                                            disabled={signMutation.isPending}
                                        >
                                            <PenTool className="w-4 h-4" />
                                            Assinar
                                        </button>
                                    )}

                                    <label className="btn-secondary py-2 cursor-pointer">
                                        {uploadingContractId === contract.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4" />
                                        )}
                                        Anexar
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, contract.id)}
                                            disabled={uploadingContractId === contract.id}
                                        />
                                    </label>
                                    <button
                                        className="btn-secondary py-2"
                                        onClick={() => handleExportPdf(contract)}
                                        title="Exportar PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                        PDF
                                    </button>
                                    <button
                                        className="btn-secondary py-2"
                                        onClick={() => handlePrint(contract)}
                                        title="Imprimir"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    {contract.status !== 'aprovado' && (
                                        <button
                                            className="btn-secondary py-2 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(contract.id, contract.title, contract.status)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Template Selection Modal for PDF */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Exportar Contrato em PDF</DialogTitle>
                        <DialogDescription>
                            Selecione um template para gerar o PDF do contrato
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Template
                            </label>
                            <select
                                className="input-financial"
                                value={selectedTemplateId}
                                onChange={(e) => setSelectedTemplateId(e.target.value)}
                            >
                                <option value="">Selecione um template</option>
                                {templates?.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setIsTemplateModalOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleGeneratePdf}
                                disabled={!selectedTemplateId || isGeneratingPdf}
                            >
                                {isGeneratingPdf && <Loader2 className="w-4 h-4 animate-spin" />}
                                Gerar PDF
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
