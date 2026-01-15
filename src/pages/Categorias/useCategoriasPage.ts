import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
    useCategoriesWithSubcategories,
    useCreateCategory,
    useDeleteCategory,
    useCreateSubcategories,
} from '@/hooks/useCategorias';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import type { RecurrenceType } from '@/types/database';

export interface CategoryFormData {
    name: string;
    type: 'receita' | 'despesa' | 'ambos';
    color: string;
    subcategories: string;
    is_recurring: boolean;
    default_recurrence_type: RecurrenceType | '';
    default_recurrence_day: string;
}

const initialCategoryForm: CategoryFormData = {
    name: '',
    type: 'receita',
    color: '#3b82f6',
    subcategories: '',
    is_recurring: false,
    default_recurrence_type: '',
    default_recurrence_day: '',
};

export function useCategoriasPage() {
    // Confirmation dialog
    const { confirm, dialogProps } = useConfirmDialog();
    const [isDeleting, setIsDeleting] = useState(false);

    // Modal states
    const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);

    // Form states
    const [categoryForm, setCategoryForm] = useState<CategoryFormData>(initialCategoryForm);

    // Fetch data
    const { data: categories, isLoading: categoriesLoading } = useCategoriesWithSubcategories();

    // Mutations
    const createCategory = useCreateCategory();
    const deleteCategory = useDeleteCategory();
    const createSubcategories = useCreateSubcategories();

    // Category handlers
    const handleSubmitCategory = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const newCategory = await createCategory.mutateAsync({
                name: categoryForm.name,
                type: categoryForm.type,
                color: categoryForm.color,
                is_recurring: categoryForm.is_recurring,
                default_recurrence_type: categoryForm.is_recurring && categoryForm.default_recurrence_type
                    ? categoryForm.default_recurrence_type : null,
                default_recurrence_day: categoryForm.is_recurring && categoryForm.default_recurrence_day
                    ? parseInt(categoryForm.default_recurrence_day, 10) : null,
            });

            if (categoryForm.subcategories.trim()) {
                const subcategoryNames = categoryForm.subcategories.split(',').map((s) => s.trim()).filter(Boolean);
                if (subcategoryNames.length > 0) {
                    await createSubcategories.mutateAsync({
                        categoryId: newCategory.id,
                        names: subcategoryNames,
                    });
                }
            }

            toast.success('Categoria criada!');
            setIsCategoriaModalOpen(false);
            setCategoryForm(initialCategoryForm);
        } catch {
            toast.error('Erro ao criar categoria');
        }
    }, [categoryForm, createCategory, createSubcategories]);

    const handleDeleteCategory = useCallback((id: string, name: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteCategory.mutateAsync(id);
                toast.success('Categoria removida!');
            } catch {
                toast.error('Erro ao remover categoria');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir categoria',
            description: `Tem certeza que deseja excluir a categoria "${name}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteCategory]);

    const resetCategoryForm = useCallback(() => {
        setCategoryForm(initialCategoryForm);
    }, []);

    return {
        // Dialog
        dialogProps,
        isDeleting,

        // Modal states
        isCategoriaModalOpen,
        setIsCategoriaModalOpen,

        // Form states
        categoryForm,
        setCategoryForm,

        // Data
        categories: categories || [],
        categoriesLoading,

        // Mutations loading states
        isSavingCategory: createCategory.isPending,

        // Handlers
        handleSubmitCategory,
        handleDeleteCategory,
        resetCategoryForm,
    };
}
