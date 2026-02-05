import { MONTHS_SHORT, formatCurrency } from '@/lib/utils';
import { LoadingState } from '@/components/shared';
import type { AnnualSummaryResult } from '@/services/planejamento';

interface AnnualSummaryTableProps {
    data: AnnualSummaryResult | undefined;
    isLoading: boolean;
    showActual?: boolean;
}

export function AnnualSummaryTable({
    data,
    isLoading,
    showActual = false,
}: AnnualSummaryTableProps) {
    if (isLoading) {
        return <LoadingState />;
    }

    if (!data) {
        return null;
    }

    const formatValue = (value: number, isNegative?: boolean) => {
        const formatted = formatCurrency(Math.abs(value));
        if (isNegative && value < 0) return `(${formatted})`;
        return formatted;
    };

    return (
        <div className="card-financial overflow-x-auto">
            <table className="w-full min-w-[900px]">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="text-left p-3 font-medium text-foreground sticky left-0 bg-muted/50">
                            {showActual ? 'Orçado / Realizado' : 'Orçamento'}
                        </th>
                        {MONTHS_SHORT.map((month) => (
                            <th key={month} className="text-right p-3 font-medium text-foreground text-sm">
                                {month}
                            </th>
                        ))}
                        <th className="text-right p-3 font-medium text-foreground bg-muted">
                            Total
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* Receitas Row */}
                    <tr className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 font-medium text-income sticky left-0 bg-card">
                            Receitas
                        </td>
                        {data.months.map((m) => (
                            <td key={m.month} className="p-3 text-right font-mono-numbers text-sm">
                                <div>{formatValue(m.receitas.budgeted)}</div>
                                {showActual && (
                                    <div className="text-xs text-muted-foreground">
                                        {formatValue(m.receitas.actual)}
                                    </div>
                                )}
                            </td>
                        ))}
                        <td className="p-3 text-right font-mono-numbers font-medium bg-muted/30">
                            <div>{formatValue(data.totals.receitas.budgeted)}</div>
                            {showActual && (
                                <div className="text-xs text-muted-foreground">
                                    {formatValue(data.totals.receitas.actual)}
                                </div>
                            )}
                        </td>
                    </tr>

                    {/* Despesas Row */}
                    <tr className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 font-medium text-expense sticky left-0 bg-card">
                            Despesas
                        </td>
                        {data.months.map((m) => (
                            <td key={m.month} className="p-3 text-right font-mono-numbers text-sm">
                                <div>{formatValue(m.despesas.budgeted)}</div>
                                {showActual && (
                                    <div className="text-xs text-muted-foreground">
                                        {formatValue(m.despesas.actual)}
                                    </div>
                                )}
                            </td>
                        ))}
                        <td className="p-3 text-right font-mono-numbers font-medium bg-muted/30">
                            <div>{formatValue(data.totals.despesas.budgeted)}</div>
                            {showActual && (
                                <div className="text-xs text-muted-foreground">
                                    {formatValue(data.totals.despesas.actual)}
                                </div>
                            )}
                        </td>
                    </tr>

                    {/* Saldo Row */}
                    <tr className="border-t-2 border-border bg-primary/5 font-bold">
                        <td className="p-3 text-primary sticky left-0 bg-primary/5">
                            Saldo
                        </td>
                        {data.months.map((m) => (
                            <td
                                key={m.month}
                                className={`p-3 text-right font-mono-numbers text-sm ${
                                    m.saldo.budgeted >= 0 ? 'text-income' : 'text-expense'
                                }`}
                            >
                                <div>{formatValue(m.saldo.budgeted, true)}</div>
                                {showActual && (
                                    <div className={`text-xs ${
                                        m.saldo.actual >= 0 ? 'text-income/70' : 'text-expense/70'
                                    }`}
                                    >
                                        {formatValue(m.saldo.actual, true)}
                                    </div>
                                )}
                            </td>
                        ))}
                        <td className={`p-3 text-right font-mono-numbers bg-muted/50 ${
                            data.totals.saldo.budgeted >= 0 ? 'text-income' : 'text-expense'
                        }`}
                        >
                            <div>{formatValue(data.totals.saldo.budgeted, true)}</div>
                            {showActual && (
                                <div className={`text-xs ${
                                    data.totals.saldo.actual >= 0 ? 'text-income/70' : 'text-expense/70'
                                }`}
                                >
                                    {formatValue(data.totals.saldo.actual, true)}
                                </div>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
