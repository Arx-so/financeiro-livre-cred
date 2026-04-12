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
    today: (branchId: string | undefined) => [...aniversariosKeys.all, 'today', branchId] as const,
    upcoming: (branchId: string | undefined, days: number) => [...aniversariosKeys.all, 'upcoming', branchId, days] as const,
    byMonth: (branchId: string | undefined, month: number) => [...aniversariosKeys.all, 'month', branchId, month] as const,
};

export function useBirthdaysToday() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    return useQuery({
        queryKey: aniversariosKeys.today(branchId),
        queryFn: () => getBirthdaysToday(branchId),
        enabled: !!unidadeAtual?.id || isAdm,
        staleTime: 60 * 60 * 1000,
        refetchInterval: 60 * 60 * 1000,
    });
}

export function useUpcomingBirthdays(days = 30) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    return useQuery({
        queryKey: aniversariosKeys.upcoming(branchId, days),
        queryFn: () => getUpcomingBirthdays(branchId, days),
        enabled: !!unidadeAtual?.id || isAdm,
        staleTime: 30 * 60 * 1000,
    });
}

export function useBirthdaysByMonth(month: number) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    return useQuery({
        queryKey: aniversariosKeys.byMonth(branchId, month),
        queryFn: () => getBirthdaysByMonth(branchId, month),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export type { FavorecidoWithBirthday };
