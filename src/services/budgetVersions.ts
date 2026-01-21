import { supabase } from '@/lib/supabase';

export type BudgetVersionStatus = 'rascunho' | 'aprovado' | 'arquivado';

export interface BudgetVersion {
    id: string;
    branch_id: string;
    year: number;
    version: number;
    name: string;
    status: BudgetVersionStatus;
    approved_by: string | null;
    approved_at: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

interface BudgetItemWithCategory {
    id: string;
    branch_id: string;
    category_id: string | null;
    year: number;
    month: number;
    budgeted_amount: number;
    actual_amount: number;
    budget_version_id: string | null;
    category?: { id: string; name: string; color: string } | null;
}

export interface BudgetVersionWithApprover extends BudgetVersion {
    approver?: { id: string; name: string } | null;
    creator?: { id: string; name: string } | null;
}

export interface CreateBudgetVersionParams {
    branchId: string;
    year: number;
    name: string;
    createdBy: string;
}

// Get all budget versions for a branch and year
export async function getBudgetVersions(
    branchId: string,
    year: number
): Promise<BudgetVersionWithApprover[]> {
    const { data, error } = await (supabase.from('budget_versions') as any)
        .select(`
            *,
            approver:profiles!approved_by(id, name),
            creator:profiles!created_by(id, name)
        `)
        .eq('branch_id', branchId)
        .eq('year', year)
        .order('version', { ascending: false });

    if (error) {
        console.error('Error fetching budget versions:', error);
        throw error;
    }

    return data || [];
}

// Get a single budget version
export async function getBudgetVersion(id: string): Promise<BudgetVersionWithApprover | null> {
    const { data, error } = await (supabase.from('budget_versions') as any)
        .select(`
            *,
            approver:profiles!approved_by(id, name),
            creator:profiles!created_by(id, name)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching budget version:', error);
        throw error;
    }

    return data;
}

// Create a new budget version using the database function
export async function createBudgetVersion(
    params: CreateBudgetVersionParams
): Promise<string> {
    const { data, error } = await (supabase.rpc as any)('create_budget_version', {
        p_branch_id: params.branchId,
        p_year: params.year,
        p_name: params.name,
        p_created_by: params.createdBy,
    });

    if (error) {
        console.error('Error creating budget version:', error);
        throw error;
    }

    return data;
}

// Duplicate an existing budget version
export async function duplicateBudgetVersion(
    sourceVersionId: string,
    newName: string,
    createdBy: string
): Promise<string> {
    const { data, error } = await (supabase.rpc as any)('duplicate_budget_version', {
        p_source_version_id: sourceVersionId,
        p_new_name: newName,
        p_created_by: createdBy,
    });

    if (error) {
        console.error('Error duplicating budget version:', error);
        throw error;
    }

    return data;
}

// Update budget version
export async function updateBudgetVersion(
    id: string,
    updates: Partial<Pick<BudgetVersion, 'name' | 'notes' | 'status'>>
): Promise<BudgetVersion> {
    const { data, error } = await (supabase.from('budget_versions') as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating budget version:', error);
        throw error;
    }

    return data;
}

// Approve a budget version
export async function approveBudgetVersion(
    id: string,
    approvedBy: string
): Promise<BudgetVersion> {
    const { data, error } = await (supabase.from('budget_versions') as any)
        .update({
            status: 'aprovado',
            approved_by: approvedBy,
            approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error approving budget version:', error);
        throw error;
    }

    return data;
}

// Archive a budget version
export async function archiveBudgetVersion(id: string): Promise<BudgetVersion> {
    const { data, error } = await (supabase.from('budget_versions') as any)
        .update({ status: 'arquivado' })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error archiving budget version:', error);
        throw error;
    }

    return data;
}

// Delete a budget version (only if draft)
export async function deleteBudgetVersion(id: string): Promise<void> {
    // First check if it's a draft

    const { data: version } = await (supabase.from('budget_versions') as any)
        .select('status')
        .eq('id', id)
        .single();

    if (!version || version.status !== 'rascunho') {
        throw new Error('Apenas versões em rascunho podem ser excluídas');
    }

    const { error } = await (supabase.from('budget_versions') as any)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting budget version:', error);
        throw error;
    }
}

// Get budget items for a specific version
export async function getBudgetItemsByVersion(
    versionId: string
): Promise<{
    categoryId: string;
    categoryName: string;
    color: string;
    months: { month: number; budgeted: number; actual: number }[];
}[]> {
    const { data, error } = await supabase
        .from('budget_items')
        .select(`
            *,
            category:categories(id, name, color)
        `)
        .eq('budget_version_id', versionId)
        .order('month');

    if (error) {
        console.error('Error fetching budget items by version:', error);
        throw error;
    }

    // Group by category
    const grouped = new Map<string, {
        categoryId: string;
        categoryName: string;
        color: string;
        months: Map<number, { budgeted: number; actual: number }>;
    }>();

    const items = (data || []) as BudgetItemWithCategory[];

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
        months: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            budgeted: cat.months.get(i + 1)?.budgeted || 0,
            actual: cat.months.get(i + 1)?.actual || 0,
        })),
    }));
}
