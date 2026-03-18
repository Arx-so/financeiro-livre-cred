import { Package, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    PageHeader,
    EmptyState,
    LoadingState,
    StatCard,
    SearchInput,
} from '@/components/shared';
import { ProductForm, ProductCard, ProductTypeModal } from './components';
import type { useProdutosPage } from './useProdutosPage';

const PRODUCT_TYPE_LABELS: Record<string, string> = {
    generico: 'Produto Genérico',
    cartao_credito: 'Cartão de Crédito',
    fgts: 'FGTS',
    consignado: 'Consignado',
};

type ProdutosViewProps = ReturnType<typeof useProdutosPage>;

export function ProdutosView(props: ProdutosViewProps) {
    const {
        // State
        searchTerm,
        setSearchTerm,
        filterCategory,
        setFilterCategory,
        filterActive,
        setFilterActive,
        isTypeModalOpen,
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
        productCategories,

        // Flags
        isSaving,

        // Handlers
        openTypeModal,
        closeTypeModal,
        handleTypeSelect,
        closeModal,
        openEditModal,
        handleSubmit,
        handleDelete,
        resetForm,
    } = props;

    const formTitle = editingId
        ? `Editar Produto`
        : `Novo ${PRODUCT_TYPE_LABELS[formData.product_type] || 'Produto'}`;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <PageHeader
                    title="Produtos"
                    description="Gerencie o cadastro de produtos"
                >
                    <button className="btn-primary" onClick={openTypeModal}>
                        <Plus className="w-4 h-4" />
                        Novo Produto
                    </button>
                </PageHeader>

                {/* Modal de seleção de tipo */}
                <ProductTypeModal
                    open={isTypeModalOpen}
                    onSelect={handleTypeSelect}
                    onClose={closeTypeModal}
                />

                {/* Dialog do formulário do produto */}
                <Dialog
                    open={isModalOpen}
                    onOpenChange={(open) => {
                        setIsModalOpen(open);
                        if (!open) resetForm();
                    }}
                >
                    <DialogContent className="max-w-2xl max-h-[90vh] min-w-[60vw]">
                        <DialogHeader>
                            <DialogTitle>{formTitle}</DialogTitle>
                            <DialogDescription>
                                Preencha os dados do produto
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm
                            formData={formData}
                            setFormData={setFormData}
                            productCategories={productCategories}
                            editingId={editingId}
                            isSaving={isSaving}
                            onSubmit={handleSubmit}
                            onCancel={closeModal}
                        />
                    </DialogContent>
                </Dialog>

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
                <div className="flex flex-col md:flex-row gap-4 items-center flex-wrap">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar por nome ou código..."
                        className="max-w-md"
                    />
                    <select
                        className="input-financial w-auto"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">Todas as categorias</option>
                        {productCategories?.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
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
