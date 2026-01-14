import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getUsers, 
  getUserWithBranches,
  updateUser,
  updateUserRole,
  getUserBranchAccess,
  setUserBranchAccess,
  inviteUser,
  type UserFilters 
} from '@/services/users';
import type { ProfileUpdate, UserRole } from '@/types/database';

// Hook to fetch all users
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => getUsers(filters),
  });
}

// Hook to fetch a single user with branches
export function useUserWithBranches(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['users', 'detail', userId],
    queryFn: () => getUserWithBranches(userId),
    enabled: enabled && !!userId,
  });
}

// Hook to fetch user branch access
export function useUserBranchAccess(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['users', 'branches', userId],
    queryFn: () => getUserBranchAccess(userId),
    enabled: enabled && !!userId,
  });
}

// Hook to update a user
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: ProfileUpdate }) => 
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Hook to update user role
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) => 
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Hook to set user branch access
export function useSetUserBranchAccess() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, branchIds }: { userId: string; branchIds: string[] }) => 
      setUserBranchAccess(userId, branchIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Hook to invite a new user
export function useInviteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ email, name, role, branchIds }: { 
      email: string; 
      name: string; 
      role: UserRole;
      branchIds: string[];
    }) => inviteUser(email, name, role, branchIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
