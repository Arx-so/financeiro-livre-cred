import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore, useBranchStore } from '@/stores';
import {
    useFavorecidos,
    useCreateFavorecido,
    useUpdateFavorecido,
    useDeleteFavorecido,
    useUploadFavorecidoPhoto,
    useDeleteFavorecidoPhoto,
    useFavorecidoDocuments,
    useUploadFavorecidoDocument,
    useDeleteFavorecidoDocument,
} from '@/hooks/useCadastros';
import { useEntityLogs } from '@/hooks/useActivityLogs';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import type {
    FavorecidoTipo,
    FavorecidoInsert,
    BankAccountType,
    PixKeyType,
} from '@/types/database';

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
    categoria_contratacao: string;
    notes: string;
    bank_name: string;
    bank_agency: string;
    bank_account: string;
    bank_account_type: BankAccountType | '';
    pix_key: string;
    pix_key_type: PixKeyType | '';
    preferred_payment_type: string;
    birth_date: string;
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
    categoria_contratacao: '',
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

export function useFavorecidosPage() {
    const user = useAuthStore((state) => state.user);
    const branchId = useBranchStore((state) => state.unidadeAtual?.id);

    // Confirmation dialog
    const { confirm, dialogProps } = useConfirmDialog();
    const [isDeleting, setIsDeleting] = useState(false);

    // Search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FavorecidoTipo | 'todos'>('todos');

    // Pagination
    const PAGE_SIZE = 24;
    const [currentPage, setCurrentPage] = useState(1);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Editing states
    const [editingId, setEditingId] = useState<string | null>(null);

    // File refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    // Form states
    const [formData, setFormData] = useState<FavorecidoFormData>(initialFavorecidoForm);

    // Photo state
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const handleSetSearchTerm = useCallback((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, []);

    const handleSetFilterType = useCallback((value: FavorecidoTipo | 'todos') => {
        setFilterType(value);
        setCurrentPage(1);
    }, []);

    // Fetch data
    const { data: favorecidosPage, isLoading: favorecidosLoading } = useFavorecidos({
        branchId,
        type: filterType === 'todos' ? undefined : filterType,
        search: searchTerm || undefined,
        isActive: true,
        page: currentPage,
        pageSize: PAGE_SIZE,
    });

    const { data: favorecidoDocuments, isLoading: documentsLoading, refetch: refetchDocuments } = useFavorecidoDocuments(editingId || '');
    const { data: favorecidoLogs, isLoading: logsLoading } = useEntityLogs('favorecido', editingId || '', !!editingId);

    // Mutations
    const createFavorecido = useCreateFavorecido();
    const updateFavorecido = useUpdateFavorecido();
    const deleteFavorecido = useDeleteFavorecido();
    const uploadPhoto = useUploadFavorecidoPhoto();
    const deletePhoto = useDeleteFavorecidoPhoto();
    const uploadDocument = useUploadFavorecidoDocument();
    const deleteDocument = useDeleteFavorecidoDocument();

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

    const handleRemovePhoto = useCallback(async () => {
        if (editingId && photoPreview) {
            try {
                await deletePhoto.mutateAsync({ favorecidoId: editingId, photoUrl: photoPreview });
                toast.success('Foto removida!');
            } catch {
                toast.error('Erro ao remover foto');
                return;
            }
        }
        setSelectedPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    }, [editingId, photoPreview, deletePhoto, fileInputRef, cameraInputRef]);

    const handleDocumentUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
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
            branch_id: branchId || null,
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
            categoria_contratacao: formData.categoria_contratacao || null,
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
    }, [formData, editingId, selectedPhoto, branchId, createFavorecido, updateFavorecido, uploadPhoto, resetForm]);

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
            categoria_contratacao: favorecido.categoria_contratacao || '',
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

    const totalCount = favorecidosPage?.count ?? 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return {
        // User
        user,

        // Dialog
        dialogProps,
        isDeleting,

        // Search and filters
        searchTerm,
        setSearchTerm: handleSetSearchTerm,
        filterType,
        setFilterType: handleSetFilterType,

        // Pagination
        currentPage,
        setCurrentPage,
        totalCount,
        totalPages,
        pageSize: PAGE_SIZE,

        // Modal states
        isModalOpen,
        setIsModalOpen,

        // Editing states
        editingId,

        // Refs
        fileInputRef,
        cameraInputRef,
        documentInputRef,

        // Form states
        formData,
        setFormData,

        // Photo state
        photoPreview,

        // Data
        favorecidos: favorecidosPage?.data || [],
        favorecidosLoading,
        favorecidoDocuments: favorecidoDocuments || [],
        documentsLoading,
        favorecidoLogs: favorecidoLogs || [],
        logsLoading,

        // Mutations loading states
        isSavingFavorecido: createFavorecido.isPending || updateFavorecido.isPending || uploadPhoto.isPending,
        isUploadingDocument: uploadDocument.isPending,
        isDeletingPhoto: deletePhoto.isPending,

        // Handlers
        handlePhotoSelect,
        handleRemovePhoto,
        handleDocumentUpload,
        handleDeleteDocument,
        resetForm,
        handleSubmitFavorecido,
        handleDeleteFavorecido,
        openEditFavorecidoModal,
    };
}
