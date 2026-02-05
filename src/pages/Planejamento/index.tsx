import { useState, useCallback, useMemo } from 'react';
import {
    Target,
    TrendingUp,
    Users,
    DollarSign,
    Plus,
    Loader2,
    Copy,
    CheckCircle,
    Archive,
    FileText,
    LayoutList,
    BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useBranchStore, useAuthStore } from '@/stores';
import {
    createAnnualBudget,
    getSalesTargets,
    createSalesTarget,
    getSalesTargetSummary,
    calculateSellerEarnings,
} from '@/services/planejamento';
import {
    getBudgetVersions,
    createBudgetVersion,
    duplicateBudgetVersion,
    approveBudgetVersion,
    archiveBudgetVersion,
} from '@/services/budgetVersions';
import {
    useBudgetHierarchical,
    useBudgetSummary,
    useAnnualSummary,
} from '@/hooks/useBudget';
import { useCategories, useSubcategories } from '@/hooks/useCategorias';
import { useVendedores } from '@/hooks/useCadastros';
import {
    PageHeader, LoadingState, EmptyState, StatCard
} from '@/components/shared';
import { formatCurrency, MONTHS_SHORT } from '@/lib/utils';
import type { SalesTargetInsert } from '@/types/database';

import {
    BudgetTreeTable,
    BudgetCharts,
    AnnualSummaryTable,
    BudgetComparisonView,
} from './components';

type BudgetViewMode = 'planejamento' | 'comparativo';

