import { useQuery } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getBirthdaysToday,
    getUpcomingBirthdays,
    getBirthdaysByMonth,
} from '@/services/hrAniversarios';
import type { FavorecidoWithBirthday } from '@/services/hrAniversarios';

export const aniversariosKeys = {
    all: ['aniversarios'] as const,
    today: (branchId: string) => [...aniversariosKeys.all, 'today', branchId] as const,
    upcoming: (branchId: string, days: number) => [...aniversariosKeys.all, 'upcoming', branchId, days] as const,
    byMonth: (branchId: string, month: number) => [...aniversariosKeys.all, 'month', branchId, month] as const,
};

export function useBirthdaysToday() {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id) ?? '';

    return useQuery({
        queryKey: aniversariosKeys.today(branchId),
        queryFn: () => getBirthdaysToday(branchId),
        enabled: !!branchId,
        staleTime: 60 * 60 * 1000, // 1 hour
        refetchInterval: 60 * 60 * 1000, // refetch every hour
    });
}

export function useUpcomingBirthdays(days = 30) {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id) ?? '';

    return useQuery({
        queryKey: aniversariosKeys.upcoming(branchId, days),
        queryFn: () => getUpcomingBirthdays(branchId, days),
        enabled: !!branchId,
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
}

export function useBirthdaysByMonth(month: number) {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id) ?? '';

    return useQuery({
        queryKey: aniversariosKeys.byMonth(branchId, month),
        queryFn: () => getBirthdaysByMonth(branchId, month),
        enabled: !!branchId,
    });
}

export type { FavorecidoWithBirthday };
