import { supabase } from '@/lib/supabase';
import type {
    BudgetItem,
    BudgetItemInsert,
    BudgetItemUpdate,
    SalesTarget,
    SalesTargetInsert,
    SalesTargetUpdate,
    BudgetCategoryWithSubcategories,
    BudgetSubcategoryData,
    BudgetFrequency,
    BudgetMonthData,
} from '@/types/database';

export interface BudgetItemWithCategory extends BudgetItem {
  category?: { id: string; name: string; color: string } | null;
}

export interface SalesTargetWithSeller extends SalesTarget {
  seller?: { id: string; name: string } | null;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalActual: number;
  executionRate: number;
}

export interface SalesTargetSummary {
  totalTarget: number;
  totalActual: number;
  totalCommission: number;
  totalBonus: number;
  achievementRate: number;
  totalSellers: number;
}

// ============================================
// BUDGET ITEMS
// ============================================

/**
 * Aggrega lançamentos financeiros por categoria e mês para calcular o "realizado"
 * do orçamento (soma dos valores dos lançamentos com a mesma categoria no período).
 */
async function getBudgetActualsFromEntries(
    branchId: string,
    year: number
): Promise<Map<string, Map<number, number>>> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const { data: entries, error } = await supabase
        .from('financial_entries')
        .select('category_id, due_date, value')
        .eq('branch_id', branchId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .neq('status', 'cancelado');

    if (error) throw error;

    const byCategoryMonth = new Map<string, Map<number, number>>();
    for (const entry of entries || []) {
        const catId = entry.category_id ?? 'uncategorized';
        const d = new Date(entry.due_date);
        if (d.getFullYear() !== year) continue;
        const month = d.getMonth() + 1;
        if (!byCategoryMonth.has(catId)) {
            byCategoryMonth.set(catId, new Map());
        }
        const monthMap = byCategoryMonth.get(catId)!;
        const prev = monthMap.get(month) ?? 0;
        monthMap.set(month, prev + Number(entry.value));
    }
    return byCategoryMonth;
}

export async function getBudgetItems(
    branchId: string,
    year: number
): Promise<BudgetItemWithCategory[]> {
    const { data, error } = await supabase
        .from('budget_items')
        .select(`
      *,
      category:categories(id, name, color)
    `)
        .eq('branch_id', branchId)
        .eq('year', year)
        .order('month');

    if (error) {
        console.error('Error fetching budget items:', error);
        throw error;
    }

    return data || [];
}

export async function getBudgetByCategory(
    branchId: string,
    year: number
): Promise<{
  categoryId: string;
  categoryName: string;
  color: string;
  budgetedAnnual: number;
  actualAnnual: number;
  months: { month: number; budgeted: number; actual: number }[];
}[]> {
    const [items, actualsMap] = await Promise.all([
        getBudgetItems(branchId, year),
        getBudgetActualsFromEntries(branchId, year),
    ]);

    // Group by category; "actual" vem dos lançamentos (financial_entries) da mesma categoria/mês
    const grouped = new Map<string, {
    categoryId: string;
    categoryName: string;
    color: string;
    months: Map<number, { budgeted: number; actual: number }>;
  }>();

    for (const item of items) {
        const catId = item.category_id || 'uncategorized';
        const catName = item.category?.name || 'Sem Categoria';
        const color = item.category?.color || '#888888';

        if (!grouped.has(catId)) {
            grouped.set(catId, {
                categoryId: catId,
                categoryName: catName,
                color,
                months: new Map(),
            });
        }

        const category = grouped.get(catId)!;
        const actual = actualsMap.get(catId)?.get(item.month) ?? 0;
        category.months.set(item.month, {
            budgeted: Number(item.budgeted_amount),
            actual,
        });
    }

    return Array.from(grouped.values()).map((cat) => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        color: cat.color,
        budgetedAnnual: Array.from(cat.months.values()).reduce((sum, m) => sum + m.budgeted, 0),
        actualAnnual: Array.from(cat.months.values()).reduce((sum, m) => sum + m.actual, 0),
        months: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            budgeted: cat.months.get(i + 1)?.budgeted || 0,
            actual: cat.months.get(i + 1)?.actual || 0,
        })),
    }));
}

