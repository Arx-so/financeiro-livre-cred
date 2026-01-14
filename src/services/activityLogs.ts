import { supabase } from '@/lib/supabase';
import type { ActivityLog, ActivityLogInsert } from '@/types/database';

export interface ActivityLogFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  limit?: number;
}

// Get activity logs with filters
export async function getActivityLogs(filters: ActivityLogFilters = {}): Promise<ActivityLog[]> {
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.entityType) {
    query = query.eq('entity_type', filters.entityType);
  }

  if (filters.entityId) {
    query = query.eq('entity_id', filters.entityId);
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.action) {
    query = query.eq('action', filters.action);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }

  return data || [];
}

// Get logs for a specific entity (favorecido, contract, financial_entry)
export async function getEntityLogs(entityType: string, entityId: string): Promise<ActivityLog[]> {
  return getActivityLogs({ entityType, entityId, limit: 50 });
}

// Create a new activity log
export async function createActivityLog(log: ActivityLogInsert): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert(log)
    .select()
    .single();

  if (error) {
    console.error('Error creating activity log:', error);
    throw error;
  }

  return data;
}

// Helper function to log an action
export async function logAction(
  entityType: string,
  entityId: string,
  action: string,
  userId?: string | null,
  userName?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await createActivityLog({
      entity_type: entityType,
      entity_id: entityId,
      action,
      user_id: userId || null,
      user_name: userName || null,
      details: details || null,
    });
  } catch (error) {
    // Log error but don't throw - we don't want to break the main flow
    console.error('Failed to log activity:', error);
  }
}

// Get action display text in Portuguese
export function getActionText(action: string): string {
  const actionTexts: Record<string, string> = {
    created: 'Criado',
    updated: 'Atualizado',
    deleted: 'Excluído',
    payment: 'Pagamento registrado',
    signed: 'Assinado',
    status_changed: 'Status alterado',
    file_uploaded: 'Arquivo anexado',
    file_deleted: 'Arquivo removido',
    photo_updated: 'Foto atualizada',
    activated: 'Ativado',
    deactivated: 'Desativado',
  };
  
  return actionTexts[action] || action;
}

// Get entity type display text in Portuguese
export function getEntityTypeText(entityType: string): string {
  const entityTexts: Record<string, string> = {
    favorecido: 'Favorecido',
    contract: 'Contrato',
    financial_entry: 'Lançamento',
    user: 'Usuário',
    branch: 'Filial',
    category: 'Categoria',
  };
  
  return entityTexts[entityType] || entityType;
}

// Format log details for display
export function formatLogDetails(details: Record<string, unknown> | null): string {
  if (!details) return '';
  
  const parts: string[] = [];
  
  if (details.old_value !== undefined && details.new_value !== undefined) {
    parts.push(`${details.old_value} → ${details.new_value}`);
  }
  
  if (details.field) {
    parts.push(`Campo: ${details.field}`);
  }
  
  if (details.value) {
    parts.push(`Valor: ${details.value}`);
  }
  
  if (details.description) {
    parts.push(String(details.description));
  }
  
  return parts.join(' | ');
}
