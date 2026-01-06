import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getBranches, 
  getBranch,
  createBranch, 
  updateBranch,
  deleteBranch,
  reactivateBranch,
  isBranchCodeUnique,
  BranchFilters
} from '@/services/branches';
import type { BranchInsert, BranchUpdate } from '@/types/database';
import { useBranchStore } from '@/stores';

// Query keys
export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (filters: BranchFilters) => [...branchKeys.lists(), filters] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
};

// Hooks
export function useBranches(filters: BranchFilters = {}) {
  return useQuery({
    queryKey: branchKeys.list(filters),
    queryFn: () => getBranches(filters),
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: () => getBranch(id),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  const loadBranches = useBranchStore((state) => state.loadBranches);

  return useMutation({
    mutationFn: (branch: BranchInsert) => createBranch(branch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, branch }: { id: string; branch: BranchUpdate }) => 
      updateBranch(id, branch),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}

export function useReactivateBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reactivateBranch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}

export function useCheckBranchCode() {
  return useMutation({
    mutationFn: ({ code, excludeId }: { code: string; excludeId?: string }) => 
      isBranchCodeUnique(code, excludeId),
  });
}