export async function createBudgetItem(item: BudgetItemInsert): Promise<BudgetItem> {
    const { data, error } = await supabase
        .from('budget_items')
        .insert(item)
        .select()
        .single();

    if (error) {
        console.error('Error creating budget item:', error);
        throw error;
    }

    return data;
}

export async function createAnnualBudget(
    branchId: string,
    categoryId: string,
    year: number,
    annualAmount: number,
    distribution: 'equal' | 'custom' = 'equal',
    monthlyAmounts?: number[]
): Promise<BudgetItem[]> {
    const items: BudgetItemInsert[] = [];
    const monthlyAmount = annualAmount / 12;

    for (let month = 1; month <= 12; month++) {
        items.push({
            branch_id: branchId,
            category_id: categoryId,
            year,
            month,
            budgeted_amount: distribution === 'equal'
                ? monthlyAmount
                : (monthlyAmounts?.[month - 1] || monthlyAmount),
        });
    }

    const { data, error } = await supabase
        .from('budget_items')
        .upsert(items, {
            onConflict: 'branch_id,category_id,year,month',
        })
        .select();

    if (error) {
        console.error('Error creating annual budget:', error);
        throw error;
    }

    return data || [];
}

export async function updateBudgetItem(id: string, item: BudgetItemUpdate): Promise<BudgetItem> {
    const { data, error } = await supabase
        .from('budget_items')
        .update(item)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating budget item:', error);
        throw error;
    }

    return data;
}

export async function deleteBudgetItem(id: string): Promise<void> {
    const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting budget item:', error);
        throw error;
    }
}

export async function getBudgetSummary(
    branchId: string,
    year: number,
    versionId?: string | null
): Promise<BudgetSummary> {
    let query = supabase
        .from('budget_items')
        .select('category_id, month, budgeted_amount')
        .eq('branch_id', branchId)
        .eq('year', year);

    if (versionId) {
        query = query.eq('budget_version_id', versionId);
    }

    const { data: items, error } = await query;

    if (error) {
        throw error;
    }

    const actualsMap = await getBudgetActualsFromEntries(branchId, year);

    let totalBudgeted = 0;
    let totalActual = 0;
    for (const item of items || []) {
        totalBudgeted += Number(item.budgeted_amount);
        const catId = item.category_id ?? 'uncategorized';
        const {month} = item;
        totalActual += actualsMap.get(catId)?.get(month) ?? 0;
    }

    const executionRate = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;

    return {
        totalBudgeted,
        totalActual,
        executionRate,
    };
}

// ============================================
// HIERARCHICAL BUDGET
// ============================================

/**
 * Get budget data organized hierarchically by category with subcategories
 */
