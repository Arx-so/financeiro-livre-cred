import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { MONTHS_SHORT, formatCurrency } from '@/lib/utils';
import { LoadingState } from '@/components/shared';
import type { BudgetCategoryWithSubcategories } from '@/types/database';

interface BudgetComparisonViewProps {
    data: BudgetCategoryWithSubcategories[] | undefined;
    isLoading: boolean;
}

export function BudgetComparisonView({
    data,
    isLoading,
}: BudgetComparisonViewProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const comparisonData = useMemo(() => {
        if (!data) return [];

        return data
            .filter((cat) => cat.budgetedAnnual > 0 || cat.actualAnnual > 0)
            .map((category) => {
                const months = category.months.map((m) => ({
                    month: m.month,
                    budgeted: m.budgeted,
                    actual: m.actual,
                    difference: m.actual - m.budgeted,
                    differencePercent: m.budgeted > 0
                        ? ((m.actual - m.budgeted) / m.budgeted) * 100
                        : 0,
                }));

                const subcategoriesComparison = (category.subcategories || [])
                    .filter((sub) => sub.budgetedAnnual > 0 || sub.actualAnnual > 0)
                    .map((sub) => ({
                        ...sub,
                        monthsComparison: sub.months.map((m) => ({
                            month: m.month,
                            budgeted: m.budgeted,
                            actual: m.actual,
                            difference: m.actual - m.budgeted,
                            differencePercent: m.budgeted > 0
                                ? ((m.actual - m.budgeted) / m.budgeted) * 100
                                : 0,
                        })),
                    }));

                return {
                    ...category,
                    monthsComparison: months,
                    subcategoriesComparison,
                };
            });
    }, [data]);

    if (isLoading) {
        return <LoadingState />;
    }

    if (!comparisonData.length) {
        return null;
    }

    return (
        <div className="card-financial overflow-x-auto">
            <table className="w-full min-w-[900px]">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="text-left p-3 font-medium text-foreground sticky left-0 bg-muted/50 min-w-[180px] z-10">
                            Categoria
                        </th>
                        {MONTHS_SHORT.map((month) => (
                            <th
                                key={month}
                                className="text-center p-2 font-medium text-foreground text-sm border-l border-border min-w-[100px]"
                            >
                                {month}
                            </th>
                        ))}
                        <th className="text-center p-2 font-medium text-foreground bg-muted border-l border-border min-w-[110px]">
                            Total
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {comparisonData.map((category) => {
                        const isIncome = category.categoryType === 'receita';
                        const hasSubs = category.subcategoriesComparison.length > 0;
                        const isExpanded = expandedCategories.has(category.categoryId);

                        return (
                            <>
                                <tr
                                    key={category.categoryId}
                                    className="border-t border-border hover:bg-muted/30"
                                >
                                    <td className="p-3 sticky left-0 bg-card z-10">
                                        <div className="flex items-center gap-2">
                                            {hasSubs ? (
                                                <button
                                                    type="button"
                                                    className="p-0.5 hover:bg-muted rounded transition-transform"
                                                    onClick={() => toggleCategory(category.categoryId)}
                                                >
                                                    <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                                                        isExpanded ? 'rotate-90' : ''
                                                    }`}
                                                    />
                                                </button>
                                            ) : (
                                                <span className="w-4.5" />
                                            )}
                                            <span
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: category.color }}
                                            />
                                            <span className="font-medium text-foreground text-sm">
                                                {category.categoryName}
                                            </span>
                                        </div>
                                    </td>
                                    {category.monthsComparison.map((m) => {
                                        const isGood = isIncome
                                            ? m.difference >= 0
                                            : m.difference <= 0;

                                        return (
                                            <td
                                                key={m.month}
                                                className="border-l border-border p-1.5 align-top"
                                            >
                                                <div className="space-y-0.5 text-right text-xs">
                                                    <div className="font-mono-numbers text-muted-foreground">
                                                        {formatCurrency(m.budgeted)}
                                                    </div>
                                                    <div className="font-mono-numbers font-medium">
                                                        {formatCurrency(m.actual)}
                                                    </div>
                                                    <div className={`font-mono-numbers font-medium ${
                                                        isGood ? 'text-income' : 'text-expense'
                                                    }`}
                                                    >
                                                        {m.difference > 0 ? '+' : ''}
                                                        {m.differencePercent.toFixed(0)}
                                                        %
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                    {/* Total column */}
                                    <td className="border-l border-border p-1.5 align-top bg-muted/30">
                                        <div className="space-y-0.5 text-right text-xs">
                                            <div className="font-mono-numbers text-muted-foreground">
                                                {formatCurrency(category.budgetedAnnual)}
                                            </div>
                                            <div className="font-mono-numbers font-medium">
                                                {formatCurrency(category.actualAnnual)}
                                            </div>
                                            {(() => {
                                                const diff = category.actualAnnual - category.budgetedAnnual;
                                                const pct = category.budgetedAnnual > 0
                                                    ? ((diff) / category.budgetedAnnual) * 100
                                                    : 0;
                                                const good = isIncome ? diff >= 0 : diff <= 0;
                                                return (
                                                    <div className={`font-mono-numbers font-bold ${
                                                        good ? 'text-income' : 'text-expense'
                                                    }`}
                                                    >
                                                        {diff > 0 ? '+' : ''}
                                                        {pct.toFixed(0)}
                                                        %
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                </tr>
                                {/* Subcategory rows */}
                                {isExpanded && category.subcategoriesComparison.map((sub) => (
                                    <tr
                                        key={`${category.categoryId}-${sub.subcategoryId}`}
                                        className="border-t border-border/50 bg-muted/10 hover:bg-muted/20"
                                    >
                                        <td className="p-3 pl-10 sticky left-0 bg-card/95 z-10">
                                            <span className="text-muted-foreground text-xs">
                                                {sub.subcategoryName}
                                            </span>
                                        </td>
                                        {sub.monthsComparison.map((m) => {
                                            const isGood = isIncome
                                                ? m.difference >= 0
                                                : m.difference <= 0;

                                            return (
                                                <td
                                                    key={m.month}
                                                    className="border-l border-border/50 p-1.5 align-top"
                                                >
                                                    <div className="space-y-0.5 text-right text-xs">
                                                        <div className="font-mono-numbers text-muted-foreground/70">
                                                            {formatCurrency(m.budgeted)}
                                                        </div>
                                                        <div className="font-mono-numbers text-muted-foreground">
                                                            {formatCurrency(m.actual)}
                                                        </div>
                                                        <div className={`font-mono-numbers ${
                                                            isGood ? 'text-income/70' : 'text-expense/70'
                                                        }`}
                                                        >
                                                            {m.difference > 0 ? '+' : ''}
                                                            {m.differencePercent.toFixed(0)}
                                                            %
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        {/* Total column */}
                                        <td className="border-l border-border/50 p-1.5 align-top bg-muted/20">
                                            <div className="space-y-0.5 text-right text-xs">
                                                <div className="font-mono-numbers text-muted-foreground/70">
                                                    {formatCurrency(sub.budgetedAnnual)}
                                                </div>
                                                <div className="font-mono-numbers text-muted-foreground">
                                                    {formatCurrency(sub.actualAnnual)}
                                                </div>
                                                {(() => {
                                                    const diff = sub.actualAnnual - sub.budgetedAnnual;
                                                    const pct = sub.budgetedAnnual > 0
                                                        ? ((diff) / sub.budgetedAnnual) * 100
                                                        : 0;
                                                    const good = isIncome ? diff >= 0 : diff <= 0;
                                                    return (
                                                        <div className={`font-mono-numbers font-medium ${
                                                            good ? 'text-income/70' : 'text-expense/70'
                                                        }`}
                                                        >
                                                            {diff > 0 ? '+' : ''}
                                                            {pct.toFixed(0)}
                                                            %
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        );
                    })}
                </tbody>
            </table>

            {/* Legend */}
            <div className="p-3 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
                <span>Linha 1: Orçado</span>
                <span>Linha 2: Realizado</span>
                <span>
                    Linha 3: Variação %
                    {' '}
                    (
                    <span className="text-income">positivo</span>
                    {' / '}
                    <span className="text-expense">negativo</span>
                    )
                </span>
            </div>
        </div>
    );
}
