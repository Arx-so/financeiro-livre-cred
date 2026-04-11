import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getHrAlerts,
    dismissAlert,
    generateHrAlerts,
    getHrDashboardSummary,
    type AlertFilters,
    type HrAlertWithEmployee,
    type HrDashboardSummary,
} from '@/services/hrAlerts';

export const hrAlertsKeys = {
    all: ['hr-alerts'] as const,
    lists: () => [...hrAlertsKeys.all, 'list'] as const,
    list: (filters: AlertFilters) => [...hrAlertsKeys.lists(), filters] as const,
    dashboard: (branchId: string) => [...hrAlertsKeys.all, 'dashboard', branchId] as const,
};

export function useHrAlerts(filters: Omit<AlertFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';

    const mergedFilters: AlertFilters = { ...filters, branchId: branchId || undefined };

    return useQuery({
        queryKey: hrAlertsKeys.list(mergedFilters),
        queryFn: () => getHrAlerts(mergedFilters),
        enabled: !!branchId,
    });
}

export function useActiveHrAlerts() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';

    const filters: AlertFilters = { branchId, dismissed: false };

    return useQuery({
        queryKey: hrAlertsKeys.list(filters),
        queryFn: () => getHrAlerts(filters),
        enabled: !!branchId,
        staleTime: 60_000, // 1 minute
    });
}

export function useHrDashboardSummary() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';

    return useQuery({
        queryKey: hrAlertsKeys.dashboard(branchId),
        queryFn: () => getHrDashboardSummary(branchId),
        enabled: !!branchId,
    });
}

export function useDismissHrAlert() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => dismissAlert(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrAlertsKeys.all });
        },
    });
}

export function useGenerateHrAlerts() {
    const queryClient = useQueryClient();
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';

    return useMutation({
        mutationFn: () => generateHrAlerts(branchId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hrAlertsKeys.all });
        },
    });
}

export type { HrAlertWithEmployee, HrDashboardSummary };
