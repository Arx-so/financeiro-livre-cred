import {
    useState, useEffect, useCallback, useMemo, useRef
} from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    useFinancialEntries,
    useFinancialSummary,
    useCreateFinancialEntry,
    useCreateFinancialEntries,
    useUpdateFinancialEntry,
    useDeleteFinancialEntries,
    useMarkAsPaid,
    useUpdateOverdueEntries,
    calculateRecurringDates,
} from '@/hooks/useFinanceiro';
import { useCategories, useSubcategories } from '@/hooks/useCategorias';
import { useFavorecidos, useCreateFavorecido, useUploadFavorecidoPhoto } from '@/hooks/useCadastros';
import { getBankAccounts } from '@/services/conciliacao';
import {
    exportToExcel, exportToCSV, parseExcel, parseCSV, parseXML, parseNFE
} from '@/services/importExport';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import type {
    EntryType, EntryStatus, FinancialEntryInsert, RecurrenceType
} from '@/types/database';

export interface FinanceiroFormData {
    type: EntryType;
    description: string;
    value: string;
    due_date: string;
    payment_date: string;
    status: EntryStatus;
    category_id: string;
    subcategory_id: string;
    favorecido_id: string;
    bank_account_id: string;
    notes: string;
    is_recurring: boolean;
    recurrence_type: RecurrenceType | '';
    recurrence_day: string;
    recurrence_count: string;
    recurrence_end_date: string;
}

const initialFormData: FinanceiroFormData = {
    type: 'receita',
    description: '',
    value: '',
    due_date: '',
    payment_date: '',
    status: 'pendente',
    category_id: '',
    subcategory_id: '',
    favorecido_id: '',
    bank_account_id: '',
    notes: '',
    is_recurring: false,
    recurrence_type: '',
    recurrence_day: '',
    recurrence_count: '12',
    recurrence_end_date: '',
};

function getMonthDateRange(monthStr: string) {
    if (!monthStr) return { startDate: undefined, endDate: undefined };
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { startDate, endDate };
}

