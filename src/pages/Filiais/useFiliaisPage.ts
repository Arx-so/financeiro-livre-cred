import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import {
    useBranches,
    useCreateBranch,
    useUpdateBranch,
    useDeleteBranch,
    useReactivateBranch,
} from '@/hooks/useBranches';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import type { BranchInsert } from '@/types/database';

export interface BranchFormData {
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
}

const initialBranchForm: BranchFormData = {
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
};

export function useFiliaisPage() {
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.role === 'admin';

    // Confirmation dialog
    const { confirm, dialogProps } = useConfirmDialog();
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter state
    const [showInactiveBranches, setShowInactiveBranches] = useState(false);

    // Modal states
    const [isFilialModalOpen, setIsFilialModalOpen] = useState(false);

    // Editing states
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

    // Form states
    const [branchForm, setBranchForm] = useState<BranchFormData>(initialBranchForm);

    // Fetch data
    const { data: branches, isLoading: branchesLoading } = useBranches({
        isActive: showInactiveBranches ? undefined : true,
    });

    // Mutations
    const createBranch = useCreateBranch();
    const updateBranch = useUpdateBranch();
    const deleteBranch = useDeleteBranch();
    const reactivateBranch = useReactivateBranch();

    // Branch handlers
    const resetBranchForm = useCallback(() => {
        setBranchForm(initialBranchForm);
        setEditingBranchId(null);
    }, []);

    const handleSubmitBranch = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const branchData: BranchInsert = {
            name: branchForm.name,
            code: branchForm.code,
            address: branchForm.address
                ? `${branchForm.address}${branchForm.city ? `, ${branchForm.city}` : ''}${branchForm.state ? ` - ${branchForm.state}` : ''}`
                : null,
            phone: branchForm.phone || null,
        };

        try {
            if (editingBranchId) {
                await updateBranch.mutateAsync({ id: editingBranchId, branch: branchData });
                toast.success('Filial atualizada!');
            } else {
                await createBranch.mutateAsync(branchData);
                toast.success('Filial criada!');
            }
            setIsFilialModalOpen(false);
            resetBranchForm();
        } catch {
            toast.error('Erro ao salvar filial');
        }
    }, [branchForm, editingBranchId, createBranch, updateBranch, resetBranchForm]);

    const handleDeleteBranch = useCallback((id: string, name: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteBranch.mutateAsync(id);
                toast.success('Filial desativada!');
            } catch {
                toast.error('Erro ao desativar filial');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Desativar filial',
            description: `Tem certeza que deseja desativar a filial "${name}"? Você poderá reativá-la depois.`,
            confirmText: 'Desativar',
        });
    }, [confirm, deleteBranch]);

    const handleReactivateBranch = useCallback(async (id: string) => {
        try {
            await reactivateBranch.mutateAsync(id);
            toast.success('Filial reativada!');
        } catch {
            toast.error('Erro ao reativar filial');
        }
    }, [reactivateBranch]);

    const openEditBranchModal = useCallback((branch: NonNullable<typeof branches>[0]) => {
        const addressParts = branch.address?.split(', ') || [];
        const lastPart = addressParts[addressParts.length - 1]?.split(' - ') || [];

        setBranchForm({
            name: branch.name,
            code: branch.code,
            address: addressParts[0] || '',
            city: addressParts.length > 1
                ? (lastPart.length > 1 ? `${addressParts.slice(1, -1).join(', ')}, ${lastPart[0]}` : addressParts.slice(1).join(', '))
                : '',
            state: lastPart.length > 1 ? lastPart[1] : '',
            zip_code: '',
            phone: branch.phone || '',
        });
        setEditingBranchId(branch.id);
        setIsFilialModalOpen(true);
    }, []);

    return {
        // User permissions
        user,
        isAdmin,

        // Dialog
        dialogProps,
        isDeleting,

        // Filter state
        showInactiveBranches,
        setShowInactiveBranches,

        // Modal states
        isFilialModalOpen,
        setIsFilialModalOpen,

        // Editing states
        editingBranchId,

        // Form states
        branchForm,
        setBranchForm,

        // Data
        branches: branches || [],
        branchesLoading,

        // Mutations loading states
        isSavingBranch: createBranch.isPending || updateBranch.isPending,

        // Handlers
        resetBranchForm,
        handleSubmitBranch,
        handleDeleteBranch,
        handleReactivateBranch,
        openEditBranchModal,
    };
}
