import { supabase } from '@/lib/supabase';
import type { Notification, NotificationInsert, NotificationUpdate } from '@/types/database';

export interface NotificationFilters {
  userId?: string;
  isRead?: boolean;
  type?: string;
  limit?: number;
}

// Get notifications with filters
export async function getNotifications(filters: NotificationFilters = {}): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data || [];
}

// Get unread notifications for a user
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  return getNotifications({ userId, isRead: false });
}

// Get unread count for a user
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }

  return count || 0;
}

// Create notification
export async function createNotification(notification: NotificationInsert): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return data;
}

// Mark notification as read
export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read for a user
export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Delete notification
export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Delete old notifications (older than 30 days)
export async function deleteOldNotifications(userId: string): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('is_read', true)
    .lt('created_at', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('Error deleting old notifications:', error);
    throw error;
  }
}

// Get notification type icon name
export function getNotificationTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    aniversario: 'cake',
    lembrete: 'bell',
    festividade: 'party',
    feriado: 'calendar',
    system: 'info',
  };
  
  return icons[type] || 'bell';
}

// Get notification type color class
export function getNotificationTypeClass(type: string): string {
  const classes: Record<string, string> = {
    aniversario: 'text-income',
    lembrete: 'text-primary',
    festividade: 'text-pending',
    feriado: 'text-expense',
    system: 'text-muted-foreground',
  };
  
  return classes[type] || 'text-muted-foreground';
}
