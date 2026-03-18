import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import { useBranches } from '@/hooks/useBranches';
import {
    useUsers, useUpdateUser, useSetUserBranchAccess, useCreateUser
} from '@/hooks/useUsers';
import { getUserBranchAccess } from '@/services/users';
import type { UserRole, Profile } from '@/types/database';

export interface UserFormData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    selectedBranches: string[];
}

const initialUserForm: UserFormData = {
    name: '',
    email: '',
    password: '',
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
    const updateUser = useUpdateUser();
    const setUserBranchAccess = useSetUserBranchAccess();
    const createUser = useCreateUser();

    // User handlers
    const resetUserForm = useCallback(() => {
        setUserForm(initialUserForm);
        setEditingUserId(null);
    }, []);

    const handleSubmitUser = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        // Creating new user
        if (!editingUserId) {
            if (!userForm.email || !userForm.password || !userForm.name) {
                toast.error('Preencha todos os campos obrigatórios');
                return;
            }

            if (userForm.password.length < 6) {
                toast.error('A senha deve ter pelo menos 6 caracteres');
                return;
            }

            try {
                const result = await createUser.mutateAsync({
                    email: userForm.email,
                    password: userForm.password,
                    name: userForm.name,
                    role: userForm.role,
                    branchIds: userForm.selectedBranches,
                });

                if (result.success) {
                    if (result.error) {
                        // Success with a note (e.g., email confirmation required)
                        toast.success(result.error);
                    } else {
                        toast.success('Usuário criado com sucesso!');
                    }
                    setIsUserModalOpen(false);
                    resetUserForm();
                } else {
                    toast.error(result.error || 'Erro ao criar usuário');
                }
            } catch (err) {
                console.error('Error creating user:', err);
                toast.error('Erro ao criar usuário');
            }
            return;
        }

        // Editing existing user
        try {
            await updateUser.mutateAsync({ userId: editingUserId, data: { role: userForm.role, name: userForm.name } });

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
    }, [editingUserId, userForm, updateUser, setUserBranchAccess, createUser, resetUserForm]);

    const openCreateUserModal = useCallback(() => {
        setUserForm(initialUserForm);
        setEditingUserId(null);
        setIsUserModalOpen(true);
    }, []);

    const openEditUserModal = useCallback(async (userProfile: Profile) => {
        let selectedBranches: string[] = [];
        try {
            const branchAccess = await getUserBranchAccess(userProfile.id);
            selectedBranches = branchAccess.map((a) => a.branch_id);
        } catch {
            // proceed with empty branches
        }

        setUserForm({
            name: userProfile.name || '',
            email: userProfile.email || '',
            password: '',
            role: userProfile.role,
            selectedBranches,
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
        isSavingUser: updateUser.isPending || setUserBranchAccess.isPending || createUser.isPending,
        isCreating: !editingUserId,

        // Handlers
        resetUserForm,
        handleSubmitUser,
        openCreateUserModal,
        openEditUserModal,
        toggleBranchSelection,
    };
}
