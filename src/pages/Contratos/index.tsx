import {
    useState, useRef, useCallback, useMemo
} from 'react';
import { Link } from 'react-router-dom';
import {
    FileText,
    Plus,
    Edit,
    Trash2,
    Upload,
    PenTool,
    Calendar,
    User,
    Loader2,
    Download,
    FileCode,
    CheckCircle,
    Send,
    Tag,
    Repeat,
    Printer,
    XCircle,
    DollarSign,
    LayoutGrid,
    List,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuthStore, useBranchStore } from '@/stores';
import {
    getContracts,
    createContract,
    updateContract,
    deleteContract,
    uploadContractFile,
    signContract,
    getContractsSummary,
    ContractFilters,
    submitForApproval,
    approveContract,
    rejectContract,
    generateFinancialEntriesFromContract,
    previewContractEntries,
} from '@/services/contratos';
import { getFinancialEntriesByContractId } from '@/services/financeiro';
import { useCategories } from '@/hooks/useCategorias';
import {
    useFavorecidos, useVendedores, useCreateFavorecido, useUploadFavorecidoPhoto
} from '@/hooks/useCadastros';
import { useProducts, useCreateProduct, useProductCategories } from '@/hooks/useProducts';
import { useCreateUser } from '@/hooks/useUsers';
import {
    PageHeader, EmptyState, LoadingState, StatCard, SearchInput, FavorecidoSelect, VendedorSelect, ProductSelect
} from '@/components/shared';
import { getContractStatusBadge, ContractStatusType } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
    getTemplates,
    generateContractFromTemplate,
    exportContractToPDF,
} from '@/services/contractTemplates';
import type {
    ContractInsert, ContractRecurrenceType, ProductInsert, ProductOtherFees, ProductCommissionReceivedBy
} from '@/types/database';
import { FavorecidoForm } from '@/pages/Favorecidos/components/FavorecidoForm';
import { ProductForm, type ProductFormData } from '@/pages/Produtos/components/ProductForm';
import { ProductRulesPanel } from './components/ProductRulesPanel';
import { KanbanView } from './KanbanView';

