import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Loader2,
  Upload
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RechartsPie, 
  Pie, 
  Cell,
  Legend 
} from 'recharts';
import { toast } from 'sonner';
import { useBranchStore } from '@/stores';
import { useQuery } from '@tanstack/react-query';
import { 
  getDREData, 
  getCategoryBreakdown, 
  getMonthlyComparison, 
  getCashFlowProjection,
  getAgingReport 
} from '@/services/relatorios';
import { exportToPDF, generateReport, exportToExcel, formatCurrency, formatDate } from '@/services/importExport';

function formatCurrencyBR(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function Relatorios() {
  const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  const [activeTab, setActiveTab] = useState('dre');
  const [dateRange, setDateRange] = useState({
    start: `${currentYear}-01-01`,
    end: `${currentYear}-12-31`,
  });

  // Fetch DRE data
  const { data: dreData, isLoading: dreLoading } = useQuery({
    queryKey: ['dre', unidadeAtual?.id, dateRange],
    queryFn: () => getDREData(unidadeAtual!.id, dateRange.start, dateRange.end),
    enabled: !!unidadeAtual?.id,
  });

  // Fetch category breakdown
  const { data: categoryBreakdownReceitas } = useQuery({
    queryKey: ['category-breakdown-receitas', unidadeAtual?.id, dateRange],
    queryFn: () => getCategoryBreakdown(unidadeAtual!.id, 'receita', dateRange.start, dateRange.end),
    enabled: !!unidadeAtual?.id,
  });

  const { data: categoryBreakdownDespesas } = useQuery({
    queryKey: ['category-breakdown-despesas', unidadeAtual?.id, dateRange],
    queryFn: () => getCategoryBreakdown(unidadeAtual!.id, 'despesa', dateRange.start, dateRange.end),
    enabled: !!unidadeAtual?.id,
  });

  // Fetch monthly comparison
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-comparison', unidadeAtual?.id, currentYear],
    queryFn: () => getMonthlyComparison(unidadeAtual!.id, currentYear),
    enabled: !!unidadeAtual?.id,
  });

  // Fetch aging report
  const { data: agingReceitas } = useQuery({
    queryKey: ['aging-receitas', unidadeAtual?.id],
    queryFn: () => getAgingReport(unidadeAtual!.id, 'receita'),
    enabled: !!unidadeAtual?.id,
  });

  const { data: agingDespesas } = useQuery({
    queryKey: ['aging-despesas', unidadeAtual?.id],
    queryFn: () => getAgingReport(unidadeAtual!.id, 'despesa'),
    enabled: !!unidadeAtual?.id,
  });

  const handleExportDRE = () => {
    if (!dreData) return;

    exportToPDF({
      title: 'Demonstrativo de Resultado do Exercício (DRE)',
      subtitle: `Período: ${formatDate(dateRange.start)} a ${formatDate(dateRange.end)}`,
      columns: [
        { header: 'Conta', dataKey: 'account' },
        { header: 'Planejado', dataKey: 'plannedFormatted' },
        { header: 'Realizado', dataKey: 'actualFormatted' },
        { header: 'Variação', dataKey: 'varianceFormatted' },
        { header: '%', dataKey: 'variancePercentFormatted' },
      ],
      data: dreData.map(item => ({
        ...item,
        plannedFormatted: formatCurrency(item.planned),
        actualFormatted: formatCurrency(item.actual),
        varianceFormatted: formatCurrency(item.variance),
        variancePercentFormatted: `${item.variancePercent.toFixed(1)}%`,
      })),
      orientation: 'landscape',
      footer: `FinControl - Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}`,
    });

    toast.success('Relatório DRE exportado em PDF!');
  };

  const handleExportMonthly = () => {
    if (!monthlyData) return;

    exportToExcel(
      monthlyData.map(m => ({
        'Mês': m.month,
        'Receitas': m.receitas,
        'Despesas': m.despesas,
        'Saldo': m.saldo,
      })),
      'comparativo-mensal'
    );

    toast.success('Relatório exportado em Excel!');
  };

  const handleGenerateFullReport = () => {
    const sections = [];

    if (dreData) {
      sections.push({
        title: 'DRE - Demonstrativo de Resultado',
        content: {
          columns: [
            { header: 'Conta', dataKey: 'account' },
            { header: 'Realizado', dataKey: 'actualFormatted' },
          ],
          data: dreData.map(item => ({
            account: item.account,
            actualFormatted: formatCurrency(item.actual),
          })),
        },
      });
    }

    if (monthlyData) {
      sections.push({
        title: 'Comparativo Mensal',
        content: {
          columns: [
            { header: 'Mês', dataKey: 'month' },
            { header: 'Receitas', dataKey: 'receitasFormatted' },
            { header: 'Despesas', dataKey: 'despesasFormatted' },
            { header: 'Saldo', dataKey: 'saldoFormatted' },
          ],
          data: monthlyData.map(m => ({
            month: m.month,
            receitasFormatted: formatCurrency(m.receitas),
            despesasFormatted: formatCurrency(m.despesas),
            saldoFormatted: formatCurrency(m.saldo),
          })),
        },
      });
    }

    generateReport(`Relatório Financeiro Completo - ${currentYear}`, sections);
    toast.success('Relatório completo gerado!');
  };

  const CHART_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">Análises e demonstrativos financeiros</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="input-financial"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <span className="text-muted-foreground">a</span>
              <input
                type="date"
                className="input-financial"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <button className="btn-primary" onClick={handleGenerateFullReport}>
              <Upload className="w-4 h-4" />
              Exportar Completo
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="dre" className="rounded-md data-[state=active]:bg-card">
              <FileText className="w-4 h-4 mr-2" />
              DRE
            </TabsTrigger>
            <TabsTrigger value="categorias" className="rounded-md data-[state=active]:bg-card">
              <PieChart className="w-4 h-4 mr-2" />
              Por Categoria
            </TabsTrigger>
            <TabsTrigger value="fluxo" className="rounded-md data-[state=active]:bg-card">
              <BarChart3 className="w-4 h-4 mr-2" />
              Fluxo de Caixa
            </TabsTrigger>
          </TabsList>

          {/* DRE Tab */}
          <TabsContent value="dre" className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">Demonstrativo de Resultado do Exercício</h2>
              <button className="btn-secondary" onClick={handleExportDRE}>
                <Upload className="w-4 h-4" />
                Exportar PDF
              </button>
            </div>

            <div className="card-financial overflow-hidden">
              {dreLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <table className="table-financial">
                  <thead>
                    <tr>
                      <th>Conta</th>
                      <th className="text-right">Planejado</th>
                      <th className="text-right">Realizado</th>
                      <th className="text-right">Variação</th>
                      <th className="text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dreData || []).map((item, index) => {
                      const isTotal = item.account.includes('Líquido') || item.account.includes('Bruto');
                      const isDeduction = item.account.startsWith('(-)');
                      return (
                        <tr key={index} className={isTotal ? 'font-bold bg-muted/30' : ''}>
                          <td className={isDeduction ? 'pl-8 text-muted-foreground' : ''}>
                            {item.account}
                          </td>
                          <td className="text-right font-mono-numbers">{formatCurrencyBR(item.planned)}</td>
                          <td className="text-right font-mono-numbers">{formatCurrencyBR(item.actual)}</td>
                          <td className={`text-right font-mono-numbers ${
                            item.variance >= 0 ? 'text-income' : 'text-expense'
                          }`}>
                            {formatCurrencyBR(item.variance)}
                          </td>
                          <td className={`text-right font-mono-numbers ${
                            item.variancePercent >= 0 ? 'text-income' : 'text-expense'
                          }`}>
                            {item.variancePercent.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categorias" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Receitas */}
              <div className="card-financial p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-income" />
                  <h3 className="font-semibold text-foreground">Receitas por Categoria</h3>
                </div>
                {categoryBreakdownReceitas?.length ? (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={categoryBreakdownReceitas}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {categoryBreakdownReceitas.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrencyBR(value)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {categoryBreakdownReceitas.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] }} 
                            />
                            <span className="text-sm text-foreground">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono-numbers font-medium text-foreground">
                              {formatCurrencyBR(item.value)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                )}
              </div>

              {/* Despesas */}
              <div className="card-financial p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingDown className="w-5 h-5 text-expense" />
                  <h3 className="font-semibold text-foreground">Despesas por Categoria</h3>
                </div>
                {categoryBreakdownDespesas?.length ? (
                  <>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={categoryBreakdownDespesas}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                            nameKey="name"
                          >
                            {categoryBreakdownDespesas.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrencyBR(value)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {categoryBreakdownDespesas.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length] }} 
                            />
                            <span className="text-sm text-foreground">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono-numbers font-medium text-foreground">
                              {formatCurrencyBR(item.value)}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Cash Flow Tab */}
          <TabsContent value="fluxo" className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">Comparativo Mensal - {currentYear}</h2>
              <button className="btn-secondary" onClick={handleExportMonthly}>
                <Upload className="w-4 h-4" />
                Exportar Excel
              </button>
            </div>

            <div className="card-financial p-6">
              {monthlyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrencyBR(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="receitas" name="Receitas" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Aging Report */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Aging - Contas a Receber</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-income-muted/30 rounded-lg">
                    <span className="text-sm text-foreground">A Vencer</span>
                    <span className="font-mono-numbers font-semibold text-income">
                      {formatCurrencyBR(agingReceitas?.current || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-pending-muted/30 rounded-lg">
                    <span className="text-sm text-foreground">1-30 dias</span>
                    <span className="font-mono-numbers font-semibold text-pending">
                      {formatCurrencyBR(agingReceitas?.days1to30 || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                    <span className="text-sm text-foreground">31-60 dias</span>
                    <span className="font-mono-numbers font-semibold text-warning">
                      {formatCurrencyBR(agingReceitas?.days31to60 || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-expense-muted/30 rounded-lg">
                    <span className="text-sm text-foreground">+90 dias</span>
                    <span className="font-mono-numbers font-semibold text-expense">
                      {formatCurrencyBR(agingReceitas?.over90 || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card-financial p-6">
                <h3 className="font-semibold text-foreground mb-4">Aging - Contas a Pagar</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-income-muted/30 rounded-lg">
                    <span className="text-sm text-foreground">A Vencer</span>
                    <span className="font-mono-numbers font-semibold text-income">
                      {formatCurrencyBR(agingDespesas?.current || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-pending-muted/30 rounded-lg">
                    <span className="text-sm text-foreground">1-30 dias</span>
                    <span className="font-mono-numbers font-semibold text-pending">
                      {formatCurrencyBR(agingDespesas?.days1to30 || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                    <span className="text-sm text-foreground">31-60 dias</span>
                    <span className="font-mono-numbers font-semibold text-warning">
                      {formatCurrencyBR(agingDespesas?.days31to60 || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-expense-muted/30 rounded-lg">
                    <span className="text-sm text-foreground">+90 dias</span>
                    <span className="font-mono-numbers font-semibold text-expense">
                      {formatCurrencyBR(agingDespesas?.over90 || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
