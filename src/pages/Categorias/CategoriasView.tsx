import { Plus, Edit, Trash2, Repeat, Tag } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader, EmptyState, LoadingState } from '@/components/shared';
import { CategoryForm } from './components';
import type { useCategoriasPage } from './useCategoriasPage';

type CategoriasViewProps = ReturnType<typeof useCategoriasPage>;

export function CategoriasView(props: CategoriasViewProps) {
    const {
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
        categories,
        categoriesLoading,
        // Mutations loading states
        isSavingCategory,
        // Handlers
        handleSubmitCategory,
        handleDeleteCategory,
        resetCategoryForm,
    } = props;

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Categorias"
                    description="Gerencie categorias e subcategorias para organizar seus lançamentos"
                />

                <div className="flex justify-end">
                    <Dialog open={isCategoriaModalOpen} onOpenChange={(open) => { setIsCategoriaModalOpen(open); if (!open) resetCategoryForm(); }}>
                        <DialogTrigger asChild>
                            <button className="btn-primary">
                                <Plus className="w-4 h-4" />
                                Nova Categoria
                            </button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nova Categoria</DialogTitle>
                                <DialogDescription>
                                    Crie uma nova categoria para organizar seus lançamentos.
                                </DialogDescription>
                            </DialogHeader>
                            <CategoryForm
                                form={categoryForm}
                                setForm={setCategoryForm}
                                isSaving={isSavingCategory}
                                onSubmit={handleSubmitCategory}
                                onCancel={() => { setIsCategoriaModalOpen(false); resetCategoryForm(); }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {categoriesLoading ? (
                    <LoadingState />
                ) : categories.length === 0 ? (
                    <EmptyState icon={Tag} message="Nenhuma categoria encontrada" />
                ) : (
                    <div className="grid gap-4">
                        {categories.map((categoria) => (
                            <div key={categoria.id} className="card-financial p-5 group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-12 rounded-full" style={{ backgroundColor: categoria.color }} />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground">{categoria.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    categoria.type === 'receita' ? 'bg-income-muted text-income'
                                                        : categoria.type === 'despesa' ? 'bg-expense-muted text-expense'
                                                            : 'bg-primary/10 text-primary'
                                                }`}
                                                >
                                                    {categoria.type === 'ambos' ? 'Receita/Despesa'
                                                        : categoria.type.charAt(0).toUpperCase() + categoria.type.slice(1)}
                                                </span>
                                                {categoria.is_recurring && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-pending-muted text-pending flex items-center gap-1">
                                                        <Repeat className="w-3 h-3" />
                                                        Recorrente
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {categoria.subcategories.map((sub) => (
                                                    <span key={sub.id} className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">
                                                        {sub.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="btn-secondary p-2">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="btn-secondary p-2 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDeleteCategory(categoria.id, categoria.name)}
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

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
