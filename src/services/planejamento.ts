import { supabase } from '@/lib/supabase';
import type {
    BudgetItem,
    BudgetItemInsert,
    BudgetItemUpdate,
    SalesTarget,
    SalesTargetInsert,
    SalesTargetUpdate
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
    const items = await getBudgetItems(branchId, year);

    // Group by category
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
        category.months.set(item.month, {
            budgeted: Number(item.budgeted_amount),
            actual: Number(item.actual_amount),
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
        .select('budgeted_amount, actual_amount')
        .eq('branch_id', branchId)
        .eq('year', year);

    if (versionId) {
        query = query.eq('version_id', versionId);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    const summary = (data || []).reduce(
        (acc, item) => {
            acc.totalBudgeted += Number(item.budgeted_amount);
            acc.totalActual += Number(item.actual_amount);
            return acc;
        },
        { totalBudgeted: 0, totalActual: 0, executionRate: 0 }
    );

    summary.executionRate = summary.totalBudgeted > 0
        ? (summary.totalActual / summary.totalBudgeted) * 100
        : 0;

    return summary;
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
      seller:favorecidos(id, name)
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

            // Bonus only if target achieved
            if (Number(target.actual_amount) >= Number(target.target_amount)) {
                const bonus = Number(target.actual_amount) * (Number(target.bonus_rate) / 100);
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
    const bonus = achieved ? Number(target.actual_amount) * (Number(target.bonus_rate) / 100) : 0;

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
