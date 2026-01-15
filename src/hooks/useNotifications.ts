import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getNotifications,
    getUnreadNotifications,
    getUnreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    type NotificationFilters
} from '@/services/notifications';
import type { NotificationInsert } from '@/types/database';

// Hook to fetch notifications with filters
export function useNotifications(filters: NotificationFilters = {}) {
    return useQuery({
        queryKey: ['notifications', filters],
        queryFn: () => getNotifications(filters),
    });
}

// Hook to fetch unread notifications for a user
export function useUnreadNotifications(userId: string, enabled = true) {
    return useQuery({
        queryKey: ['notifications', 'unread', userId],
        queryFn: () => getUnreadNotifications(userId),
        enabled: enabled && !!userId,
        staleTime: 30000, // 30 seconds
        refetchInterval: 60000, // Refetch every minute
    });
}

// Hook to fetch unread count for a user
export function useUnreadCount(userId: string, enabled = true) {
    return useQuery({
        queryKey: ['notifications', 'count', userId],
        queryFn: () => getUnreadCount(userId),
        enabled: enabled && !!userId,
        staleTime: 30000,
        refetchInterval: 60000,
    });
}

// Hook to create a notification
export function useCreateNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notification: NotificationInsert) => createNotification(notification),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

// Hook to mark a notification as read
export function useMarkAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

// Hook to mark all notifications as read
export function useMarkAllAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => markAllAsRead(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

// Hook to delete a notification
export function useDeleteNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}
