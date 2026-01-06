import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getFinancialEntries, 
  getFinancialEntry,
  createFinancialEntry,
  createFinancialEntries,
  calculateRecurringDates,
  updateFinancialEntry,
  deleteFinancialEntry,
  deleteFinancialEntries,
  markAsPaid,
  getFinancialSummary,
  getMonthlyData,
  getUpcomingPayments,
  getRecentTransactions,
  updateOverdueEntries,
  FinancialFilters,
  FinancialEntryWithRelations,
} from '@/services/financeiro';
import type { FinancialEntryInsert, FinancialEntryUpdate } from '@/types/database';
import { useBranchStore } from '@/stores';

// Re-export helper functions for use in components
export { calculateRecurringDates } from '@/services/financeiro';

// Query keys
export const financialKeys = {
  all: ['financial-entries'] as const,
  lists: () => [...financialKeys.all, 'list'] as const,
  list: (filters: FinancialFilters) => [...financialKeys.lists(), filters] as const,
  details: () => [...financialKeys.all, 'detail'] as const,
  detail: (id: string) => [...financialKeys.details(), id] as const,
  summary: (branchId: string) => [...financialKeys.all, 'summary', branchId] as const,
  monthly: (branchId: string, year: number) => [...financialKeys.all, 'monthly', branchId, year] as const,
  upcoming: (branchId: string) => [...financialKeys.all, 'upcoming', branchId] as const,
  recent: (branchId: string) => [...financialKeys.all, 'recent', branchId] as const,
};

// Hooks
export function useFinancialEntries(filters: FinancialFilters = {}) {
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const branchId = filters.branchId || unidadeAtual?.id;

  return useQuery({
    queryKey: financialKeys.list({ ...filters, branchId }),
    queryFn: () => getFinancialEntries({ ...filters, branchId }),
    enabled: !!branchId,
  });
}

export function useFinancialEntry(id: string) {
  return useQuery({
    queryKey: financialKeys.detail(id),
    queryFn: () => getFinancialEntry(id),
    enabled: !!id,
  });
}

export function useFinancialSummary(branchId?: string, startDate?: string, endDate?: string) {
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const effectiveBranchId = branchId || unidadeAtual?.id;

  return useQuery({
    queryKey: [...financialKeys.summary(effectiveBranchId || ''), startDate, endDate],
    queryFn: () => getFinancialSummary(effectiveBranchId!, startDate, endDate),
    enabled: !!effectiveBranchId,
  });
}

export function useMonthlyData(year: number, branchId?: string) {
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const effectiveBranchId = branchId || unidadeAtual?.id;

  return useQuery({
    queryKey: financialKeys.monthly(effectiveBranchId || '', year),
    queryFn: () => getMonthlyData(effectiveBranchId!, year),
    enabled: !!effectiveBranchId,
  });
}

export function useUpcomingPayments(days: number = 30, branchId?: string) {
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const effectiveBranchId = branchId || unidadeAtual?.id;

  return useQuery({
    queryKey: [...financialKeys.upcoming(effectiveBranchId || ''), days],
    queryFn: () => getUpcomingPayments(effectiveBranchId!, days),
    enabled: !!effectiveBranchId,
  });
}

export function useRecentTransactions(limit: number = 10, branchId?: string, year?: number) {
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const effectiveBranchId = branchId || unidadeAtual?.id;

  return useQuery({
    queryKey: [...financialKeys.recent(effectiveBranchId || ''), limit, year],
    queryFn: () => getRecentTransactions(effectiveBranchId!, limit, year),
    enabled: !!effectiveBranchId,
  });
}

export function useCreateFinancialEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: FinancialEntryInsert) => createFinancialEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
}

export function useCreateFinancialEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entries: FinancialEntryInsert[]) => createFinancialEntries(entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
}

export function useUpdateFinancialEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, entry }: { id: string; entry: FinancialEntryUpdate }) => 
      updateFinancialEntry(id, entry),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
}

export function useDeleteFinancialEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFinancialEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
}

export function useDeleteFinancialEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => deleteFinancialEntries(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, paymentDate }: { id: string; paymentDate?: string }) => 
      markAsPaid(id, paymentDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
}

export function useUpdateOverdueEntries() {
  const queryClient = useQueryClient();
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

  return useMutation({
    mutationFn: () => updateOverdueEntries(unidadeAtual?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
}
