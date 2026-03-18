import {
    useState, useCallback, useMemo, useEffect
} from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { useBranchStore } from '@/stores';
import {
    usePayrolls,
    usePayrollSummary,
    useCreatePayroll,
    useUpdatePayroll,
    useDeletePayroll,
    useGenerateFinancialEntry,
    useCreateBatchPayroll,
    useHiringCategories,
} from '@/hooks/useFolhaPagamento';
import { useFuncionarios } from '@/hooks/useCadastros';
import { calculateNetSalary, type BatchPayrollConfig } from '@/services/folhaPagamento';
import type { PayrollInsert, PayrollUpdate } from '@/types/database';

interface FormData {
    employee_id: string;
    reference_month: string;
    reference_year: string;
    recurring_months: string;
    base_salary: string;
    overtime_hours: string;
    overtime_value: string;
    transport_allowance: string;
    meal_allowance: string;
    other_benefits: string;
    inss_discount: string;
    irrf_discount: string;
    other_discounts: string;
    notes: string;
}

const currentDate = new Date();
const initialFormData: FormData = {
    employee_id: '',
    reference_month: String(currentDate.getMonth() + 1),
    reference_year: String(currentDate.getFullYear()),
    recurring_months: '1',
    base_salary: '0',
    overtime_hours: '0',
    overtime_value: '0',
    transport_allowance: '0',
    meal_allowance: '0',
    other_benefits: '0',
    inss_discount: '0',
    irrf_discount: '0',
    other_discounts: '0',
    notes: '',
};

