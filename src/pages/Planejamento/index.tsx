import { useState, useCallback, useMemo } from 'react';
import {
    Target,
    TrendingUp,
    Users,
    DollarSign,
    Plus,
    Loader2,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
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
import { useBranchStore } from '@/stores';
import {
    getBudgetByCategory,
    createAnnualBudget,
    getBudgetSummary,
    getSalesTargets,
    createSalesTarget,
    getSalesTargetSummary,
} from '@/services/planejamento';
import { useCategories } from '@/hooks/useCategorias';
import { useVendedores } from '@/hooks/useCadastros';
import {
    PageHeader, LoadingState, EmptyState, StatCard
} from '@/components/shared';
import { formatCurrency, MONTHS_SHORT } from '@/lib/utils';
import type { SalesTargetInsert } from '@/types/database';

export default function Planejamento() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const queryClient = useQueryClient();
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [activeTab, setActiveTab] = useState('orcamento');
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

    // Budget form
    const [budgetForm, setBudgetForm] = useState({
        category_id: '',
        annual_amount: '',
    });

    // Target form
    const [targetForm, setTargetForm] = useState({
        seller_id: '',
        target_amount: '',
        commission_rate: '5',
        bonus_rate: '1',
    });

    // Fetch data
    const { data: budgetByCategory, isLoading: budgetLoading } = useQuery({
        queryKey: ['budget-by-category', unidadeAtual?.id, selectedYear],
        queryFn: () => getBudgetByCategory(unidadeAtual!.id, selectedYear),
        enabled: !!unidadeAtual?.id,
    });

    const { data: budgetSummary } = useQuery({
        queryKey: ['budget-summary', unidadeAtual?.id, selectedYear],
        queryFn: () => getBudgetSummary(unidadeAtual!.id, selectedYear),
        enabled: !!unidadeAtual?.id,
    });

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

    // Mutations
    const createBudgetMutation = useMutation({
        mutationFn: createAnnualBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['budget-by-category'] });
            queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
            setIsBudgetModalOpen(false);
            setBudgetForm({ category_id: '', annual_amount: '' });
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
                seller_id: '', target_amount: '', commission_rate: '5', bonus_rate: '1'
            });
            toast.success('Meta criada!');
        },
        onError: () => toast.error('Erro ao criar meta'),
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
            bonus_rate: parseFloat(targetForm.bonus_rate) || 1,
        };

        createTargetMutation.mutate(targetData);
    }, [unidadeAtual?.id, targetForm, selectedYear, selectedMonth, createTargetMutation]);

    // Chart data
    const chartData = useMemo(() => budgetByCategory?.map((b) => ({
        name: b.categoryName || 'Outros',
        orcado: b.budgetedAnnual,
        realizado: b.actualAnnual,
    })) || [], [budgetByCategory]);

    const yearOptions = useMemo(() => {
        const years = [];
        for (let i = 0; i <= 2; i += 1) {
            years.push(currentYear + i);
        }
        return years;
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
                        <TabsTrigger value="orcamento" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                            Orçamento
                        </TabsTrigger>
                        <TabsTrigger value="metas" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                            Metas de Vendas
                        </TabsTrigger>
                    </TabsList>

                    {/* Orçamento Tab */}
                    <TabsContent value="orcamento" className="space-y-6 mt-6">
                        {/* Summary */}
                        {budgetSummary && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard label="Orçado Total" value={formatCurrency(budgetSummary.totalBudgeted || 0)} icon={Target} />
                                <StatCard label="Realizado" value={formatCurrency(budgetSummary.totalActual || 0)} icon={TrendingUp} variant="income" />
                                <StatCard label="Variação" value={formatCurrency((budgetSummary.totalActual || 0) - (budgetSummary.totalBudgeted || 0))} icon={DollarSign} variant={(budgetSummary.totalActual || 0) <= (budgetSummary.totalBudgeted || 0) ? 'income' : 'expense'} />
                                <StatCard label="% Execução" value={`${Math.round(((budgetSummary.totalActual || 0) / (budgetSummary.totalBudgeted || 1)) * 100)}%`} icon={TrendingUp} variant="primary" />
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-foreground">Orçamento por Categoria</h3>
                            <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
                                <DialogTrigger asChild>
                                    <button className="btn-primary">
                                        <Plus className="w-4 h-4" />
                                        Novo Orçamento
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Novo Orçamento Anual</DialogTitle>
                                        <DialogDescription>
                                            Defina o orçamento para uma categoria
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form className="space-y-4 mt-4" onSubmit={handleCreateBudget}>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                                            <select
                                                className="input-financial"
                                                value={budgetForm.category_id}
                                                onChange={(e) => setBudgetForm({ ...budgetForm, category_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Selecione</option>
                                                {categories?.map((c) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Valor Anual</label>
                                            <CurrencyInput
                                                value={budgetForm.annual_amount}
                                                onChange={(numValue) => setBudgetForm({ ...budgetForm, annual_amount: String(numValue) })}
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
                        </div>

                        {budgetLoading ? (
                            <LoadingState />
                        ) : !chartData.length ? (
                            <EmptyState icon={Target} message="Nenhum orçamento definido" />
                        ) : (
                            <div className="card-financial p-6">
                                <div className="h-[400px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                                            <Legend />
                                            <Bar dataKey="orcado" name="Orçado" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
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
                                    <option key={i} value={i + 1}>{m}</option>
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
                                            <label className="block text-sm font-medium text-foreground mb-2">Vendedor</label>
                                            <select
                                                className="input-financial"
                                                value={targetForm.seller_id}
                                                onChange={(e) => setTargetForm({ ...targetForm, seller_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Selecione</option>
                                                {vendedores?.map((v) => (
                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">Meta</label>
                                            <CurrencyInput
                                                value={targetForm.target_amount}
                                                onChange={(numValue) => setTargetForm({ ...targetForm, target_amount: String(numValue) })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Comissão (%)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    className="input-financial"
                                                    value={targetForm.commission_rate}
                                                    onChange={(e) => setTargetForm({ ...targetForm, commission_rate: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-foreground mb-2">Bônus (%)</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="100"
                                                    className="input-financial"
                                                    value={targetForm.bonus_rate}
                                                    onChange={(e) => setTargetForm({ ...targetForm, bonus_rate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button type="button" className="btn-secondary" onClick={() => setIsTargetModalOpen(false)}>
                                                Cancelar
                                            </button>
                                            <button type="submit" className="btn-primary" disabled={createTargetMutation.isPending}>
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
                                    const percentAchieved = Math.round(((target.achieved_amount || 0) / (target.target_amount || 1)) * 100);
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
                                                            {formatCurrency(target.achieved_amount || 0)}
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
                </Tabs>
            </div>
        </AppLayout>
    );
}
