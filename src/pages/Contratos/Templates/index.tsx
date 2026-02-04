import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    Eye,
    Copy,
    Loader2,
    ArrowLeft,
    Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    PageHeader,
    EmptyState,
    LoadingState,
    SearchInput,
} from '@/components/shared';
import {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    replaceTemplateVariables,
    TEMPLATE_VARIABLES,
} from '@/services/contractTemplates';
import type { ContractTemplateInsert, ContractTemplateUpdate } from '@/types/database';

interface FormData {
    name: string;
    description: string;
    content: string;
    is_active: boolean;
}

const initialFormData: FormData = {
    name: '',
    description: '',
    content: '',
    is_active: true,
};

export default function ContractTemplates() {
    const queryClient = useQueryClient();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [previewContent, setPreviewContent] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    // Dialog
    const { confirm, dialogProps } = useConfirmDialog();

    // Queries
    const { data: templates, isLoading } = useQuery({
        queryKey: ['contract-templates', searchTerm],
        queryFn: () => getTemplates({ search: searchTerm || undefined }),
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: ContractTemplateInsert) => createTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
            closeModal();
            toast.success('Template criado com sucesso!');
        },
        onError: () => toast.error('Erro ao criar template'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ContractTemplateUpdate }) => updateTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
            closeModal();
            toast.success('Template atualizado com sucesso!');
        },
        onError: () => toast.error('Erro ao atualizar template'),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
            toast.success('Template excluído com sucesso!');
        },
        onError: () => toast.error('Erro ao excluir template'),
    });

    // Handlers
    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setEditingId(null);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        resetForm();
    }, [resetForm]);

    const openEditModal = useCallback((template: any) => {
        setFormData({
            name: template.name,
            description: template.description || '',
            content: template.content,
            is_active: template.is_active,
        });
        setEditingId(template.id);
        setIsModalOpen(true);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }

        if (!formData.content.trim()) {
            toast.error('Conteúdo é obrigatório');
            return;
        }

        const templateData = {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            content: formData.content,
            is_active: formData.is_active,
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: templateData });
        } else {
            createMutation.mutate(templateData as ContractTemplateInsert);
        }
    }, [formData, editingId, createMutation, updateMutation]);

    const handleDelete = useCallback((id: string, name: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteMutation.mutateAsync(id);
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir template',
            description: `Tem certeza que deseja excluir "${name}"?`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteMutation]);

    const handlePreview = useCallback((template: any) => {
        // Preview com dados de exemplo
        const previewData = replaceTemplateVariables(
            template.content,
            {
                id: 'preview',
                type: 'cliente',
                name: 'João da Silva',
                document: '123.456.789-00',
                email: 'joao@email.com',
                phone: '(11) 99999-9999',
                address: 'Rua das Flores, 123',
                city: 'São Paulo',
                state: 'SP',
                zip_code: '01234-567',
                category: null,
                photo_url: null,
                notes: null,
                is_active: true,
                bank_name: null,
                bank_agency: null,
                bank_account: null,
                bank_account_type: null,
                pix_key: null,
                pix_key_type: null,
                preferred_payment_type: null,
                birth_date: null,
                created_at: '',
                updated_at: '',
            },
            { value: 1500.50, date: new Date().toISOString() }
        );
        setPreviewContent(previewData);
        setIsPreviewOpen(true);
    }, []);

    const insertVariable = useCallback((variable: string) => {
        setFormData((prev) => ({
            ...prev,
            content: prev.content + variable,
        }));
    }, []);

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="Templates de Contrato"
                    description="Gerencie modelos para geração automática de contratos"
                >
                    <Link to="/vendas" className="btn-secondary">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para Vendas
                    </Link>
                    <Dialog
                        open={isModalOpen}
                        onOpenChange={(open) => {
                            setIsModalOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <button className="btn-primary">
                                <Plus className="w-4 h-4" />
                                Novo Template
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingId ? 'Editar Template' : 'Novo Template'}
                                </DialogTitle>
                                <DialogDescription>
                                    Crie um modelo de contrato com variáveis dinâmicas
                                </DialogDescription>
                            </DialogHeader>

                            <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Nome do Template *
                                        </label>
                                        <input
                                            type="text"
                                            className="input-financial"
                                            placeholder="Ex: Contrato de Venda Padrão"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Descrição
                                        </label>
                                        <input
                                            type="text"
                                            className="input-financial"
                                            placeholder="Descrição breve do template"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Variables Helper */}
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Info className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium text-foreground">
                                            Variáveis Disponíveis
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {TEMPLATE_VARIABLES.map((variable) => (
                                            <button
                                                key={variable.key}
                                                type="button"
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background border border-border rounded-md hover:bg-primary/10 hover:border-primary transition-colors"
                                                onClick={() => insertVariable(variable.key)}
                                                title={variable.description}
                                            >
                                                <Copy className="w-3 h-3" />
                                                {variable.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Conteúdo do Template *
                                    </label>
                                    <textarea
                                        className="input-financial min-h-[300px] font-mono text-sm"
                                        placeholder="Digite o conteúdo do contrato usando as variáveis acima..."
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded border-input"
                                    />
                                    <label htmlFor="is_active" className="text-sm font-medium text-foreground">
                                        Template ativo
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" className="btn-secondary" onClick={closeModal}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={isSaving}>
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingId ? 'Atualizar' : 'Criar'}
                                        {' '}
                                        Template
                                    </button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </PageHeader>

                {/* Search */}
                <div className="flex gap-4">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar templates..."
                        className="max-w-md"
                    />
                </div>

                {/* Templates List */}
                {isLoading ? (
                    <LoadingState />
                ) : !templates?.length ? (
                    <EmptyState
                        icon={FileText}
                        message="Nenhum template encontrado"
                    />
                ) : (
                    <div className="grid gap-4">
                        {templates.map((template) => (
                            <div key={template.id} className="card-financial p-5 group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-primary/10">
                                            <FileText className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground">
                                                    {template.name}
                                                </h3>
                                                {!template.is_active && (
                                                    <span className="badge-neutral text-xs">Inativo</span>
                                                )}
                                            </div>
                                            {template.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {template.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {template.content.length}
                                                {' '}
                                                caracteres
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => handlePreview(template)}
                                        >
                                            <Eye className="w-4 h-4" />
                                            Preview
                                        </button>
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => openEditModal(template)}
                                        >
                                            <Edit className="w-4 h-4" />
                                            Editar
                                        </button>
                                        <button
                                            className="btn-secondary py-2 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(template.id, template.name)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Preview do Template</DialogTitle>
                        <DialogDescription>
                            Visualização com dados de exemplo
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-6 bg-white dark:bg-gray-900 rounded-lg border border-border">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
                            {previewContent}
                        </pre>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
