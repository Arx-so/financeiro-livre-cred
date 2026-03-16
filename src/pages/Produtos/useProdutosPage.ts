import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    useProducts,
    useProductsSummary,
    useProductCategories,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
} from '@/hooks/useProducts';
import type {
    ProductInsert, ProductUpdate, ProductOtherFees, ProductCommissionReceivedBy
} from '@/types/database';
import type { ProductFormData } from '@/pages/Produtos/components/ProductForm';
import type { ProductWithCategory } from '@/services/products';

const initialFormData: ProductFormData = {
    name: '',
    code: '',
    description: '',
    commercial_description: '',
    product_category_id: '',
    reference_value: '0',
    bank_percentage: '0',
    company_percentage: '0',
    is_active: true,
    eligible_client_type: '',
    target_audience: [],
    value_min: '',
    value_max: '',
    term_months_min: '',
    term_months_max: '',
    interest_rate_min: '',
    interest_rate_max: '',
    billing_type: [],
    iof_applicable: false,
    iof_percentage: '',
    other_fees_cadastro: '',
    other_fees_operacao: '',
    other_fees_seguro: '',
    specific_rules: '',
    commission_type: '',
    commission_pct: '',
    commission_min: '',
    commission_max: '',
    commission_received_by_product: '',
    commission_received_by_term: '',
    commission_received_by_value: '',
    commission_payment_day: '',
    required_docs: [],
    required_docs_other: '',
    recurrence_type: 'unico',
};

function parseSpecificRules(value: string): Record<string, unknown> | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;
    try {
        const parsed = JSON.parse(trimmed);
        return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
        return null;
    }
}

