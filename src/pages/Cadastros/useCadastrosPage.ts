import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import {
    useFavorecidos,
    useCreateFavorecido,
    useUpdateFavorecido,
    useDeleteFavorecido,
    useUploadFavorecidoPhoto,
    useFavorecidoDocuments,
    useUploadFavorecidoDocument,
    useDeleteFavorecidoDocument,
} from '@/hooks/useCadastros';
import {
    useCategoriesWithSubcategories,
    useCreateCategory,
    useDeleteCategory,
    useCreateSubcategories,
} from '@/hooks/useCategorias';
import {
    useBranches,
    useCreateBranch,
    useUpdateBranch,
    useDeleteBranch,
    useReactivateBranch,
} from '@/hooks/useBranches';
import {
    useAllBankAccounts,
    useCreateBankAccount,
    useUpdateBankAccount,
    useDeleteBankAccount,
    useReactivateBankAccount,
} from '@/hooks/useBankAccounts';
import { useEntityLogs } from '@/hooks/useActivityLogs';
import { useUsers, useUpdateUserRole, useSetUserBranchAccess } from '@/hooks/useUsers';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import type {
    FavorecidoTipo,
    FavorecidoInsert,
    BranchInsert,
    BankAccountInsert,
    RecurrenceType,
    BankAccountType,
    PixKeyType,
    PaymentType,
    UserRole,
    Profile,
} from '@/types/database';

// Form state types
export interface FavorecidoFormData {
    type: FavorecidoTipo;
    name: string;
    document: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    category: string;
    notes: string;
    bank_name: string;
    bank_agency: string;
    bank_account: string;
    bank_account_type: BankAccountType | '';
    pix_key: string;
    pix_key_type: PixKeyType | '';
    preferred_payment_type: PaymentType | '';
    birth_date: string;
}

export interface CategoryFormData {
    name: string;
    type: 'receita' | 'despesa' | 'ambos';
    color: string;
    subcategories: string;
    is_recurring: boolean;
    default_recurrence_type: RecurrenceType | '';
    default_recurrence_day: string;
}

export interface BranchFormData {
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
}

export interface BankAccountFormData {
    name: string;
    bank_name: string;
    agency: string;
    account_number: string;
    branch_id: string;
    initial_balance: string;
}

export interface UserFormData {
    role: UserRole;
    selectedBranches: string[];
}

const initialFavorecidoForm: FavorecidoFormData = {
    type: 'cliente',
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    category: '',
    notes: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: '',
    pix_key: '',
    pix_key_type: '',
    preferred_payment_type: '',
    birth_date: '',
};

const initialCategoryForm: CategoryFormData = {
    name: '',
    type: 'receita',
    color: '#3b82f6',
    subcategories: '',
    is_recurring: false,
    default_recurrence_type: '',
    default_recurrence_day: '',
};

const initialBranchForm: BranchFormData = {
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
};

const initialBankAccountForm: BankAccountFormData = {
    name: '',
    bank_name: '',
    agency: '',
    account_number: '',
    branch_id: '',
    initial_balance: '',
};

const initialUserForm: UserFormData = {
    role: 'usuario',
    selectedBranches: [],
};