export async function getBudgetHierarchical(
    branchId: string,
    year: number,
    versionId?: string | null
): Promise<BudgetCategoryWithSubcategories[]> {
    // Get categories with subcategories
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select(`
            id,
            name,
            type,
            color,
            subcategories(id, name)
        `)
        .eq('is_active', true)
        .order('name');

    if (catError) throw catError;

    // Get budget items
    let budgetQuery = supabase
        .from('budget_items')
        .select('*')
        .eq('branch_id', branchId)
        .eq('year', year);

    if (versionId) {
        budgetQuery = budgetQuery.eq('budget_version_id', versionId);
    }

    const { data: budgetItems, error: budgetError } = await budgetQuery;
    if (budgetError) throw budgetError;

    // Get actuals from financial entries
    const actualsMap = await getBudgetActualsFromEntries(branchId, year);

    // Also get actuals by subcategory
    const actualsBySubcategory = await getBudgetActualsBySubcategory(branchId, year);

    // Build hierarchical structure
    const result: BudgetCategoryWithSubcategories[] = [];

    for (const cat of categories || []) {
        const catBudgets = (budgetItems || []).filter((b) => b.category_id === cat.id);
        const catActuals = actualsMap.get(cat.id) || new Map<number, number>();

        // Build months data for category
        const categoryMonths: BudgetMonthData[] = [];
        let categoryBudgetedAnnual = 0;
        let categoryActualAnnual = 0;

        for (let month = 1; month <= 12; month++) {
            const budgetItem = catBudgets.find((b) => b.month === month && !b.subcategory_id);
            const budgeted = budgetItem?.budgeted_amount || 0;
            const actual = catActuals.get(month) || 0;

            categoryMonths.push({ month, budgeted: Number(budgeted), actual });
            categoryBudgetedAnnual += Number(budgeted);
            categoryActualAnnual += actual;
        }

        // Build subcategories
        const subcategories: BudgetSubcategoryData[] = [];
        for (const sub of cat.subcategories || []) {
            const subBudgets = catBudgets.filter((b) => b.subcategory_id === sub.id);
            const subActuals = actualsBySubcategory.get(sub.id) || new Map<number, number>();

            const subMonths: BudgetMonthData[] = [];
            let subBudgetedAnnual = 0;
            let subActualAnnual = 0;

            for (let month = 1; month <= 12; month++) {
                const budgetItem = subBudgets.find((b) => b.month === month);
                const budgeted = budgetItem?.budgeted_amount || 0;
                const actual = subActuals.get(month) || 0;

                subMonths.push({ month, budgeted: Number(budgeted), actual });
                subBudgetedAnnual += Number(budgeted);
                subActualAnnual += actual;
            }

            subcategories.push({
                subcategoryId: sub.id,
                subcategoryName: sub.name,
                frequency: 'mensal' as BudgetFrequency,
                budgetedAnnual: subBudgetedAnnual,
                actualAnnual: subActualAnnual,
                months: subMonths,
            });
        }

        result.push({
            categoryId: cat.id,
            categoryName: cat.name,
            categoryType: cat.type as 'receita' | 'despesa' | 'ambos',
            color: cat.color,
            frequency: 'mensal' as BudgetFrequency,
            budgetedAnnual: categoryBudgetedAnnual,
            actualAnnual: categoryActualAnnual,
            months: categoryMonths,
            subcategories,
        });
    }

    return result;
}

/**
 * Get actuals grouped by subcategory and month
 */
async function getBudgetActualsBySubcategory(
    branchId: string,
    year: number
): Promise<Map<string, Map<number, number>>> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: entries, error } = await supabase
        .from('financial_entries')
        .select('subcategory_id, due_date, value')
        .eq('branch_id', branchId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .neq('status', 'cancelado')
        .not('subcategory_id', 'is', null);

    if (error) throw error;

    const bySubMonth = new Map<string, Map<number, number>>();
    for (const entry of entries || []) {
        if (!entry.subcategory_id) continue;
        const d = new Date(entry.due_date);
        if (d.getFullYear() !== year) continue;
        const month = d.getMonth() + 1;

        if (!bySubMonth.has(entry.subcategory_id)) {
            bySubMonth.set(entry.subcategory_id, new Map());
        }
        const monthMap = bySubMonth.get(entry.subcategory_id)!;
        const prev = monthMap.get(month) ?? 0;
        monthMap.set(month, prev + Number(entry.value));
    }

    return bySubMonth;
}

/**
 * Update budget items for a category/subcategory with monthly amounts
 */
export async function updateBudgetItemMonthly(
    branchId: string,
    categoryId: string,
    subcategoryId: string | null,
    year: number,
    amounts: number[],
    frequency: BudgetFrequency,
    versionId?: string | null
): Promise<void> {
    const items: BudgetItemInsert[] = [];

    for (let month = 1; month <= 12; month++) {
        const item: BudgetItemInsert = {
            branch_id: branchId,
            category_id: categoryId,
            subcategory_id: subcategoryId,
            year,
            month,
            budgeted_amount: amounts[month - 1] || 0,
            budget_version_id: versionId || null,
        };

        items.push(item);
    }

    // Upsert all 12 months
    const { error } = await supabase
        .from('budget_items')
        .upsert(items, {
            onConflict: subcategoryId
                ? 'branch_id,category_id,subcategory_id,year,month'
                : 'branch_id,category_id,year,month',
        });

    if (error) throw error;
}

/**
 * Get budget suggestion based on last 12 months of actual data
 */