export function useProdutosPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [filterActive, setFilterActive] = useState<'todos' | 'ativos' | 'inativos'>('todos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [isDeleting, setIsDeleting] = useState(false);

    const { confirm, dialogProps } = useConfirmDialog();

    const filters = useMemo(
        () => ({
            search: searchTerm || undefined,
            productCategoryId: filterCategory || undefined,
            isActive: filterActive === 'todos' ? undefined : filterActive === 'ativos',
        }),
        [searchTerm, filterCategory, filterActive]
    );

    const { data: products, isLoading: productsLoading } = useProducts(filters);
    const { data: summary } = useProductsSummary();
    const { data: productCategories } = useProductCategories();

    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();
    const deleteMutation = useDeleteProduct();

    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setEditingId(null);
    }, []);

    const openModal = useCallback(() => {
        resetForm();
        setIsModalOpen(true);
    }, [resetForm]);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        resetForm();
    }, [resetForm]);

    const openEditModal = useCallback((product: ProductWithCategory) => {
        const bankVal = Number(product.bank_value) || 0;
        const companyVal = Number(product.company_value) || 0;
        const refTotal = bankVal + companyVal;
        const ref = refTotal > 0 ? refTotal : 1;
        const bankPct = ref > 0 ? (bankVal / ref) * 100 : (Number(product.bank_percentage) || 0);
        const companyPct = ref > 0 ? (companyVal / ref) * 100 : (Number(product.company_percentage) || 0);

        const targetAudience = Array.isArray(product.target_audience)
            ? (product.target_audience as string[])
            : [];
        const billingType = Array.isArray(product.billing_type) ? (product.billing_type as string[]) : [];
        const requiredDocs = Array.isArray(product.required_docs) ? (product.required_docs as string[]) : [];

        const otherFees = product.other_fees as ProductOtherFees | null | undefined;
        const commissionReceived = product.commission_received_by as ProductCommissionReceivedBy | null | undefined;

        setFormData({
            name: product.name,
            code: product.code || '',
            description: product.description || '',
            commercial_description: product.commercial_description || '',
            product_category_id: product.product_category_id || '',
            reference_value: refTotal > 0 ? String(refTotal) : '0',
            bank_percentage: String(Math.round(bankPct * 100) / 100),
            company_percentage: String(Math.round(companyPct * 100) / 100),
            is_active: product.is_active,
            eligible_client_type: product.eligible_client_type || '',
            target_audience: targetAudience,
            value_min: product.value_min != null ? String(product.value_min) : '',
            value_max: product.value_max != null ? String(product.value_max) : '',
            term_months_min: product.term_months_min != null ? String(product.term_months_min) : '',
            term_months_max: product.term_months_max != null ? String(product.term_months_max) : '',
            interest_rate_min: product.interest_rate_min != null ? String(product.interest_rate_min) : '',
            interest_rate_max: product.interest_rate_max != null ? String(product.interest_rate_max) : '',
            billing_type: billingType,
            iof_applicable: product.iof_applicable ?? false,
            iof_percentage: otherFees?.iof != null ? String(otherFees.iof) : '',
            other_fees_cadastro: otherFees?.cadastro != null ? String(otherFees.cadastro) : '',
            other_fees_operacao: otherFees?.operacao != null ? String(otherFees.operacao) : '',
            other_fees_seguro: otherFees?.seguro != null ? String(otherFees.seguro) : '',
            specific_rules:
                product.specific_rules && typeof product.specific_rules === 'object'
                    ? JSON.stringify(product.specific_rules, null, 2)
                    : '',
            commission_type: product.commission_type || '',
            commission_pct: product.commission_pct != null ? String(product.commission_pct) : '',
            commission_min: product.commission_min != null ? String(product.commission_min) : '',
            commission_max: product.commission_max != null ? String(product.commission_max) : '',
            commission_received_by_product:
                commissionReceived?.by_product != null ? String(commissionReceived.by_product) : '',
            commission_received_by_term:
                commissionReceived?.by_term != null ? String(commissionReceived.by_term) : '',
            commission_received_by_value:
                commissionReceived?.by_value != null ? String(commissionReceived.by_value) : '',
            commission_payment_day:
                product.commission_payment_day != null ? String(product.commission_payment_day) : '',
            required_docs: requiredDocs,
            required_docs_other: product.required_docs_other || '',
            recurrence_type: product.recurrence_type || 'unico',
        });
        setEditingId(product.id);
        setIsModalOpen(true);
    }, []);

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            if (!formData.name.trim()) {
                toast.error('Nome é obrigatório');
                return;
            }

            const ref = parseFloat(formData.reference_value) || 0;
            const bankPct = parseFloat(formData.bank_percentage) || 0;
            const companyPct = parseFloat(formData.company_percentage) || 0;
            const bank_value = (ref * bankPct) / 100;
            const company_value = (ref * companyPct) / 100;

            const other_fees: ProductOtherFees = {};
            const cad = parseFloat(formData.other_fees_cadastro);
            const ope = parseFloat(formData.other_fees_operacao);
            const seg = parseFloat(formData.other_fees_seguro);
            const iofPct = parseFloat(formData.iof_percentage);
            if (Number.isFinite(cad) && cad > 0) other_fees.cadastro = cad;
            if (Number.isFinite(ope) && ope > 0) other_fees.operacao = ope;
            if (Number.isFinite(seg) && seg > 0) other_fees.seguro = seg;
            if (formData.iof_applicable && Number.isFinite(iofPct) && iofPct > 0) other_fees.iof = iofPct;

            const commission_received_by: ProductCommissionReceivedBy = {};
            const crProduct = parseFloat(formData.commission_received_by_product);
            const crTerm = parseFloat(formData.commission_received_by_term);
            const crValue = parseFloat(formData.commission_received_by_value);
            if (Number.isFinite(crProduct) && crProduct > 0) commission_received_by.by_product = crProduct;
            if (Number.isFinite(crTerm) && crTerm > 0) commission_received_by.by_term = crTerm;
            if (Number.isFinite(crValue) && crValue > 0) commission_received_by.by_value = crValue;

            const specific_rules = parseSpecificRules(formData.specific_rules);
            const commissionPaymentDay = formData.commission_payment_day.trim();
            const commission_payment_day = commissionPaymentDay !== '' && /^\d+$/.test(commissionPaymentDay)
                ? Math.min(31, Math.max(1, parseInt(commissionPaymentDay, 10)))
                : null;

            const productData: ProductInsert | ProductUpdate = {
                name: formData.name.trim(),
                code: formData.code.trim() || null,
                description: formData.description.trim() || null,
                commercial_description: formData.commercial_description.trim() || null,
                product_category_id: formData.product_category_id || null,
                bank_value,
                bank_percentage: bankPct,
                company_value,
                company_percentage: companyPct,
                is_active: formData.is_active,
                eligible_client_type: formData.eligible_client_type.trim() || null,
                target_audience: formData.target_audience.length > 0 ? formData.target_audience : null,
                value_min: formData.value_min !== '' ? parseFloat(formData.value_min) || null : null,
                value_max: formData.value_max !== '' ? parseFloat(formData.value_max) || null : null,
                term_months_min:
                    formData.term_months_min !== ''
                        ? parseInt(formData.term_months_min, 10) || null
                        : null,
                term_months_max:
                    formData.term_months_max !== ''
                        ? parseInt(formData.term_months_max, 10) || null
                        : null,
                interest_rate_min:
                    formData.interest_rate_min !== ''
                        ? parseFloat(formData.interest_rate_min) || null
                        : null,
                interest_rate_max:
                    formData.interest_rate_max !== ''
                        ? parseFloat(formData.interest_rate_max) || null
                        : null,
                billing_type: formData.billing_type.length > 0 ? formData.billing_type : null,
                iof_applicable: formData.iof_applicable,
                other_fees: Object.keys(other_fees).length > 0 ? other_fees : null,
                specific_rules,
                commission_type:
                    (formData.commission_type === 'fixa' || formData.commission_type === 'percentual'
                        ? formData.commission_type
                        : null) as 'fixa' | 'percentual' | null,
                commission_pct:
                    formData.commission_pct !== '' ? parseFloat(formData.commission_pct) || null : null,
                commission_min:
                    formData.commission_min !== ''
                        ? parseFloat(formData.commission_min) || null
                        : null,
                commission_max:
                    formData.commission_max !== ''
                        ? parseFloat(formData.commission_max) || null
                        : null,
                commission_received_by:
                    Object.keys(commission_received_by).length > 0 ? commission_received_by : null,
                commission_payment_day,
                required_docs:
                    formData.required_docs.length > 0 ? formData.required_docs : null,
                required_docs_other: formData.required_docs_other.trim() || null,
                recurrence_type:
                    formData.recurrence_type === 'unico'
                    || formData.recurrence_type === 'mensal'
                    || formData.recurrence_type === 'anual'
                        ? formData.recurrence_type
                        : 'unico',
            };

            try {
                if (editingId) {
                    await updateMutation.mutateAsync({ id: editingId, data: productData });
                    toast.success('Produto atualizado com sucesso!');
                } else {
                    await createMutation.mutateAsync(productData as ProductInsert);
                    toast.success('Produto criado com sucesso!');
                }
                closeModal();
            } catch {
                toast.error(editingId ? 'Erro ao atualizar produto' : 'Erro ao criar produto');
            }
        },
        [formData, editingId, createMutation, updateMutation, closeModal]
    );

    const handleDelete = useCallback(
        (id: string, name: string) => {
            confirm(async () => {
                setIsDeleting(true);
                try {
                    await deleteMutation.mutateAsync(id);
                    toast.success('Produto excluído com sucesso!');
                } catch {
                    toast.error('Erro ao excluir produto');
                } finally {
                    setIsDeleting(false);
                }
            }, {
                title: 'Excluir produto',
                description: `Tem certeza que deseja excluir "${name}"?`,
                confirmText: 'Excluir',
            });
        },
        [confirm, deleteMutation]
    );

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return {
        searchTerm,
        setSearchTerm,
        filterCategory,
        setFilterCategory,
        filterActive,
        setFilterActive,
        isModalOpen,
        setIsModalOpen,
        editingId,
        formData,
        setFormData,
        isDeleting,
        dialogProps,
        products: products || [],
        productsLoading,
        summary,
        productCategories: productCategories || [],
        isSaving,
        openModal,
        closeModal,
        openEditModal,
        handleSubmit,
        handleDelete,
        resetForm,
    };
}
