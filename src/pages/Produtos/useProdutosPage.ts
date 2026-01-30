import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    useProducts,
    useProductsSummary,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
} from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategorias';
import type { ProductInsert, ProductUpdate } from '@/types/database';

interface FormData {
    name: string;
    description: string;
    category_id: string;
    bank_value: string;
    bank_percentage: string;
    company_value: string;
    company_percentage: string;
    is_active: boolean;
}

const initialFormData: FormData = {
    name: '',
    description: '',
    category_id: '',
    bank_value: '0',
    bank_percentage: '0',
    company_value: '0',
    company_percentage: '0',
    is_active: true,
};

export function useProdutosPage() {
    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState<'todos' | 'ativos' | 'inativos'>('todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isDeleting, setIsDeleting] = useState(false);

    // Dialog
    const { confirm, dialogProps } = useConfirmDialog();

    // Filters
    const filters = useMemo(() => ({
        search: searchTerm || undefined,
        isActive: filterActive === 'todos' ? undefined : filterActive === 'ativos',
    }), [searchTerm, filterActive]);

    // Queries
    const { data: products, isLoading: productsLoading } = useProducts(filters);
    const { data: summary } = useProductsSummary();
    const { data: categories } = useCategories();

    // Mutations
    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();
    const deleteMutation = useDeleteProduct();

    // Handlers
    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setEditingId(null);
    }, []);

    const openModal = useCallback(() => {
        resetForm();
        setIsModalOpen(true);
    }, [resetForm]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        resetForm();
    }, [resetForm]);

    const openEditModal = useCallback((product: any) => {
        setFormData({
            name: product.name,
            description: product.description || '',
            category_id: product.category_id || '',
            bank_value: product.bank_value?.toString() || '0',
            bank_percentage: product.bank_percentage?.toString() || '0',
            company_value: product.company_value?.toString() || '0',
            company_percentage: product.company_percentage?.toString() || '0',
            is_active: product.is_active,
        });
        setEditingId(product.id);
        setIsModalOpen(true);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Nome é obrigatório');
            return;
        }

        const productData: ProductInsert | ProductUpdate = {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            category_id: formData.category_id || null,
            bank_value: parseFloat(formData.bank_value) || 0,
            bank_percentage: parseFloat(formData.bank_percentage) || 0,
            company_value: parseFloat(formData.company_value) || 0,
            company_percentage: parseFloat(formData.company_percentage) || 0,
            is_active: formData.is_active,
        };

        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: productData });
                toast.success('Produto atualizado com sucesso!');
            } else {
                await createMutation.mutateAsync(productData as ProductInsert);
                toast.success('Produto criado com sucesso!');
            }
            closeModal();
        } catch {
            toast.error(editingId ? 'Erro ao atualizar produto' : 'Erro ao criar produto');
        }
    }, [formData, editingId, createMutation, updateMutation, closeModal]);

    const handleDelete = useCallback((id: string, name: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('Produto excluído com sucesso!');
            } catch {
                toast.error('Erro ao excluir produto');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir produto',
            description: `Tem certeza que deseja excluir "${name}"?`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteMutation]);

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return {
        // State
        searchTerm,
        setSearchTerm,
        filterActive,
        setFilterActive,
        isModalOpen,
        setIsModalOpen,
        editingId,
        formData,
        setFormData,
        isDeleting,

        // Dialog
        dialogProps,

        // Data
        products: products || [],
        productsLoading,
        summary,
        categories: categories || [],

        // Flags
        isSaving,

        // Handlers
        openModal,
        closeModal,
        openEditModal,
        handleSubmit,
        handleDelete,
        resetForm,
    };
}
