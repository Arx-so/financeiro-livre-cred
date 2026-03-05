import { Plus, User, ChevronLeft, ChevronRight } from 'lucide-react';
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
    PageHeader, EmptyState, LoadingState, SearchInput
} from '@/components/shared';
import { FavorecidoCard, FavorecidoForm } from './components';
import type { useFavorecidosPage } from './useFavorecidosPage';
import type { FavorecidoTipo } from '@/types/database';

type FavorecidosViewProps = ReturnType<typeof useFavorecidosPage>;

export function FavorecidosView(props: FavorecidosViewProps) {
    const {
        // Dialog
        dialogProps,
        isDeleting,
        // Search and filters
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType,
        // Pagination
        currentPage,
        setCurrentPage,
        totalCount,
        totalPages,
        pageSize,
        // Modal states
        isModalOpen,
        setIsModalOpen,
        // Editing states
        editingId,
        // Refs
        fileInputRef,
        documentInputRef,
        // Form states
        formData,
        setFormData,
        // Photo state
        photoPreview,
        // Data
        favorecidos,
        favorecidosLoading,
        favorecidoDocuments,
        documentsLoading,
        favorecidoLogs,
        logsLoading,
        // Mutations loading states
        isSavingFavorecido,
        isUploadingDocument,
        // Handlers
        handlePhotoSelect,
        handleDocumentUpload,
        handleDeleteDocument,
        resetForm,
        handleSubmitFavorecido,
        handleDeleteFavorecido,
        openEditFavorecidoModal,
    } = props;

    const firstItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const lastItem = Math.min(currentPage * pageSize, totalCount);

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Favorecidos"
                    description="Gerencie clientes, fornecedores e funcionários"
                />

                <div className="flex flex-col md:flex-row gap-4">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar por nome, email, telefone..."
                    />
                    <div className="flex gap-2">
                        <select
                            className="input-financial"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as FavorecidoTipo | 'todos')}
                        >
                            <option value="todos">Todos</option>
                            <option value="cliente">Clientes</option>
                            <option value="fornecedor">Fornecedores</option>
                            <option value="funcionario">Funcionários</option>
                        </select>
                        <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
                            <DialogTrigger asChild>
                                <button className="btn-primary min-w-40">
                                    <Plus className="w-4 h-4" />
                                    Novo Cadastro
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>{editingId ? 'Editar Favorecido' : 'Novo Favorecido'}</DialogTitle>
                                    <DialogDescription>
                                        Cadastre um novo cliente, fornecedor ou funcionário.
                                    </DialogDescription>
                                </DialogHeader>
                                <FavorecidoForm
                                    formData={formData}
                                    setFormData={setFormData}
                                    editingId={editingId}
                                    photoPreview={photoPreview}
                                    fileInputRef={fileInputRef}
                                    documentInputRef={documentInputRef}
                                    favorecidoDocuments={favorecidoDocuments}
                                    documentsLoading={documentsLoading}
                                    favorecidoLogs={favorecidoLogs}
                                    logsLoading={logsLoading}
                                    isUploadingDocument={isUploadingDocument}
                                    isSaving={isSavingFavorecido}
                                    onPhotoSelect={handlePhotoSelect}
                                    onDocumentUpload={handleDocumentUpload}
                                    onDeleteDocument={handleDeleteDocument}
                                    onSubmit={handleSubmitFavorecido}
                                    onCancel={() => { setIsModalOpen(false); resetForm(); }}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {favorecidosLoading ? (
                    <LoadingState />
                ) : favorecidos.length === 0 ? (
                    <EmptyState icon={User} message="Nenhum cadastro encontrado" />
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {favorecidos.map((favorecido) => (
                                <FavorecidoCard
                                    key={favorecido.id}
                                    favorecido={favorecido}
                                    onEdit={() => openEditFavorecidoModal(favorecido)}
                                    onDelete={() => handleDeleteFavorecido(favorecido.id, favorecido.name)}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-sm text-muted-foreground">
                                    Exibindo {firstItem}–{lastItem} de {totalCount} cadastros
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        className="btn-ghost p-2 disabled:opacity-40"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        aria-label="Página anterior"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                                            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((item, idx) => item === 'ellipsis' ? (
                                            <span key={`e-${idx}`} className="px-1 text-muted-foreground">…</span>
                                        ) : (
                                            <button
                                                key={item}
                                                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${item === currentPage ? 'bg-primary text-primary-foreground' : 'btn-ghost'}`}
                                                onClick={() => setCurrentPage(item as number)}
                                            >
                                                {item}
                                            </button>
                                        ))
                                    }
                                    <button
                                        className="btn-ghost p-2 disabled:opacity-40"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        aria-label="Próxima página"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
