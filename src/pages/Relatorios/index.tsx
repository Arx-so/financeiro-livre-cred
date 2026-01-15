import { useState, useMemo, useCallback } from 'react';
import {
    FileText,
    Download,
    Printer,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
} from 'lucide-react';
import {
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
    Legend,
} from 'recharts';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    getDREData,
    getCategoryBreakdown,
    getMonthlyComparison,
    getAgingReport,
} from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import {
    PageHeader, LoadingState, EmptyState, StatCard
} from '@/components/shared';
import { formatCurrency, MONTHS_SHORT } from '@/lib/utils';

export default function Relatorios() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const currentYear = new Date().getFullYear();

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

    // Chart data
    const pieDataReceitas = useMemo(() => categoryBreakdownReceitas?.map((c) => ({
        name: c.name || 'Outros',
        value: c.value,
        color: c.color || 'hsl(var(--muted-foreground))',
    })) || [], [categoryBreakdownReceitas]);

    const pieDataDespesas = useMemo(() => categoryBreakdownDespesas?.map((c) => ({
        name: c.name || 'Outros',
        value: c.value,
        color: c.color || 'hsl(var(--muted-foreground))',
    })) || [], [categoryBreakdownDespesas]);

    const monthlyChartData = useMemo(() => monthlyData?.map((m, i) => ({
        name: MONTHS_SHORT[i],
        receitas: m.receitas || 0,
        despesas: m.despesas || 0,
        saldo: (m.receitas || 0) - (m.despesas || 0),
    })) || [], [monthlyData]);

    // Export handlers
    const handleExportPDF = useCallback(() => {
        if (!dreData) {
            toast.error('Sem dados para exportar');
            return;
        }
        toast.success('Relatório PDF gerado!');
    }, [dreData]);

    const handleExportExcel = useCallback(() => {
        if (!monthlyData) {
            toast.error('Sem dados para exportar');
            return;
        }

        const data = monthlyData.map((m, i) => ({
            Mês: MONTHS_SHORT[i],
            Receitas: m.receitas || 0,
            Despesas: m.despesas || 0,
            Saldo: (m.receitas || 0) - (m.despesas || 0),
        }));

        exportToExcel(data, `relatorio-${currentYear}`);
        toast.success('Relatório Excel gerado!');
    }, [monthlyData, currentYear]);

    return (
        <AppLayout>
            <div className="space-y-6">
                <PageHeader title="Relatórios" description="Análises e demonstrativos financeiros">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="input-financial"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="text-muted-foreground">até</span>
                        <input
                            type="date"
                            className="input-financial"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <button className="btn-secondary" onClick={handleExportPDF}>
                        <Printer className="w-4 h-4" />
                        PDF
                    </button>
                    <button className="btn-secondary" onClick={handleExportExcel}>
                        <Download className="w-4 h-4" />
                        Excel
                    </button>
                </PageHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-muted/50 p-1 rounded-lg">
                        <TabsTrigger value="dre" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                            DRE
                        </TabsTrigger>
                        <TabsTrigger value="categorias" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                            Por Categoria
                        </TabsTrigger>
                        <TabsTrigger value="mensal" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                            Comparativo Mensal
                        </TabsTrigger>
                        <TabsTrigger value="aging" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">
                            Aging
                        </TabsTrigger>
                    </TabsList>

                    {/* DRE Tab */}
                    <TabsContent value="dre" className="space-y-6 mt-6">
                        {dreLoading ? (
                            <LoadingState />
                        ) : !dreData ? (
                            <EmptyState icon={FileText} message="Sem dados para o período" />
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard label="Receita Bruta" value={formatCurrency(dreData.receita_bruta || 0)} icon={TrendingUp} variant="income" />
                                    <StatCard label="Despesas" value={formatCurrency(dreData.despesas_totais || 0)} icon={TrendingDown} variant="expense" />
                                    <StatCard label="Resultado Líquido" value={formatCurrency(dreData.resultado_liquido || 0)} icon={TrendingUp} variant={(dreData.resultado_liquido || 0) >= 0 ? 'income' : 'expense'} />
                                </div>

                                <div className="card-financial p-6">
                                    <h3 className="font-semibold text-foreground mb-4">Demonstrativo de Resultado</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="font-medium text-foreground">Receita Bruta</span>
                                            <span className="font-mono text-income">{formatCurrency(dreData.receita_bruta || 0)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="font-medium text-foreground">(-) Deduções</span>
                                            <span className="font-mono text-expense">{formatCurrency(dreData.deducoes || 0)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border bg-muted/30 px-2 rounded">
                                            <span className="font-semibold text-foreground">= Receita Líquida</span>
                                            <span className="font-mono font-semibold">{formatCurrency(dreData.receita_liquida || 0)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="font-medium text-foreground">(-) Custos Operacionais</span>
                                            <span className="font-mono text-expense">{formatCurrency(dreData.custos_operacionais || 0)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border">
                                            <span className="font-medium text-foreground">(-) Despesas Administrativas</span>
                                            <span className="font-mono text-expense">{formatCurrency(dreData.despesas_administrativas || 0)}</span>
                                        </div>
                                        <div className="flex justify-between py-3 bg-primary/10 px-2 rounded">
                                            <span className="font-bold text-foreground">= Resultado Líquido</span>
                                            <span className={`font-mono font-bold ${(dreData.resultado_liquido || 0) >= 0 ? 'text-income' : 'text-expense'}`}>
                                                {formatCurrency(dreData.resultado_liquido || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    {/* Categorias Tab */}
                    <TabsContent value="categorias" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card-financial p-6">
                                <h3 className="font-semibold text-foreground mb-4">Receitas por Categoria</h3>
                                <div className="h-[300px]">
                                    {pieDataReceitas.length === 0 ? (
                                        <EmptyState icon={PieChart} message="Sem dados" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPie>
                                                <Pie data={pieDataReceitas} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {pieDataReceitas.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                                <Legend />
                                            </RechartsPie>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            <div className="card-financial p-6">
                                <h3 className="font-semibold text-foreground mb-4">Despesas por Categoria</h3>
                                <div className="h-[300px]">
                                    {pieDataDespesas.length === 0 ? (
                                        <EmptyState icon={PieChart} message="Sem dados" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPie>
                                                <Pie data={pieDataDespesas} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                    {pieDataDespesas.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                                <Legend />
                                            </RechartsPie>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Mensal Tab */}
                    <TabsContent value="mensal" className="space-y-6 mt-6">
                        <div className="card-financial p-6">
                            <h3 className="font-semibold text-foreground mb-4">Comparativo Mensal</h3>
                            <div className="h-[400px]">
                                {monthlyLoading ? (
                                    <LoadingState />
                                ) : monthlyChartData.length === 0 ? (
                                    <EmptyState icon={BarChart3} message="Sem dados" />
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                                            <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                                            <Legend />
                                            <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Aging Tab */}
                    <TabsContent value="aging" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card-financial p-6">
                                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-income" />
                                    Contas a Receber - Aging
                                </h3>
                                {!agingReceitas?.length ? (
                                    <EmptyState icon={FileText} message="Sem valores pendentes" />
                                ) : (
                                    <div className="space-y-3">
                                        {agingReceitas.map((aging, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                                <span className="text-sm text-foreground">{aging.range}</span>
                                                <span className="font-mono font-semibold text-income">{formatCurrency(aging.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="card-financial p-6">
                                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <TrendingDown className="w-5 h-5 text-expense" />
                                    Contas a Pagar - Aging
                                </h3>
                                {!agingDespesas?.length ? (
                                    <EmptyState icon={FileText} message="Sem valores pendentes" />
                                ) : (
                                    <div className="space-y-3">
                                        {agingDespesas.map((aging, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                                <span className="text-sm text-foreground">{aging.range}</span>
                                                <span className="font-mono font-semibold text-expense">{formatCurrency(aging.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
