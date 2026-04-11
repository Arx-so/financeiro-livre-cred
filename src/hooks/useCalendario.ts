import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getCorporateHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    type HolidayFilters,
} from '@/services/hrCalendario';
import type { CorporateHolidayInsert, CorporateHolidayUpdate } from '@/types/database';

export const calendarioKeys = {
    all: ['corporate-holidays'] as const,
    lists: () => [...calendarioKeys.all, 'list'] as const,
    list: (filters: HolidayFilters) => [...calendarioKeys.lists(), filters] as const,
};

export function useCorporateHolidays(filters: Omit<HolidayFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: HolidayFilters = { ...filters, branchId };

    return useQuery({
        queryKey: calendarioKeys.list(mergedFilters),
        queryFn: () => getCorporateHolidays(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useCreateHoliday() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CorporateHolidayInsert) => createHoliday(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: calendarioKeys.all });
        },
    });
}

export function useUpdateHoliday() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CorporateHolidayUpdate }) => updateHoliday(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: calendarioKeys.all });
        },
    });
}

export function useDeleteHoliday() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteHoliday(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: calendarioKeys.all });
        },
    });
}
