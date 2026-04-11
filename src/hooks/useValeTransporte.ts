import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getVtRecharges,
    createVtRecharge,
    generateVtMonthlyReport,
    type VtFilters,
    type VtRechargeWithEmployee,
    type VtMonthlyReport,
} from '@/services/hrValeTransporte';
import type { VtRechargeInsert } from '@/types/database';

export const vtKeys = {
    all: ['vt-recharges'] as const,
    lists: () => [...vtKeys.all, 'list'] as const,
    list: (filters: VtFilters) => [...vtKeys.lists(), filters] as const,
    report: (branchId: string, month: number, year: number) =>
        [...vtKeys.all, 'report', branchId, month, year] as const,
};

export function useVtRecharges(filters: Omit<VtFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: VtFilters = { ...filters, branchId };

    return useQuery({
        queryKey: vtKeys.list(mergedFilters),
        queryFn: () => getVtRecharges(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useVtMonthlyReport(month: number, year: number) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';

    return useQuery({
        queryKey: vtKeys.report(branchId, month, year),
        queryFn: () => generateVtMonthlyReport(branchId, month, year),
        enabled: !!branchId && !!month && !!year,
    });
}

export function useCreateVtRecharge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: VtRechargeInsert) => createVtRecharge(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vtKeys.all });
        },
    });
}

export type { VtRechargeWithEmployee, VtMonthlyReport };
