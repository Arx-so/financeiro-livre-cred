import {
    useState, useRef, useCallback, useMemo, useEffect
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
    Paperclip,
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
} from '@/services/contratos';
import { getFinancialEntriesByContractId, deleteFinancialEntries } from '@/services/financeiro';
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
import {
    TERMINALS, TERMINAL_LABELS,
    CARD_BRANDS, CARD_BRAND_LABELS,
    PAYMENT_METHODS, PAYMENT_METHOD_LABELS,
    TRANSFER_SOURCES, TRANSFER_SOURCE_LABELS,
    SALE_TYPES, SALE_TYPE_LABELS,
    PAYMENT_METHODS_REQUIRING_ACCOUNT,
} from '@/constants/sales';
import { FavorecidoForm } from '@/pages/Favorecidos/components/FavorecidoForm';
import { ProductForm, type ProductFormData } from '@/pages/Produtos/components/ProductForm';
import { ProductTypeModal } from '@/pages/Produtos/components/ProductTypeModal';
import { KanbanView } from './KanbanView';
import { ContractViewerModal } from './ContractViewerModal';
import { ContractCreditCardReceipt } from './ContractCreditCardReceipt';
import type { ContractWithRelations } from '@/services/contratos';

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

    // Comprovante CC modal
    const [comprovanteContract, setComprovanteContract] = useState<any | null>(null);

    // Viewer modal state
    const [viewingContract, setViewingContract] = useState<ContractWithRelations | null>(null);

    // Pending files to upload after contract creation
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        favorecido_id: '',
        type: '',
        value: '',
        installments: '1',
        notes: '',
        category_id: '',
        product_id: '',
        seller_id: '',
        payment_due_day: '',
        interest_rate: '',
        cc_amount_released: '',
        cc_terminal: TERMINALS.SUMUP_W,
        cc_card_brand: CARD_BRANDS.VISA,
        cc_card_last_four: '',
        cc_card_holder_name: '',
        cc_sale_type: SALE_TYPES.VENDA_NOVA,
        cc_payment_method: PAYMENT_METHODS.PIX,
        cc_payment_account: TRANSFER_SOURCES.TF_RENTA,
        cc_discount_amount: '',
        cc_saturday_refund: '',
        cc_lacre: '',
    });

    const isAdm = unidadeAtual?.code === 'ADM';

    // Fetch data
    const filters: ContractFilters = useMemo(() => ({
        branchId: unidadeAtual?.code === 'ADM' ? undefined : unidadeAtual?.id,
        search: searchTerm || undefined,
        productId: filterProductId || undefined,
    }), [unidadeAtual?.id, unidadeAtual?.code, searchTerm, filterProductId]);

    const { data: contracts, isLoading } = useQuery({
        queryKey: ['contracts', filters],
        queryFn: () => getContracts(filters),
        enabled: !!unidadeAtual?.id || isAdm,
    });

    const { data: summary } = useQuery({
        queryKey: ['contracts-summary', unidadeAtual?.id],
        queryFn: () => getContractsSummary(unidadeAtual?.code === 'ADM' ? undefined : unidadeAtual?.id),
        enabled: !!unidadeAtual?.id || isAdm,
    });

    const { data: favorecidos, refetch: refetchFavorecidos } = useFavorecidos({ isActive: true });
    const { data: categories } = useCategories();
    const { refetch: refetchVendedores } = useVendedores();
    const { data: products, refetch: refetchProducts } = useProducts({ isActive: true });
    const { data: productCategories } = useProductCategories();

    const selectedProduct = useMemo(
        () => (formData.product_id ? products?.find((p) => p.id === formData.product_id) : null),
        [products, formData.product_id]
    );

    const selectedFavorecido = useMemo(
        () => (formData.favorecido_id ? favorecidos?.data?.find((f) => f.id === formData.favorecido_id) : null),
        [favorecidos, formData.favorecido_id]
    );

    const autoTitle = useMemo(() => {
        const client = selectedFavorecido?.name || '';
        const product = selectedProduct?.name || '';
        if (client && product) return `${product} - ${client}`;
        return client || product || 'Nova venda';
    }, [selectedFavorecido, selectedProduct]);

    // Pre-fill cc_terminal and cc_card_brand from product specific_rules when product changes (new contract only)
    useEffect(() => {
        if (!selectedProduct || editingId) return;
        const rules = selectedProduct.specific_rules as Record<string, unknown> | null;
        if (!rules) return;
        setFormData((prev) => ({
            ...prev,
            ...(rules.card_machine ? { cc_terminal: rules.card_machine as string } : {}),
            ...(rules.card_brand ? { cc_card_brand: rules.card_brand as string } : {}),
        }));
    }, [selectedProduct?.id, editingId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Credit card: compute total interest rate from amounts
    const ccRate = useMemo(() => {
        if (selectedProduct?.product_type !== 'cartao_credito') return null;
        const total = parseFloat(formData.value) || 0;
        const released = parseFloat(formData.cc_amount_released) || 0;
        if (!total || !released || released <= 0) return null;
        return Math.round(((total / released) - 1) * 10000) / 100;
    }, [selectedProduct, formData.value, formData.cc_amount_released]);

    const ccRateStatus = useMemo(() => {
        if (ccRate === null) return null;
        const min = selectedProduct?.interest_rate_min;
        const max = selectedProduct?.interest_rate_max;
        if (min != null && ccRate < min) return 'below' as const;
        if (max != null && ccRate > max) return 'above' as const;
        return 'ok' as const;
    }, [ccRate, selectedProduct]);

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
    const [inlineProductType, setInlineProductType] = useState('generico');
    const initialProductForm: ProductFormData = {
        product_type: 'generico',
        name: '',
        code: '',
        description: '',
        commercial_description: '',
        product_category_id: '',
        reference_value: '0',
        bank_percentage: '0',
        company_percentage: '0',
        is_active: true,
        card_brand: '',
        card_machine: '',
        card_machine_fee: '',
        card_machine_fee_tiers: [],
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
    const [isInlineTypeModalOpen, setIsInlineTypeModalOpen] = useState(false);
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

        // Merge card fields into specific_rules for cartao_credito
        let inlineSpecificRules: Record<string, unknown> | null = null;
        const trimmedRules = productFormData.specific_rules?.trim();
        if (trimmedRules) {
            try { inlineSpecificRules = JSON.parse(trimmedRules); } catch { /* ignore */ }
        }
        if (productFormData.product_type === 'cartao_credito') {
            const inlineMachineFee = parseFloat(productFormData.card_machine_fee);
            const inlineValidTiers = productFormData.card_machine_fee_tiers
                .map((t) => ({
                    from: parseInt(t.from, 10),
                    to: parseInt(t.to, 10),
                    fee: parseFloat(t.fee),
                }))
                .filter((t) => Number.isFinite(t.from) && Number.isFinite(t.to) && Number.isFinite(t.fee));
            inlineSpecificRules = {
                ...(inlineSpecificRules || {}),
                ...(productFormData.card_brand ? { card_brand: productFormData.card_brand } : {}),
                ...(productFormData.card_machine ? { card_machine: productFormData.card_machine } : {}),
                ...(Number.isFinite(inlineMachineFee) && inlineMachineFee > 0
                    ? { card_machine_fee: inlineMachineFee } : {}),
                ...(inlineValidTiers.length > 0 ? { card_machine_fee_tiers: inlineValidTiers } : {}),
            };
            if (Object.keys(inlineSpecificRules).length === 0) inlineSpecificRules = null;
        }

        const validProdTypes = ['generico', 'cartao_credito', 'fgts', 'consignado'] as const;
        type ValidProdType = typeof validProdTypes[number];
        const prodType: ValidProdType = validProdTypes.includes(productFormData.product_type as ValidProdType)
            ? productFormData.product_type as ValidProdType : 'generico';

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
            specific_rules: inlineSpecificRules,
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
            product_type: prodType,
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
            favorecido_id: '',
            type: '',
            value: '',
            installments: '1',
            notes: '',
            category_id: '',
            product_id: '',
            seller_id: '',
            payment_due_day: '',
            interest_rate: '',
            cc_amount_released: '',
            cc_terminal: TERMINALS.SUMUP_W,
            cc_card_brand: CARD_BRANDS.VISA,
            cc_card_last_four: '',
            cc_card_holder_name: '',
            cc_sale_type: SALE_TYPES.VENDA_NOVA,
            cc_payment_method: PAYMENT_METHODS.PIX,
            cc_payment_account: TRANSFER_SOURCES.TF_RENTA,
            cc_discount_amount: '',
            cc_saturday_refund: '',
            cc_lacre: '',
        });
        setEditingId(null);
        setPendingFiles([]);
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
        const installments = Math.max(1, parseInt(formData.installments, 10) || 1);
        const product = products?.find((p) => p.id === formData.product_id) ?? null;
        const isCartao = product?.product_type === 'cartao_credito';

        // Compute start/end dates from installments
        const todayDate = new Date();
        const startDate = todayDate.toISOString().split('T')[0];
        const endD = new Date(todayDate);
        endD.setMonth(endD.getMonth() + installments - 1);
        const endDate = endD.toISOString().split('T')[0];
        const recurrenceType: ContractRecurrenceType = installments === 1 ? 'unico' : 'mensal';

        // Compute interest rate: for credit card, derived from values; else from field
        let interestRate: number | null = null;
        if (isCartao && ccRate !== null) {
            interestRate = ccRate;
        } else if (formData.interest_rate) {
            interestRate = parseFloat(formData.interest_rate) || null;
        }

        if (product) {
            if (product.value_min != null && value < product.value_min) {
                toast.error(`O valor deve ser no mínimo ${formatCurrency(product.value_min)} (regra do produto).`);
                return;
            }
            if (product.value_max != null && value > product.value_max) {
                toast.error(`O valor deve ser no máximo ${formatCurrency(product.value_max)} (regra do produto).`);
                return;
            }
            if (product.term_months_min != null && installments < product.term_months_min) {
                toast.error(`O número de parcelas deve ser no mínimo ${product.term_months_min} (regra do produto).`);
                return;
            }
            if (product.term_months_max != null && installments > product.term_months_max) {
                toast.error(`O número de parcelas deve ser no máximo ${product.term_months_max} (regra do produto).`);
                return;
            }
            if (interestRate != null) {
                if (product.interest_rate_min != null && interestRate < product.interest_rate_min) {
                    toast.error(`A taxa de juros deve ser no mínimo ${product.interest_rate_min}% (regra do produto).`);
                    return;
                }
                if (product.interest_rate_max != null && interestRate > product.interest_rate_max) {
                    toast.error(`A taxa de juros deve ser no máximo ${product.interest_rate_max}% (regra do produto).`);
                    return;
                }
            }
        }

        const requiresAccount = PAYMENT_METHODS_REQUIRING_ACCOUNT.includes(formData.cc_payment_method);

        const contractData: ContractInsert = {
            branch_id: unidadeAtual.id,
            title: autoTitle,
            favorecido_id: formData.favorecido_id || null,
            type: formData.type || null,
            value,
            start_date: startDate,
            end_date: installments > 1 ? endDate : null,
            notes: formData.notes || null,
            category_id: formData.category_id || null,
            product_id: formData.product_id || null,
            recurrence_type: recurrenceType,
            seller_id: formData.seller_id || null,
            payment_due_day: formData.payment_due_day ? parseInt(formData.payment_due_day, 10) : null,
            interest_rate: interestRate,
            cc_amount_released: formData.cc_amount_released ? parseFloat(formData.cc_amount_released) : null,
            ...(isCartao && {
                cc_terminal: formData.cc_terminal || null,
                cc_card_brand: formData.cc_card_brand || null,
                cc_card_last_four: formData.cc_card_last_four || null,
                cc_card_holder_name: formData.cc_card_holder_name || null,
                cc_sale_type: formData.cc_sale_type || null,
                cc_payment_method: formData.cc_payment_method || null,
                cc_payment_account: requiresAccount ? formData.cc_payment_account || null : null,
                cc_discount_amount: formData.cc_discount_amount ? parseFloat(formData.cc_discount_amount) : null,
                cc_saturday_refund: formData.cc_saturday_refund ? parseFloat(formData.cc_saturday_refund) : null,
                cc_lacre: formData.cc_lacre || null,
            }),
            status: editingId ? undefined : 'aprovado',
        };

        if (editingId) {
            const currentEditingId = editingId;
            try {
                const updated = await updateMutation.mutateAsync({ id: currentEditingId, data: contractData });
                // onSuccess already closed modal and reset form
                const oldEntries = await getFinancialEntriesByContractId(currentEditingId);
                if (oldEntries.length > 0) {
                    await deleteFinancialEntries(oldEntries.map((entry) => entry.id));
                }
                await generateFinancialEntriesFromContract(updated as ContractWithRelations, product);
                queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
            } catch {
                // Error already handled by mutation's onError
            }
        } else {
            const created = await createMutation.mutateAsync(contractData);
            if (pendingFiles.length > 0 && created?.id) {
                await Promise.allSettled(
                    pendingFiles.map((f) => uploadContractFile(created.id, f, user?.id ?? undefined))
                );
                queryClient.invalidateQueries({ queryKey: ['contracts'] });
            }
            if (created?.id) {
                try {
                    await generateFinancialEntriesFromContract(created as ContractWithRelations, product);
                    queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
                } catch {
                    toast.warning('Venda criada, mas erro ao gerar lançamentos financeiros');
                }
            }
        }
    }, [formData, editingId, unidadeAtual?.id, products, ccRate, autoTitle, createMutation, updateMutation, pendingFiles, user?.id, queryClient]);

    const handleDelete = useCallback((id: string, title: string) => {
        confirm(async () => {
            setIsDeleting(true);
            try {
                const oldEntries = await getFinancialEntriesByContractId(id);
                if (oldEntries.length > 0) {
                    await deleteFinancialEntries(oldEntries.map((entry) => entry.id));
                }
                await deleteMutation.mutateAsync(id);
            } finally {
                setIsDeleting(false);
            }
        }, {
            title: 'Excluir venda',
            description: `Tem certeza que deseja excluir "${title}"? Os lançamentos financeiros também serão excluídos.`,
            confirmText: 'Excluir',
        });
    }, [confirm, deleteMutation]);

    const openEditModal = useCallback((contract: any) => {
        const product = contract.product_id
            ? products?.find((p) => p.id === contract.product_id)
            : null;
        const categoryByProductName = product?.product_category?.name
            ? categories?.find(
                (c) => c.name.toLowerCase() === product.product_category!.name.toLowerCase()
            )
            : null;
        const categoryIdFromProduct = categoryByProductName?.id ?? (vendasCategory?.id || '');
        // Derive installments from start/end dates
        let derivedInstallments = '1';
        if (contract.end_date && contract.start_date) {
            const s = new Date(contract.start_date);
            const e = new Date(contract.end_date);
            const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
            derivedInstallments = String(Math.max(1, months));
        }

        setFormData({
            favorecido_id: contract.favorecido_id || '',
            type: product ? (product.commercial_description || product.name) : (contract.type || ''),
            value: contract.value?.toString() || '',
            installments: derivedInstallments,
            notes: contract.notes || '',
            category_id: product ? categoryIdFromProduct : (contract.category_id || ''),
            product_id: contract.product_id || '',
            seller_id: contract.seller_id || '',
            payment_due_day: contract.payment_due_day?.toString() || '',
            interest_rate: contract.interest_rate?.toString() || '',
            cc_amount_released: contract.cc_amount_released?.toString() || '',
            cc_terminal: contract.cc_terminal || TERMINALS.SUMUP_W,
            cc_card_brand: contract.cc_card_brand || CARD_BRANDS.VISA,
            cc_card_last_four: contract.cc_card_last_four || '',
            cc_card_holder_name: contract.cc_card_holder_name || '',
            cc_sale_type: contract.cc_sale_type || SALE_TYPES.VENDA_NOVA,
            cc_payment_method: contract.cc_payment_method || PAYMENT_METHODS.PIX,
            cc_payment_account: contract.cc_payment_account || TRANSFER_SOURCES.TF_RENTA,
            cc_discount_amount: contract.cc_discount_amount?.toString() || '',
            cc_saturday_refund: contract.cc_saturday_refund?.toString() || '',
            cc_lacre: contract.cc_lacre || '',
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
                                {/* Produto — primeiro campo */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Produto
                                        <span className="text-destructive ml-1">*</span>
                                    </label>
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
                                                });
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsInlineTypeModalOpen(true)}
                                            className="inline-flex items-center px-3 py-2.5 rounded-lg font-medium text-primary border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
                                            title="Cadastrar novo produto"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Título gerado automaticamente */}
                                {autoTitle && autoTitle !== 'Nova venda' && (
                                    <div className="px-3 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground">Título: </span>
                                        {autoTitle}
                                    </div>
                                )}

                                {/* Cliente */}
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

                                {/* Bloco cartão de crédito */}
                                {selectedProduct?.product_type === 'cartao_credito' && (
                                    <div className="rounded-xl border-2 border-blue-500/40 bg-blue-500/5 p-4 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                Operação de Cartão de Crédito
                                            </span>
                                        </div>

                                        {/* Valores */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    Valor total pago na maquineta (R$)
                                                </label>
                                                <CurrencyInput
                                                    value={formData.value}
                                                    onChange={(numValue) => setFormData({ ...formData, value: String(numValue) })}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Parcelas × valor da parcela (receita total)
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                    Valor liberado ao cliente (R$)
                                                </label>
                                                <CurrencyInput
                                                    value={formData.cc_amount_released}
                                                    onChange={(numValue) => setFormData({ ...formData, cc_amount_released: String(numValue) })}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Dinheiro entregue ao cliente (despesa)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Taxa calculada */}
                                        {ccRate !== null && (
                                            <div className={[
                                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                ccRateStatus === 'ok'
                                                    ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                                                    : 'bg-red-500/10 text-red-700 dark:text-red-400',
                                            ].join(' ')}
                                            >
                                                <span>
                                                    Taxa total calculada:
                                                    {' '}
                                                    <span className="font-bold">
                                                        {ccRate.toFixed(2)}
                                                        %
                                                    </span>
                                                </span>
                                                {ccRateStatus === 'ok' && (
                                                    <span className="text-xs opacity-80">✓ dentro da faixa do produto</span>
                                                )}
                                                {ccRateStatus === 'below' && (
                                                    <span className="text-xs opacity-80">
                                                        ✗ abaixo do mínimo (
                                                        {selectedProduct.interest_rate_min}
                                                        %)
                                                    </span>
                                                )}
                                                {ccRateStatus === 'above' && (
                                                    <span className="text-xs opacity-80">
                                                        ✗ acima do máximo (
                                                        {selectedProduct.interest_rate_max}
                                                        %)
                                                    </span>
                                                )}
                                                {ccRateStatus === null && selectedProduct && (
                                                    selectedProduct.interest_rate_min == null
                                                    && selectedProduct.interest_rate_max == null
                                                ) && (
                                                    <span className="text-xs opacity-80">sem restrição de taxa no produto</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Terminal e Cartão */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Maquineta</label>
                                                <select
                                                    className="input-financial"
                                                    value={formData.cc_terminal}
                                                    onChange={(e) => setFormData({ ...formData, cc_terminal: e.target.value })}
                                                >
                                                    {Object.entries(TERMINAL_LABELS).map(([val, label]) => (
                                                        <option key={val} value={val}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Bandeira</label>
                                                <select
                                                    className="input-financial"
                                                    value={formData.cc_card_brand}
                                                    onChange={(e) => setFormData({ ...formData, cc_card_brand: e.target.value })}
                                                >
                                                    {Object.entries(CARD_BRAND_LABELS).map(([val, label]) => (
                                                        <option key={val} value={val}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Final do Cartão (4 dígitos)</label>
                                                <input
                                                    type="text"
                                                    className="input-financial font-mono"
                                                    maxLength={4}
                                                    placeholder="1234"
                                                    value={formData.cc_card_last_four}
                                                    onChange={(e) => setFormData({ ...formData, cc_card_last_four: e.target.value.replace(/\D/g, '') })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Titular do Cartão</label>
                                                <input
                                                    type="text"
                                                    className="input-financial"
                                                    placeholder="Nome como no cartão"
                                                    value={formData.cc_card_holder_name}
                                                    onChange={(e) => setFormData({ ...formData, cc_card_holder_name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Tipo de venda e pagamento */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Tipo de Venda</label>
                                                <select
                                                    className="input-financial"
                                                    value={formData.cc_sale_type}
                                                    onChange={(e) => setFormData({ ...formData, cc_sale_type: e.target.value })}
                                                >
                                                    {Object.entries(SALE_TYPE_LABELS).map(([val, label]) => (
                                                        <option key={val} value={val}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Forma de Pagamento</label>
                                                <select
                                                    className="input-financial"
                                                    value={formData.cc_payment_method}
                                                    onChange={(e) => setFormData({ ...formData, cc_payment_method: e.target.value })}
                                                >
                                                    {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                                                        <option key={val} value={val}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {PAYMENT_METHODS_REQUIRING_ACCOUNT.includes(formData.cc_payment_method) && (
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-2">Realizador</label>
                                                    <select
                                                        className="input-financial"
                                                        value={formData.cc_payment_account}
                                                        onChange={(e) => setFormData({ ...formData, cc_payment_account: e.target.value })}
                                                    >
                                                        {Object.entries(TRANSFER_SOURCE_LABELS).map(([val, label]) => (
                                                            <option key={val} value={val}>{label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Desconto, sábado e lacre
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Desconto (R$)</label>
                                                <CurrencyInput
                                                    value={formData.cc_discount_amount}
                                                    onChange={(numValue) => setFormData({ ...formData, cc_discount_amount: String(numValue) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Devolução Sábado (R$)</label>
                                                <CurrencyInput
                                                    value={formData.cc_saturday_refund}
                                                    onChange={(numValue) => setFormData({ ...formData, cc_saturday_refund: String(numValue) })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Lacre</label>
                                                <input
                                                    type="text"
                                                    className="input-financial"
                                                    placeholder="Código do lacre"
                                                    value={formData.cc_lacre}
                                                    onChange={(e) => setFormData({ ...formData, cc_lacre: e.target.value })}
                                                />
                                            </div>
                                        </div> */}

                                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                                            Ao gerar lançamentos: 1 saída (valor ao cliente) + N entradas (parcelas da maquininha).
                                        </p>
                                    </div>
                                )}

                                {/* Valor — produtos não-cartão */}
                                {selectedProduct?.product_type !== 'cartao_credito' && (
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">Valor (R$)</label>
                                        <CurrencyInput
                                            value={formData.value}
                                            onChange={(numValue) => setFormData({ ...formData, value: String(numValue) })}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Número de parcelas
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="input-financial"
                                            placeholder="Ex: 12"
                                            value={formData.installments}
                                            onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                                        />
                                        {selectedProduct && (selectedProduct.term_months_min != null || selectedProduct.term_months_max != null) && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Faixa do produto:
                                                {' '}
                                                {selectedProduct.term_months_min ?? 1}
                                                {' – '}
                                                {selectedProduct.term_months_max ?? '∞'}
                                                {' parcelas'}
                                            </p>
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

                                {/* Taxa de juros — apenas produtos não-cartão */}
                                {selectedProduct?.product_type !== 'cartao_credito' && (
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Taxa de juros (% a.m.)
                                        </label>
                                        <input
                                            type="number"
                                            className="input-financial"
                                            placeholder={
                                                selectedProduct
                                                    ? `${selectedProduct.interest_rate_min ?? 0} – ${selectedProduct.interest_rate_max ?? '∞'}%`
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
                                                {'% – '}
                                                {selectedProduct.interest_rate_max ?? '∞'}
                                                % a.m.
                                            </p>
                                        )}
                                    </div>
                                )}
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
                                {!editingId && (
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Anexos
                                        </label>
                                        <label className="btn-secondary py-2 cursor-pointer inline-flex">
                                            <Upload className="w-4 h-4" />
                                            Selecionar arquivos
                                            <input
                                                type="file"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files ?? []);
                                                    setPendingFiles((prev) => [...prev, ...files]);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        {pendingFiles.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {pendingFiles.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="flex-1 truncate">{f.name}</span>
                                                        <button
                                                            type="button"
                                                            className="text-destructive hover:text-destructive/80"
                                                            onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
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
                            onApprove={handleApprove}
                            onReject={handleReject}
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
                                            {/* Creator info */}
                                            {contract.creator && (
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    Criado por
                                                    {' '}
                                                    {contract.creator.name}
                                                    {' '}
                                                    em
                                                    {' '}
                                                    {formatDate(contract.created_at)}
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
                                    <button
                                        className="btn-secondary py-2"
                                        onClick={() => setViewingContract(contract)}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Ver
                                    </button>
                                    <button
                                        className="btn-secondary py-2"
                                        onClick={() => openEditModal(contract)}
                                    >
                                        <Edit className="w-4 h-4" />
                                        Editar
                                    </button>

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
                                    {products?.find((p) => p.id === contract.product_id)?.product_type === 'cartao_credito' && (
                                        <button
                                            className="btn-secondary py-2"
                                            onClick={() => setComprovanteContract(contract)}
                                            title="Gerar comprovante de cartão"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Comprovante
                                        </button>
                                    )}
                                    <button
                                        className="btn-secondary py-2 text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(contract.id, contract.title)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {comprovanteContract && (
                <ContractCreditCardReceipt
                    contract={comprovanteContract}
                    branchName={unidadeAtual?.name ?? undefined}
                    open={!!comprovanteContract}
                    onClose={() => setComprovanteContract(null)}
                />
            )}

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

            {/* Inline Product Type Selection Modal */}
            <ProductTypeModal
                open={isInlineTypeModalOpen}
                onSelect={(type) => {
                    setProductFormData((prev) => ({ ...prev, product_type: type }));
                    setIsInlineTypeModalOpen(false);
                    setIsProductModalOpen(true);
                }}
                onClose={() => setIsInlineTypeModalOpen(false)}
            />

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

            <ConfirmDialog {...dialogProps} isLoading={isDeleting} />

            <ContractViewerModal
                contract={viewingContract}
                open={!!viewingContract}
                onClose={() => setViewingContract(null)}
            />
        </AppLayout>
    );
}