export function useFinanceiroPage() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    // Confirmation dialog
    const { confirm, dialogProps } = useConfirmDialog();
    const [isDeleting, setIsDeleting] = useState(false);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState<'todos' | EntryType>('todos');
    const [filterMonth, setFilterMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Favorecido modal state
    const [isFavorecidoModalOpen, setIsFavorecidoModalOpen] = useState(false);
    const [favorecidoFormData, setFavorecidoFormData] = useState<any>({
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
    });
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const favorecidoFileInputRef = useRef<HTMLInputElement>(null);
    const favorecidoDocumentInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState<FinanceiroFormData>(initialFormData);

    // File input refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calculate date range
    const { startDate, endDate } = useMemo(() => getMonthDateRange(filterMonth), [filterMonth]);

    // Fetch data
    const { data: entries, isLoading: entriesLoading } = useFinancialEntries({
        type: filterTipo === 'todos' ? undefined : filterTipo,
        search: searchTerm || undefined,
        startDate,
        endDate,
    });
    const { data: summary } = useFinancialSummary(undefined, startDate, endDate);
    const { data: categories } = useCategories();
    const { data: subcategories } = useSubcategories(formData.category_id);
    const { refetch: refetchFavorecidos } = useFavorecidos({ isActive: true });
    const { data: bankAccounts } = useQuery({
        queryKey: ['bank-accounts', unidadeAtual?.id],
        queryFn: () => getBankAccounts(unidadeAtual?.id),
        enabled: !!unidadeAtual?.id,
    });

    // Favorecido mutations
    const createFavorecido = useCreateFavorecido();
    const uploadPhoto = useUploadFavorecidoPhoto();

    // Mutations
    const createEntry = useCreateFinancialEntry();
    const createEntries = useCreateFinancialEntries();
    const updateEntry = useUpdateFinancialEntry();
    const deleteEntries = useDeleteFinancialEntries();
    const markPaid = useMarkAsPaid();
    const updateOverdue = useUpdateOverdueEntries();

    // Auto-update overdue entries on page load
    useEffect(() => {
        if (unidadeAtual?.id) {
            updateOverdue.mutate();
        }
    }, [unidadeAtual?.id]);

    const filteredEntries = useMemo(() => entries || [], [entries]);

    // Handlers
    const handleSelectAll = useCallback(() => {
        if (selectedIds.length === filteredEntries.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredEntries.map((l) => l.id));
        }
    }, [selectedIds.length, filteredEntries]);

    const handleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((i) => i !== id);
            }
            return [...prev, id];
        });
    }, []);

    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setEditingId(null);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!unidadeAtual?.id) {
            toast.error('Selecione uma filial');
            return;
        }

        const entryData: FinancialEntryInsert = {
            branch_id: unidadeAtual.id,
            type: formData.type,
            description: formData.description,
            value: parseFloat(formData.value) || 0,
            due_date: formData.due_date,
            payment_date: formData.status === 'pago' ? (formData.payment_date || new Date().toISOString().split('T')[0]) : null,
            status: formData.status,
            category_id: formData.category_id || null,
            subcategory_id: formData.subcategory_id || null,
            favorecido_id: formData.favorecido_id || null,
            bank_account_id: formData.bank_account_id || null,
            notes: formData.notes || null,
            ...(formData.is_recurring && {
                is_recurring: true,
                recurrence_type: formData.recurrence_type || null,
                recurrence_day: formData.recurrence_day ? parseInt(formData.recurrence_day, 10) : null,
                recurrence_end_date: formData.recurrence_end_date || null,
            }),
        };

        try {
            if (editingId) {
                await updateEntry.mutateAsync({ id: editingId, entry: entryData });
                toast.success('Lançamento atualizado!');
            } else if (formData.is_recurring && formData.recurrence_type) {
                // Use end date if provided, otherwise use count
                const endDateOrCount = formData.recurrence_end_date
                    || parseInt(formData.recurrence_count, 10)
                    || 12;

                const dates = calculateRecurringDates(
                    formData.due_date,
                    formData.recurrence_type as RecurrenceType,
                    formData.recurrence_day ? parseInt(formData.recurrence_day, 10) : undefined,
                    endDateOrCount,
                );

                const entriesToCreate = dates.map((date, index) => ({
                    ...entryData,
                    due_date: date,
                    description: `${formData.description} (${index + 1}/${dates.length})`,
                }));

                await createEntries.mutateAsync(entriesToCreate);
                toast.success(`${dates.length} lançamentos recorrentes criados!`);
            } else {
                await createEntry.mutateAsync(entryData);
                toast.success('Lançamento criado!');
            }

            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            toast.error('Erro ao salvar lançamento');
        }
    }, [unidadeAtual?.id, formData, editingId, createEntry, createEntries, updateEntry, resetForm]);

    const handleDelete = useCallback((ids: string[]) => {
        const count = ids.length;
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteEntries.mutateAsync(ids);
                setSelectedIds([]);
                toast.success(`${count} lançamento(s) excluído(s)!`);
            } catch (error) {
                toast.error('Erro ao excluir lançamentos');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir lançamentos',
            description: `Tem certeza que deseja excluir ${count} lançamento(s)? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteEntries]);

    const handleMarkPaid = useCallback(async (id: string) => {
        try {
            await markPaid.mutateAsync({ id });
            toast.success('Lançamento marcado como pago!');
        } catch (error) {
            toast.error('Erro ao marcar como pago');
        }
    }, [markPaid]);

    const handleCancel = useCallback(async (id: string) => {
        confirm(async () => {
            try {
                await updateEntry.mutateAsync({
                    id,
                    entry: { status: 'cancelado' },
                });
                toast.success('Lançamento cancelado!');
            } catch (error) {
                toast.error('Erro ao cancelar lançamento');
            }
        }, {
            title: 'Cancelar lançamento',
            description: 'Tem certeza que deseja cancelar este lançamento?',
            confirmText: 'Cancelar lançamento',
        });
    }, [confirm, updateEntry]);

    const openEditModal = useCallback((entry: NonNullable<typeof entries>[0]) => {
        setFormData({
            type: entry.type,
            description: entry.description,
            value: entry.value.toString(),
            due_date: entry.due_date,
            payment_date: entry.payment_date || '',
            status: entry.status,
            category_id: entry.category_id || '',
            subcategory_id: entry.subcategory_id || '',
            favorecido_id: entry.favorecido_id || '',
            bank_account_id: entry.bank_account_id || '',
            notes: entry.notes || '',
            is_recurring: entry.is_recurring || false,
            recurrence_type: entry.recurrence_type || '',
            recurrence_day: entry.recurrence_day?.toString() || '',
            recurrence_count: '12',
            recurrence_end_date: entry.recurrence_end_date || '',
        });
        setEditingId(entry.id);
        setIsModalOpen(true);
    }, []);

    const handleExport = useCallback((format: 'excel' | 'csv') => {
        if (!filteredEntries.length) {
            toast.error('Não há dados para exportar');
            return;
        }

        const data = filteredEntries.map((entry) => ({
            Descrição: entry.description,
            Tipo: entry.type === 'receita' ? 'Receita' : 'Despesa',
            Valor: entry.value,
            Vencimento: entry.due_date,
            Status: entry.status,
            Categoria: entry.category?.name || '',
            Favorecido: entry.favorecido?.name || '',
        }));

        if (format === 'excel') {
            exportToExcel(data, `financeiro-${filterMonth}`);
        } else {
            exportToCSV(data, `financeiro-${filterMonth}`);
        }
        toast.success('Arquivo exportado!');
    }, [filteredEntries, filterMonth]);

    const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !unidadeAtual?.id) return;

        const fileName = file.name.toLowerCase();

        try {
            let parsedEntries: FinancialEntryInsert[] = [];

            if (fileName.endsWith('.xml')) {
                parsedEntries = await parseXML(file, unidadeAtual.id);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                parsedEntries = await parseExcel(file, unidadeAtual.id);
            } else if (fileName.endsWith('.csv')) {
                parsedEntries = await parseCSV(file, unidadeAtual.id);
            } else {
                toast.error('Formato não suportado');
                return;
            }

            if (parsedEntries.length > 0) {
                await createEntries.mutateAsync(parsedEntries);
                toast.success(`${parsedEntries.length} lançamentos importados!`);
            } else {
                toast.error('Nenhum lançamento encontrado no arquivo');
            }
        } catch (error) {
            toast.error('Erro ao importar arquivo');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [unidadeAtual?.id, createEntries]);

    const handleImportNFE = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !unidadeAtual?.id) return;

        try {
            const parsedEntry = await parseNFE(file, unidadeAtual.id);
            if (parsedEntry) {
                setFormData({
                    type: parsedEntry.type || 'despesa',
                    description: parsedEntry.description || '',
                    value: parsedEntry.value?.toString() || '',
                    due_date: parsedEntry.due_date || '',
                    payment_date: '',
                    status: 'pendente',
                    category_id: '',
                    subcategory_id: '',
                    favorecido_id: '',
                    bank_account_id: '',
                    notes: parsedEntry.notes || '',
                    is_recurring: false,
                    recurrence_type: '',
                    recurrence_day: '',
                    recurrence_end_date: '',
                });
                setIsModalOpen(true);
                toast.success('NFE importada! Revise os dados antes de salvar.');
            }
        } catch (error) {
            toast.error('Erro ao importar NFE');
        }

        if (e.target) {
            e.target.value = '';
        }
    }, [unidadeAtual?.id]);

    // Month navigation
    const navigateMonth = useCallback((direction: 'prev' | 'next') => {
        const [year, month] = filterMonth.split('-').map(Number);
        const newDate = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
        setFilterMonth(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`);
    }, [filterMonth]);

    const currentMonthLabel = useMemo(() => {
        const [year, month] = filterMonth.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }, [filterMonth]);

    // Favorecido handlers
    const resetFavorecidoForm = useCallback(() => {
        setFavorecidoFormData({
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
        });
        setSelectedPhoto(null);
        setPhotoPreview(null);
    }, []);

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

    const handleSubmitFavorecido = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const favorecidoData = {
                type: favorecidoFormData.type,
                name: favorecidoFormData.name,
                document: favorecidoFormData.document || null,
                email: favorecidoFormData.email || null,
                phone: favorecidoFormData.phone || null,
                address: favorecidoFormData.address || null,
                city: favorecidoFormData.city || null,
                state: favorecidoFormData.state || null,
                zip_code: favorecidoFormData.zip_code || null,
                category: favorecidoFormData.category || null,
                categoria_contratacao: favorecidoFormData.categoria_contratacao || null,
                notes: favorecidoFormData.notes || null,
                bank_name: favorecidoFormData.bank_name || null,
                bank_agency: favorecidoFormData.bank_agency || null,
                bank_account: favorecidoFormData.bank_account || null,
                bank_account_type: favorecidoFormData.bank_account_type || null,
                pix_key: favorecidoFormData.pix_key || null,
                pix_key_type: favorecidoFormData.pix_key_type || null,
                preferred_payment_type: favorecidoFormData.preferred_payment_type || null,
                birth_date: favorecidoFormData.birth_date || null,
            };

            const newFavorecido = await createFavorecido.mutateAsync(favorecidoData);

            // Upload photo if selected
            if (selectedPhoto && newFavorecido.id) {
                await uploadPhoto.mutateAsync({ favorecidoId: newFavorecido.id, file: selectedPhoto });
            }

            // Refresh favorecidos list
            await refetchFavorecidos();

            // Select the new favorecido in the entry form
            setFormData((prev) => ({ ...prev, favorecido_id: newFavorecido.id }));

            toast.success('Favorecido criado com sucesso!');
            setIsFavorecidoModalOpen(false);
            resetFavorecidoForm();
        } catch (error) {
            toast.error('Erro ao criar favorecido');
        }
    }, [favorecidoFormData, selectedPhoto, createFavorecido, uploadPhoto, refetchFavorecidos, setFormData]);

    return {
        // Branch
        unidadeAtual,

        // Dialog
        confirm,
        dialogProps,
        isDeleting,

        // Selection
        selectedIds,
        handleSelectAll,
        handleSelect,

        // Filters
        searchTerm,
        setSearchTerm,
        filterTipo,
        setFilterTipo,
        filterMonth,
        setFilterMonth,
        navigateMonth,
        currentMonthLabel,

        // Modal
        isModalOpen,
        setIsModalOpen,
        editingId,

        // Form
        formData,
        setFormData,
        resetForm,

        // Refs
        fileInputRef,

        // Data
        entries: filteredEntries,
        entriesLoading,
        summary,
        categories: categories || [],
        subcategories: subcategories || [],
        bankAccounts: bankAccounts || [],

        // Mutation states
        isSaving: createEntry.isPending || createEntries.isPending || updateEntry.isPending,
        isMarkingPaid: markPaid.isPending,

        // Handlers
        handleSubmit,
        handleDelete,
        handleMarkPaid,
        handleCancel,
        openEditModal,
        handleExport,
        handleImport,
        handleImportNFE,

        // Favorecido modal
        isFavorecidoModalOpen,
        setIsFavorecidoModalOpen,
        favorecidoFormData,
        setFavorecidoFormData,
        photoPreview,
        favorecidoFileInputRef,
        favorecidoDocumentInputRef,
        handlePhotoSelect,
        handleSubmitFavorecido,
        resetFavorecidoForm,
        isSavingFavorecido: createFavorecido.isPending || uploadPhoto.isPending,
    };
}
