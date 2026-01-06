import { supabase } from '@/lib/supabase';
import type { 
  BankAccount,
  BankAccountInsert,
  BankAccountUpdate,
  BankStatement, 
  BankStatementInsert, 
  Reconciliation,
  ReconciliationInsert,
  FinancialEntry,
  ReconciliationStatus 
} from '@/types/database';

export interface BankStatementWithReconciliation extends BankStatement {
  reconciliation?: {
    id: string;
    financial_entry_id: string;
    matched_at: string;
  } | null;
}

export interface ReconciliationSummary {
  total: number;
  reconciled: number;
  pending: number;
  divergent: number;
  reconciliationRate: number;
}

// ============================================
// BANK ACCOUNTS
// ============================================

export async function getBankAccounts(branchId?: string): Promise<BankAccount[]> {
  let query = supabase
    .from('bank_accounts')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bank accounts:', error);
    throw error;
  }

  return data || [];
}

export async function createBankAccount(account: BankAccountInsert): Promise<BankAccount> {
  const { data, error } = await supabase
    .from('bank_accounts')
    .insert(account)
    .select()
    .single();

  if (error) {
    console.error('Error creating bank account:', error);
    throw error;
  }

  return data;
}

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

// ============================================
// BANK STATEMENTS
// ============================================

export async function getBankStatements(
  bankAccountId: string,
  startDate?: string,
  endDate?: string
): Promise<BankStatementWithReconciliation[]> {
  let query = supabase
    .from('bank_statements')
    .select(`
      *,
      reconciliation:reconciliations(id, financial_entry_id, matched_at)
    `)
    .eq('bank_account_id', bankAccountId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bank statements:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    reconciliation: Array.isArray(item.reconciliation) 
      ? item.reconciliation[0] || null 
      : item.reconciliation,
  }));
}

export async function createBankStatement(statement: BankStatementInsert): Promise<BankStatement> {
  const { data, error } = await supabase
    .from('bank_statements')
    .insert(statement)
    .select()
    .single();

  if (error) {
    console.error('Error creating bank statement:', error);
    throw error;
  }

  return data;
}

export async function createBankStatements(statements: BankStatementInsert[]): Promise<BankStatement[]> {
  const { data, error } = await supabase
    .from('bank_statements')
    .insert(statements)
    .select();

  if (error) {
    console.error('Error creating bank statements:', error);
    throw error;
  }

  return data || [];
}

export async function deleteBankStatement(id: string): Promise<void> {
  const { error } = await supabase
    .from('bank_statements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting bank statement:', error);
    throw error;
  }
}

// ============================================
// RECONCILIATION
// ============================================

export async function createReconciliation(
  bankStatementId: string, 
  financialEntryId: string,
  matchedBy?: string,
  notes?: string
): Promise<Reconciliation> {
  const reconciliation: ReconciliationInsert = {
    bank_statement_id: bankStatementId,
    financial_entry_id: financialEntryId,
    matched_by: matchedBy,
    notes,
  };

  const { data, error } = await supabase
    .from('reconciliations')
    .insert(reconciliation)
    .select()
    .single();

  if (error) {
    console.error('Error creating reconciliation:', error);
    throw error;
  }

  // Update bank statement status
  await supabase
    .from('bank_statements')
    .update({ reconciliation_status: 'conciliado' })
    .eq('id', bankStatementId);

  // Update financial entry status to paid if not already
  await supabase
    .from('financial_entries')
    .update({ status: 'pago' })
    .eq('id', financialEntryId)
    .eq('status', 'pendente');

  return data;
}

export async function deleteReconciliation(id: string): Promise<void> {
  // Get reconciliation info first
  const { data: reconciliation } = await supabase
    .from('reconciliations')
    .select('bank_statement_id')
    .eq('id', id)
    .single();

  if (reconciliation) {
    // Reset bank statement status
    await supabase
      .from('bank_statements')
      .update({ reconciliation_status: 'pendente' })
      .eq('id', reconciliation.bank_statement_id);
  }

  const { error } = await supabase
    .from('reconciliations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting reconciliation:', error);
    throw error;
  }
}

// Get unreconciled entries for matching
export async function getUnreconciledEntries(branchId: string): Promise<FinancialEntry[]> {
  // First, get all reconciled entry IDs
  const { data: reconciledData, error: reconciledError } = await supabase
    .from('reconciliations')
    .select('financial_entry_id');

  if (reconciledError) {
    console.error('Error fetching reconciled entries:', reconciledError);
    throw reconciledError;
  }

  const reconciledIds = (reconciledData || []).map(r => r.financial_entry_id).filter(Boolean);

  // Now get entries that are not in the reconciled list
  let query = supabase
    .from('financial_entries')
    .select('*')
    .eq('branch_id', branchId)
    .in('status', ['pago', 'pendente']);

  // Only apply the filter if there are reconciled IDs
  if (reconciledIds.length > 0) {
    query = query.not('id', 'in', `(${reconciledIds.join(',')})`);
  }

  const { data, error } = await query.order('due_date', { ascending: false });

  if (error) {
    console.error('Error fetching unreconciled entries:', error);
    throw error;
  }

  return data || [];
}