export function useCadastrosPage() {
    const user = useAuthStore((state) => state.user);
    const isAdmin = user?.role === 'admin';
    const isAdminOrGerente = user?.role === 'admin' || user?.role === 'gerente';

    // Confirmation dialog
    const { confirm, dialogProps } = useConfirmDialog();
    const [isDeleting, setIsDeleting] = useState(false);

    // Tab and UI state
    const [activeTab, setActiveTab] = useState('favorecidos');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FavorecidoTipo | 'todos'>('todos');
    const [showInactiveBranches, setShowInactiveBranches] = useState(false);
    const [showInactiveBankAccounts, setShowInactiveBankAccounts] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
    const [isFilialModalOpen, setIsFilialModalOpen] = useState(false);
    const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // Editing states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
    const [editingBankAccountId, setEditingBankAccountId] = useState<string | null>(null);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    // File refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [formData, setFormData] = useState<FavorecidoFormData>(initialFavorecidoForm);
    const [categoryForm, setCategoryForm] = useState<CategoryFormData>(initialCategoryForm);
    const [branchForm, setBranchForm] = useState<BranchFormData>(initialBranchForm);
    const [bankAccountForm, setBankAccountForm] = useState<BankAccountFormData>(initialBankAccountForm);
    const [userForm, setUserForm] = useState<UserFormData>(initialUserForm);

    // Photo state
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Fetch data
    const { data: favorecidos, isLoading: favorecidosLoading } = useFavorecidos({
        type: filterType === 'todos' ? undefined : filterType,
        search: searchTerm || undefined,
        isActive: true,
    });

    const { data: categories, isLoading: categoriesLoading } = useCategoriesWithSubcategories();
    const { data: favorecidoDocuments, isLoading: documentsLoading, refetch: refetchDocuments } = useFavorecidoDocuments(editingId || '');
    const { data: favorecidoLogs, isLoading: logsLoading } = useEntityLogs('favorecido', editingId || '', !!editingId);
    const { data: branches, isLoading: branchesLoading } = useBranches({
        isActive: showInactiveBranches ? undefined : true,
    });
    const { data: bankAccounts, isLoading: bankAccountsLoading } = useAllBankAccounts({
        isActive: showInactiveBankAccounts ? undefined : true,
    });
    const { data: users, isLoading: usersLoading } = useUsers({
        search: userSearchTerm || undefined,
    });

    // Mutations
    const createFavorecido = useCreateFavorecido();
    const updateFavorecido = useUpdateFavorecido();
    const deleteFavorecido = useDeleteFavorecido();
    const uploadPhoto = useUploadFavorecidoPhoto();
    const uploadDocument = useUploadFavorecidoDocument();
    const deleteDocument = useDeleteFavorecidoDocument();
    const createCategory = useCreateCategory();
    const deleteCategory = useDeleteCategory();
    const createSubcategories = useCreateSubcategories();
    const createBranch = useCreateBranch();
    const updateBranch = useUpdateBranch();
    const deleteBranch = useDeleteBranch();
    const reactivateBranch = useReactivateBranch();
    const createBankAccount = useCreateBankAccount();
    const updateBankAccount = useUpdateBankAccount();
    const deleteBankAccount = useDeleteBankAccount();
    const reactivateBankAccount = useReactivateBankAccount();
    const updateUserRole = useUpdateUserRole();
    const setUserBranchAccess = useSetUserBranchAccess();

    // Handlers
    const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleDocumentUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const {files} = e.target;
        if (!files || files.length === 0 || !editingId) return;

        const uploadPromises = Array.from(files).map(async (file) => {
            try {
                await uploadDocument.mutateAsync({ favorecidoId: editingId, file });
                toast.success(`${file.name} enviado com sucesso!`);
            } catch {
                toast.error(`Erro ao enviar ${file.name}`);
            }
        });

        await Promise.all(uploadPromises);

        if (documentInputRef.current) {
            documentInputRef.current.value = '';
        }
    }, [editingId, uploadDocument]);

    const handleDeleteDocument = useCallback((docId: string, fileName: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteDocument.mutateAsync(docId);
                refetchDocuments();
                toast.success('Documento removido!');
            } catch {
                toast.error('Erro ao remover documento');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Remover documento',
            description: `Tem certeza que deseja remover o arquivo "${fileName}"?`,
            confirmText: 'Remover',
        });
    }, [confirm, deleteDocument, refetchDocuments]);

    const resetForm = useCallback(() => {
        setFormData(initialFavorecidoForm);
        setEditingId(null);
        setSelectedPhoto(null);
        setPhotoPreview(null);
    }, []);

    const handleSubmitFavorecido = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const favorecidoData: FavorecidoInsert = {
            type: formData.type,
            name: formData.name,
            document: formData.document || null,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            city: formData.city || null,
            state: formData.state || null,
            zip_code: formData.zip_code || null,
            category: formData.category || null,
            notes: formData.notes || null,
            bank_name: formData.bank_name || null,
            bank_agency: formData.bank_agency || null,
            bank_account: formData.bank_account || null,
            bank_account_type: formData.bank_account_type || null,
            pix_key: formData.pix_key || null,
            pix_key_type: formData.pix_key_type || null,
            preferred_payment_type: formData.preferred_payment_type || null,
            birth_date: formData.birth_date || null,
        };

        try {
            let favorecidoId = editingId;

            if (editingId) {
                await updateFavorecido.mutateAsync({ id: editingId, favorecido: favorecidoData });
            } else {
                const result = await createFavorecido.mutateAsync(favorecidoData);
                favorecidoId = result.id;
            }

            if (selectedPhoto && favorecidoId) {
                await uploadPhoto.mutateAsync({ favorecidoId, file: selectedPhoto });
            }

            toast.success(editingId ? 'Cadastro atualizado!' : 'Cadastro realizado!');
            setIsModalOpen(false);
            resetForm();
        } catch {
            toast.error('Erro ao salvar cadastro');
        }
    }, [formData, editingId, selectedPhoto, createFavorecido, updateFavorecido, uploadPhoto, resetForm]);

    const handleDeleteFavorecido = useCallback((id: string, name: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteFavorecido.mutateAsync(id);
                toast.success('Cadastro removido!');
            } catch {
                toast.error('Erro ao remover cadastro');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir cadastro',
            description: `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteFavorecido]);

    const openEditFavorecidoModal = useCallback((favorecido: NonNullable<typeof favorecidos>[0]) => {
        setFormData({
            type: favorecido.type,
            name: favorecido.name,
            document: favorecido.document || '',
            email: favorecido.email || '',
            phone: favorecido.phone || '',
            address: favorecido.address || '',
            city: favorecido.city || '',
            state: favorecido.state || '',
            zip_code: favorecido.zip_code || '',
            category: favorecido.category || '',
            notes: favorecido.notes || '',
            bank_name: favorecido.bank_name || '',
            bank_agency: favorecido.bank_agency || '',
            bank_account: favorecido.bank_account || '',
            bank_account_type: favorecido.bank_account_type || '',
            pix_key: favorecido.pix_key || '',
            pix_key_type: favorecido.pix_key_type || '',
            preferred_payment_type: favorecido.preferred_payment_type || '',
            birth_date: favorecido.birth_date || '',
        });
        setEditingId(favorecido.id);
        setPhotoPreview(favorecido.photo_url);
        setIsModalOpen(true);
    }, []);

    // Category handlers
    const handleSubmitCategory = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const newCategory = await createCategory.mutateAsync({
                name: categoryForm.name,
                type: categoryForm.type,
                color: categoryForm.color,
                is_recurring: categoryForm.is_recurring,
                default_recurrence_type: categoryForm.is_recurring && categoryForm.default_recurrence_type
                    ? categoryForm.default_recurrence_type : null,
                default_recurrence_day: categoryForm.is_recurring && categoryForm.default_recurrence_day
                    ? parseInt(categoryForm.default_recurrence_day, 10) : null,
            });

            if (categoryForm.subcategories.trim()) {
                const subcategoryNames = categoryForm.subcategories.split(',').map((s) => s.trim()).filter(Boolean);
                if (subcategoryNames.length > 0) {
                    await createSubcategories.mutateAsync({
                        categoryId: newCategory.id,
                        names: subcategoryNames,
                    });
                }
            }

            toast.success('Categoria criada!');
            setIsCategoriaModalOpen(false);
            setCategoryForm(initialCategoryForm);
        } catch {
            toast.error('Erro ao criar categoria');
        }
    }, [categoryForm, createCategory, createSubcategories]);

    const handleDeleteCategory = useCallback((id: string, name: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteCategory.mutateAsync(id);
                toast.success('Categoria removida!');
            } catch {
                toast.error('Erro ao remover categoria');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir categoria',
            description: `Tem certeza que deseja excluir a categoria "${name}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteCategory]);

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

    // Bank Account handlers
    const resetBankAccountForm = useCallback(() => {
        setBankAccountForm(initialBankAccountForm);
        setEditingBankAccountId(null);
    }, []);

    const handleSubmitBankAccount = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const accountData: BankAccountInsert = {
            name: bankAccountForm.name,
            bank_name: bankAccountForm.bank_name,
            agency: bankAccountForm.agency || null,
            account_number: bankAccountForm.account_number || null,
            branch_id: bankAccountForm.branch_id,
            initial_balance: parseFloat(bankAccountForm.initial_balance) || 0,
        };

        try {
            if (editingBankAccountId) {
                await updateBankAccount.mutateAsync({ id: editingBankAccountId, account: accountData });
                toast.success('Conta bancária atualizada!');
            } else {
                await createBankAccount.mutateAsync(accountData);
                toast.success('Conta bancária criada!');
            }
            setIsBankAccountModalOpen(false);
            resetBankAccountForm();
        } catch {
            toast.error('Erro ao salvar conta bancária');
        }
    }, [bankAccountForm, editingBankAccountId, createBankAccount, updateBankAccount, resetBankAccountForm]);

    const handleDeleteBankAccount = useCallback((id: string, name: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteBankAccount.mutateAsync(id);
                toast.success('Conta bancária desativada!');
            } catch {
                toast.error('Erro ao desativar conta bancária');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Desativar conta bancária',
            description: `Tem certeza que deseja desativar a conta "${name}"? Você poderá reativá-la depois.`,
            confirmText: 'Desativar',
        });
    }, [confirm, deleteBankAccount]);

    const handleReactivateBankAccount = useCallback(async (id: string) => {
        try {
            await reactivateBankAccount.mutateAsync(id);
            toast.success('Conta bancária reativada!');
        } catch {
            toast.error('Erro ao reativar conta bancária');
        }
    }, [reactivateBankAccount]);

    const openEditBankAccountModal = useCallback((account: NonNullable<typeof bankAccounts>[0]) => {
        setBankAccountForm({
            name: account.name,
            bank_name: account.bank_name,
            agency: account.agency || '',
            account_number: account.account_number || '',
            branch_id: account.branch_id,
            initial_balance: account.initial_balance.toString(),
        });
        setEditingBankAccountId(account.id);
        setIsBankAccountModalOpen(true);
    }, []);

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
        isAdminOrGerente,

        // Dialog
        confirm,
        dialogProps,
        isDeleting,

        // Tab state
        activeTab,
        setActiveTab,

        // Search and filters
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType,
        showInactiveBranches,
        setShowInactiveBranches,
        showInactiveBankAccounts,
        setShowInactiveBankAccounts,
        userSearchTerm,
        setUserSearchTerm,

        // Modal states
        isModalOpen,
        setIsModalOpen,
        isCategoriaModalOpen,
        setIsCategoriaModalOpen,
        isFilialModalOpen,
        setIsFilialModalOpen,
        isBankAccountModalOpen,
        setIsBankAccountModalOpen,
        isUserModalOpen,
        setIsUserModalOpen,

        // Editing states
        editingId,
        editingBranchId,
        editingBankAccountId,
        editingUserId,

        // Refs
        fileInputRef,
        documentInputRef,

        // Form states
        formData,
        setFormData,
        categoryForm,
        setCategoryForm,
        branchForm,
        setBranchForm,
        bankAccountForm,
        setBankAccountForm,
        userForm,
        setUserForm,

        // Photo state
        selectedPhoto,
        photoPreview,

        // Data
        favorecidos: favorecidos || [],
        favorecidosLoading,
        categories: categories || [],
        categoriesLoading,
        favorecidoDocuments: favorecidoDocuments || [],
        documentsLoading,
        favorecidoLogs: favorecidoLogs || [],
        logsLoading,
        branches: branches || [],
        branchesLoading,
        bankAccounts: bankAccounts || [],
        bankAccountsLoading,
        users: users || [],
        usersLoading,

        // Mutations loading states
        isSavingFavorecido: createFavorecido.isPending || updateFavorecido.isPending || uploadPhoto.isPending,
        isSavingCategory: createCategory.isPending,
        isSavingBranch: createBranch.isPending || updateBranch.isPending,
        isSavingBankAccount: createBankAccount.isPending || updateBankAccount.isPending,
        isSavingUser: updateUserRole.isPending || setUserBranchAccess.isPending,
        isUploadingDocument: uploadDocument.isPending,

        // Handlers
        handlePhotoSelect,
        handleDocumentUpload,
        handleDeleteDocument,
        resetForm,
        handleSubmitFavorecido,
        handleDeleteFavorecido,
        openEditFavorecidoModal,
        handleSubmitCategory,
        handleDeleteCategory,
        resetBranchForm,
        handleSubmitBranch,
        handleDeleteBranch,
        handleReactivateBranch,
        openEditBranchModal,
        resetBankAccountForm,
        handleSubmitBankAccount,
        handleDeleteBankAccount,
        handleReactivateBankAccount,
        openEditBankAccountModal,
        resetUserForm,
        handleSubmitUser,
        openEditUserModal,
        toggleBranchSelection,
    };
}
