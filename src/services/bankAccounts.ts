import { supabase } from '@/lib/supabase';
import type { BankAccount, BankAccountInsert, BankAccountUpdate } from '@/types/database';

export interface BankAccountFilters {
  branchId?: string;
  isActive?: boolean;
  search?: string;
}

export interface BankAccountWithBranch extends BankAccount {
  branch?: { id: string; name: string; code: string } | null;
}

// Get all bank accounts with optional filters
export async function getBankAccounts(filters: BankAccountFilters = {}): Promise<BankAccountWithBranch[]> {
    let query = supabase
        .from('bank_accounts')
        .select(`
      *,
      branch:branches(id, name, code)
    `)
        .order('name', { ascending: true });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
    }

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,bank_name.ilike.%${filters.search}%,account_number.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching bank accounts:', error);
        throw error;
    }

    return data || [];
}

// Get single bank account
export async function getBankAccount(id: string): Promise<BankAccountWithBranch | null> {
    const { data, error } = await supabase
        .from('bank_accounts')
        .select(`
      *,
      branch:branches(id, name, code)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching bank account:', error);
        throw error;
    }

    return data;
}

// Create bank account
export async function createBankAccount(account: BankAccountInsert): Promise<BankAccount> {
    // Set current_balance to initial_balance on creation
    const accountData = {
        ...account,
        current_balance: account.initial_balance || 0,
    };

    const { data, error } = await supabase
        .from('bank_accounts')
        .insert(accountData)
        .select()
        .single();

    if (error) {
        console.error('Error creating bank account:', error);
        throw error;
    }

    return data;
}

// Update bank account
export async function updateBankAccount(id: string, account: BankAccountUpdate): Promise<BankAccount> {
    const { data, error } = await supabase
        .from('bank_accounts')
        .update(account)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating bank account:', error);
        throw error;
    }

    return data;
}

// Soft delete bank account (set is_active = false)
export async function deleteBankAccount(id: string): Promise<void> {
    const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('Error deactivating bank account:', error);
        throw error;
    }
}

// Reactivate bank account
export async function reactivateBankAccount(id: string): Promise<BankAccount> {
    const { data, error } = await supabase
        .from('bank_accounts')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error reactivating bank account:', error);
        throw error;
    }

    return data;
}

// Get bank accounts for a specific branch
export async function getBranchBankAccounts(branchId: string): Promise<BankAccount[]> {
    return getBankAccounts({ branchId, isActive: true });
}

// Format currency for display
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}
