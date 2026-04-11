import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getEmployeeVacations,
    getVacationById,
    createVacation,
    updateVacation,
    deleteVacation,
    getExpiringVacations,
    type VacationFilters,
    type VacationWithEmployee,
} from '@/services/hrFerias';
import type { EmployeeVacationInsert, EmployeeVacationUpdate } from '@/types/database';

export const feriasKeys = {
    all: ['ferias'] as const,
    lists: () => [...feriasKeys.all, 'list'] as const,
    list: (filters: VacationFilters) => [...feriasKeys.lists(), filters] as const,
    detail: (id: string) => [...feriasKeys.all, 'detail', id] as const,
    expiring: (branchId: string, days?: number) => [...feriasKeys.all, 'expiring', branchId, days] as const,
};

export function useFerias(filters: Omit<VacationFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: VacationFilters = { ...filters, branchId };

    return useQuery({
        queryKey: feriasKeys.list(mergedFilters),
        queryFn: () => getEmployeeVacations(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useFeriasById(id: string) {
    return useQuery({
        queryKey: feriasKeys.detail(id),
        queryFn: () => getVacationById(id),
        enabled: !!id,
    });
}

export function useExpiringFerias(days = 30) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';

    return useQuery({
        queryKey: feriasKeys.expiring(branchId, days),
        queryFn: () => getExpiringVacations(branchId, days),
        enabled: !!branchId,
    });
}

export function useCreateFerias() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: EmployeeVacationInsert) => createVacation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feriasKeys.all });
        },
    });
}

export function useUpdateFerias() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: EmployeeVacationUpdate }) => updateVacation(id, data),
        onSuccess: (_result, { id }) => {
            queryClient.invalidateQueries({ queryKey: feriasKeys.all });
            queryClient.invalidateQueries({ queryKey: feriasKeys.detail(id) });
        },
    });
}

export function useDeleteFerias() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteVacation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: feriasKeys.all });
        },
    });
}

export type { VacationWithEmployee };
