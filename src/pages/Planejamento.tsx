import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  Target, 
  TrendingUp, 
  Users, 
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Save,
  Calendar,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Legend 
} from 'recharts';
import { toast } from 'sonner';
import { useBranchStore } from '@/stores';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getBudgetItems, 
  getBudgetByCategory,
  createAnnualBudget,
  updateBudgetItem,
  getBudgetSummary,
  getSalesTargets,
  createSalesTarget,
  updateSalesTarget,
  getSalesTargetSummary,
  calculateSellerEarnings
} from '@/services/planejamento';
import { useCategories } from '@/hooks/useCategorias';
import { useVendedores } from '@/hooks/useCadastros';
import type { SalesTargetInsert } from '@/types/database';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

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

  const { data: targetsSummary } = useQuery({
    queryKey: ['sales-targets-summary', unidadeAtual?.id, selectedYear, selectedMonth],
    queryFn: () => getSalesTargetSummary(unidadeAtual!.id, selectedYear, selectedMonth),
    enabled: !!unidadeAtual?.id,
  });

  const { data: categories } = useCategories();
  const { data: vendedores } = useVendedores();

  // Mutations
  const createBudgetMutation = useMutation({
    mutationFn: ({ categoryId, annualAmount }: { categoryId: string; annualAmount: number }) =>
      createAnnualBudget(unidadeAtual!.id, categoryId, selectedYear, annualAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['budget-by-category'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    },
  });

  const createTargetMutation = useMutation({
    mutationFn: (target: SalesTargetInsert) => createSalesTarget(target),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] });
      queryClient.invalidateQueries({ queryKey: ['sales-targets-summary'] });
    },
  });

  const updateTargetMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateSalesTarget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] });
      queryClient.invalidateQueries({ queryKey: ['sales-targets-summary'] });
    },
  });

  // Chart data for budget
  const budgetChartData = MONTHS.map((month, index) => {
    const monthData = { month };
    (budgetByCategory || []).forEach(cat => {
      monthData[cat.categoryName] = cat.months[index]?.budgeted || 0;
    });
    return monthData;
  });

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!budgetForm.category_id || !budgetForm.annual_amount) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      await createBudgetMutation.mutateAsync({
        categoryId: budgetForm.category_id,
        annualAmount: parseFloat(budgetForm.annual_amount.replace(/[^\d,-]/g, '').replace(',', '.')),
      });
      toast.success('Orçamento anual criado!');
      setIsBudgetModalOpen(false);
      setBudgetForm({ category_id: '', annual_amount: '' });
    } catch (error) {
      toast.error('Erro ao criar orçamento');
    }
  };

  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unidadeAtual?.id || !targetForm.seller_id || !targetForm.target_amount) {
      toast.error('Preencha todos os campos');
      return;
    }

    const target: SalesTargetInsert = {
      branch_id: unidadeAtual.id,
      seller_id: targetForm.seller_id,
      year: selectedYear,
      month: selectedMonth,
      target_amount: parseFloat(targetForm.target_amount.replace(/[^\d,-]/g, '').replace(',', '.')),
      commission_rate: parseFloat(targetForm.commission_rate),
      bonus_rate: parseFloat(targetForm.bonus_rate),
    };

    try {
      await createTargetMutation.mutateAsync(target);
      toast.success('Meta criada!');
      setIsTargetModalOpen(false);
      setTargetForm({ seller_id: '', target_amount: '', commission_rate: '5', bonus_rate: '1' });
    } catch (error) {
      toast.error('Erro ao criar meta');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Planejamento</h1>
            <p className="text-muted-foreground">Orçamento anual e metas de vendedores</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="input-financial"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="orcamento" className="rounded-md data-[state=active]:bg-card">
              <Target className="w-4 h-4 mr-2" />
              Orçamento Anual
            </TabsTrigger>
            <TabsTrigger value="metas" className="rounded-md data-[state=active]:bg-card">
              <Users className="w-4 h-4 mr-2" />
              Metas de Vendedores
            </TabsTrigger>
          </TabsList>

          {/* Budget Tab */}
          <TabsContent value="orcamento" className="mt-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat-card stat-card-primary">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orçado</p>
                    <p className="text-xl font-bold font-mono-numbers text-foreground">
                      {formatCurrency(budgetSummary?.totalBudgeted || 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="stat-card stat-card-income">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-income" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Realizado</p>
                    <p className="text-xl font-bold font-mono-numbers text-income">
                      {formatCurrency(budgetSummary?.totalActual || 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Execução</p>
                    <p className="text-xl font-bold text-foreground">
                      {(budgetSummary?.executionRate || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
                <DialogTrigger asChild>
                  <button className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Novo Orçamento
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Orçamento Anual</DialogTitle>
                    <DialogDescription>
                      Defina o orçamento anual para uma categoria. O valor será distribuído igualmente entre os meses.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4 mt-4" onSubmit={handleBudgetSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Categoria</label>
                      <select
                        className="input-financial"
                        value={budgetForm.category_id}
                        onChange={(e) => setBudgetForm({ ...budgetForm, category_id: e.target.value })}
                        required
                      >
                        <option value="">Selecione</option>
                        {categories?.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Valor Anual</label>
                      <input
                        type="text"
                        className="input-financial font-mono-numbers"
                        placeholder="R$ 0,00"
                        value={budgetForm.annual_amount}
                        onChange={(e) => setBudgetForm({ ...budgetForm, annual_amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" className="btn-secondary" onClick={() => setIsBudgetModalOpen(false)}>
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={createBudgetMutation.isPending}
                      >
                        {createBudgetMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        Salvar Orçamento
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Budget Chart */}
            <div className="card-financial p-6">
              <h3 className="font-semibold text-foreground mb-4">Orçamento por Categoria - {selectedYear}</h3>
              {budgetLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : budgetByCategory?.length ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      {(budgetByCategory || []).map((cat, index) => (
                        <Bar 
                          key={cat.categoryId} 
                          dataKey={cat.categoryName} 
                          fill={cat.color} 
                          stackId="budget"
                          radius={index === (budgetByCategory?.length || 0) - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">Nenhum orçamento definido para {selectedYear}</p>
              )}
            </div>

            {/* Budget Table */}
            <div className="card-financial overflow-hidden">
              <table className="table-financial">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th className="text-right">Orçado Anual</th>
                    <th className="text-right">Realizado</th>
                    <th className="text-right">Variação</th>
                    <th className="text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {(budgetByCategory || []).map(cat => {
                    const variance = cat.actualAnnual - cat.budgetedAnnual;
                    const variancePercent = cat.budgetedAnnual > 0 ? (cat.actualAnnual / cat.budgetedAnnual) * 100 : 0;
                    return (
                      <tr key={cat.categoryId}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="font-medium text-foreground">{cat.categoryName}</span>
                          </div>
                        </td>
                        <td className="text-right font-mono-numbers">{formatCurrency(cat.budgetedAnnual)}</td>
                        <td className="text-right font-mono-numbers">{formatCurrency(cat.actualAnnual)}</td>
                        <td className={`text-right font-mono-numbers ${variance >= 0 ? 'text-income' : 'text-expense'}`}>
                          {formatCurrency(variance)}
                        </td>
                        <td className="text-right font-mono-numbers">{variancePercent.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Sales Targets Tab */}
          <TabsContent value="metas" className="mt-6 space-y-6">
            {/* Month selector */}
            <div className="flex items-center gap-4">
              <select
                className="input-financial"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {MONTHS.map((month, index) => (
                  <option key={index} value={index + 1}>{month}</option>
                ))}
              </select>
              <span className="text-muted-foreground">de {selectedYear}</span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stat-card stat-card-primary">
                <p className="text-sm text-muted-foreground">Meta Total</p>
                <p className="text-xl font-bold font-mono-numbers text-foreground">
                  {formatCurrency(targetsSummary?.totalTarget || 0)}
                </p>
              </div>
              <div className="stat-card stat-card-income">
                <p className="text-sm text-muted-foreground">Realizado</p>
                <p className="text-xl font-bold font-mono-numbers text-income">
                  {formatCurrency(targetsSummary?.totalActual || 0)}
                </p>
              </div>
              <div className="stat-card stat-card-pending">
                <p className="text-sm text-muted-foreground">Comissões</p>
                <p className="text-xl font-bold font-mono-numbers text-pending">
                  {formatCurrency(targetsSummary?.totalCommission || 0)}
                </p>
              </div>
              <div className="stat-card">
                <p className="text-sm text-muted-foreground">Atingimento</p>
                <p className="text-xl font-bold text-foreground">
                  {(targetsSummary?.achievementRate || 0).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <Dialog open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
                <DialogTrigger asChild>
                  <button className="btn-primary">
                    <Plus className="w-4 h-4" />
                    Nova Meta
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Meta de Vendedor</DialogTitle>
                    <DialogDescription>
                      Defina a meta mensal para um vendedor.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4 mt-4" onSubmit={handleTargetSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Vendedor</label>
                      <select
                        className="input-financial"
                        value={targetForm.seller_id}
                        onChange={(e) => setTargetForm({ ...targetForm, seller_id: e.target.value })}
                        required
                      >
                        <option value="">Selecione</option>
                        {vendedores?.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Meta de Vendas</label>
                      <input
                        type="text"
                        className="input-financial font-mono-numbers"
                        placeholder="R$ 0,00"
                        value={targetForm.target_amount}
                        onChange={(e) => setTargetForm({ ...targetForm, target_amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Comissão (%)</label>
                        <input
                          type="number"
                          step="0.1"
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
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={createTargetMutation.isPending}
                      >
                        {createTargetMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        Salvar Meta
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Sales Targets Table */}
            <div className="card-financial overflow-hidden">
              {targetsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (salesTargets || []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma meta definida para {MONTHS[selectedMonth - 1]}/{selectedYear}</p>
                </div>
              ) : (
                <table className="table-financial">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th className="text-right">Meta</th>
                      <th className="text-right">Realizado</th>
                      <th className="text-center">Atingimento</th>
                      <th className="text-right">Comissão</th>
                      <th className="text-right">Bônus</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(salesTargets || []).map(target => {
                      const earnings = calculateSellerEarnings(target);
                      const progressPercent = Number(target.target_amount) > 0 
                        ? (Number(target.actual_amount) / Number(target.target_amount)) * 100 
                        : 0;
                      
                      return (
                        <tr key={target.id}>
                          <td>
                            <span className="font-medium text-foreground">{target.seller?.name || 'N/A'}</span>
                          </td>
                          <td className="text-right font-mono-numbers">{formatCurrency(Number(target.target_amount))}</td>
                          <td className="text-right font-mono-numbers">{formatCurrency(Number(target.actual_amount))}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${earnings.achieved ? 'bg-income' : 'bg-pending'}`}
                                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono-numbers text-foreground w-12 text-right">
                                {progressPercent.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="text-right font-mono-numbers text-muted-foreground">
                            {formatCurrency(earnings.commission)}
                          </td>
                          <td className="text-right font-mono-numbers">
                            {earnings.achieved ? (
                              <span className="text-income">{formatCurrency(earnings.bonus)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="text-right font-mono-numbers font-semibold text-foreground">
                            {formatCurrency(earnings.total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
