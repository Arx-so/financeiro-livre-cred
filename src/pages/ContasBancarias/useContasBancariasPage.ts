import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import { useBranches } from '@/hooks/useBranches';
import {
    useAllBankAccounts,
    useCreateBankAccount,
    useUpdateBankAccount,
    useDeleteBankAccount,
    useReactivateBankAccount,
} from '@/hooks/useBankAccounts';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import type { BankAccountInsert } from '@/types/database';

export interface BankAccountFormData {
    name: string;
    bank_name: string;
    agency: string;
    account_number: string;
    branch_id: string;
    initial_balance: string;
}

const initialBankAccountForm: BankAccountFormData = {
    name: '',
    bank_name: '',
    agency: '',
    account_number: '',
    branch_id: '',
    initial_balance: '',
};

export function useContasBancariasPage() {
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.role === 'admin';
    const isAdminOrGerente = user?.role === 'admin' || user?.role === 'gerente';

    // Confirmation dialog
    const { confirm, dialogProps } = useConfirmDialog();
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter state
    const [showInactiveBankAccounts, setShowInactiveBankAccounts] = useState(false);

    // Modal states
    const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);

    // Editing states
    const [editingBankAccountId, setEditingBankAccountId] = useState<string | null>(null);

    // Form states
    const [bankAccountForm, setBankAccountForm] = useState<BankAccountFormData>(initialBankAccountForm);

    // Fetch data
    const { data: branches, isLoading: branchesLoading } = useBranches({ isActive: true });
    const { data: bankAccounts, isLoading: bankAccountsLoading } = useAllBankAccounts({
        isActive: showInactiveBankAccounts ? undefined : true,
    });

    // Mutations
    const createBankAccount = useCreateBankAccount();
    const updateBankAccount = useUpdateBankAccount();
    const deleteBankAccount = useDeleteBankAccount();
    const reactivateBankAccount = useReactivateBankAccount();

    // Bank Account handlers
    const resetBankAccountForm = useCallback(() => {
        setBankAccountForm(initialBankAccountForm);
        setEditingBankAccountId(null);
    }, []);

    const handleSubmitBankAccount = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const accountData: BankAccountInsert = {
            name: bankAccountForm.name,
            bank_name: bankAccountForm.bank_name,
            agency: bankAccountForm.agency || null,
            account_number: bankAccountForm.account_number || null,
            branch_id: bankAccountForm.branch_id,
            initial_balance: parseFloat(bankAccountForm.initial_balance) || 0,
        };

        try {
            if (editingBankAccountId) {
                await updateBankAccount.mutateAsync({ id: editingBankAccountId, account: accountData });
                toast.success('Conta bancária atualizada!');
            } else {
                await createBankAccount.mutateAsync(accountData);
                toast.success('Conta bancária criada!');
            }
            setIsBankAccountModalOpen(false);
            resetBankAccountForm();
        } catch {
            toast.error('Erro ao salvar conta bancária');
        }
    }, [bankAccountForm, editingBankAccountId, createBankAccount, updateBankAccount, resetBankAccountForm]);

    const handleDeleteBankAccount = useCallback((id: string, name: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteBankAccount.mutateAsync(id);
                toast.success('Conta bancária desativada!');
            } catch {
                toast.error('Erro ao desativar conta bancária');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Desativar conta bancária',
            description: `Tem certeza que deseja desativar a conta "${name}"? Você poderá reativá-la depois.`,
            confirmText: 'Desativar',
        });
    }, [confirm, deleteBankAccount]);

    const handleReactivateBankAccount = useCallback(async (id: string) => {
        try {
            await reactivateBankAccount.mutateAsync(id);
            toast.success('Conta bancária reativada!');
        } catch {
            toast.error('Erro ao reativar conta bancária');
        }
    }, [reactivateBankAccount]);

    const openEditBankAccountModal = useCallback((account: NonNullable<typeof bankAccounts>[0]) => {
        setBankAccountForm({
            name: account.name,
            bank_name: account.bank_name,
            agency: account.agency || '',
            account_number: account.account_number || '',
            branch_id: account.branch_id,
            initial_balance: account.initial_balance.toString(),
        });
        setEditingBankAccountId(account.id);
        setIsBankAccountModalOpen(true);
    }, []);

    return {
        // User permissions
        user,
        isAdmin,
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
        branches: branches || [],
        branchesLoading,
        bankAccounts: bankAccounts || [],
        bankAccountsLoading,

        // Mutations loading states
        isSavingBankAccount: createBankAccount.isPending || updateBankAccount.isPending,

        // Handlers
        resetBankAccountForm,
        handleSubmitBankAccount,
        handleDeleteBankAccount,
        handleReactivateBankAccount,
        openEditBankAccountModal,
    };
}