export async function getBudgetSuggestion(
    branchId: string,
    categoryId: string,
    subcategoryId?: string | null
): Promise<{ monthlyAverage: number; lastYearTotal: number; suggestedMonthly: number[] }> {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0];

    let query = supabase
        .from('financial_entries')
        .select('due_date, value')
        .eq('branch_id', branchId)
        .eq('category_id', categoryId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .neq('status', 'cancelado');

    if (subcategoryId) {
        query = query.eq('subcategory_id', subcategoryId);
    }

    const { data: entries, error } = await query;
    if (error) throw error;

    // Group by month
    const monthlyTotals = new Map<string, number>();
    for (const entry of entries || []) {
        const d = new Date(entry.due_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const prev = monthlyTotals.get(key) ?? 0;
        monthlyTotals.set(key, prev + Number(entry.value));
    }

    const totals = Array.from(monthlyTotals.values());
    const lastYearTotal = totals.reduce((sum, v) => sum + v, 0);
    const monthlyAverage = totals.length > 0 ? lastYearTotal / totals.length : 0;

    // Generate suggested monthly values (simple: use average for all months)
    const suggestedMonthly = Array(12).fill(monthlyAverage);

    return {
        monthlyAverage,
        lastYearTotal,
        suggestedMonthly,
    };
}

/**
 * Get annual summary with totals by month
 */
interface BudgetedActual {
    budgeted: number;
    actual: number;
}

export interface AnnualSummaryMonth {
    month: number;
    receitas: BudgetedActual;
    despesas: BudgetedActual;
    saldo: BudgetedActual;
}

export interface AnnualSummaryResult {
    months: AnnualSummaryMonth[];
    totals: {
        receitas: BudgetedActual;
        despesas: BudgetedActual;
        saldo: BudgetedActual;
    };
}

export async function getAnnualSummary(
    branchId: string,
    year: number,
    versionId?: string | null
): Promise<AnnualSummaryResult> {
    // Get categories to know their types
    const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, type')
        .eq('is_active', true);

    if (catError) throw catError;

    const receitaCategoryIds = new Set(
        (categories || []).filter((c) => c.type === 'receita').map((c) => c.id)
    );
    const despesaCategoryIds = new Set(
        (categories || []).filter((c) => c.type === 'despesa').map((c) => c.id)
    );

    // Get budget items
    let budgetQuery = supabase
        .from('budget_items')
        .select('category_id, month, budgeted_amount')
        .eq('branch_id', branchId)
        .eq('year', year);

    if (versionId) {
        budgetQuery = budgetQuery.eq('budget_version_id', versionId);
    }

    const { data: budgetItems, error: budgetError } = await budgetQuery;
    if (budgetError) throw budgetError;

    // Get actuals
    const actualsMap = await getBudgetActualsFromEntries(branchId, year);

    // Build monthly summary
    const months: {
        month: number;
        receitas: { budgeted: number; actual: number };
        despesas: { budgeted: number; actual: number };
        saldo: { budgeted: number; actual: number };
    }[] = [];

    let totalReceitasBudgeted = 0;
    let totalReceitasActual = 0;
    let totalDespesasBudgeted = 0;
    let totalDespesasActual = 0;

    for (let month = 1; month <= 12; month++) {
        let receitasBudgeted = 0;
        let receitasActual = 0;
        let despesasBudgeted = 0;
        let despesasActual = 0;

        // Sum budgeted by type
        for (const item of budgetItems || []) {
            if (item.month !== month) continue;
            const catId = item.category_id;

            if (catId && receitaCategoryIds.has(catId)) {
                receitasBudgeted += Number(item.budgeted_amount);
            } else if (catId && despesaCategoryIds.has(catId)) {
                despesasBudgeted += Number(item.budgeted_amount);
            }
        }

        // Sum actuals by type
        for (const [catId, monthMap] of actualsMap) {
            const actual = monthMap.get(month) || 0;
            if (receitaCategoryIds.has(catId)) {
                receitasActual += actual;
            } else if (despesaCategoryIds.has(catId)) {
                despesasActual += actual;
            }
        }

        months.push({
            month,
            receitas: { budgeted: receitasBudgeted, actual: receitasActual },
            despesas: { budgeted: despesasBudgeted, actual: despesasActual },
            saldo: {
                budgeted: receitasBudgeted - despesasBudgeted,
                actual: receitasActual - despesasActual,
            },
        });

        totalReceitasBudgeted += receitasBudgeted;
        totalReceitasActual += receitasActual;
        totalDespesasBudgeted += despesasBudgeted;
        totalDespesasActual += despesasActual;
    }

    return {
        months,
        totals: {
            receitas: { budgeted: totalReceitasBudgeted, actual: totalReceitasActual },
            despesas: { budgeted: totalDespesasBudgeted, actual: totalDespesasActual },
            saldo: {
                budgeted: totalReceitasBudgeted - totalDespesasBudgeted,
                actual: totalReceitasActual - totalDespesasActual,
            },
        },
    };
}

// ============================================
// SALES TARGETS
// ============================================

export async function getSalesTargets(
    branchId: string,
    year: number,
    month?: number
): Promise<SalesTargetWithSeller[]> {
    let query = supabase
        .from('sales_targets')
        .select(`
      *,
      seller:profiles(id, name, email)
    `)
        .eq('branch_id', branchId)
        .eq('year', year)
        .order('month');

    if (month) {
        query = query.eq('month', month);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching sales targets:', error);
        throw error;
    }

    return data || [];
}

export async function createSalesTarget(target: SalesTargetInsert): Promise<SalesTarget> {
    const { data, error } = await supabase
        .from('sales_targets')
        .insert(target)
        .select()
        .single();

    if (error) {
        console.error('Error creating sales target:', error);
        throw error;
    }

    return data;
}

export async function updateSalesTarget(id: string, target: SalesTargetUpdate): Promise<SalesTarget> {
    const { data, error } = await supabase
        .from('sales_targets')
        .update(target)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating sales target:', error);
        throw error;
    }

    return data;
}

