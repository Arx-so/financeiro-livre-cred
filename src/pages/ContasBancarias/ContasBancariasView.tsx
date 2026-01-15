import { Plus, Landmark } from 'lucide-react';
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
import { BankAccountForm, BankAccountCard } from './components';
import type { useContasBancariasPage } from './useContasBancariasPage';

type ContasBancariasViewProps = ReturnType<typeof useContasBancariasPage>;

export function ContasBancariasView(props: ContasBancariasViewProps) {
    const {
        // User permissions
        isAdminOrGerente,
        // Dialog
        dialogProps,
        isDeleting,
        // Filter state
        showInactiveBankAccounts,
        setShowInactiveBankAccounts,
        // Modal states
        isBankAccountModalOpen,
        setIsBankAccountModalOpen,
        // Editing states
        editingBankAccountId,
        // Form states
        bankAccountForm,
        setBankAccountForm,
        // Data
        branches,
        bankAccounts,
        bankAccountsLoading,
        // Mutations loading states
        isSavingBankAccount,
        // Handlers
        resetBankAccountForm,
        handleSubmitBankAccount,
        handleDeleteBankAccount,
        handleReactivateBankAccount,
        openEditBankAccountModal,
    } = props;

    // Redirect if not admin or gerente
    if (!isAdminOrGerente) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader
                    title="Contas Bancárias"
                    description="Gerencie as contas bancárias da empresa"
                />

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showInactiveBankAccounts}
                                onChange={(e) => setShowInactiveBankAccounts(e.target.checked)}
                                className="w-4 h-4 rounded border-input"
                            />
                            <span className="text-muted-foreground">Mostrar inativas</span>
                        </label>
                    </div>
                    <Dialog open={isBankAccountModalOpen} onOpenChange={(open) => { setIsBankAccountModalOpen(open); if (!open) resetBankAccountForm(); }}>
                        <DialogTrigger asChild>
                            <button className="btn-primary">
                                <Plus className="w-4 h-4" />
                                Nova Conta
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingBankAccountId ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}</DialogTitle>
                                <DialogDescription>
                                    {editingBankAccountId ? 'Atualize os dados da conta bancária.' : 'Cadastre uma nova conta bancária.'}
                                </DialogDescription>
                            </DialogHeader>
                            <BankAccountForm
                                form={bankAccountForm}
                                setForm={setBankAccountForm}
                                branches={branches.filter((b) => b.is_active)}
                                isEditing={!!editingBankAccountId}
                                isSaving={isSavingBankAccount}
                                onSubmit={handleSubmitBankAccount}
                                onCancel={() => { setIsBankAccountModalOpen(false); resetBankAccountForm(); }}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {bankAccountsLoading ? (
                    <LoadingState />
                ) : bankAccounts.length === 0 ? (
                    <EmptyState icon={Landmark} message="Nenhuma conta bancária encontrada" />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {bankAccounts.map((account) => (
                            <BankAccountCard
                                key={account.id}
                                account={account}
                                onEdit={() => openEditBankAccountModal(account)}
                                onDelete={() => handleDeleteBankAccount(account.id, account.name)}
                                onReactivate={() => handleReactivateBankAccount(account.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
