import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getPayrolls,
    getPayrollSummary,
    createPayroll,
    updatePayroll,
    deletePayroll,
    generateFinancialEntry,
    generateFinancialEntriesBatch,
    getHiringCategories,
    getEmployeesByFilters,
    createBatchPayroll,
    PayrollFilters,
    BatchPayrollConfig,
    type BatchGenerationResultItem,
    type PayrollWithEmployee,
} from '@/services/folhaPagamento';
import type { PayrollInsert, PayrollUpdate } from '@/types/database';

export function usePayrolls(filters: Omit<PayrollFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    return useQuery({
        queryKey: ['payrolls', branchId ?? 'adm', filters],
        queryFn: () => getPayrolls({ ...filters, branchId }),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function usePayrollSummary(month?: number, year?: number) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    return useQuery({
        queryKey: ['payroll-summary', branchId ?? 'adm', month, year],
        queryFn: () => getPayrollSummary(branchId, month, year),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useCreatePayroll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payroll: PayrollInsert) => createPayroll(payroll),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
            queryClient.invalidateQueries({ queryKey: ['payroll-summary'] });
        },
    });
}

export function useUpdatePayroll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: PayrollUpdate }) => updatePayroll(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
            queryClient.invalidateQueries({ queryKey: ['payroll-summary'] });
        },
    });
}

export function useDeletePayroll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deletePayroll(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
            queryClient.invalidateQueries({ queryKey: ['payroll-summary'] });
        },
    });
}

export function useGenerateFinancialEntry() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payrollId: string) => generateFinancialEntry(payrollId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
            queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
        },
    });
}

export function useHiringCategories() {
    return useQuery({
        queryKey: ['hiring-categories'],
        queryFn: () => getHiringCategories(),
    });
}

export function useEmployeesByFilters(filters: { categoria_contratacao?: string }) {
    return useQuery({
        queryKey: ['employees-by-filters', filters],
        queryFn: () => getEmployeesByFilters(filters),
        enabled: !!filters.categoria_contratacao,
    });
}

export function useBatchGenerateFinancialEntries() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payrolls: PayrollWithEmployee[]) => generateFinancialEntriesBatch(payrolls),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
            queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
        },
    });
}

export type { BatchGenerationResultItem };

export function useCreateBatchPayroll() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (config: BatchPayrollConfig) => createBatchPayroll(config),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payrolls'] });
            queryClient.invalidateQueries({ queryKey: ['payroll-summary'] });
        },
    });
}
