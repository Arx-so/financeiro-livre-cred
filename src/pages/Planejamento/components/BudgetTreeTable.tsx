import { useMemo, useState } from 'react';
import { Target } from 'lucide-react';
import { BudgetCategoryRow } from './BudgetCategoryRow';
import { CategoryDetailSheet } from './CategoryDetailSheet';
import { LoadingState, EmptyState } from '@/components/shared';
import { formatCurrency } from '@/lib/utils';
import type { BudgetCategoryWithSubcategories, BudgetSubcategoryData } from '@/types/database';

interface BudgetTreeTableProps {
    data: BudgetCategoryWithSubcategories[] | undefined;
    isLoading: boolean;
    branchId: string;
    year: number;
    versionId?: string | null;
    isEditable: boolean;
    filterType?: 'receita' | 'despesa' | 'all';
}

export function BudgetTreeTable({
    data,
    isLoading,
    branchId,
    year,
    versionId,
    isEditable,
    filterType = 'all',
}: BudgetTreeTableProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<BudgetCategoryWithSubcategories | null>(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState<BudgetSubcategoryData | null>(null);

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (filterType === 'all') return data;
        return data.filter((cat) => cat.categoryType === filterType || cat.categoryType === 'ambos');
    }, [data, filterType]);

    // Group by type
    const { receitas, despesas } = useMemo(() => {
        const rec = filteredData.filter(
            (cat) => cat.categoryType === 'receita' || cat.categoryType === 'ambos'
        );
        const desp = filteredData.filter(
            (cat) => cat.categoryType === 'despesa' || cat.categoryType === 'ambos'
        );
        return { receitas: rec, despesas: desp };
    }, [filteredData]);

    // Calculate totals
    const totals = useMemo(() => {
        const recBudgeted = receitas.reduce((sum, c) => sum + c.budgetedAnnual, 0);
        const recActual = receitas.reduce((sum, c) => sum + c.actualAnnual, 0);
        const despBudgeted = despesas.reduce((sum, c) => sum + c.budgetedAnnual, 0);
        const despActual = despesas.reduce((sum, c) => sum + c.actualAnnual, 0);

        return {
            receitas: { budgeted: recBudgeted, actual: recActual },
            despesas: { budgeted: despBudgeted, actual: despActual },
            saldo: {
                budgeted: recBudgeted - despBudgeted,
                actual: recActual - despActual,
            },
        };
    }, [receitas, despesas]);

    const handleEditCategory = (category: BudgetCategoryWithSubcategories) => {
        setSelectedCategory(category);
        setSelectedSubcategory(null);
        setSheetOpen(true);
    };

    const handleEditSubcategory = (
        category: BudgetCategoryWithSubcategories,
        subcategory: BudgetSubcategoryData
    ) => {
        setSelectedCategory(category);
        setSelectedSubcategory(subcategory);
        setSheetOpen(true);
    };

    if (isLoading) {
        return <LoadingState />;
    }

    if (!filteredData.length) {
        return <EmptyState icon={Target} message="Nenhuma categoria cadastrada. Cadastre categorias para definir o orçamento." />;
    }

    return (
        <>
            <div className="card-financial overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 font-medium text-foreground">
                                Categoria
                            </th>
                            <th className="text-right p-4 font-medium text-foreground">
                                Valor Previsto
                            </th>
                            <th className="text-center p-4 font-medium text-foreground">
                                Frequência
                            </th>
                            <th className="text-right p-4 font-medium text-foreground">
                                Previsão Anual
                            </th>
                            <th className="text-right p-4 font-medium text-foreground">
                                Realizado
                            </th>
                            <th className="text-right p-4 font-medium text-foreground">
                                Diferença
                            </th>
                            <th className="text-center p-4 font-medium text-foreground w-16">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Receitas Section */}
                        {(filterType === 'all' || filterType === 'receita') && receitas.length > 0 && (
                            <>
                                <tr className="bg-income/5">
                                    <td colSpan={7} className="px-4 py-2">
                                        <span className="font-semibold text-income">Receitas</span>
                                    </td>
                                </tr>
                                {receitas.map((category) => (
                                    <BudgetCategoryRow
                                        key={category.categoryId}
                                        category={category}
                                        onEditCategory={handleEditCategory}
                                        onEditSubcategory={handleEditSubcategory}
                                        isEditable={isEditable}
                                    />
                                ))}
                                <tr className="bg-income/10 font-medium">
                                    <td className="py-3 px-4">Subtotal Receitas</td>
                                    <td className="py-3 px-4 text-right font-mono-numbers">
                                        {formatCurrency(totals.receitas.budgeted / 12)}
                                    </td>
                                    <td className="py-3 px-4" />
                                    <td className="py-3 px-4 text-right font-mono-numbers">
                                        {formatCurrency(totals.receitas.budgeted)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono-numbers">
                                        {formatCurrency(totals.receitas.actual)}
                                    </td>
                                    <td className={`py-3 px-4 text-right font-mono-numbers ${
                                        totals.receitas.actual >= totals.receitas.budgeted
                                            ? 'text-income'
                                            : 'text-expense'
                                    }`}
                                    >
                                        {formatCurrency(totals.receitas.actual - totals.receitas.budgeted)}
                                    </td>
                                    <td className="py-3 px-4" />
                                </tr>
                            </>
                        )}

                        {/* Despesas Section */}
                        {(filterType === 'all' || filterType === 'despesa') && despesas.length > 0 && (
                            <>
                                <tr className="bg-expense/5">
                                    <td colSpan={7} className="px-4 py-2">
                                        <span className="font-semibold text-expense">Despesas</span>
                                    </td>
                                </tr>
                                {despesas.map((category) => (
                                    <BudgetCategoryRow
                                        key={category.categoryId}
                                        category={category}
                                        onEditCategory={handleEditCategory}
                                        onEditSubcategory={handleEditSubcategory}
                                        isEditable={isEditable}
                                    />
                                ))}
                                <tr className="bg-expense/10 font-medium">
                                    <td className="py-3 px-4">Subtotal Despesas</td>
                                    <td className="py-3 px-4 text-right font-mono-numbers">
                                        {formatCurrency(totals.despesas.budgeted / 12)}
                                    </td>
                                    <td className="py-3 px-4" />
                                    <td className="py-3 px-4 text-right font-mono-numbers">
                                        {formatCurrency(totals.despesas.budgeted)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono-numbers">
                                        {formatCurrency(totals.despesas.actual)}
                                    </td>
                                    <td className={`py-3 px-4 text-right font-mono-numbers ${
                                        totals.despesas.actual <= totals.despesas.budgeted
                                            ? 'text-income'
                                            : 'text-expense'
                                    }`}
                                    >
                                        {formatCurrency(totals.despesas.actual - totals.despesas.budgeted)}
                                    </td>
                                    <td className="py-3 px-4" />
                                </tr>
                            </>
                        )}

                        {/* Saldo Final */}
                        {filterType === 'all' && (
                            <tr className="bg-primary/10 font-bold">
                                <td className="py-4 px-4 text-primary">Saldo Final</td>
                                <td className="py-4 px-4 text-right font-mono-numbers text-primary">
                                    {formatCurrency(totals.saldo.budgeted / 12)}
                                </td>
                                <td className="py-4 px-4" />
                                <td className="py-4 px-4 text-right font-mono-numbers text-primary">
                                    {formatCurrency(totals.saldo.budgeted)}
                                </td>
                                <td className="py-4 px-4 text-right font-mono-numbers text-primary">
                                    {formatCurrency(totals.saldo.actual)}
                                </td>
                                <td className={`py-4 px-4 text-right font-mono-numbers ${
                                    totals.saldo.actual >= totals.saldo.budgeted
                                        ? 'text-income'
                                        : 'text-expense'
                                }`}
                                >
                                    {formatCurrency(totals.saldo.actual - totals.saldo.budgeted)}
                                </td>
                                <td className="py-4 px-4" />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <CategoryDetailSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                category={selectedCategory}
                subcategory={selectedSubcategory}
                branchId={branchId}
                year={year}
                versionId={versionId}
                isEditable={isEditable}
            />
        </>
    );
}
