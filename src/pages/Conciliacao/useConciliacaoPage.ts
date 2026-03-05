import {
    useState, useRef, useCallback, useMemo, useEffect
} from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useBranchStore } from '@/stores';
import {
    getBankAccounts,
    getBankStatements,
    createReconciliation,
    deleteReconciliation,
    getReconciliationSummary,
    findMatchCandidates,
    importBankStatements,
    getUnreconciledEntries,
} from '@/services/conciliacao';
import { createFinancialEntry } from '@/services/financeiro';
import {
    parseExcel, parseCSV, parseBankStatement, exportToExcel,
    type ColumnMapping,
} from '@/services/importExport';
import { useCategories } from '@/hooks/useCategorias';
import { useFavorecidos } from '@/hooks/useCadastros';
import type { EntryType, FinancialEntryInsert } from '@/types/database';

export interface NewEntryFormData {
    type: EntryType;
    description: string;
    value: string;
    due_date: string;
    category_id: string;
    favorecido_id: string;
    notes: string;
}

const initialNewEntryForm: NewEntryFormData = {
    type: 'despesa',
    description: '',
    value: '',
    due_date: '',
    category_id: '',
    favorecido_id: '',
    notes: '',
};

export function useConciliacaoPage() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Selection state
    const [selectedBanco, setSelectedBanco] = useState<string | null>(null);
    const [selectedExtrato, setSelectedExtrato] = useState<string | null>(null);
    const [selectedLancamento, setSelectedLancamento] = useState<string | null>(null);

    // UI state
    const [isImporting, setIsImporting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createAndReconcile, setCreateAndReconcile] = useState(true);

    // Form state for new entry
    const [newEntryForm, setNewEntryForm] = useState<NewEntryFormData>(initialNewEntryForm);

    // Fetch bank accounts
    const { data: bankAccounts } = useQuery({
        queryKey: ['bank-accounts', unidadeAtual?.id],
        queryFn: () => getBankAccounts(unidadeAtual?.id),
        enabled: !!unidadeAtual?.id,
    });

    // Effect to set default bank
    useEffect(() => {
        if (bankAccounts?.length && !selectedBanco) {
            setSelectedBanco(bankAccounts[0].id);
        }
    }, [bankAccounts, selectedBanco]);

    // Fetch statements for selected bank
    const { data: statements, isLoading: statementsLoading } = useQuery({
        queryKey: ['bank-statements', selectedBanco],
        queryFn: () => getBankStatements(selectedBanco!),
        enabled: !!selectedBanco,
    });

    // Fetch unreconciled entries
    const { data: entries, isLoading: entriesLoading } = useQuery({
        queryKey: ['unreconciled-entries', unidadeAtual?.id],
        queryFn: () => getUnreconciledEntries(unidadeAtual!.id),
        enabled: !!unidadeAtual?.id,
    });

    // Fetch reconciliation summary
    const { data: summary } = useQuery({
        queryKey: ['reconciliation-summary', selectedBanco],
        queryFn: () => getReconciliationSummary(selectedBanco!),
        enabled: !!selectedBanco,
    });

    // Find match candidates
    const { data: matchCandidates } = useQuery({
        queryKey: ['match-candidates', selectedBanco, unidadeAtual?.id],
        queryFn: () => findMatchCandidates(selectedBanco!, unidadeAtual!.id),
        enabled: !!selectedBanco && !!unidadeAtual?.id,
    });

    // Fetch categories and favorecidos for the create entry form
    const { data: categories } = useCategories();
    const { data: favorecidos } = useFavorecidos({ isActive: true, pageSize: 1000 });

    // Get selected statement for creating entry
    const selectedStatement = useMemo(
        () => statements?.find((s) => s.id === selectedExtrato),
        [statements, selectedExtrato],
    );

    // Reconcile mutation
    const reconcileMutation = useMutation({
        mutationFn: ({ statementId, entryId }: { statementId: string; entryId: string }) => (
            createReconciliation(statementId, entryId, user?.id)
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
            queryClient.invalidateQueries({ queryKey: ['unreconciled-entries'] });
            queryClient.invalidateQueries({ queryKey: ['reconciliation-summary'] });
            queryClient.invalidateQueries({ queryKey: ['match-candidates'] });
            setSelectedExtrato(null);
            setSelectedLancamento(null);
            toast.success('Conciliação realizada!');
        },
        onError: () => {
            toast.error('Erro ao conciliar');
        },
    });

    // Unreconcile mutation
    const unreconciledMutation = useMutation({
        mutationFn: deleteReconciliation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
            queryClient.invalidateQueries({ queryKey: ['unreconciled-entries'] });
            queryClient.invalidateQueries({ queryKey: ['reconciliation-summary'] });
            toast.success('Conciliação desfeita!');
        },
        onError: () => {
            toast.error('Erro ao desfazer conciliação');
        },
    });

    // Create entry mutation
    const createEntryMutation = useMutation({
        mutationFn: createFinancialEntry,
        onSuccess: async (data) => {
            if (createAndReconcile && selectedExtrato) {
                await reconcileMutation.mutateAsync({
                    statementId: selectedExtrato,
                    entryId: data.id,
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['unreconciled-entries'] });
            }
            setIsCreateModalOpen(false);
            setNewEntryForm(initialNewEntryForm);
            toast.success('Lançamento criado!');
        },
        onError: () => {
            toast.error('Erro ao criar lançamento');
        },
    });

    // Handlers
    const handleReconcile = useCallback(() => {
        if (!selectedExtrato || !selectedLancamento) {
            toast.error('Selecione um extrato e um lançamento');
            return;
        }
        reconcileMutation.mutate({
            statementId: selectedExtrato,
            entryId: selectedLancamento,
        });
    }, [selectedExtrato, selectedLancamento, reconcileMutation]);

    const handleUnreconcile = useCallback((reconciliationId: string) => {
        unreconciledMutation.mutate(reconciliationId);
    }, [unreconciledMutation]);

    const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedBanco) return;

        setIsImporting(true);
        try {
            const fileName = file.name.toLowerCase();
            let parsedStatements;

            // Default column mapping - adjust based on your bank statement format
            const defaultMapping: ColumnMapping = {
                date: 'Data',
                description: 'Descrição',
                value: 'Valor',
                type: 'Tipo',
            };

            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                const data = await parseExcel(file);
                parsedStatements = parseBankStatement(data, defaultMapping);
            } else if (fileName.endsWith('.csv')) {
                const data = await parseCSV(file);
                parsedStatements = parseBankStatement(data, defaultMapping);
            } else {
                toast.error('Formato não suportado. Use Excel ou CSV.');
                return;
            }

            if (parsedStatements.length > 0) {
                await importBankStatements(selectedBanco, parsedStatements);
                queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
                toast.success(`${parsedStatements.length} registros importados!`);
            } else {
                toast.error('Nenhum registro encontrado no arquivo');
            }
        } catch {
            toast.error('Erro ao importar arquivo');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [selectedBanco, queryClient]);

    const handleExport = useCallback(() => {
        if (!statements?.length) {
            toast.error('Não há dados para exportar');
            return;
        }

        const data = statements.map((s) => ({
            Data: s.date,
            Descrição: s.description,
            Valor: s.value,
            Tipo: s.type === 'credito' ? 'Crédito' : 'Débito',
            Conciliado: s.reconciliation_status === 'conciliado' ? 'Sim' : 'Não',
        }));

        exportToExcel(data, 'extrato-bancario');
        toast.success('Arquivo exportado!');
    }, [statements]);

    const openCreateModal = useCallback((statement?: any) => {
        if (statement) {
            setNewEntryForm({
                type: statement.type === 'credito' ? 'receita' : 'despesa',
                description: statement.description || '',
                value: Math.abs(statement.value).toString(),
                due_date: statement.date,
                category_id: '',
                favorecido_id: '',
                notes: '',
            });
            setSelectedExtrato(statement.id);
        }
        setIsCreateModalOpen(true);
    }, []);

    const handleCreateEntry = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!unidadeAtual?.id) {
            toast.error('Selecione uma filial');
            return;
        }

        const entryData: FinancialEntryInsert = {
            branch_id: unidadeAtual.id,
            type: newEntryForm.type,
            description: newEntryForm.description,
            value: parseFloat(newEntryForm.value) || 0,
            due_date: newEntryForm.due_date,
            payment_date: new Date().toISOString().split('T')[0],
            status: 'pago',
            category_id: newEntryForm.category_id || null,
            favorecido_id: newEntryForm.favorecido_id || null,
            notes: newEntryForm.notes || null,
            bank_account_id: selectedBanco,
        };

        createEntryMutation.mutate(entryData);
    }, [unidadeAtual?.id, newEntryForm, selectedBanco, createEntryMutation]);

    const resetNewEntryForm = useCallback(() => {
        setNewEntryForm(initialNewEntryForm);
        setSelectedExtrato(null);
    }, []);

    // Filtered lists
    const unreconciledStatements = useMemo(
        () => statements?.filter((s) => s.reconciliation_status !== 'conciliado') || [],
        [statements],
    );

    const reconciledStatements = useMemo(
        () => statements?.filter((s) => s.reconciliation_status === 'conciliado') || [],
        [statements],
    );

    return {
        // User and branch
        user,
        unidadeAtual,

        // Refs
        fileInputRef,

        // Selection state
        selectedBanco,
        setSelectedBanco,
        selectedExtrato,
        setSelectedExtrato,
        selectedLancamento,
        setSelectedLancamento,

        // UI state
        isImporting,
        isCreateModalOpen,
        setIsCreateModalOpen,
        createAndReconcile,
        setCreateAndReconcile,

        // Form state
        newEntryForm,
        setNewEntryForm,
        resetNewEntryForm,

        // Data
        bankAccounts: bankAccounts || [],
        statements: statements || [],
        unreconciledStatements,
        reconciledStatements,
        statementsLoading,
        entries: entries || [],
        entriesLoading,
        summary,
        matchCandidates: matchCandidates || [],
        categories: categories || [],
        favorecidos: favorecidos?.data || [],
        selectedStatement,

        // Mutation states
        isReconciling: reconcileMutation.isPending,
        isUnreconciling: unreconciledMutation.isPending,
        isCreatingEntry: createEntryMutation.isPending,

        // Handlers
        handleReconcile,
        handleUnreconcile,
        handleImport,
        handleExport,
        openCreateModal,
        handleCreateEntry,
    };
}