export default function Planejamento() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [activeTab, setActiveTab] = useState('orcamento');
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [budgetViewMode, setBudgetViewMode] = useState<BudgetViewMode>('planejamento');

    // Budget form
    const [budgetForm, setBudgetForm] = useState({
        category_id: '',
        annual_amount: '',
        subcategory_id: '',
    });

    const { data: subcategories } = useSubcategories(budgetForm.category_id);

    // Target form
    const [targetForm, setTargetForm] = useState({
        seller_id: '',
        target_amount: '',
        commission_rate: '5',
        bonus_amount: '0',
    });

    // Version form
    const [versionForm, setVersionForm] = useState({
        name: '',
    });

    // Check if user can approve
    const canApprove = user?.role === 'admin' || user?.role === 'gerente';

    // Fetch hierarchical budget data
    const { data: budgetHierarchical, isLoading: budgetLoading } = useBudgetHierarchical(
        unidadeAtual?.id,
        selectedYear,
        selectedVersionId
    );

    const { data: budgetSummary } = useBudgetSummary(
        unidadeAtual?.id,
        selectedYear,
        selectedVersionId
    );

    const { data: annualSummary, isLoading: annualSummaryLoading } = useAnnualSummary(
        unidadeAtual?.id,
        selectedYear,
        selectedVersionId
    );

    const { data: salesTargets, isLoading: targetsLoading } = useQuery({
        queryKey: ['sales-targets', unidadeAtual?.id, selectedYear, selectedMonth],
        queryFn: () => getSalesTargets(unidadeAtual!.id, selectedYear, selectedMonth),
        enabled: !!unidadeAtual?.id,
    });

    const { data: targetSummary } = useQuery({
        queryKey: ['sales-target-summary', unidadeAtual?.id, selectedYear, selectedMonth],
        queryFn: () => getSalesTargetSummary(unidadeAtual!.id, selectedYear, selectedMonth),
        enabled: !!unidadeAtual?.id,
    });

    const { data: categories } = useCategories();
    const { data: vendedores } = useVendedores();

    // Fetch budget versions
    const { data: budgetVersions } = useQuery({
        queryKey: ['budget-versions', unidadeAtual?.id, selectedYear],
        queryFn: () => getBudgetVersions(unidadeAtual!.id, selectedYear),
        enabled: !!unidadeAtual?.id,
    });

    // Get selected version details
    const selectedVersion = useMemo(
        () => budgetVersions?.find((v) => v.id === selectedVersionId),
        [budgetVersions, selectedVersionId]
    );

    // Check if selected version is editable
    const isVersionEditable = !selectedVersion || selectedVersion.status === 'rascunho';

    // Mutations
    const createBudgetMutation = useMutation({
        mutationFn: (params: {
            branchId: string;
            categoryId: string;
            year: number;
            annualAmount: number;
            subcategoryId?: string | null;
            versionId?: string | null;
        }) => createAnnualBudget(
            params.branchId,
            params.categoryId,
            params.year,
            params.annualAmount,
            'equal',
            undefined,
            params.subcategoryId,
            params.versionId
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget'] });
            setIsBudgetModalOpen(false);
            setBudgetForm({ category_id: '', annual_amount: '', subcategory_id: '' });
            toast.success('Orçamento criado!');
        },
        onError: () => toast.error('Erro ao criar orçamento'),
    });

    const createTargetMutation = useMutation({
        mutationFn: createSalesTarget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales-targets'] });
            queryClient.invalidateQueries({ queryKey: ['sales-target-summary'] });
            setIsTargetModalOpen(false);
            setTargetForm({
                seller_id: '', target_amount: '', commission_rate: '5', bonus_amount: '0'
            });
            toast.success('Meta criada!');
        },
        onError: () => toast.error('Erro ao criar meta'),
    });

    // Version mutations
    const createVersionMutation = useMutation({
        mutationFn: () => createBudgetVersion({
            branchId: unidadeAtual!.id,
            year: selectedYear,
            name: versionForm.name,
            createdBy: user!.id,
        }),
        onSuccess: (versionId) => {
            queryClient.invalidateQueries({ queryKey: ['budget-versions'] });
            setIsVersionModalOpen(false);
            setVersionForm({ name: '' });
            setSelectedVersionId(versionId);
            toast.success('Versão criada!');
        },
        onError: () => toast.error('Erro ao criar versão'),
    });

    const duplicateVersionMutation = useMutation({
        mutationFn: (sourceId: string) => duplicateBudgetVersion(
            sourceId,
            `Cópia de ${selectedVersion?.name || 'versão'}`,
            user!.id
        ),
        onSuccess: (versionId) => {
            queryClient.invalidateQueries({ queryKey: ['budget-versions'] });
            setSelectedVersionId(versionId);
            toast.success('Versão duplicada!');
        },
        onError: () => toast.error('Erro ao duplicar versão'),
    });

    const approveVersionMutation = useMutation({
        mutationFn: (versionId: string) => approveBudgetVersion(versionId, user!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-versions'] });
            toast.success('Versão aprovada!');
        },
        onError: () => toast.error('Erro ao aprovar versão'),
    });

    const archiveVersionMutation = useMutation({
        mutationFn: archiveBudgetVersion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-versions'] });
            toast.success('Versão arquivada!');
        },
        onError: () => toast.error('Erro ao arquivar versão'),
    });

    // Handlers
    const handleCreateBudget = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!unidadeAtual?.id) return;

        createBudgetMutation.mutate({
            branchId: unidadeAtual.id,
            categoryId: budgetForm.category_id,
            year: selectedYear,
            annualAmount: parseFloat(budgetForm.annual_amount) || 0,
            subcategoryId: budgetForm.subcategory_id || null,
            versionId: selectedVersionId,
        });
    }, [unidadeAtual?.id, budgetForm, selectedYear, createBudgetMutation]);

    const handleCreateTarget = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!unidadeAtual?.id) return;

        const targetData: SalesTargetInsert = {
            branch_id: unidadeAtual.id,
            seller_id: targetForm.seller_id,
            year: selectedYear,
            month: selectedMonth,
            target_amount: parseFloat(targetForm.target_amount) || 0,
            commission_rate: parseFloat(targetForm.commission_rate) || 5,
            bonus_amount: parseFloat(targetForm.bonus_amount) || 0,
        };

        createTargetMutation.mutate(targetData);
    }, [unidadeAtual?.id, targetForm, selectedYear, selectedMonth, createTargetMutation]);

    const yearOptions = useMemo(() => {
        const years = [];
        for (let i = -2; i <= 2; i += 1) {
            years.push(currentYear + i);
        }
        return years.sort((a, b) => b - a);
    }, [currentYear]);

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Planejamento" description="Orçamento anual e metas de vendas">
                    <select
                        className="input-financial"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {yearOptions.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </PageHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-muted/50 p-1 rounded-lg">
                        <TabsTrigger
                            value="orcamento"
                            className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm"
                        >
                            Orçamento
                        </TabsTrigger>
                        <TabsTrigger
                            value="metas"
                            className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm"
                        >
                            Metas de Vendas
                        </TabsTrigger>
                        <TabsTrigger
                            value="comissoes"
                            className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm"
                        >
                            Comissões
                        </TabsTrigger>
                    </TabsList>

                    {/* Orçamento Tab */}
                    <TabsContent value="orcamento" className="space-y-6 mt-6">
                        {/* Budget Versions & View Mode */}
                        <div className="card-financial p-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label htmlFor="version-select" className="block text-xs text-muted-foreground mb-1">
                                            Versão
                                        </label>
                                        <select
                                            id="version-select"
                                            className="input-financial min-w-[200px]"
                                            value={selectedVersionId || ''}
                                            onChange={(e) => setSelectedVersionId(e.target.value || null)}
                                        >
                                            <option value="">Todas (consolidado)</option>
                                            {budgetVersions?.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name}
                                                    {' '}
                                                    (v
                                                    {v.version}
                                                    )
                                                    {' '}
                                                    -
                                                    {' '}
                                                    {v.status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {selectedVersion && (
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${
                                                    selectedVersion.status === 'aprovado'
                                                        ? 'bg-income/10 text-income'
                                                        : selectedVersion.status === 'arquivado'
                                                            ? 'bg-muted text-muted-foreground'
                                                            : 'bg-pending/10 text-pending'
                                                }`}
                                            >
                                                {selectedVersion.status === 'rascunho' && 'Rascunho'}
                                                {selectedVersion.status === 'aprovado' && 'Aprovado'}
                                                {selectedVersion.status === 'arquivado' && 'Arquivado'}
                                            </span>
                                        </div>
                                    )}

                                    {/* View Mode Toggle */}
                                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                                        <button
                                            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                                                budgetViewMode === 'planejamento'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-muted'
                                            }`}
                                            onClick={() => setBudgetViewMode('planejamento')}
                                        >
                                            <LayoutList className="w-4 h-4" />
                                            Planejamento
                                        </button>
                                        <button
                                            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
                                                budgetViewMode === 'comparativo'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-muted'
                                            }`}
                                            onClick={() => setBudgetViewMode('comparativo')}
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                            Comparativo
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedVersion && selectedVersion.status === 'rascunho' && (
                                        <button
                                            className="btn-secondary py-1.5"
                                            onClick={() => duplicateVersionMutation.mutate(selectedVersion.id)}
                                            disabled={duplicateVersionMutation.isPending}
                                        >
                                            <Copy className="w-4 h-4" />
                                            Duplicar
                                        </button>
                                    )}
                                    {selectedVersion && selectedVersion.status === 'rascunho' && canApprove && (
                                        <button
                                            className="btn-primary py-1.5"
                                            onClick={() => approveVersionMutation.mutate(selectedVersion.id)}
                                            disabled={approveVersionMutation.isPending}
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Aprovar
                                        </button>
                                    )}
                                    {selectedVersion && selectedVersion.status === 'aprovado' && canApprove && (
                                        <button
                                            className="btn-secondary py-1.5"
                                            onClick={() => archiveVersionMutation.mutate(selectedVersion.id)}
                                            disabled={archiveVersionMutation.isPending}
                                        >
                                            <Archive className="w-4 h-4" />
                                            Arquivar
                                        </button>
                                    )}
                                    <Dialog
                                        open={isVersionModalOpen}
                                        onOpenChange={(open) => {
                                            setIsVersionModalOpen(open);
                                            if (!open) setVersionForm({ name: '' });
                                        }}
                                    >
                                        <DialogTrigger asChild>
                                            <button className="btn-secondary py-1.5">
                                                <FileText className="w-4 h-4" />
                                                Nova Versão
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Nova Versão do Orçamento</DialogTitle>
                                                <DialogDescription>
                                                    Crie uma nova versão do orçamento para
                                                    {' '}
                                                    {selectedYear}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form
                                                className="space-y-4 mt-4"
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    createVersionMutation.mutate();
                                                }}
                                            >
                                                <div>
                                                    <label htmlFor="version-name" className="block text-sm font-medium mb-2">
                                                        Nome da Versão
                                                    </label>
                                                    <input
                                                        id="version-name"
                                                        type="text"
                                                        className="input-financial"
                                                        placeholder={`Orçamento ${selectedYear} v${(budgetVersions?.length || 0) + 1}`}
                                                        value={versionForm.name}
                                                        onChange={(e) => setVersionForm({ name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-3 pt-4">
                                                    <button
                                                        type="button"
                                                        className="btn-secondary"
                                                        onClick={() => setIsVersionModalOpen(false)}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="btn-primary"
                                                        disabled={createVersionMutation.isPending}
                                                    >
                                                        {createVersionMutation.isPending && (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        )}
                                                        Criar Versão
                                                    </button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        {budgetSummary && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard
                                    label="Orçado Total"
                                    value={formatCurrency(budgetSummary.totalBudgeted || 0)}
                                    icon={Target}
                                />
                                <StatCard
                                    label="Realizado"
                                    value={formatCurrency(budgetSummary.totalActual || 0)}
                                    icon={TrendingUp}
                                    variant="income"
                                />
                                <StatCard
                                    label="Variação"
                                    value={formatCurrency(
                                        (budgetSummary.totalActual || 0) - (budgetSummary.totalBudgeted || 0)
                                    )}
                                    icon={DollarSign}
                                    variant={
                                        (budgetSummary.totalActual || 0) <= (budgetSummary.totalBudgeted || 0)
                                            ? 'income'
                                            : 'expense'
                                    }
                                />
                                <StatCard
                                    label="% Execução"
                                    value={`${Math.round(
                                        ((budgetSummary.totalActual || 0) / (budgetSummary.totalBudgeted || 1)) * 100
                                    )}%`}
                                    icon={TrendingUp}
                                    variant="primary"
                                />
                            </div>
                        )}

                        {/* Add Budget Button */}
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-foreground">
                                {budgetViewMode === 'planejamento'
                                    ? 'Orçamento por Categoria'
                                    : 'Comparativo Orçado x Realizado'}
                            </h3>
                            {budgetViewMode === 'planejamento' && (
                                <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
                                    <DialogTrigger asChild>
                                        <button className="btn-primary" disabled={!isVersionEditable}>
                                            <Plus className="w-4 h-4" />
                                            Novo Orçamento
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Novo Orçamento Anual</DialogTitle>
                                            <DialogDescription>
                                                {budgetForm.subcategory_id
                                                    ? 'Defina o orçamento para uma subcategoria'
                                                    : 'Defina o orçamento para uma categoria'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form className="space-y-4 mt-4" onSubmit={handleCreateBudget}>
                                            <div>
                                                <label htmlFor="budget-category" className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                                                <select
                                                    id="budget-category"
                                                    className="input-financial"
                                                    value={budgetForm.category_id}
                                                    onChange={(e) => setBudgetForm({
                                                        ...budgetForm,
                                                        category_id: e.target.value
                                                    })}
                                                    required
                                                >
                                                    <option value="">Selecione</option>
                                                    {categories?.map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Subcategoria</label>
                                                <select
                                                    className="input-financial"
                                                    value={budgetForm.subcategory_id}
                                                    onChange={(e) => setBudgetForm({ ...budgetForm, subcategory_id: e.target.value })}
                                                    disabled={!budgetForm.category_id}
                                                >
                                                    <option value="">Selecione</option>
                                                    {subcategories?.map((s) => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="budget-annual-amount"
                                                    className="block text-sm font-medium text-foreground mb-2"
                                                >
                                                    Valor Anual
                                                </label>
                                                <CurrencyInput
                                                    id="budget-annual-amount"
                                                    value={budgetForm.annual_amount}
                                                    onChange={(numValue) => setBudgetForm({
                                                        ...budgetForm,
                                                        annual_amount: String(numValue)
                                                    })}
                                                    required
                                                />
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4">
                                                <button type="button" className="btn-secondary" onClick={() => setIsBudgetModalOpen(false)}>
                                                    Cancelar
                                                </button>
                                                <button type="submit" className="btn-primary" disabled={createBudgetMutation.isPending}>
                                                    {createBudgetMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                                    Criar Orçamento
                                                </button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        {/* Budget Content Based on View Mode */}
                        {budgetViewMode === 'planejamento' ? (
                            <>
                                <BudgetTreeTable
                                    data={budgetHierarchical}
                                    isLoading={budgetLoading}
                                    branchId={unidadeAtual?.id || ''}
                                    year={selectedYear}
                                    versionId={selectedVersionId}
                                    isEditable={isVersionEditable}
                                />

                                <BudgetCharts
                                    categoryData={budgetHierarchical}
                                    annualSummary={annualSummary}
                                    isLoading={budgetLoading || annualSummaryLoading}
                                />

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-foreground">Resumo Anual</h3>
                                    <AnnualSummaryTable
                                        data={annualSummary}
                                        isLoading={annualSummaryLoading}
                                        showActual
                                    />
                                </div>
                            </>
                        ) : (
                            <BudgetComparisonView
                                data={budgetHierarchical}
                                isLoading={budgetLoading}
                            />
                        )}
                    </TabsContent>

                    {/* Metas de Vendas Tab */}
                    <TabsContent value="metas" className="space-y-6 mt-6">
                        <div className="flex items-center gap-4">
                            <select
                                className="input-financial"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            >
                                {MONTHS_SHORT.map((m, i) => (
                                    <option key={`month-metas-${i + 1}`} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Summary */}
                        {targetSummary && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard label="Meta Total" value={formatCurrency(targetSummary.totalTarget || 0)} icon={Target} />
                                <StatCard label="Vendido" value={formatCurrency(targetSummary.totalActual || 0)} icon={TrendingUp} variant="income" />
                                <StatCard label="Vendedores" value={targetSummary.totalSellers || 0} icon={Users} variant="primary" />
                                <StatCard label="% Atingimento" value={`${Math.round(((targetSummary.totalActual || 0) / (targetSummary.totalTarget || 1)) * 100)}%`} icon={TrendingUp} variant={(targetSummary.totalActual || 0) >= (targetSummary.totalTarget || 0) ? 'income' : 'pending'} />
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-foreground">Metas por Vendedor</h3>
                            <Dialog open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
                                <DialogTrigger asChild>
                                    <button className="btn-primary">
                                        <Plus className="w-4 h-4" />
                                        Nova Meta
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Nova Meta de Vendas</DialogTitle>
                                        <DialogDescription>
                                            Defina a meta para um vendedor
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form className="space-y-4 mt-4" onSubmit={handleCreateTarget}>
                                        <div>
                                            <label
                                                htmlFor="target-seller"
                                                className="block text-sm font-medium text-foreground mb-2"
                                            >
                                                Vendedor
                                            </label>
                                            <select
                                                id="target-seller"
                                                className="input-financial"
                                                value={targetForm.seller_id}
                                                onChange={(e) => setTargetForm({
                                                    ...targetForm,
                                                    seller_id: e.target.value
                                                })}
                                                required
                                            >
                                                <option value="">Selecione</option>
                                                {vendedores?.map((v) => (
                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="target-amount"
                                                className="block text-sm font-medium text-foreground mb-2"
                                            >
                                                Meta
                                            </label>
                                            <CurrencyInput
                                                id="target-amount"
                                                value={targetForm.target_amount}
                                                onChange={(numValue) => setTargetForm({
                                                    ...targetForm,
                                                    target_amount: String(numValue)
                                                })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label
                                                    htmlFor="target-commission"
                                                    className="block text-sm font-medium text-foreground mb-2"
                                                >
                                                    Comissão (%)
                                                </label>
                                                <input
                                                    id="target-commission"
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    className="input-financial"
                                                    value={targetForm.commission_rate}
                                                    onChange={(e) => setTargetForm({
                                                        ...targetForm,
                                                        commission_rate: e.target.value
                                                    })}
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="target-bonus"
                                                    className="block text-sm font-medium text-foreground mb-2"
                                                >
                                                    Bônus (R$)
                                                </label>
                                                <CurrencyInput
                                                    value={targetForm.bonus_amount}
                                                    onChange={(numValue) => setTargetForm({
                                                        ...targetForm,
                                                        bonus_amount: String(numValue)
                                                    })}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button type="button" className="btn-secondary" onClick={() => setIsTargetModalOpen(false)}>
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn-primary"
                                                disabled={createTargetMutation.isPending}
                                            >
                                                {createTargetMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                                Criar Meta
                                            </button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {targetsLoading ? (
                            <LoadingState />
                        ) : !salesTargets?.length ? (
                            <EmptyState icon={Users} message="Nenhuma meta definida" />
                        ) : (
                            <div className="grid gap-4">
                                {salesTargets.map((target) => {
                                    const percentAchieved = Math.round(
                                        ((target.actual_amount || 0) / (target.target_amount || 1)) * 100
                                    );
                                    return (
                                        <div key={target.id} className="card-financial p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/10">
                                                        <Users className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{target.seller?.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Meta:
                                                            {' '}
                                                            {formatCurrency(target.target_amount)}
                                                            {' '}
                                                            • Vendido:
                                                            {' '}
                                                            {formatCurrency(target.actual_amount || 0)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-bold ${percentAchieved >= 100 ? 'text-income' : 'text-pending'}`}>
                                                        {percentAchieved}
                                                        %
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">atingido</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${percentAchieved >= 100 ? 'bg-income' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(percentAchieved, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* Comissões Tab */}
                    <TabsContent value="comissoes" className="space-y-6 mt-6">
                        <div className="flex items-center gap-4">
                            <select
                                className="input-financial"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            >
                                {MONTHS_SHORT.map((m, i) => (
                                    <option key={`month-comissoes-${i + 1}`} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Summary */}
                        {targetSummary && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard
                                    label="Vendido Total"
                                    value={formatCurrency(targetSummary.totalActual || 0)}
                                    icon={TrendingUp}
                                    variant="income"
                                />
                                <StatCard
                                    label="Total Comissões"
                                    value={formatCurrency(targetSummary.totalCommission || 0)}
                                    icon={DollarSign}
                                    variant="primary"
                                />
                                <StatCard
                                    label="Total Bônus"
                                    value={formatCurrency(targetSummary.totalBonus || 0)}
                                    icon={DollarSign}
                                    variant="income"
                                />
                                <StatCard
                                    label="Vendedores"
                                    value={targetSummary.totalSellers || 0}
                                    icon={Users}
                                />
                            </div>
                        )}

                        <div className="card-financial overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-foreground">
                                            Vendedor
                                        </th>
                                        <th className="text-right p-4 font-medium text-foreground">
                                            Meta
                                        </th>
                                        <th className="text-right p-4 font-medium text-foreground">
                                            Vendido
                                        </th>
                                        <th className="text-right p-4 font-medium text-foreground">
                                            % Comissão
                                        </th>
                                        <th className="text-right p-4 font-medium text-foreground">
                                            Comissão
                                        </th>
                                        <th className="text-right p-4 font-medium text-foreground">
                                            Bônus
                                        </th>
                                        <th className="text-right p-4 font-medium text-foreground">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesTargets?.map((target) => {
                                        const earnings = calculateSellerEarnings(target);
                                        return (
                                            <tr
                                                key={target.id}
                                                className="border-t border-border hover:bg-muted/30"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-primary/10">
                                                            <Users className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span className="font-medium">
                                                            {target.seller?.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-mono">
                                                    {formatCurrency(target.target_amount)}
                                                </td>
                                                <td className="p-4 text-right font-mono">
                                                    {formatCurrency(target.actual_amount || 0)}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {target.commission_rate}
                                                    %
                                                </td>
                                                <td className="p-4 text-right font-mono text-primary">
                                                    {formatCurrency(earnings.commission)}
                                                </td>
                                                <td className="p-4 text-right font-mono">
                                                    {earnings.achieved ? (
                                                        <span className="text-income">
                                                            {formatCurrency(earnings.bonus)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right font-mono font-semibold text-income">
                                                    {formatCurrency(earnings.total)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!salesTargets || salesTargets.length === 0) && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                                Nenhuma meta definida para este período
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
