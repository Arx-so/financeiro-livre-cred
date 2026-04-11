import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getDPlusSales,
    getDPlusSaleById,
    createDPlusSale,
    updateDPlusSaleStatus,
    getDPlusSalesReport,
    type DPlusSaleFilters,
    type SalesDPlusWithRelations,
    type DPlusReportSummary,
} from '@/services/salesDPlus';
import type { SalesDPlusProductInsert } from '@/types/database';

export const dPlusSalesKeys = {
    all: ['sales-d-plus'] as const,
    lists: () => [...dPlusSalesKeys.all, 'list'] as const,
    list: (filters: DPlusSaleFilters) => [...dPlusSalesKeys.lists(), filters] as const,
    detail: (id: string) => [...dPlusSalesKeys.all, 'detail', id] as const,
    report: (filters: DPlusSaleFilters) => [...dPlusSalesKeys.all, 'report', filters] as const,
};

export function useDPlusSales(filters: Omit<DPlusSaleFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: DPlusSaleFilters = { ...filters, branchId };

    return useQuery({
        queryKey: dPlusSalesKeys.list(mergedFilters),
        queryFn: () => getDPlusSales(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useDPlusSaleById(id: string) {
    return useQuery({
        queryKey: dPlusSalesKeys.detail(id),
        queryFn: () => getDPlusSaleById(id),
        enabled: !!id,
    });
}

export function useDPlusSalesReport(filters: Omit<DPlusSaleFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: DPlusSaleFilters = { ...filters, branchId };

    return useQuery({
        queryKey: dPlusSalesKeys.report(mergedFilters),
        queryFn: () => getDPlusSalesReport(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useCreateDPlusSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SalesDPlusProductInsert) => createDPlusSale(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dPlusSalesKeys.all });
        },
    });
}

export function useUpdateDPlusSaleStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => (
            updateDPlusSaleStatus(id, { status: status as 'pendente' | 'ativo' | 'cancelado' })
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dPlusSalesKeys.all });
        },
    });
}

export type { SalesDPlusWithRelations, DPlusReportSummary };
