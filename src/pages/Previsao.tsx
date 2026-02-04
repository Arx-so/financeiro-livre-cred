import { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    DollarSign,
    Loader2,
    AlertCircle,
    Download
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { useBranchStore } from '@/stores';
import { getCashFlowProjection } from '@/services/relatorios';
import { exportToExcel } from '@/services/importExport';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function Previsao() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    const today = new Date();
    const defaultStart = today.toISOString().split('T')[0];
    const defaultEnd = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState({
        start: defaultStart,
        end: defaultEnd,
    });
    const [initialBalance, setInitialBalance] = useState(0);

    // Fetch cash flow projection
    const { data: projection, isLoading } = useQuery({
        queryKey: ['cash-flow-projection', unidadeAtual?.id, dateRange, initialBalance],
        queryFn: () => getCashFlowProjection(unidadeAtual!.id, dateRange.start, dateRange.end, initialBalance),
        enabled: !!unidadeAtual?.id,
    });

    // Calculate summary
    const summary = (projection || []).reduce((acc, day) => {
        acc.totalIncome += day.income;
        acc.totalExpenses += day.expenses;
        acc.finalBalance = day.balance;
        if (day.balance < acc.minBalance) {
            acc.minBalance = day.balance;
            acc.minBalanceDate = day.date;
        }
        return acc;
    }, {
        totalIncome: 0,
        totalExpenses: 0,
        finalBalance: initialBalance,
        minBalance: initialBalance,
        minBalanceDate: '',
    });

    const handleExport = () => {
        if (!projection?.length) return;

        exportToExcel(
            projection.map((p) => ({
                Data: formatDate(p.date),
                Entradas: p.income,
                Saídas: p.expenses,
                Saldo: p.balance,
            })),
            'previsao-fluxo-caixa'
        );

        toast.success('Previsão exportada!');
    };

    // Format data for chart
    const chartData = (projection || []).map((p) => ({
        ...p,
        dateFormatted: formatDate(p.date),
    }));

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Previsão de Fluxo de Caixa</h1>
                        <p className="text-muted-foreground">Projeção financeira baseada em lançamentos futuros</p>
                    </div>
                    <button className="btn-primary" onClick={handleExport} disabled={!projection?.length}>
                        <Download className="w-4 h-4" />
                        Exportar Excel
                    </button>
                </div>

                {/* Filters */}
                <div className="card-financial p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Data Início</label>
                            <input
                                type="date"
                                className="input-financial"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Data Fim</label>
                            <input
                                type="date"
                                className="input-financial"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Saldo Inicial</label>
                            <input
                                type="number"
                                className="input-financial font-mono-numbers"
                                value={initialBalance}
                                onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="stat-card stat-card-income">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-income" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Entradas</p>
                                <p className="text-xl font-bold font-mono-numbers text-income">
                                    {formatCurrency(summary.totalIncome)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-expense">
                        <div className="flex items-center gap-3">
                            <TrendingDown className="w-5 h-5 text-expense" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Saídas</p>
                                <p className="text-xl font-bold font-mono-numbers text-expense">
                                    {formatCurrency(summary.totalExpenses)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card stat-card-primary">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Saldo Final</p>
                                <p className={`text-xl font-bold font-mono-numbers ${
                                    summary.finalBalance >= 0 ? 'text-income' : 'text-expense'
                                }`}
                                >
                                    {formatCurrency(summary.finalBalance)}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className={`stat-card ${summary.minBalance < 0 ? 'stat-card-expense' : 'stat-card-pending'}`}>
                        <div className="flex items-center gap-3">
                            <AlertCircle className={`w-5 h-5 ${summary.minBalance < 0 ? 'text-expense' : 'text-pending'}`} />
                            <div>
                                <p className="text-sm text-muted-foreground">Saldo Mínimo</p>
                                <p className={`text-xl font-bold font-mono-numbers ${
                                    summary.minBalance >= 0 ? 'text-pending' : 'text-expense'
                                }`}
                                >
                                    {formatCurrency(summary.minBalance)}
                                </p>
                                {summary.minBalanceDate && (
                                    <p className="text-xs text-muted-foreground">
                                        em
                                        {' '}
                                        {formatDate(summary.minBalanceDate)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="card-financial p-6">
                    <h3 className="font-semibold text-foreground mb-4">Projeção de Saldo</h3>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : chartData.length ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="dateFormatted" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <ReferenceLine y={0} stroke="hsl(var(--expense))" strokeDasharray="5 5" />
                                    <Area
                                        type="monotone"
                                        dataKey="balance"
                                        name="Saldo"
                                        stroke="hsl(160 84% 39%)"
                                        fillOpacity={1}
                                        fill="url(#colorBalance)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-12">Nenhum lançamento futuro encontrado</p>
                    )}
                </div>

                {/* Daily Table */}
                <div className="card-financial overflow-hidden">
                    <div className="p-4 border-b border-border">
                        <h3 className="font-semibold text-foreground">Detalhamento Diário</h3>
                    </div>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            <table className="table-financial">
                                <thead className="sticky top-0 bg-card">
                                    <tr>
                                        <th>Data</th>
                                        <th className="text-right">Entradas</th>
                                        <th className="text-right">Saídas</th>
                                        <th className="text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chartData.length ? chartData.map((day, index) => (
                                        <tr key={index}>
                                            <td className="text-foreground">{day.dateFormatted}</td>
                                            <td className="text-right font-mono-numbers text-income">
                                                {day.income > 0 ? `+${formatCurrency(day.income)}` : '-'}
                                            </td>
                                            <td className="text-right font-mono-numbers text-expense">
                                                {day.expenses > 0 ? `-${formatCurrency(day.expenses)}` : '-'}
                                            </td>
                                            <td className={`text-right font-mono-numbers font-semibold ${
                                                day.balance >= 0 ? 'text-income' : 'text-expense'
                                            }`}
                                            >
                                                {formatCurrency(day.balance)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted-foreground py-8">
                                                Nenhum dado disponível
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
