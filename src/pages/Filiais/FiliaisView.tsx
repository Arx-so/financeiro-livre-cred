import { Plus, Store } from 'lucide-react';
import { Navigate } from 'react-router-dom';
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
import { BranchForm, BranchCard } from './components';
import type { useFiliaisPage } from './useFiliaisPage';

type FiliaisViewProps = ReturnType<typeof useFiliaisPage>;

export function FiliaisView(props: FiliaisViewProps) {
    const {
        // User permissions
        isAdmin,
        // Dialog
        dialogProps,
        isDeleting,
        // Filter state
        showInactiveBranches,
        setShowInactiveBranches,
        // Modal states
        isFilialModalOpen,
        setIsFilialModalOpen,
        // Editing states
        editingBranchId,
        // Form states
        branchForm,
        setBranchForm,
        // Data
        branches,
        branchesLoading,
        // Mutations loading states
        isSavingBranch,
        // Handlers
        resetBranchForm,
        handleSubmitBranch,
        handleDeleteBranch,
        handleReactivateBranch,
        openEditBranchModal,
    } = props;

    // Redirect if not admin
    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Filiais"
                    description="Gerencie as filiais da empresa"
                />

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showInactiveBranches}
                                onChange={(e) => setShowInactiveBranches(e.target.checked)}
                                className="w-4 h-4 rounded border-input"
                            />
                            <span className="text-muted-foreground">Mostrar inativas</span>
                        </label>
                    </div>
                    <Dialog open={isFilialModalOpen} onOpenChange={(open) => { setIsFilialModalOpen(open); if (!open) resetBranchForm(); }}>
                        <DialogTrigger asChild>
                            <button className="btn-primary">
                                <Plus className="w-4 h-4" />
                                Nova Filial
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{editingBranchId ? 'Editar Filial' : 'Nova Filial'}</DialogTitle>
                                <DialogDescription>
                                    {editingBranchId ? 'Atualize os dados da filial.' : 'Cadastre uma nova filial para sua empresa.'}
                                </DialogDescription>
                            </DialogHeader>
                            <BranchForm
                                form={branchForm}
                                setForm={setBranchForm}
                                isEditing={!!editingBranchId}
                                isSaving={isSavingBranch}
                                onSubmit={handleSubmitBranch}
                                onCancel={() => { setIsFilialModalOpen(false); resetBranchForm(); }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {branchesLoading ? (
                    <LoadingState />
                ) : branches.length === 0 ? (
                    <EmptyState icon={Store} message="Nenhuma filial encontrada" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {branches.map((branch) => (
                            <BranchCard
                                key={branch.id}
                                branch={branch}
                                onEdit={() => openEditBranchModal(branch)}
                                onDelete={() => handleDeleteBranch(branch.id, branch.name, branch.code)}
                                onReactivate={() => handleReactivateBranch(branch.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
