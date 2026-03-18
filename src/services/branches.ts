import { supabase } from '@/lib/supabase';
import type { Branch, BranchInsert, BranchUpdate } from '@/types/database';

export interface BranchFilters {
  isActive?: boolean;
  search?: string;
}

// Get all branches with optional filters
export async function getBranches(filters: BranchFilters = {}): Promise<Branch[]> {
    let query = supabase
        .from('branches')
        .select('*')
        .order('name', { ascending: true });

    if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
    }

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching branches:', error);
        throw error;
    }

    return data || [];
}

// Get single branch
export async function getBranch(id: string): Promise<Branch | null> {
    const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching branch:', error);
        throw error;
    }

    return data;
}

// Create branch
export async function createBranch(branch: BranchInsert): Promise<Branch> {
    const { data, error } = await supabase
        .from('branches')
        .insert(branch)
        .select()
        .single();

    if (error) {
        console.error('Error creating branch:', error);
        throw error;
    }

    return data;
}

// Update branch
export async function updateBranch(id: string, branch: BranchUpdate): Promise<Branch> {
    const { data, error } = await supabase
        .from('branches')
        .update(branch)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating branch:', error);
        throw error;
    }

    return data;
}

// Soft delete branch (set is_active = false)
export async function deleteBranch(id: string): Promise<void> {
    // Prevent deactivating the ADM branch
    const branch = await getBranch(id);
    if (branch?.code === 'ADM') {
        throw new Error('A filial ADM não pode ser desativada');
    }

    const { error } = await supabase
        .from('branches')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('Error deactivating branch:', error);
        throw error;
    }
}

// Reactivate branch
export async function reactivateBranch(id: string): Promise<Branch> {
    const { data, error } = await supabase
        .from('branches')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error reactivating branch:', error);
        throw error;
    }

    return data;
}

// Check if branch code is unique
export async function isBranchCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    let query = supabase
        .from('branches')
        .select('id')
        .eq('code', code);

    if (excludeId) {
        query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error checking branch code:', error);
        throw error;
    }

    return (data?.length || 0) === 0;
}