export default function Contratos() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterProductId, setFilterProductId] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [uploadingContractId, setUploadingContractId] = useState<string | null>(null);

    // Confirmation dialog
    const { confirm, dialogProps } = useConfirmDialog();
    const [isDeleting, setIsDeleting] = useState(false);

    // Template modal state (usado para PDF download e impressão — mesmo PDF)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfContractId, setPdfContractId] = useState<string | null>(null);
    const [pdfIntent, setPdfIntent] = useState<'download' | 'print'>('download');

    // Generate entries modal state
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [generateContractId, setGenerateContractId] = useState<string | null>(null);
    const [isGeneratingEntries, setIsGeneratingEntries] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        favorecido_id: '',
        type: '',
        value: '',
        start_date: '',
        end_date: '',
        notes: '',
        category_id: '',
        product_id: '',
        recurrence_type: 'unico' as ContractRecurrenceType,
        seller_id: '',
        payment_due_day: '',
        interest_rate: '',
    });

    // Fetch data
    const filters: ContractFilters = useMemo(() => ({
        branchId: unidadeAtual?.id,
        search: searchTerm || undefined,
        productId: filterProductId || undefined,
    }), [unidadeAtual?.id, searchTerm, filterProductId]);

    const { data: contracts, isLoading } = useQuery({
        queryKey: ['contracts', filters],
        queryFn: () => getContracts(filters),
        enabled: !!unidadeAtual?.id,
    });

    const { data: summary } = useQuery({
        queryKey: ['contracts-summary', unidadeAtual?.id],
        queryFn: () => getContractsSummary(unidadeAtual!.id),
        enabled: !!unidadeAtual?.id,
    });

    const { refetch: refetchFavorecidos } = useFavorecidos({ isActive: true });
    const { data: categories } = useCategories();
    const { refetch: refetchVendedores } = useVendedores();
    const { data: products, refetch: refetchProducts } = useProducts({ isActive: true });
    const { data: productCategories } = useProductCategories();

    const selectedProduct = useMemo(
        () => (formData.product_id ? products?.find((p) => p.id === formData.product_id) : null),
        [products, formData.product_id]
    );

    // Find "Vendas" category
    const vendasCategory = useMemo(
        () => categories?.find((c) => c.name.toLowerCase() === 'vendas'),
        [categories]
    );

    // Check if user can approve contracts
    const canApprove = user?.role === 'admin' || user?.role === 'gerente';

    // Fetch templates for PDF generation
    const { data: templates } = useQuery({
        queryKey: ['contract-templates'],
        queryFn: () => getTemplates({ isActive: true }),
    });

    // --- Inline Favorecido creation ---
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
    const createFavorecido = useCreateFavorecido();
    const uploadPhoto = useUploadFavorecidoPhoto();

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
            reader.onloadend = () => { setPhotoPreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleSubmitFavorecido = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newFav = await createFavorecido.mutateAsync({
                branch_id: unidadeAtual?.id || null,
                type: favorecidoFormData.type,
                name: favorecidoFormData.name,
                document: favorecidoFormData.document || null,
                email: favorecidoFormData.email || null,
                phone: favorecidoFormData.phone || null,
                address: favorecidoFormData.address || null,
                city: favorecidoFormData.city || null,
                state: favorecidoFormData.state || null,
                zip_code: favorecidoFormData.zip_code || null,
                notes: favorecidoFormData.notes || null,
            });
            if (selectedPhoto && newFav.id) {
                await uploadPhoto.mutateAsync({ favorecidoId: newFav.id, file: selectedPhoto });
            }
            await refetchFavorecidos();
            setFormData((prev) => ({ ...prev, favorecido_id: newFav.id }));
            toast.success('Favorecido criado!');
            setIsFavorecidoModalOpen(false);
            resetFavorecidoForm();
        } catch {
            toast.error('Erro ao criar favorecido');
        }
    }, [favorecidoFormData, selectedPhoto, createFavorecido, uploadPhoto, refetchFavorecidos, resetFavorecidoForm]);

    // --- Inline Product creation ---
    const initialProductForm: ProductFormData = {
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
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productFormData, setProductFormData] = useState<ProductFormData>(initialProductForm);
    const createProductMutation = useCreateProduct();

    const resetProductForm = useCallback(() => {
        setProductFormData(initialProductForm);
    }, []);

    const handleSubmitProduct = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productFormData.name.trim()) {
            toast.error('Nome do produto é obrigatório');
            return;
        }
        const ref = parseFloat(productFormData.reference_value) || 0;
        const bankPct = parseFloat(productFormData.bank_percentage) || 0;
        const companyPct = parseFloat(productFormData.company_percentage) || 0;

        const otherFees: ProductOtherFees = {};
        const cad = parseFloat(productFormData.other_fees_cadastro);
        const ope = parseFloat(productFormData.other_fees_operacao);
        const seg = parseFloat(productFormData.other_fees_seguro);
        if (Number.isFinite(cad) && cad > 0) otherFees.cadastro = cad;
        if (Number.isFinite(ope) && ope > 0) otherFees.operacao = ope;
        if (Number.isFinite(seg) && seg > 0) otherFees.seguro = seg;

        const commissionReceivedBy: ProductCommissionReceivedBy = {};
        const crP = parseFloat(productFormData.commission_received_by_product);
        const crT = parseFloat(productFormData.commission_received_by_term);
        const crV = parseFloat(productFormData.commission_received_by_value);
        if (Number.isFinite(crP) && crP > 0) commissionReceivedBy.by_product = crP;
        if (Number.isFinite(crT) && crT > 0) commissionReceivedBy.by_term = crT;
        if (Number.isFinite(crV) && crV > 0) commissionReceivedBy.by_value = crV;

        const cpd = productFormData.commission_payment_day.trim();
        const commissionPayDay = cpd !== '' && /^\d+$/.test(cpd)
            ? Math.min(31, Math.max(1, parseInt(cpd, 10)))
            : null;

        const productData: ProductInsert = {
            name: productFormData.name.trim(),
            code: productFormData.code.trim() || null,
            description: productFormData.description.trim() || null,
            commercial_description: productFormData.commercial_description.trim() || null,
            product_category_id: productFormData.product_category_id || null,
            bank_value: (ref * bankPct) / 100,
            bank_percentage: bankPct,
            company_value: (ref * companyPct) / 100,
            company_percentage: companyPct,
            is_active: productFormData.is_active,
            eligible_client_type: productFormData.eligible_client_type.trim() || null,
            target_audience: productFormData.target_audience.length > 0 ? productFormData.target_audience : null,
            value_min: productFormData.value_min !== '' ? parseFloat(productFormData.value_min) || null : null,
            value_max: productFormData.value_max !== '' ? parseFloat(productFormData.value_max) || null : null,
            term_months_min: productFormData.term_months_min !== '' ? parseInt(productFormData.term_months_min, 10) || null : null,
            term_months_max: productFormData.term_months_max !== '' ? parseInt(productFormData.term_months_max, 10) || null : null,
            interest_rate_min: productFormData.interest_rate_min !== '' ? parseFloat(productFormData.interest_rate_min) || null : null,
            interest_rate_max: productFormData.interest_rate_max !== '' ? parseFloat(productFormData.interest_rate_max) || null : null,
            billing_type: productFormData.billing_type.length > 0 ? productFormData.billing_type : null,
            iof_applicable: productFormData.iof_applicable,
            other_fees: Object.keys(otherFees).length > 0 ? otherFees : null,
            commission_type: (productFormData.commission_type === 'fixa' || productFormData.commission_type === 'percentual'
                ? productFormData.commission_type : null) as 'fixa' | 'percentual' | null,
            commission_pct: productFormData.commission_pct !== '' ? parseFloat(productFormData.commission_pct) || null : null,
            commission_min: productFormData.commission_min !== '' ? parseFloat(productFormData.commission_min) || null : null,
            commission_max: productFormData.commission_max !== '' ? parseFloat(productFormData.commission_max) || null : null,
            commission_received_by: Object.keys(commissionReceivedBy).length > 0 ? commissionReceivedBy : null,
            commission_payment_day: commissionPayDay,
            required_docs: productFormData.required_docs.length > 0 ? productFormData.required_docs : null,
            required_docs_other: productFormData.required_docs_other.trim() || null,
            recurrence_type: ['unico', 'mensal', 'anual'].includes(productFormData.recurrence_type)
                ? productFormData.recurrence_type as 'unico' | 'mensal' | 'anual' : 'unico',
        };

        try {
            const newProduct = await createProductMutation.mutateAsync(productData);
            await refetchProducts();
            const catByProdName = productCategories?.find(
                (pc) => pc.id === newProduct.product_category_id
            );
            const catMatch = catByProdName?.name
                ? categories?.find((c) => c.name.toLowerCase() === catByProdName.name.toLowerCase())
                : null;
            setFormData((prev) => ({
                ...prev,
                product_id: newProduct.id,
                type: newProduct.commercial_description || newProduct.name,
                category_id: catMatch?.id ?? (vendasCategory?.id || prev.category_id),
                recurrence_type: (newProduct.recurrence_type as ContractRecurrenceType) ?? prev.recurrence_type,
            }));
            toast.success('Produto criado!');
            setIsProductModalOpen(false);
            resetProductForm();
        } catch {
            toast.error('Erro ao criar produto');
        }
    }, [
        productFormData, createProductMutation, refetchProducts,
        productCategories, categories, vendasCategory, resetProductForm,
    ]);

    // --- Inline Vendedor creation ---
    const [isVendedorModalOpen, setIsVendedorModalOpen] = useState(false);
    const [vendedorFormData, setVendedorFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const createUserMutation = useCreateUser();

    const resetVendedorForm = useCallback(() => {
        setVendedorFormData({ name: '', email: '', password: '' });
    }, []);

    const handleSubmitVendedor = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendedorFormData.name.trim() || !vendedorFormData.email.trim() || !vendedorFormData.password.trim()) {
            toast.error('Preencha nome, email e senha');
            return;
        }
        if (vendedorFormData.password.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres');
            return;
        }
        try {
            const result = await createUserMutation.mutateAsync({
                email: vendedorFormData.email.trim(),
                password: vendedorFormData.password,
                name: vendedorFormData.name.trim(),
                role: 'vendas',
                branchIds: unidadeAtual?.id ? [unidadeAtual.id] : [],
            });
            if (!result.success) {
                toast.error(result.error || 'Erro ao criar vendedor');
                return;
            }
            await refetchVendedores();
            if (result.userId) {
                setFormData((prev) => ({ ...prev, seller_id: result.userId! }));
            }
            toast.success('Vendedor criado!');
            setIsVendedorModalOpen(false);
            resetVendedorForm();
        } catch {
            toast.error('Erro ao criar vendedor');
        }
    }, [vendedorFormData, unidadeAtual?.id, createUserMutation, refetchVendedores, resetVendedorForm]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: createContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['contracts-summary'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Contrato criado!');
        },
        onError: () => toast.error('Erro ao criar contrato'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ContractInsert> }) => updateContract(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['contracts-summary'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Contrato atualizado!');
        },
        onError: (error: any) => {
            const message = error?.message || 'Erro ao atualizar contrato';
            toast.error(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            queryClient.invalidateQueries({ queryKey: ['contracts-summary'] });
            toast.success('Contrato excluído!');
        },
        onError: (error: any) => {
            const message = error?.message || 'Erro ao excluir contrato';
            toast.error(message);
        },
    });

    const signMutation = useMutation({
        mutationFn: ({ contractId, signedBy }: { contractId: string; signedBy: string }) => (
            signContract(contractId, signedBy)
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Contrato assinado!');
        },
        onError: () => toast.error('Erro ao assinar contrato'),
    });

    const submitForApprovalMutation = useMutation({
        mutationFn: submitForApproval,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Contrato enviado para aprovação!');
        },
        onError: () => toast.error('Erro ao enviar para aprovação'),
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => approveContract(id, approvedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Contrato aprovado!');
        },
        onError: () => toast.error('Erro ao aprovar contrato'),
    });

    const rejectMutation = useMutation({
        mutationFn: rejectContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Contrato rejeitado!');
        },
        onError: () => toast.error('Erro ao rejeitar contrato'),
    });

    const uploadFileMutation = useMutation({
        mutationFn: ({ contractId, file }: { contractId: string; file: File }) => uploadContractFile(contractId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            toast.success('Arquivo anexado!');
        },
        onError: () => toast.error('Erro ao anexar arquivo'),
    });

    // Handlers
    const resetForm = useCallback(() => {
        setFormData({
            title: '',
            favorecido_id: '',
            type: '',
            value: '',
            start_date: '',
            end_date: '',
            notes: '',
            category_id: '',
            product_id: '',
            recurrence_type: 'unico',
            seller_id: '',
            payment_due_day: '',
            interest_rate: '',
        });
        setEditingId(null);
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!unidadeAtual?.id) {
            toast.error('Selecione uma filial');
            return;
        }
        if (!formData.product_id) {
            toast.error('É obrigatório vincular a venda a um produto.');
            return;
        }

        const value = parseFloat(formData.value) || 0;
        const product = products?.find((p) => p.id === formData.product_id) ?? null;

        if (product) {
            if (product.value_min != null && value < product.value_min) {
                toast.error(`O valor da venda deve ser no mínimo ${formatCurrency(product.value_min)} (regra do produto).`);
                return;
            }
            if (product.value_max != null && value > product.value_max) {
                toast.error(`O valor da venda deve ser no máximo ${formatCurrency(product.value_max)} (regra do produto).`);
                return;
            }
            if (formData.start_date && formData.end_date) {
                const start = new Date(formData.start_date);
                const end = new Date(formData.end_date);
                const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                if (product.term_months_min != null && months < product.term_months_min) {
                    toast.error(`O prazo deve ser no mínimo ${product.term_months_min} meses (regra do produto).`);
                    return;
                }
                if (product.term_months_max != null && months > product.term_months_max) {
                    toast.error(`O prazo deve ser no máximo ${product.term_months_max} meses (regra do produto).`);
                    return;
                }
            }
            const rate = parseFloat(formData.interest_rate) || 0;
            if (product.interest_rate_min != null && rate < product.interest_rate_min) {
                toast.error(`A taxa de juros deve ser no mínimo ${product.interest_rate_min}% a.m. (regra do produto).`);
                return;
            }
            if (product.interest_rate_max != null && rate > product.interest_rate_max) {
                toast.error(`A taxa de juros deve ser no máximo ${product.interest_rate_max}% a.m. (regra do produto).`);
                return;
            }
        }

        const contractData: ContractInsert = {
            branch_id: unidadeAtual.id,
            title: formData.title,
            favorecido_id: formData.favorecido_id || null,
            type: formData.type || null,
            value,
            start_date: formData.start_date,
            end_date: formData.end_date || null,
            notes: formData.notes || null,
            category_id: formData.category_id || null,
            product_id: formData.product_id || null,
            recurrence_type: formData.recurrence_type,
            seller_id: formData.seller_id || null,
            payment_due_day: formData.payment_due_day ? parseInt(formData.payment_due_day, 10) : null,
            interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
            status: editingId ? undefined : 'criado',
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: contractData });
        } else {
            createMutation.mutate(contractData);
        }
    }, [formData, editingId, unidadeAtual?.id, products, createMutation, updateMutation]);

    const handleDelete = useCallback((id: string, title: string, status: string) => {
        if (status === 'aprovado') {
            toast.error('Não é possível excluir um contrato aprovado');
            return;
        }
        confirm(async () => {
            setIsDeleting(true);
            try {
                await deleteMutation.mutateAsync(id);
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir contrato',
            description: `Tem certeza que deseja excluir "${title}"?`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteMutation]);

    const openEditModal = useCallback((contract: any) => {
        if (contract.status === 'aprovado') {
            toast.error('Não é possível editar um contrato aprovado');
            return;
        }
        const product = contract.product_id
            ? products?.find((p) => p.id === contract.product_id)
            : null;
        const categoryByProductName = product?.product_category?.name
            ? categories?.find(
                (c) => c.name.toLowerCase() === product.product_category!.name.toLowerCase()
            )
            : null;
        const categoryIdFromProduct = categoryByProductName?.id ?? (vendasCategory?.id || '');
        setFormData({
            title: contract.title,
            favorecido_id: contract.favorecido_id || '',
            type: product ? (product.commercial_description || product.name) : (contract.type || ''),
            value: contract.value?.toString() || '',
            start_date: contract.start_date,
            end_date: contract.end_date || '',
            notes: contract.notes || '',
            category_id: product ? categoryIdFromProduct : (contract.category_id || ''),
            product_id: contract.product_id || '',
            recurrence_type: product?.recurrence_type ?? contract.recurrence_type ?? 'unico',
            seller_id: contract.seller_id || '',
            payment_due_day: contract.payment_due_day?.toString() || '',
            interest_rate: contract.interest_rate?.toString() || '',
        });
        setEditingId(contract.id);
        setIsModalOpen(true);
    }, [products, categories, vendasCategory]);

    const handleSubmitForApproval = useCallback((contractId: string) => {
        submitForApprovalMutation.mutate(contractId);
    }, [submitForApprovalMutation]);

    const handleApprove = useCallback((contractId: string) => {
        if (!user?.id) {
            toast.error('Usuário não identificado');
            return;
        }
        approveMutation.mutate({ id: contractId, approvedBy: user.id });
    }, [user?.id, approveMutation]);

    const handleReject = useCallback((contractId: string) => {
        rejectMutation.mutate(contractId);
    }, [rejectMutation]);

    const handlePrint = useCallback((contract: any) => {
        if (!templates || templates.length === 0) {
            toast.error('Nenhum template disponível. Crie um template primeiro.');
            return;
        }
        setPdfContractId(contract.id);
        setPdfIntent('print');
        setSelectedTemplateId(templates[0]?.id || '');
        setIsTemplateModalOpen(true);
    }, [templates]);

    const handleSign = useCallback((contractId: string) => {
        if (!user?.name) {
            toast.error('Usuário não identificado');
            return;
        }
        signMutation.mutate({ contractId, signedBy: user.name });
    }, [user?.name, signMutation]);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, contractId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingContractId(contractId);
        try {
            await uploadFileMutation.mutateAsync({ contractId, file });
        } finally {
            setUploadingContractId(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [uploadFileMutation]);

    // Query to check which contracts already have financial entries
    const approvedContractIds = useMemo(
        () => (contracts || [])
            .filter((c) => c.status === 'aprovado' || c.status === 'ativo')
            .map((c) => c.id),
        [contracts]
    );

    const { data: contractsWithEntries } = useQuery({
        queryKey: ['contract-entries-check', approvedContractIds],
        queryFn: async () => {
            const results: Record<string, boolean> = {};
            await Promise.all(
                approvedContractIds.map(async (id) => {
                    const entries = await getFinancialEntriesByContractId(id);
                    results[id] = entries.length > 0;
                })
            );
            return results;
        },
        enabled: approvedContractIds.length > 0,
    });

    // Preview data for the generate modal
    const generatePreview = useMemo(() => {
        if (!generateContractId) return null;
        const contract = contracts?.find((c) => c.id === generateContractId);
        if (!contract) return null;
        const product = contract.product_id
            ? products?.find((p) => p.id === contract.product_id) ?? null
            : null;
        return previewContractEntries(contract as any, product ?? null);
    }, [generateContractId, contracts, products]);

    const handleGenerateEntries = useCallback(async () => {
        if (!generateContractId) return;
        const contract = contracts?.find((c) => c.id === generateContractId);
        if (!contract) return;
        const product = contract.product_id
            ? products?.find((p) => p.id === contract.product_id) ?? null
            : null;

        setIsGeneratingEntries(true);
        try {
            const count = await generateFinancialEntriesFromContract(contract as any, product ?? null);
            toast.success(`${count} lançamentos financeiros criados!`);
            queryClient.invalidateQueries({ queryKey: ['contract-entries-check'] });
            queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
            setIsGenerateModalOpen(false);
            setGenerateContractId(null);
        } catch (error) {
            console.error('Error generating entries:', error);
            toast.error('Erro ao gerar lançamentos financeiros');
        } finally {
            setIsGeneratingEntries(false);
        }
    }, [generateContractId, contracts, products, queryClient]);

    const openGenerateModal = useCallback((contractId: string) => {
        setGenerateContractId(contractId);
        setIsGenerateModalOpen(true);
    }, []);

    const isSaving = createMutation.isPending || updateMutation.isPending;

    // Handler para exportar PDF de um contrato (abre modal de template)
    const handleExportPdf = useCallback((contract: any) => {
        if (!templates || templates.length === 0) {
            toast.error('Nenhum template disponível. Crie um template primeiro.');
            return;
        }
        setPdfContractId(contract.id);
        setPdfIntent('download');
        setSelectedTemplateId(templates[0]?.id || '');
        setIsTemplateModalOpen(true);
    }, [templates]);

    // Handler para gerar o PDF
    const handleGeneratePdf = useCallback(async () => {
        if (!selectedTemplateId || !pdfContractId) {
            toast.error('Selecione um template');
            return;
        }

        const contract = contracts?.find((c) => c.id === pdfContractId);
        if (!contract) {
            toast.error('Contrato não encontrado');
            return;
        }

        setIsGeneratingPdf(true);
        try {
            const content = await generateContractFromTemplate(
                selectedTemplateId,
                contract.favorecido_id,
                { value: contract.value, date: contract.start_date }
            );
            exportContractToPDF(content, contract.title, pdfIntent);
            toast.success(pdfIntent === 'print' ? 'PDF aberto para impressão.' : 'PDF gerado com sucesso!');
            setIsTemplateModalOpen(false);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Erro ao gerar PDF');
        } finally {
            setIsGeneratingPdf(false);
        }
    }, [selectedTemplateId, pdfContractId, pdfIntent, contracts]);

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Vendas" description="Gerencie contratos e vendas">
                    <Link to="/vendas/templates" className="btn-secondary">
                        <FileCode className="w-4 h-4" />
                        Templates
                    </Link>
                    <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <button className="btn-primary">
                                <Plus className="w-4 h-4" />
                                Novo Contrato
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[90vh] min-w-[60vw] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingId ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle>
                                <DialogDescription>
                                    Preencha os dados do contrato
                                </DialogDescription>
                            </DialogHeader>
                            <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Título</label>
                                    <input
                                        type="text"
                                        className="input-financial"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Cliente</label>
                                        <div className="flex gap-2">
                                            <FavorecidoSelect
                                                value={formData.favorecido_id}
                                                onChange={(id) => setFormData({ ...formData, favorecido_id: id })}
                                                className="flex-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsFavorecidoModalOpen(true)}
                                                className="inline-flex items-center px-3 py-2.5 rounded-lg font-medium text-primary border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                                                title="Adicionar novo cliente"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Valor</label>
                                        <CurrencyInput
                                            value={formData.value}
                                            onChange={(numValue) => setFormData({ ...formData, value: String(numValue) })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Data Início</label>
                                        <input
                                            type="date"
                                            className="input-financial"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Data Fim</label>
                                        <input
                                            type="date"
                                            className="input-financial"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Produto (cadastro)</label>
                                        <div className="flex gap-2">
                                            <ProductSelect
                                                value={formData.product_id}
                                                className="flex-1"
                                                placeholder="Selecione um produto (obrigatório)"
                                                onChange={(id, product) => {
                                                    const categoryByProductName = product?.product_category?.name
                                                        ? categories?.find(
                                                            (c) => c.name.toLowerCase() === product.product_category!.name.toLowerCase()
                                                        )
                                                        : null;
                                                    const categoryId = categoryByProductName?.id ?? (vendasCategory?.id || '');
                                                    setFormData({
                                                        ...formData,
                                                        product_id: id,
                                                        type: product ? (product.commercial_description || product.name) : formData.type,
                                                        category_id: product ? categoryId : formData.category_id,
                                                        recurrence_type: product?.recurrence_type ?? formData.recurrence_type,
                                                    });
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsProductModalOpen(true)}
                                                className="inline-flex items-center px-3 py-2.5 rounded-lg font-medium text-primary border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                                                title="Adicionar novo produto"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Tipo / descrição</label>
                                        <input
                                            type="text"
                                            className="input-financial"
                                            placeholder="Ex: Empréstimo Consignado"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            readOnly={!!selectedProduct}
                                            title={selectedProduct ? 'Definido pelo produto vinculado' : ''}
                                        />
                                        {selectedProduct && (
                                            <p className="text-xs text-muted-foreground mt-1">Definido pelo produto</p>
                                        )}
                                    </div>
                                </div>
                                {selectedProduct && (
                                    <ProductRulesPanel
                                        product={selectedProduct}
                                        saleValue={typeof formData.value === 'string' ? parseFloat(formData.value) || 0 : Number(formData.value)}
                                    />
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Recorrência</label>
                                        <select
                                            className="input-financial"
                                            value={formData.recurrence_type}
                                            onChange={(e) => setFormData({ ...formData, recurrence_type: e.target.value as ContractRecurrenceType })}
                                            disabled={!!selectedProduct}
                                            title={selectedProduct ? 'Definida pelo produto vinculado' : ''}
                                        >
                                            <option value="unico">Único</option>
                                            <option value="mensal">Mensal</option>
                                            <option value="anual">Anual</option>
                                        </select>
                                        {selectedProduct && (
                                            <p className="text-xs text-muted-foreground mt-1">Definida pelo produto</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Dia de vencimento</label>
                                        <input
                                            type="number"
                                            className="input-financial"
                                            placeholder="1-31"
                                            min={1}
                                            max={31}
                                            value={formData.payment_due_day}
                                            onChange={(e) => setFormData({ ...formData, payment_due_day: e.target.value })}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Dia do mês para vencimento das parcelas
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Taxa de juros (% a.m.)
                                    </label>
                                    <input
                                        type="number"
                                        className="input-financial"
                                        placeholder={
                                            selectedProduct
                                                ? `${selectedProduct.interest_rate_min ?? 0} - ${selectedProduct.interest_rate_max ?? '∞'}%`
                                                : '0.00'
                                        }
                                        step="0.01"
                                        min={0}
                                        value={formData.interest_rate}
                                        onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                                    />
                                    {selectedProduct && (selectedProduct.interest_rate_min != null || selectedProduct.interest_rate_max != null) && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Faixa do produto:
                                            {' '}
                                            {selectedProduct.interest_rate_min ?? 0}
                                            {'% - '}
                                            {selectedProduct.interest_rate_max ?? '∞'}
                                            % a.m.
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                                        <select
                                            className="input-financial"
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                            disabled={!!selectedProduct || !!formData.seller_id}
                                            title={
                                                selectedProduct
                                                    ? 'Definida pelo produto vinculado'
                                                    : formData.seller_id
                                                        ? 'Categoria definida automaticamente como "Vendas" para contratos com vendedor'
                                                        : ''
                                            }
                                        >
                                            <option value="">Selecione</option>
                                            {categories?.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        {selectedProduct && (
                                            <p className="text-xs text-muted-foreground mt-1">Definida pelo produto</p>
                                        )}
                                        {!selectedProduct && formData.seller_id && vendasCategory && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Categoria definida automaticamente: Vendas
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Vendedor</label>
                                        <div className="flex gap-2">
                                            <VendedorSelect
                                                value={formData.seller_id}
                                                className="flex-1"
                                                onChange={(sellerId) => {
                                                    setFormData({
                                                        ...formData,
                                                        seller_id: sellerId,
                                                        category_id: sellerId && vendasCategory
                                                            ? vendasCategory.id
                                                            : (formData.category_id === vendasCategory?.id ? '' : formData.category_id)
                                                    });
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsVendedorModalOpen(true)}
                                                className="inline-flex items-center px-3 py-2.5 rounded-lg font-medium text-primary border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                                                title="Adicionar novo vendedor"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                                    <textarea
                                        className="input-financial min-h-[80px]"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" className="btn-secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={isSaving}>
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingId ? 'Atualizar' : 'Criar'}
                                        {' '}
                                        Contrato
                                    </button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </PageHeader>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard label="Total Contratos" value={summary.total || 0} icon={FileText} />
                        <StatCard label="Ativos" value={summary.active || 0} icon={FileText} variant="income" />
                        <StatCard label="Pendentes" value={summary.pending || 0} icon={FileText} variant="pending" />
                        <StatCard label="Valor Total" value={formatCurrency(summary.totalValue || 0)} icon={FileText} variant="primary" />
                    </div>
                )}

                {/* Search and filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <SearchInput
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar contratos..."
                        className="max-w-md"
                    />
                    <ProductSelect
                        value={filterProductId}
                        onChange={(id) => setFilterProductId(id)}
                        placeholder="Todos os produtos"
                        className="w-auto min-w-[200px]"
                    />
                    {canApprove && (
                        <div className="flex items-center gap-1 ml-auto border border-border rounded-lg p-1">
                            <button
                                className={viewMode === 'list' ? 'btn-primary py-1.5 px-3' : 'btn-secondary py-1.5 px-3'}
                                onClick={() => setViewMode('list')}
                                title="Visualização em lista"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                className={viewMode === 'kanban' ? 'btn-primary py-1.5 px-3' : 'btn-secondary py-1.5 px-3'}
                                onClick={() => setViewMode('kanban')}
                                title="Visualização Kanban"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Kanban View (admin/gerente only) */}
                {canApprove && viewMode === 'kanban' ? (
                    isLoading ? (
                        <LoadingState />
                    ) : (
                        <KanbanView
                            contracts={contracts || []}
                            contractsWithEntries={contractsWithEntries}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onGenerateEntries={openGenerateModal}
                            onResubmit={handleSubmitForApproval}
                            isApprovePending={approveMutation.isPending}
                            isRejectPending={rejectMutation.isPending}
                            isResubmitPending={submitForApprovalMutation.isPending}
                        />
                    )
                ) : isLoading ? (
                    <LoadingState />
                ) : !contracts?.length ? (
                    <EmptyState icon={FileText} message="Nenhum contrato encontrado" />
                ) : (
                    <div className="grid gap-4">
                        {contracts.map((contract) => (
                            <div key={contract.id} className="card-financial p-5 group">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-primary/10">
                                            <FileText className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{contract.title}</h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                {contract.favorecido && (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <User className="w-3.5 h-3.5" />
                                                        {contract.favorecido.name}
                                                    </span>
                                                )}
                                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {formatDate(contract.start_date)}
                                                    {contract.end_date && ` - ${formatDate(contract.end_date)}`}
                                                </span>
                                                {contract.category && (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Tag className="w-3.5 h-3.5" />
                                                        {contract.category.name}
                                                    </span>
                                                )}
                                                {contract.product && (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Tag className="w-3.5 h-3.5" />
                                                        {contract.product.name}
                                                        {contract.product.code ? ` (${contract.product.code})` : ''}
                                                    </span>
                                                )}
                                                {contract.recurrence_type && contract.recurrence_type !== 'unico' && (
                                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Repeat className="w-3.5 h-3.5" />
                                                        {contract.recurrence_type === 'mensal' ? 'Mensal' : 'Anual'}
                                                    </span>
                                                )}
                                                {contract.seller && (
                                                    <span className="text-sm text-primary flex items-center gap-1">
                                                        <User className="w-3.5 h-3.5" />
                                                        Vendedor:
                                                        {' '}
                                                        {contract.seller.name}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Approval info */}
                                            {contract.approved_at && (
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    Aprovado por
                                                    {' '}
                                                    {contract.approver?.name}
                                                    {' '}
                                                    em
                                                    {' '}
                                                    {formatDate(contract.approved_at)}
                                                </div>
                                            )}
                                            {contract.signed_at && (
                                                <div className="text-xs text-muted-foreground">
                                                    Assinado por
                                                    {' '}
                                                    {contract.signed_by}
                                                    {' '}
                                                    em
                                                    {' '}
                                                    {formatDate(contract.signed_at)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getContractStatusBadge(contract.status as ContractStatusType)}
                                        <span className="font-semibold font-mono text-foreground">
                                            {formatCurrency(contract.value)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                                    {contract.status !== 'aprovado' && (
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => openEditModal(contract)}
                                        >
                                            <Edit className="w-4 h-4" />
                                            Editar
                                        </button>
                                    )}

                                    {/* Workflow buttons based on status */}
                                    {contract.status === 'criado' && (
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => handleSubmitForApproval(contract.id)}
                                            disabled={submitForApprovalMutation.isPending}
                                        >
                                            <Send className="w-4 h-4" />
                                            Enviar p/ Aprovação
                                        </button>
                                    )}

                                    {contract.status === 'em_aprovacao' && canApprove && (
                                        <>
                                            <button
                                                className="btn-primary py-2"
                                                onClick={() => handleApprove(contract.id)}
                                                disabled={approveMutation.isPending}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Aprovar
                                            </button>
                                            <button
                                                className="btn-secondary py-2 text-destructive"
                                                onClick={() => handleReject(contract.id)}
                                                disabled={rejectMutation.isPending}
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Rejeitar
                                            </button>
                                        </>
                                    )}

                                    {contract.status === 'rejeitado' && (
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => handleSubmitForApproval(contract.id)}
                                            disabled={submitForApprovalMutation.isPending}
                                        >
                                            <Send className="w-4 h-4" />
                                            Re-enviar p/ Aprovação
                                        </button>
                                    )}

                                    {(contract.status === 'aprovado' || contract.status === 'ativo') && (
                                        <button
                                            className="btn-primary py-2"
                                            onClick={() => openGenerateModal(contract.id)}
                                            disabled={contractsWithEntries?.[contract.id]}
                                            title={
                                                contractsWithEntries?.[contract.id]
                                                    ? 'Lançamentos já gerados'
                                                    : 'Gerar lançamentos financeiros'
                                            }
                                        >
                                            <DollarSign className="w-4 h-4" />
                                            {contractsWithEntries?.[contract.id]
                                                ? 'Lançamentos gerados'
                                                : 'Gerar Lançamentos'}
                                        </button>
                                    )}

                                    {(contract.status === 'aprovado' || contract.status === 'pendente') && (
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => handleSign(contract.id)}
                                            disabled={signMutation.isPending}
                                        >
                                            <PenTool className="w-4 h-4" />
                                            Assinar
                                        </button>
                                    )}

                                    <label className="btn-secondary py-2 cursor-pointer">
                                        {uploadingContractId === contract.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4" />
                                        )}
                                        Anexar
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => handleFileUpload(e, contract.id)}
                                            disabled={uploadingContractId === contract.id}
                                        />
                                    </label>
                                    <button
                                        className="btn-secondary py-2"
                                        onClick={() => handleExportPdf(contract)}
                                        title="Exportar PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                        PDF
                                    </button>
                                    <button
                                        className="btn-secondary py-2"
                                        onClick={() => handlePrint(contract)}
                                        title="Imprimir"
                                    >
                                        <Printer className="w-4 h-4" />
                                    </button>
                                    {contract.status !== 'aprovado' && (
                                        <button
                                            className="btn-secondary py-2 text-destructive hover:bg-destructive/10"
                                            onClick={() => handleDelete(contract.id, contract.title, contract.status)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Template Selection Modal for PDF (download e impressão usam o mesmo PDF) */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {pdfIntent === 'print' ? 'Imprimir contrato' : 'Exportar Contrato em PDF'}
                        </DialogTitle>
                        <DialogDescription>
                            Selecione um template para gerar o PDF do contrato
                            {pdfIntent === 'print' ? ' (o mesmo PDF será aberto para impressão).' : '.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Template
                            </label>
                            <select
                                className="input-financial"
                                value={selectedTemplateId}
                                onChange={(e) => setSelectedTemplateId(e.target.value)}
                            >
                                <option value="">Selecione um template</option>
                                {templates?.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setIsTemplateModalOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleGeneratePdf}
                                disabled={!selectedTemplateId || isGeneratingPdf}
                            >
                                {isGeneratingPdf && <Loader2 className="w-4 h-4 animate-spin" />}
                                {pdfIntent === 'print' ? 'Gerar e imprimir' : 'Gerar PDF'}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Inline Favorecido Creation Modal */}
            <Dialog
                open={isFavorecidoModalOpen}
                onOpenChange={(open) => { setIsFavorecidoModalOpen(open); if (!open) resetFavorecidoForm(); }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Cliente / Favorecido</DialogTitle>
                        <DialogDescription>
                            Cadastre um novo favorecido para usar nesta venda.
                        </DialogDescription>
                    </DialogHeader>
                    <FavorecidoForm
                        formData={favorecidoFormData}
                        setFormData={setFavorecidoFormData}
                        editingId={null}
                        photoPreview={photoPreview}
                        fileInputRef={favorecidoFileInputRef}
                        documentInputRef={favorecidoDocumentInputRef}
                        favorecidoDocuments={[]}
                        documentsLoading={false}
                        favorecidoLogs={[]}
                        logsLoading={false}
                        isUploadingDocument={false}
                        isSaving={createFavorecido.isPending}
                        onPhotoSelect={handlePhotoSelect}
                        onDocumentUpload={() => {}}
                        onDeleteDocument={() => {}}
                        onSubmit={handleSubmitFavorecido}
                        onCancel={() => { setIsFavorecidoModalOpen(false); resetFavorecidoForm(); }}
                    />
                </DialogContent>
            </Dialog>

            {/* Inline Product Creation Modal */}
            <Dialog
                open={isProductModalOpen}
                onOpenChange={(open) => { setIsProductModalOpen(open); if (!open) resetProductForm(); }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Produto</DialogTitle>
                        <DialogDescription>
                            Cadastre um novo produto para vincular a esta venda.
                        </DialogDescription>
                    </DialogHeader>
                    <ProductForm
                        formData={productFormData}
                        setFormData={setProductFormData}
                        productCategories={productCategories || []}
                        editingId={null}
                        isSaving={createProductMutation.isPending}
                        onSubmit={handleSubmitProduct}
                        onCancel={() => { setIsProductModalOpen(false); resetProductForm(); }}
                    />
                </DialogContent>
            </Dialog>

            {/* Inline Vendedor Creation Modal */}
            <Dialog
                open={isVendedorModalOpen}
                onOpenChange={(open) => { setIsVendedorModalOpen(open); if (!open) resetVendedorForm(); }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Novo Vendedor</DialogTitle>
                        <DialogDescription>
                            Crie um novo usuário com perfil de vendedor.
                        </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4 mt-4" onSubmit={handleSubmitVendedor}>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Nome</label>
                            <input
                                type="text"
                                className="input-financial"
                                value={vendedorFormData.name}
                                onChange={(e) => setVendedorFormData({ ...vendedorFormData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                            <input
                                type="email"
                                className="input-financial"
                                value={vendedorFormData.email}
                                onChange={(e) => setVendedorFormData({ ...vendedorFormData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
                            <input
                                type="password"
                                className="input-financial"
                                value={vendedorFormData.password}
                                onChange={(e) => setVendedorFormData({ ...vendedorFormData, password: e.target.value })}
                                minLength={6}
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres</p>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => { setIsVendedorModalOpen(false); resetVendedorForm(); }}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary" disabled={createUserMutation.isPending}>
                                {createUserMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                Criar Vendedor
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Generate Financial Entries Modal */}
            <Dialog open={isGenerateModalOpen} onOpenChange={(open) => { setIsGenerateModalOpen(open); if (!open) setGenerateContractId(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gerar Lançamentos Financeiros</DialogTitle>
                        <DialogDescription>
                            Confira o resumo dos lançamentos que serão criados para esta venda.
                        </DialogDescription>
                    </DialogHeader>
                    {generatePreview && (
                        <div className="space-y-4 mt-4">
                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                                    Receitas (parcelas)
                                </h4>
                                <p className="text-sm text-emerald-600 dark:text-emerald-300">
                                    {generatePreview.revenueCount}
                                    {' '}
                                    parcela(s) de
                                    {' '}
                                    {formatCurrency(generatePreview.revenueInstallmentValue)}
                                </p>
                                {generatePreview.interestRate > 0 && (
                                    <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">
                                        Juros:
                                        {' '}
                                        {generatePreview.interestRate}
                                        % a.m. (Tabela Price) — Total:
                                        {' '}
                                        {formatCurrency(generatePreview.totalWithInterest)}
                                    </p>
                                )}
                            </div>
                            {generatePreview.expenses.length > 0 && (
                                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                                    <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                                        Despesas
                                    </h4>
                                    <ul className="space-y-1">
                                        {generatePreview.expenses.map((exp, i) => (
                                            <li key={i} className="text-sm text-red-600 dark:text-red-300 flex justify-between">
                                                <span>{exp.description}</span>
                                                <span className="font-mono">{formatCurrency(exp.value)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800 text-sm font-semibold text-red-700 dark:text-red-400 flex justify-between">
                                        <span>Total despesas</span>
                                        <span className="font-mono">{formatCurrency(generatePreview.totalExpenses)}</span>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => { setIsGenerateModalOpen(false); setGenerateContractId(null); }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleGenerateEntries}
                                    disabled={isGeneratingEntries}
                                >
                                    {isGeneratingEntries && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Confirmar e gerar
                                </button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />
        </AppLayout>
    );
}