export function useFolhaPagamentoPage() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    // State
    const [filterMonth, setFilterMonth] = useState(currentDate.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(currentDate.getFullYear());
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchConfig, setBatchConfig] = useState({
        filterType: 'all' as 'all' | 'category',
        categoria_contratacao: undefined as string | undefined,
        is_recurring: false,
        recurrence_type: null as 'infinite' | 'fixed_months' | null,
        recurrence_months: 3,
    });

    // Dialog
    const { confirm, dialogProps } = useConfirmDialog();

    // Queries
    const { data: payrolls, isLoading: payrollsLoading } = usePayrolls({
        month: filterMonth,
        year: filterYear,
        categoriaContratacao: filterCategory || undefined,
    });
    const { data: summary } = usePayrollSummary(filterMonth, filterYear);
    const { data: funcionariosPage } = useFuncionarios();
    const { data: hiringCategories = [] } = useHiringCategories();

    // Mutations
    const createMutation = useCreatePayroll();
    const updateMutation = useUpdatePayroll();
    const deleteMutation = useDeletePayroll();
    const generateEntryMutation = useGenerateFinancialEntry();
    const createBatchMutation = useCreateBatchPayroll();

    // Calculate net salary whenever form data changes
    const calculatedNetSalary = useMemo(() => calculateNetSalary({
        base_salary: parseFloat(formData.base_salary) || 0,
        overtime_value: parseFloat(formData.overtime_value) || 0,
        transport_allowance: parseFloat(formData.transport_allowance) || 0,
        meal_allowance: parseFloat(formData.meal_allowance) || 0,
        other_benefits: parseFloat(formData.other_benefits) || 0,
        inss_discount: parseFloat(formData.inss_discount) || 0,
        irrf_discount: parseFloat(formData.irrf_discount) || 0,
        other_discounts: parseFloat(formData.other_discounts) || 0,
    }), [formData]);

    // Handlers
    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setEditingId(null);
        setIsBatchMode(false);
        setBatchConfig({
            filterType: 'all',
            categoria_contratacao: undefined,
            is_recurring: false,
            recurrence_type: null,
            recurrence_months: 3,
        });
    }, []);

    const openModal = useCallback(() => {
        resetForm();
        setIsModalOpen(true);
    }, [resetForm]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        resetForm();
    }, [resetForm]);

    const openEditModal = useCallback((payroll: any) => {
        setFormData({
            employee_id: payroll.employee_id,
            reference_month: String(payroll.reference_month),
            reference_year: String(payroll.reference_year),
            base_salary: payroll.base_salary?.toString() || '0',
            overtime_hours: payroll.overtime_hours?.toString() || '0',
            overtime_value: payroll.overtime_value?.toString() || '0',
            transport_allowance: payroll.transport_allowance?.toString() || '0',
            meal_allowance: payroll.meal_allowance?.toString() || '0',
            other_benefits: payroll.other_benefits?.toString() || '0',
            inss_discount: payroll.inss_discount?.toString() || '0',
            irrf_discount: payroll.irrf_discount?.toString() || '0',
            other_discounts: payroll.other_discounts?.toString() || '0',
            notes: payroll.notes || '',
        });
        setEditingId(payroll.id);
        setIsModalOpen(true);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!unidadeAtual?.id) {
            toast.error('Selecione uma filial');
            return;
        }

        if (!formData.employee_id) {
            toast.error('Selecione um funcionário');
            return;
        }

        const basePayrollData = {
            branch_id: unidadeAtual.id,
            employee_id: formData.employee_id,
            base_salary: parseFloat(formData.base_salary) || 0,
            overtime_hours: parseFloat(formData.overtime_hours) || 0,
            overtime_value: parseFloat(formData.overtime_value) || 0,
            transport_allowance: parseFloat(formData.transport_allowance) || 0,
            meal_allowance: parseFloat(formData.meal_allowance) || 0,
            other_benefits: parseFloat(formData.other_benefits) || 0,
            inss_discount: parseFloat(formData.inss_discount) || 0,
            irrf_discount: parseFloat(formData.irrf_discount) || 0,
            other_discounts: parseFloat(formData.other_discounts) || 0,
            net_salary: calculatedNetSalary,
            notes: formData.notes || null,
        };

        const startMonth = parseInt(formData.reference_month, 10);
        const startYear = parseInt(formData.reference_year, 10);
        const months = Math.max(1, parseInt(formData.recurring_months, 10) || 1);

        try {
            if (editingId) {
                const payrollData: PayrollUpdate = {
                    ...basePayrollData,
                    reference_month: startMonth,
                    reference_year: startYear,
                };
                await updateMutation.mutateAsync({ id: editingId, data: payrollData });
                toast.success('Folha de pagamento atualizada!');
            } else {
                let created = 0;
                let skipped = 0;
                for (let i = 0; i < months; i++) {
                    const totalMonths = startMonth - 1 + i;
                    const month = (totalMonths % 12) + 1;
                    const year = startYear + Math.floor(totalMonths / 12);
                    const payrollData: PayrollInsert = {
                        ...basePayrollData,
                        reference_month: month,
                        reference_year: year,
                    };
                    try {
                        await createMutation.mutateAsync(payrollData);
                        created++;
                    } catch (err: any) {
                        if (err?.code === '23505') skipped++;
                        else throw err;
                    }
                }
                if (skipped > 0) {
                    toast.warning(`${created} criada(s), ${skipped} já existente(s) ignorada(s).`);
                } else {
                    toast.success(created === 1 ? 'Folha de pagamento criada!' : `${created} folhas criadas!`);
                }
            }
            closeModal();
        } catch (error: any) {
            toast.error(editingId ? 'Erro ao atualizar folha' : 'Erro ao criar folha');
        }
    }, [formData, editingId, unidadeAtual?.id, calculatedNetSalary, createMutation, updateMutation, closeModal]);

    const handleDelete = useCallback((id: string, employeeName: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteMutation.mutateAsync(id);
                toast.success('Folha de pagamento excluída!');
            } catch (error) {
                toast.error('Erro ao excluir folha');
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir folha de pagamento',
            description: `Tem certeza que deseja excluir a folha de "${employeeName}"?`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteMutation]);

    const handleGenerateEntry = useCallback(async (id: string) => {
        try {
            await generateEntryMutation.mutateAsync(id);
            toast.success('Lançamento financeiro gerado com sucesso!');
        } catch (error: any) {
            toast.error(error?.message || 'Erro ao gerar lançamento');
        }
    }, [generateEntryMutation]);

    const handleBatchSubmit = useCallback(async (config: BatchPayrollConfig) => {
        if (!unidadeAtual?.id) {
            toast.error('Selecione uma filial');
            return;
        }

        try {
            const result = await createBatchMutation.mutateAsync(config);
            const count = result.length;
            toast.success(`${count} folha(s) de pagamento criada(s) com sucesso!`);
            closeModal();
        } catch (error: any) {
            if (error?.code === '23505') {
                toast.error('Algumas folhas já existem para os funcionários selecionados');
            } else {
                toast.error(error?.message || 'Erro ao criar folhas em lote');
            }
        }
    }, [unidadeAtual?.id, createBatchMutation, closeModal]);

    const toggleBatchMode = useCallback(() => {
        setIsBatchMode((prev) => !prev);
    }, []);

    const isSaving = createMutation.isPending || updateMutation.isPending || createBatchMutation.isPending;

    return {
        // Branch
        unidadeAtual,

        // State
        filterMonth,
        setFilterMonth,
        filterYear,
        setFilterYear,
        filterCategory,
        setFilterCategory,
        isModalOpen,
        setIsModalOpen,
        editingId,
        formData,
        setFormData,
        isDeleting,

        // Dialog
        dialogProps,

        // Data
        payrolls: payrolls || [],
        payrollsLoading,
        summary,
        funcionarios: funcionariosPage?.data || [],
        hiringCategories,
        calculatedNetSalary,

        // Flags
        isSaving,
        isGeneratingEntry: generateEntryMutation.isPending,

        // Batch mode
        isBatchMode,
        setIsBatchMode,
        batchConfig,
        setBatchConfig,
        toggleBatchMode,
        handleBatchSubmit,

        // Handlers
        openModal,
        closeModal,
        openEditModal,
        handleSubmit,
        handleDelete,
        handleGenerateEntry,
        resetForm,
    };
}
