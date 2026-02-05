import { useState } from 'react';
import { ChevronRight, ChevronDown, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getFrequencyShortLabel } from './FrequencySelector';
import { BudgetSubcategoryRow } from './BudgetSubcategoryRow';
import type { BudgetCategoryWithSubcategories, BudgetSubcategoryData } from '@/types/database';

interface BudgetCategoryRowProps {
    category: BudgetCategoryWithSubcategories;
    onEditCategory: (category: BudgetCategoryWithSubcategories) => void;
    onEditSubcategory: (category: BudgetCategoryWithSubcategories, subcategory: BudgetSubcategoryData) => void;
    isEditable: boolean;
    defaultExpanded?: boolean;
}

export function BudgetCategoryRow({
    category,
    onEditCategory,
    onEditSubcategory,
    isEditable,
    defaultExpanded = false,
}: BudgetCategoryRowProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const hasSubcategories = category.subcategories.length > 0;
    const variance = category.actualAnnual - category.budgetedAnnual;
    const variancePercent = category.budgetedAnnual > 0
        ? ((category.actualAnnual / category.budgetedAnnual) - 1) * 100
        : 0;

    // Determine if this is income or expense for styling
    const isIncome = category.categoryType === 'receita';

    return (
        <>
            <tr className={`border-t border-border hover:bg-muted/50 transition-colors ${
                hasSubcategories ? 'cursor-pointer' : ''
            }`}
            >
                <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                        {hasSubcategories ? (
                            <button
                                className="p-1 rounded hover:bg-muted transition-colors"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                            </button>
                        ) : (
                            <div className="w-6" />
                        )}
                        <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                        />
                        <span
                            className="font-medium text-foreground cursor-pointer"
                            onClick={() => hasSubcategories && setIsExpanded(!isExpanded)}
                        >
                            {category.categoryName}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isIncome
                                ? 'bg-income/10 text-income'
                                : 'bg-expense/10 text-expense'
                        }`}
                        >
                            {isIncome ? 'Receita' : 'Despesa'}
                        </span>
                    </div>
                </td>
                <td className="py-4 px-4 text-right font-mono-numbers">
                    {formatCurrency(category.budgetedAnnual / 12)}
                </td>
                <td className="py-4 px-4 text-center text-sm text-muted-foreground">
                    {getFrequencyShortLabel(category.frequency)}
                </td>
                <td className="py-4 px-4 text-right font-mono-numbers font-medium">
                    {formatCurrency(category.budgetedAnnual)}
                </td>
                <td className="py-4 px-4 text-right font-mono-numbers">
                    {formatCurrency(category.actualAnnual)}
                </td>
                <td className={`py-4 px-4 text-right font-mono-numbers ${
                    isIncome
                        ? (variance >= 0 ? 'text-income' : 'text-expense')
                        : (variance <= 0 ? 'text-income' : 'text-expense')
                }`}
                >
                    {formatCurrency(Math.abs(variance))}
                    {variance !== 0 && (
                        <span className="ml-1 text-xs">
                            (
                            {variance > 0 ? '+' : '-'}
                            {Math.abs(variancePercent).toFixed(0)}
                            %)
                        </span>
                    )}
                </td>
                <td className="py-4 px-4 text-center">
                    {isEditable && (
                        <button
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditCategory(category);
                            }}
                            title="Editar categoria"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    )}
                </td>
            </tr>

            {isExpanded && hasSubcategories && (
                <>
                    {category.subcategories.map((sub) => (
                        <BudgetSubcategoryRow
                            key={sub.subcategoryId}
                            subcategory={sub}
                            onEdit={() => onEditSubcategory(category, sub)}
                            isEditable={isEditable}
                        />
                    ))}
                </>
            )}
        </>
    );
}
