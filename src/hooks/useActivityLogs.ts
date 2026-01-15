import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getActivityLogs,
    getEntityLogs,
    createActivityLog,
    logAction,
    type ActivityLogFilters
} from '@/services/activityLogs';
import type { ActivityLogInsert } from '@/types/database';

// Hook to fetch activity logs with filters
export function useActivityLogs(filters: ActivityLogFilters = {}) {
    return useQuery({
        queryKey: ['activity-logs', filters],
        queryFn: () => getActivityLogs(filters),
        staleTime: 30000, // 30 seconds
    });
}

// Hook to fetch logs for a specific entity
export function useEntityLogs(entityType: string, entityId: string, enabled = true) {
    return useQuery({
        queryKey: ['activity-logs', 'entity', entityType, entityId],
        queryFn: () => getEntityLogs(entityType, entityId),
        enabled: enabled && !!entityId,
        staleTime: 30000,
    });
}

// Hook to create an activity log
export function useCreateActivityLog() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (log: ActivityLogInsert) => createActivityLog(log),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

// Hook to log an action (non-blocking)
export function useLogAction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            entityType,
            entityId,
            action,
            userId,
            userName,
            details
        }: {
      entityType: string;
      entityId: string;
      action: string;
      userId?: string | null;
      userName?: string | null;
      details?: Record<string, unknown>;
    }) => logAction(entityType, entityId, action, userId, userName, details),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}
