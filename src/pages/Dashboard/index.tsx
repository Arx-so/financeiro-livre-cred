import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore, useBranchStore } from '@/stores';
import {
    useFinancialSummary,
    useMonthlyData,
    useRecentTransactions,
    useUpcomingPayments,
} from '@/hooks/useFinanceiro';
import { getCategoryBreakdown } from '@/services/relatorios';
import {
    StatCard, LoadingState, EmptyState
} from '@/components/shared';
import {
    formatCurrency, formatDate, getDaysUntil, getYearOptions
} from '@/lib/utils';

export default function Dashboard() {
    const user = useAuthStore((state) => state.user);
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });

    // Year selector state
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const yearOptions = getYearOptions();

    // Calculate date range for the selected year
    const yearStartDate = `${selectedYear}-01-01`;
    const yearEndDate = `${selectedYear}-12-31`;

    // Fetch data filtered by selected year
    const { data: summary, isLoading: summaryLoading } = useFinancialSummary(
        undefined,
        yearStartDate,
        yearEndDate,
    );
    const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyData(selectedYear);
    const { data: recentTransactions, isLoading: recentLoading } = useRecentTransactions(5, undefined, selectedYear);
    const { data: upcomingPayments, isLoading: upcomingLoading } = useUpcomingPayments(15);

    // Receitas por categoria (todas do período, não só as 5 transações recentes)
    const { data: categoryBreakdownReceitas, isLoading: categoryLoading } = useQuery({
        queryKey: ['dashboard-receitas-por-categoria', unidadeAtual?.id, yearStartDate, yearEndDate],
        queryFn: () => getCategoryBreakdown(unidadeAtual!.id, 'receita', yearStartDate, yearEndDate),
        enabled: !!unidadeAtual?.id,
    });

    // Prepare chart data
    const chartData = useMemo(() => monthlyData || [], [monthlyData]);

    // Dados do gráfico de pizza: receitas por categoria no período
    const categoryData = useMemo(
        () => (categoryBreakdownReceitas || []).map((c) => ({
            name: c.name,
            value: c.value,
            color: c.color || 'hsl(var(--muted-foreground))',
        })),
        [categoryBreakdownReceitas],
    );

    const isLoading = summaryLoading || monthlyLoading;

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Olá,
                            {' '}
                            {user?.name?.split(' ')[0] || 'Usuário'}
                            !
                        </h1>
                        <p className="text-muted-foreground">
                            Aqui está o resumo financeiro de
                            {' '}
                            {selectedYear}
                            {unidadeAtual && ` • ${unidadeAtual.name}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            className="input-financial"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                {isLoading ? (
                    <LoadingState />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Receitas"
                            value={formatCurrency(summary?.totalReceitas || 0)}
                            icon={TrendingUp}
                            variant="income"
                        />
                        <StatCard
                            label="Despesas"
                            value={formatCurrency(summary?.totalDespesas || 0)}
                            icon={TrendingDown}
                            variant="expense"
                        />
                        <StatCard
                            label="Pendente"
                            value={formatCurrency(summary?.pendentes || 0)}
                            icon={Clock}
                            variant="pending"
                        />
                        <StatCard
                            label="Saldo"
                            value={formatCurrency(summary?.saldo || 0)}
                            icon={DollarSign}
                            variant={(summary?.saldo || 0) >= 0 ? 'income' : 'expense'}
                        />
                    </div>
                )}

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Cash Flow Chart */}
                    <div className="lg:col-span-2 card-financial p-6">
                        <h3 className="font-semibold text-foreground mb-4">Fluxo de Caixa Mensal</h3>
                        <div className="h-[300px]">
                            {monthlyLoading ? (
                                <LoadingState />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--income))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--income))" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--expense))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--expense))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                                        <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Area type="monotone" dataKey="receitas" stroke="hsl(var(--income))" fill="url(#colorReceitas)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="despesas" stroke="hsl(var(--expense))" fill="url(#colorDespesas)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="card-financial p-6">
                        <h3 className="font-semibold text-foreground mb-4">Receitas por Categoria</h3>
                        <div className="h-[300px]">
                            {categoryLoading ? (
                                <LoadingState />
                            ) : categoryData.length === 0 ? (
                                <EmptyState icon={TrendingUp} message="Sem dados" />
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend
                                            verticalAlign="bottom"
                                            formatter={(value, entry: { payload?: { value?: number } }) =>
                                                `${value} (${formatCurrency(entry?.payload?.value ?? 0)})`
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent & Upcoming */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Transactions */}
                    <div className="card-financial">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">Transações Recentes</h3>
                            <Link to="/financeiro" className="text-sm text-primary hover:underline">
                                Ver todas
                            </Link>
                        </div>
                        {recentLoading ? (
                            <LoadingState />
                        ) : (
                            <div className="divide-y divide-border">
                                {(recentTransactions || []).slice(0, 5).map((t) => (
                                    <div key={t.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {t.type === 'receita' ? (
                                                <div className="p-2 rounded-lg bg-income/10">
                                                    <ArrowUpRight className="w-4 h-4 text-income" />
                                                </div>
                                            ) : (
                                                <div className="p-2 rounded-lg bg-expense/10">
                                                    <ArrowDownRight className="w-4 h-4 text-expense" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-foreground">{t.description}</p>
                                                <p className="text-sm text-muted-foreground">{formatDate(t.due_date)}</p>
                                            </div>
                                        </div>
                                        <p className={`font-semibold font-mono ${t.type === 'receita' ? 'text-income' : 'text-expense'}`}>
                                            {t.type === 'despesa' ? '-' : ''}
                                            {formatCurrency(t.value)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Payments */}
                    <div className="card-financial">
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">Próximos Vencimentos</h3>
                            <Link to="/financeiro" className="text-sm text-primary hover:underline">
                                Ver todos
                            </Link>
                        </div>
                        {upcomingLoading ? (
                            <LoadingState />
                        ) : (
                            <div className="divide-y divide-border">
                                {(upcomingPayments || []).slice(0, 5).map((p) => {
                                    const daysUntil = getDaysUntil(p.due_date);
                                    return (
                                        <div key={p.id} className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-pending/10">
                                                    <Calendar className="w-4 h-4 text-pending" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{p.description}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(p.due_date)}
                                                        {daysUntil === 0 && ' • Hoje'}
                                                        {daysUntil === 1 && ' • Amanhã'}
                                                        {daysUntil > 1 && ` • em ${daysUntil} dias`}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-semibold font-mono text-expense">
                                                {formatCurrency(p.value)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