export async function deleteSalesTarget(id: string): Promise<void> {
    const { error } = await supabase
        .from('sales_targets')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting sales target:', error);
        throw error;
    }
}

export async function getSalesTargetSummary(
    branchId: string,
    year: number,
    month?: number
): Promise<SalesTargetSummary> {
    const targets = await getSalesTargets(branchId, year, month);

    const summary = targets.reduce(
        (acc, target) => {
            acc.totalTarget += Number(target.target_amount);
            acc.totalActual += Number(target.actual_amount);
            acc.totalSellers++;

            const commission = Number(target.actual_amount) * (Number(target.commission_rate) / 100);
            acc.totalCommission += commission;

            // Bonus only if target achieved (now using fixed amount)
            if (Number(target.actual_amount) >= Number(target.target_amount)) {
                const bonus = Number(target.bonus_amount) || 0;
                acc.totalBonus += bonus;
            }

            return acc;
        },
        {
            totalTarget: 0, totalActual: 0, totalCommission: 0, totalBonus: 0, achievementRate: 0, totalSellers: 0
        }
    );

    summary.achievementRate = summary.totalTarget > 0
        ? (summary.totalActual / summary.totalTarget) * 100
        : 0;

    return summary;
}

// Calculate commission and bonus for a seller
export function calculateSellerEarnings(target: SalesTarget): {
  commission: number;
  bonus: number;
  total: number;
  achieved: boolean;
} {
    const achieved = Number(target.actual_amount) >= Number(target.target_amount);
    const commission = Number(target.actual_amount) * (Number(target.commission_rate) / 100);
    const bonus = achieved ? (Number(target.bonus_amount) || 0) : 0;

    return {
        commission,
        bonus,
        total: commission + bonus,
        achieved,
    };
}

// Update actual amount from financial entries
export async function syncActualFromEntries(
    branchId: string,
    year: number,
    month: number
): Promise<void> {
    // Get all sales entries for the month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: entries, error: entriesError } = await supabase
        .from('financial_entries')
        .select('favorecido_id, value')
        .eq('branch_id', branchId)
        .eq('type', 'receita')
        .eq('status', 'pago')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

    if (entriesError) {
        console.error('Error fetching entries for sync:', entriesError);
        throw entriesError;
    }

    // Group by seller
    const sellerTotals = new Map<string, number>();
    for (const entry of entries || []) {
        if (entry.favorecido_id) {
            sellerTotals.set(
                entry.favorecido_id,
                (sellerTotals.get(entry.favorecido_id) || 0) + Number(entry.value)
            );
        }
    }

    // Update targets
    for (const [sellerId, total] of sellerTotals) {
        await supabase
            .from('sales_targets')
            .update({ actual_amount: total })
            .eq('branch_id', branchId)
            .eq('seller_id', sellerId)
            .eq('year', year)
            .eq('month', month);
    }
}
