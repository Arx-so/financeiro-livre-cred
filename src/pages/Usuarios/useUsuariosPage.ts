import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import { useBranches } from '@/hooks/useBranches';
import { useUsers, useUpdateUserRole, useSetUserBranchAccess } from '@/hooks/useUsers';
import type { UserRole, Profile } from '@/types/database';

export interface UserFormData {
    role: UserRole;
    selectedBranches: string[];
}

const initialUserForm: UserFormData = {
    role: 'usuario',
    selectedBranches: [],
};

export function useUsuariosPage() {
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.role === 'admin';

    // Search state
    const [userSearchTerm, setUserSearchTerm] = useState('');

    // Modal states
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Editing states
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // Form states
    const [userForm, setUserForm] = useState<UserFormData>(initialUserForm);

    // Fetch data
    const { data: branches, isLoading: branchesLoading } = useBranches({ isActive: true });
    const { data: users, isLoading: usersLoading } = useUsers({
        search: userSearchTerm || undefined,
    });

    // Mutations
    const updateUserRole = useUpdateUserRole();
    const setUserBranchAccess = useSetUserBranchAccess();

    // User handlers
    const resetUserForm = useCallback(() => {
        setUserForm(initialUserForm);
        setEditingUserId(null);
    }, []);

    const handleSubmitUser = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingUserId) return;

        try {
            await updateUserRole.mutateAsync({ userId: editingUserId, role: userForm.role });

            if (userForm.role !== 'admin') {
                await setUserBranchAccess.mutateAsync({
                    userId: editingUserId,
                    branchIds: userForm.selectedBranches,
                });
            }

            toast.success('Usuário atualizado!');
            setIsUserModalOpen(false);
            resetUserForm();
        } catch {
            toast.error('Erro ao atualizar usuário');
        }
    }, [editingUserId, userForm, updateUserRole, setUserBranchAccess, resetUserForm]);

    const openEditUserModal = useCallback((userProfile: Profile) => {
        setUserForm({
            role: userProfile.role,
            selectedBranches: [],
        });
        setEditingUserId(userProfile.id);
        setIsUserModalOpen(true);
    }, []);

    const toggleBranchSelection = useCallback((branchId: string) => {
        setUserForm((prev) => ({
            ...prev,
            selectedBranches: prev.selectedBranches.includes(branchId)
                ? prev.selectedBranches.filter((id) => id !== branchId)
                : [...prev.selectedBranches, branchId],
        }));
    }, []);

    return {
        // User permissions
        user,
        isAdmin,

        // Search state
        userSearchTerm,
        setUserSearchTerm,

        // Modal states
        isUserModalOpen,
        setIsUserModalOpen,

        // Editing states
        editingUserId,

        // Form states
        userForm,
        setUserForm,

        // Data
        branches: branches || [],
        branchesLoading,
        users: users || [],
        usersLoading,

        // Mutations loading states
        isSavingUser: updateUserRole.isPending || setUserBranchAccess.isPending,

        // Handlers
        resetUserForm,
        handleSubmitUser,
        openEditUserModal,
        toggleBranchSelection,
    };
}
