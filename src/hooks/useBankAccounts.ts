import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBankAccounts,
    getBankAccount,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    reactivateBankAccount,
    getBranchBankAccounts,
    BankAccountFilters,
} from '@/services/bankAccounts';
import type { BankAccountInsert, BankAccountUpdate } from '@/types/database';
import { useBranchStore } from '@/stores';

// Query keys
export const bankAccountKeys = {
    all: ['bank-accounts'] as const,
    lists: () => [...bankAccountKeys.all, 'list'] as const,
    list: (filters: BankAccountFilters) => [...bankAccountKeys.lists(), filters] as const,
    details: () => [...bankAccountKeys.all, 'detail'] as const,
    detail: (id: string) => [...bankAccountKeys.details(), id] as const,
    branch: (branchId: string) => [...bankAccountKeys.all, 'branch', branchId] as const,
};

// Hooks
export function useBankAccounts(filters: BankAccountFilters = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    // Use branch from filters or current branch
    const effectiveFilters = {
        ...filters,
        branchId: filters.branchId || unidadeAtual?.id,
    };

    return useQuery({
        queryKey: bankAccountKeys.list(effectiveFilters),
        queryFn: () => getBankAccounts(effectiveFilters),
    });
}

export function useAllBankAccounts(filters: BankAccountFilters = {}) {
    return useQuery({
        queryKey: bankAccountKeys.list(filters),
        queryFn: () => getBankAccounts(filters),
    });
}

export function useBankAccount(id: string) {
    return useQuery({
        queryKey: bankAccountKeys.detail(id),
        queryFn: () => getBankAccount(id),
        enabled: !!id,
    });
}

export function useBranchBankAccounts(branchId?: string) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const effectiveBranchId = branchId || unidadeAtual?.id;

    return useQuery({
        queryKey: bankAccountKeys.branch(effectiveBranchId || ''),
        queryFn: () => getBranchBankAccounts(effectiveBranchId!),
        enabled: !!effectiveBranchId,
    });
}

export function useCreateBankAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (account: BankAccountInsert) => createBankAccount(account),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
        },
    });
}

export function useUpdateBankAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, account }: { id: string; account: BankAccountUpdate }) => updateBankAccount(id, account),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
        },
    });
}

export function useDeleteBankAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteBankAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
        },
    });
}

export function useReactivateBankAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => reactivateBankAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
        },
    });
}
