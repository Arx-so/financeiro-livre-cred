import { Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getFrequencyShortLabel } from './FrequencySelector';
import type { BudgetSubcategoryData } from '@/types/database';

interface BudgetSubcategoryRowProps {
    subcategory: BudgetSubcategoryData;
    onEdit: () => void;
    isEditable: boolean;
}

export function BudgetSubcategoryRow({
    subcategory,
    onEdit,
    isEditable,
}: BudgetSubcategoryRowProps) {
    const variance = subcategory.actualAnnual - subcategory.budgetedAnnual;
    const variancePercent = subcategory.budgetedAnnual > 0
        ? ((subcategory.actualAnnual / subcategory.budgetedAnnual) - 1) * 100
        : 0;

    return (
        <tr className="border-t border-border/50 hover:bg-muted/30 transition-colors">
            <td className="py-3 pl-12 pr-4">
                <span className="text-sm text-muted-foreground">
                    {subcategory.subcategoryName}
                </span>
            </td>
            <td className="py-3 px-4 text-right font-mono-numbers text-sm">
                {formatCurrency(subcategory.budgetedAnnual / 12)}
            </td>
            <td className="py-3 px-4 text-center text-sm text-muted-foreground">
                {getFrequencyShortLabel(subcategory.frequency)}
            </td>
            <td className="py-3 px-4 text-right font-mono-numbers text-sm">
                {formatCurrency(subcategory.budgetedAnnual)}
            </td>
            <td className="py-3 px-4 text-right font-mono-numbers text-sm">
                {formatCurrency(subcategory.actualAnnual)}
            </td>
            <td className={`py-3 px-4 text-right font-mono-numbers text-sm ${
                variance > 0 ? 'text-expense' : variance < 0 ? 'text-income' : ''
            }`}
            >
                {formatCurrency(Math.abs(variance))}
                {variance !== 0 && (
                    <span className="ml-1 text-xs">
                        (
                        {variance > 0 ? '+' : ''}
                        {variancePercent.toFixed(0)}
                        %)
                    </span>
                )}
            </td>
            <td className="py-3 px-4 text-center">
                {isEditable && (
                    <button
                        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        onClick={onEdit}
                        title="Editar"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </td>
        </tr>
    );
}
