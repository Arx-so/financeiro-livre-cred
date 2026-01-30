import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getPayrolls,
    getPayrollSummary,
    createPayroll,
    updatePayroll,
    deletePayroll,
    generateFinancialEntry,
    getHiringCategories,
    getEmployeesByFilters,
    createBatchPayroll,
    PayrollFilters,
    BatchPayrollConfig,
} from '@/services/folhaPagamento';
import type { PayrollInsert, PayrollUpdate } from '@/types/database';

export function usePayrolls(filters: Omit<PayrollFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    return useQuery({
        queryKey: ['payrolls', unidadeAtual?.id, filters],
        queryFn: () => getPayrolls({ ...filters, branchId: unidadeAtual?.id }),
        enabled: !!unidadeAtual?.id,
    });
}

export function usePayrollSummary(month?: number, year?: number) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    return useQuery({
        queryKey: ['payroll-summary', unidadeAtual?.id, month, year],
        queryFn: () => getPayrollSummary(unidadeAtual!.id, month, year),
        enabled: !!unidadeAtual?.id,
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
