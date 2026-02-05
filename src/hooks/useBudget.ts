import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBudgetHierarchical,
    updateBudgetItemMonthly,
    getBudgetSuggestion,
    getAnnualSummary,
    getBudgetSummary,
    getBudgetByCategory,
} from '@/services/planejamento';
import type { BudgetFrequency } from '@/types/database';

// Query keys
export const budgetKeys = {
    all: ['budget'] as const,
    hierarchical: (branchId: string, year: number, versionId?: string | null) => (
        [...budgetKeys.all, 'hierarchical', branchId, year, versionId] as const
    ),
    byCategory: (branchId: string, year: number) => (
        [...budgetKeys.all, 'by-category', branchId, year] as const
    ),
    summary: (branchId: string, year: number, versionId?: string | null) => (
        [...budgetKeys.all, 'summary', branchId, year, versionId] as const
    ),
    annualSummary: (branchId: string, year: number, versionId?: string | null) => (
        [...budgetKeys.all, 'annual-summary', branchId, year, versionId] as const
    ),
    suggestion: (branchId: string, categoryId: string, subcategoryId?: string | null) => (
        [...budgetKeys.all, 'suggestion', branchId, categoryId, subcategoryId] as const
    ),
};

// Hooks
export function useBudgetHierarchical(
    branchId: string | undefined,
    year: number,
    versionId?: string | null
) {
    return useQuery({
        queryKey: budgetKeys.hierarchical(branchId || '', year, versionId),
        queryFn: () => getBudgetHierarchical(branchId!, year, versionId),
        enabled: !!branchId,
    });
}

export function useBudgetByCategory(branchId: string | undefined, year: number) {
    return useQuery({
        queryKey: budgetKeys.byCategory(branchId || '', year),
        queryFn: () => getBudgetByCategory(branchId!, year),
        enabled: !!branchId,
    });
}

export function useBudgetSummary(
    branchId: string | undefined,
    year: number,
    versionId?: string | null
) {
    return useQuery({
        queryKey: budgetKeys.summary(branchId || '', year, versionId),
        queryFn: () => getBudgetSummary(branchId!, year, versionId),
        enabled: !!branchId,
    });
}

export function useAnnualSummary(
    branchId: string | undefined,
    year: number,
    versionId?: string | null
) {
    return useQuery({
        queryKey: budgetKeys.annualSummary(branchId || '', year, versionId),
        queryFn: () => getAnnualSummary(branchId!, year, versionId),
        enabled: !!branchId,
    });
}

export function useBudgetSuggestion(
    branchId: string | undefined,
    categoryId: string | undefined,
    subcategoryId?: string | null
) {
    return useQuery({
        queryKey: budgetKeys.suggestion(branchId || '', categoryId || '', subcategoryId),
        queryFn: () => getBudgetSuggestion(branchId!, categoryId!, subcategoryId),
        enabled: !!branchId && !!categoryId,
    });
}

export function useUpdateBudgetMonthly() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            branchId,
            categoryId,
            subcategoryId,
            year,
            amounts,
            frequency,
            versionId,
        }: {
            branchId: string;
            categoryId: string;
            subcategoryId: string | null;
            year: number;
            amounts: number[];
            frequency: BudgetFrequency;
            versionId?: string | null;
        }) => updateBudgetItemMonthly(branchId, categoryId, subcategoryId, year, amounts, frequency, versionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: budgetKeys.all });
        },
    });
}
