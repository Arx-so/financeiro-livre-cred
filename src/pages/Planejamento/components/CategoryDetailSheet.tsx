import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { FrequencySelector } from './FrequencySelector';
import { MonthlyInputGrid } from './MonthlyInputGrid';
import { useBudgetSuggestion, useUpdateBudgetMonthly } from '@/hooks/useBudget';
import type { BudgetFrequency, BudgetCategoryWithSubcategories, BudgetSubcategoryData } from '@/types/database';

interface CategoryDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: BudgetCategoryWithSubcategories | null;
    subcategory?: BudgetSubcategoryData | null;
    branchId: string;
    year: number;
    versionId?: string | null;
    isEditable: boolean;
}

export function CategoryDetailSheet({
    open,
    onOpenChange,
    category,
    subcategory,
    branchId,
    year,
    versionId,
    isEditable,
}: CategoryDetailSheetProps) {
    const [frequency, setFrequency] = useState<BudgetFrequency>('mensal');
    const [monthlyValues, setMonthlyValues] = useState<number[]>(Array(12).fill(0));

    const updateMutation = useUpdateBudgetMonthly();

    const { data: suggestion } = useBudgetSuggestion(
        branchId,
        category?.categoryId,
        subcategory?.subcategoryId
    );

    // Initialize values when opening
    useEffect(() => {
        if (open) {
            if (subcategory) {
                setFrequency(subcategory.frequency);
                setMonthlyValues(subcategory.months.map((m) => m.budgeted));
            } else if (category) {
                setFrequency(category.frequency);
                setMonthlyValues(category.months.map((m) => m.budgeted));
            }
        }
    }, [open, category, subcategory]);

    const handleSave = async () => {
        if (!category) return;

        try {
            await updateMutation.mutateAsync({
                branchId,
                categoryId: category.categoryId,
                subcategoryId: subcategory?.subcategoryId || null,
                year,
                amounts: monthlyValues,
                frequency,
                versionId,
            });
            toast.success('Orçamento atualizado!');
            onOpenChange(false);
        } catch {
            toast.error('Erro ao atualizar orçamento');
        }
    };

    const title = subcategory
        ? `${category?.categoryName} > ${subcategory.subcategoryName}`
        : category?.categoryName || 'Categoria';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        {category && (
                            <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                            />
                        )}
                        {title}
                    </SheetTitle>
                    <SheetDescription>
                        Defina os valores orçados para cada mês de
                        {' '}
                        {year}
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    <FrequencySelector
                        value={frequency}
                        onChange={setFrequency}
                        disabled={!isEditable}
                    />

                    <MonthlyInputGrid
                        values={monthlyValues}
                        onChange={setMonthlyValues}
                        frequency={frequency}
                        suggestion={suggestion?.suggestedMonthly}
                        disabled={!isEditable}
                    />

                    {suggestion && (
                        <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                            <p className="text-muted-foreground">
                                Média mensal (últimos 12 meses):
                                {' '}
                                <span className="font-mono-numbers font-medium text-foreground">
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    }).format(suggestion.monthlyAverage)}
                                </span>
                            </p>
                            <p className="text-muted-foreground">
                                Total ano anterior:
                                {' '}
                                <span className="font-mono-numbers font-medium text-foreground">
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    }).format(suggestion.lastYearTotal)}
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                <SheetFooter className="flex gap-3">
                    <button
                        type="button"
                        className="btn-secondary flex-1"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn-primary flex-1"
                        onClick={handleSave}
                        disabled={!isEditable || updateMutation.isPending}
                    >
                        {updateMutation.isPending && (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        )}
                        OK
                    </button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
