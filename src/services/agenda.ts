import { supabase } from '@/lib/supabase';
import type { AgendaEvent, AgendaEventInsert, AgendaEventUpdate, AgendaEventType } from '@/types/database';

export interface AgendaFilters {
  branchId?: string;
  eventType?: AgendaEventType;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

// Get agenda events with filters
export async function getAgendaEvents(filters: AgendaFilters = {}): Promise<AgendaEvent[]> {
  let query = supabase
    .from('agenda_events')
    .select('*')
    .order('event_date', { ascending: true });

  if (filters.branchId) {
    query = query.or(`branch_id.eq.${filters.branchId},branch_id.is.null`);
  }

  if (filters.eventType) {
    query = query.eq('event_type', filters.eventType);
  }

  if (filters.startDate) {
    query = query.gte('event_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('event_date', filters.endDate);
  }

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching agenda events:', error);
    throw error;
  }

  return data || [];
}

// Get events for a specific month
export async function getMonthEvents(year: number, month: number, branchId?: string): Promise<AgendaEvent[]> {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  return getAgendaEvents({
    branchId,
    startDate,
    endDate,
    isActive: true,
  });
}

// Get today's events
export async function getTodayEvents(branchId?: string): Promise<AgendaEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  return getAgendaEvents({
    branchId,
    startDate: today,
    endDate: today,
    isActive: true,
  });
}

// Get upcoming events (next 7 days)
export async function getUpcomingEvents(branchId?: string): Promise<AgendaEvent[]> {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  return getAgendaEvents({
    branchId,
    startDate: today.toISOString().split('T')[0],
    endDate: nextWeek.toISOString().split('T')[0],
    isActive: true,
  });
}

// Get birthdays for a specific month (from favorecidos)
export async function getBirthdays(month: number): Promise<{ id: string; name: string; birth_date: string }[]> {
  const { data, error } = await supabase
    .from('favorecidos')
    .select('id, name, birth_date')
    .eq('is_active', true)
    .not('birth_date', 'is', null);

  if (error) {
    console.error('Error fetching birthdays:', error);
    throw error;
  }

  // Filter by month
  return (data || []).filter(f => {
    if (!f.birth_date) return false;
    const birthMonth = new Date(f.birth_date).getMonth() + 1;
    return birthMonth === month;
  });
}

// Create agenda event
export async function createAgendaEvent(event: AgendaEventInsert): Promise<AgendaEvent> {
  const { data, error } = await supabase
    .from('agenda_events')
    .insert(event)
    .select()
    .single();

  if (error) {
    console.error('Error creating agenda event:', error);
    throw error;
  }

  return data;
}

// Update agenda event
export async function updateAgendaEvent(id: string, event: AgendaEventUpdate): Promise<AgendaEvent> {
  const { data, error } = await supabase
    .from('agenda_events')
    .update(event)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating agenda event:', error);
    throw error;
  }

  return data;
}

// Delete agenda event (soft delete)
export async function deleteAgendaEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('agenda_events')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting agenda event:', error);
    throw error;
  }
}

// Get event type display text in Portuguese
export function getEventTypeText(eventType: AgendaEventType): string {
  const texts: Record<AgendaEventType, string> = {
    lembrete: 'Lembrete',
    aniversario: 'Aniversário',
    festividade: 'Festividade',
    feriado: 'Feriado',
  };
  
  return texts[eventType] || eventType;
}

// Get event type badge color class
export function getEventTypeBadgeClass(eventType: AgendaEventType): string {
  const classes: Record<AgendaEventType, string> = {
    lembrete: 'bg-primary/10 text-primary',
    aniversario: 'bg-income-muted text-income',
    festividade: 'bg-pending-muted text-pending',
    feriado: 'bg-expense-muted text-expense',
  };
  
  return classes[eventType] || 'bg-muted text-muted-foreground';
}
