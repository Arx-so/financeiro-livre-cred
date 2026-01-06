import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthStore, useBranchStore } from '@/stores';
import { 
  useFinancialSummary, 
  useMonthlyData, 
  useRecentTransactions, 
  useUpcomingPayments 
} from '@/hooks/useFinanceiro';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });

  // Fetch data
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyData(currentYear);
  const { data: recentTransactions, isLoading: recentLoading } = useRecentTransactions(5);
  const { data: upcomingPayments, isLoading: upcomingLoading } = useUpcomingPayments(15);

  // Prepare chart data
  const chartData = monthlyData || [];
  
  // Calculate category breakdown from recent transactions
  const categoryData = (recentTransactions || [])
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => {
      const catName = t.category?.name || 'Outros';
      const existing = acc.find(c => c.name === catName);
      if (existing) {
        existing.value += Number(t.value);
      } else {
        acc.push({
          name: catName,
          value: Number(t.value),
          color: t.category?.color || 'hsl(var(--muted-foreground))',
        });
      }
      return acc;
    }, [] as { name: string; value: number; color: string }[]);

  const isLoading = summaryLoading || monthlyLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {user?.name}! • {unidadeAtual?.name || 'Selecione uma filial'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Calendar className="w-4 h-4" />
              {currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)} {currentYear}
            </button>
            <button className="btn-secondary">
              <Filter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card stat-card-income animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receitas do Mês</p>
                <p className="text-2xl font-bold font-mono-numbers text-foreground mt-1">
                  {formatCurrency(summary?.totalReceitas || 0)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-income-muted">
                <TrendingUp className="w-5 h-5 text-income" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <ArrowUpRight className="w-4 h-4 text-income" />
              <span className="text-sm font-medium text-income">Receitas</span>
            </div>
          </div>

          <div className="stat-card stat-card-expense animate-fade-in stagger-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Despesas do Mês</p>
                <p className="text-2xl font-bold font-mono-numbers text-foreground mt-1">
                  {formatCurrency(summary?.totalDespesas || 0)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-expense-muted">
                <TrendingDown className="w-5 h-5 text-expense" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <ArrowDownRight className="w-4 h-4 text-expense" />
              <span className="text-sm font-medium text-expense">Despesas</span>
            </div>
          </div>

          <div className="stat-card stat-card-primary animate-fade-in stagger-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
                <p className="text-2xl font-bold font-mono-numbers text-foreground mt-1">
                  {formatCurrency(summary?.saldo || 0)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {(summary?.saldo || 0) >= 0 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-income" />
                  <span className="text-sm font-medium text-income">Positivo</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-expense" />
                  <span className="text-sm font-medium text-expense">Negativo</span>
                </>
              )}
            </div>
          </div>

          <div className="stat-card stat-card-pending animate-fade-in stagger-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contas Pendentes</p>
                <p className="text-2xl font-bold font-mono-numbers text-foreground mt-1">
                  {formatCurrency(summary?.pendentes || 0)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-pending-muted">
                <Clock className="w-5 h-5 text-pending" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <span className="text-sm font-medium text-pending">
                {summary?.atrasados ? `${formatCurrency(summary.atrasados)} atrasados` : 'Sem atrasos'}
              </span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 card-financial p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Fluxo de Caixa</h3>
                <p className="text-sm text-muted-foreground">Receitas vs Despesas</p>
              </div>
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="h-72">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0 72% 51%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(0 72% 51%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-md)'
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="receitas" stroke="hsl(160 84% 39%)" fillOpacity={1} fill="url(#colorReceitas)" strokeWidth={2} />
                    <Area type="monotone" dataKey="despesas" stroke="hsl(0 72% 51%)" fillOpacity={1} fill="url(#colorDespesas)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Nenhum dado disponível para exibir</p>
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card-financial p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Por Categoria</h3>
                <p className="text-sm text-muted-foreground">Distribuição de receitas</p>
              </div>
            </div>
            {categoryData.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-4">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-mono-numbers font-medium text-foreground">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="card-financial p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Transações Recentes</h3>
              <Link to="/financeiro" className="text-sm text-primary hover:underline">Ver todas</Link>
            </div>
            <div className="space-y-3">
              {recentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (recentTransactions || []).length > 0 ? (
                recentTransactions?.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tx.type === 'receita' ? 'bg-income-muted' : 'bg-expense-muted'
                      }`}>
                        {tx.type === 'receita' ? (
                          <ArrowUpRight className="w-5 h-5 text-income" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-expense" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.due_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono-numbers font-semibold ${
                        tx.type === 'receita' ? 'text-income' : 'text-expense'
                      }`}>
                        {tx.type === 'receita' ? '+' : '-'}{formatCurrency(Number(tx.value))}
                      </p>
                      <span className={`text-xs ${
                        tx.status === 'pago' ? 'badge-success' : 
                        tx.status === 'pendente' ? 'badge-warning' : 
                        tx.status === 'atrasado' ? 'badge-danger' : 'badge-neutral'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma transação recente</p>
              )}
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="card-financial p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Próximos Vencimentos</h3>
              <Link to="/programacao" className="text-sm text-primary hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-3">
              {upcomingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (upcomingPayments || []).length > 0 ? (
                upcomingPayments?.slice(0, 5).map((payment) => {
                  const daysLeft = getDaysUntil(payment.due_date);
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          daysLeft <= 5 ? 'bg-expense-muted' : 'bg-pending-muted'
                        }`}>
                          <Calendar className={`w-5 h-5 ${
                            daysLeft <= 5 ? 'text-expense' : 'text-pending'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{payment.description}</p>
                          <p className="text-xs text-muted-foreground">Vence em {formatDate(payment.due_date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono-numbers font-semibold text-foreground">
                          {formatCurrency(Number(payment.value))}
                        </p>
                        <span className={`text-xs ${
                          daysLeft <= 5 ? 'text-expense' : 'text-pending'
                        }`}>
                          {daysLeft} dia{daysLeft !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum vencimento próximo</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
