import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area,
} from 'recharts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MONTHS_SHORT, formatCurrency } from '@/lib/utils';
import type { BudgetCategoryWithSubcategories } from '@/types/database';
import type { AnnualSummaryResult } from '@/services/planejamento';

interface BudgetChartsProps {
    categoryData: BudgetCategoryWithSubcategories[] | undefined;
    annualSummary?: AnnualSummaryResult;
    isLoading: boolean;
}

export function BudgetCharts({
    categoryData,
    annualSummary,
    isLoading,
}: BudgetChartsProps) {
    const [isOpen, setIsOpen] = useState(true);

    // Bar chart data: Budget vs Actual by category
    const barChartData = useMemo(() => {
        if (!categoryData) return [];

        return categoryData
            .filter((c) => c.budgetedAnnual > 0 || c.actualAnnual > 0)
            .slice(0, 10) // Limit to top 10 categories
            .map((category) => ({
                name: category.categoryName.length > 15
                    ? `${category.categoryName.slice(0, 15)}...`
                    : category.categoryName,
                fullName: category.categoryName,
                orcado: category.budgetedAnnual,
                realizado: category.actualAnnual,
                color: category.color,
            }));
    }, [categoryData]);

    // Area chart data: Monthly evolution
    const areaChartData = useMemo(() => {
        if (!annualSummary) return [];

        return annualSummary.months.map((m) => ({
            name: MONTHS_SHORT[m.month - 1],
            receitasOrcadas: m.receitas.budgeted,
            receitasRealizadas: m.receitas.actual,
            despesasOrcadas: m.despesas.budgeted,
            despesasRealizadas: m.despesas.actual,
            saldoOrcado: m.saldo.budgeted,
            saldoRealizado: m.saldo.actual,
        }));
    }, [annualSummary]);

    if (isLoading || (!barChartData.length && !areaChartData.length)) {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="card-financial">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg">
                    <h3 className="font-semibold text-foreground">Gráficos</h3>
                    {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="p-4 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bar Chart: Budget vs Actual by Category */}
                        {barChartData.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Orçado vs Realizado por Categoria
                                </h4>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={barChartData}
                                            layout="vertical"
                                            margin={{
                                                top: 5, right: 30, left: 0, bottom: 5
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="hsl(var(--border))"
                                            />
                                            <XAxis
                                                type="number"
                                                stroke="hsl(var(--muted-foreground))"
                                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                stroke="hsl(var(--muted-foreground))"
                                                width={120}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip
                                                formatter={(value: number) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                }}
                                                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="orcado"
                                                name="Orçado"
                                                fill="hsl(var(--muted-foreground))"
                                                radius={[0, 4, 4, 0]}
                                            />
                                            <Bar
                                                dataKey="realizado"
                                                name="Realizado"
                                                fill="hsl(var(--primary))"
                                                radius={[0, 4, 4, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Area Chart: Monthly Evolution */}
                        {areaChartData.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Evolução Mensal (Saldo)
                                </h4>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={areaChartData}
                                            margin={{
                                                top: 5, right: 30, left: 0, bottom: 5
                                            }}
                                        >
                                            <defs>
                                                <linearGradient
                                                    id="colorSaldoOrcado"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="hsl(var(--muted-foreground))"
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="hsl(var(--muted-foreground))"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                                <linearGradient
                                                    id="colorSaldoRealizado"
                                                    x1="0"
                                                    y1="0"
                                                    x2="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="5%"
                                                        stopColor="hsl(var(--primary))"
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor="hsl(var(--primary))"
                                                        stopOpacity={0}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="hsl(var(--border))"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                stroke="hsl(var(--muted-foreground))"
                                            />
                                            <YAxis
                                                stroke="hsl(var(--muted-foreground))"
                                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                formatter={(value: number) => formatCurrency(value)}
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px',
                                                }}
                                            />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="saldoOrcado"
                                                name="Saldo Orçado"
                                                stroke="hsl(var(--muted-foreground))"
                                                fill="url(#colorSaldoOrcado)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="saldoRealizado"
                                                name="Saldo Realizado"
                                                stroke="hsl(var(--primary))"
                                                fill="url(#colorSaldoRealizado)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
