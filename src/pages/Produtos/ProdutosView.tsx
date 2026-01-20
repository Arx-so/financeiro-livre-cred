import { Package, Plus } from 'lucide-react';
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
import {
    PageHeader,
    EmptyState,
    LoadingState,
    StatCard,
    SearchInput,
} from '@/components/shared';
import { ProductForm, ProductCard } from './components';
import type { useProdutosPage } from './useProdutosPage';

type ProdutosViewProps = ReturnType<typeof useProdutosPage>;

export function ProdutosView(props: ProdutosViewProps) {
    const {
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
        products,
        productsLoading,
        summary,
        categories,

        // Flags
        isSaving,

        // Handlers
        closeModal,
        openEditModal,
        handleSubmit,
        handleDelete,
        resetForm,
    } = props;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="Produtos"
                    description="Gerencie o cadastro de produtos"
                >
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
                                Novo Produto
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingId ? 'Editar Produto' : 'Novo Produto'}
                                </DialogTitle>
                                <DialogDescription>
                                    Preencha os dados do produto
                                </DialogDescription>
                            </DialogHeader>
                            <ProductForm
                                formData={formData}
                                setFormData={setFormData}
                                categories={categories}
                                editingId={editingId}
                                isSaving={isSaving}
                                onSubmit={handleSubmit}
                                onCancel={closeModal}
                            />
                        </DialogContent>
                    </Dialog>
                </PageHeader>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            label="Total de Produtos"
                            value={summary.total}
                            icon={Package}
                        />
                        <StatCard
                            label="Produtos Ativos"
                            value={summary.active}
                            icon={Package}
                            variant="income"
                        />
                        <StatCard
                            label="Produtos Inativos"
                            value={summary.inactive}
                            icon={Package}
                            variant="expense"
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar produtos..."
                        className="max-w-md"
                    />
                    <select
                        className="input-financial w-auto"
                        value={filterActive}
                        onChange={(e) => setFilterActive(e.target.value as 'todos' | 'ativos' | 'inativos')}
                    >
                        <option value="todos">Todos</option>
                        <option value="ativos">Ativos</option>
                        <option value="inativos">Inativos</option>
                    </select>
                </div>

                {/* Products Grid */}
                {productsLoading ? (
                    <LoadingState />
                ) : products.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        message="Nenhum produto encontrado"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