// Auto-match bank statements with entries
export interface MatchCandidate {
  statementId: string;
  entryId: string;
  score: number;
  matchType: 'exact' | 'value' | 'date_value' | 'description';
}

export async function findMatchCandidates(
  bankAccountId: string,
  branchId: string
): Promise<MatchCandidate[]> {
  // Get unreconciled statements
  const statements = await getBankStatements(bankAccountId);
  const pendingStatements = statements.filter(s => s.reconciliation_status === 'pendente');

  // Get unreconciled entries
  const entries = await getUnreconciledEntries(branchId);

  const candidates: MatchCandidate[] = [];

  for (const statement of pendingStatements) {
    for (const entry of entries) {
      // Check type match (credit = receita, debit = despesa)
      const typeMatch = 
        (statement.type === 'credito' && entry.type === 'receita') ||
        (statement.type === 'debito' && entry.type === 'despesa');

      if (!typeMatch) continue;

      // Check value match
      const valueMatch = Math.abs(Number(statement.value) - Number(entry.value)) < 0.01;

      if (!valueMatch) continue;

      // Check date match (same day or within 3 days)
      const statementDate = new Date(statement.date);
      const entryDate = new Date(entry.due_date);
      const daysDiff = Math.abs((statementDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      const dateMatch = daysDiff <= 3;

      // Check description similarity (simple contains check)
      const descMatch = 
        statement.description.toLowerCase().includes(entry.description.toLowerCase().substring(0, 10)) ||
        entry.description.toLowerCase().includes(statement.description.toLowerCase().substring(0, 10));

      // Calculate match score
      let score = 0;
      let matchType: MatchCandidate['matchType'] = 'value';

      if (valueMatch) score += 40;
      if (dateMatch) {
        score += daysDiff === 0 ? 30 : (3 - daysDiff) * 10;
        matchType = 'date_value';
      }
      if (descMatch) {
        score += 30;
        matchType = 'description';
      }
      if (valueMatch && daysDiff === 0 && descMatch) {
        matchType = 'exact';
      }

      if (score >= 40) {
        candidates.push({
          statementId: statement.id,
          entryId: entry.id,
          score,
          matchType,
        });
      }
    }
  }

  // Sort by score descending and remove duplicates
  candidates.sort((a, b) => b.score - a.score);

  // Keep only best match per statement
  const bestMatches = new Map<string, MatchCandidate>();
  for (const candidate of candidates) {
    if (!bestMatches.has(candidate.statementId)) {
      bestMatches.set(candidate.statementId, candidate);
    }
  }

  return Array.from(bestMatches.values());
}

// Get reconciliation summary
export async function getReconciliationSummary(bankAccountId: string): Promise<ReconciliationSummary> {
  const { data, error } = await supabase
    .from('bank_statements')
    .select('reconciliation_status')
    .eq('bank_account_id', bankAccountId);

  if (error) {
    console.error('Error fetching reconciliation summary:', error);
    throw error;
  }

  const summary = (data || []).reduce(
    (acc, statement) => {
      acc.total++;
      switch (statement.reconciliation_status) {
        case 'conciliado':
          acc.reconciled++;
          break;
        case 'pendente':
          acc.pending++;
          break;
        case 'divergente':
          acc.divergent++;
          break;
      }
      return acc;
    },
    { total: 0, reconciled: 0, pending: 0, divergent: 0, reconciliationRate: 0 }
  );

  summary.reconciliationRate = summary.total > 0 
    ? (summary.reconciled / summary.total) * 100 
    : 0;

  return summary;
}

// Import bank statement from parsed data
export interface ParsedStatementRow {
  date: string;
  description: string;
  value: number;
  type: 'credito' | 'debito';
  balance?: number;
  reference?: string;
}

export async function importBankStatements(
  bankAccountId: string,
  rows: ParsedStatementRow[]
): Promise<{ imported: number; errors: number }> {
  const statements: BankStatementInsert[] = rows.map(row => ({
    bank_account_id: bankAccountId,
    date: row.date,
    description: row.description,
    value: row.value,
    type: row.type,
    balance: row.balance,
    reference: row.reference,
    reconciliation_status: 'pendente',
  }));

  try {
    const result = await createBankStatements(statements);
    return { imported: result.length, errors: 0 };
  } catch (error) {
    console.error('Error importing statements:', error);
    return { imported: 0, errors: statements.length };
  }
}
