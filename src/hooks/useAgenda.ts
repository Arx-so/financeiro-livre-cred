import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAgendaEvents,
    getMonthEvents,
    getTodayEvents,
    getUpcomingEvents,
    getBirthdays,
    createAgendaEvent,
    updateAgendaEvent,
    deleteAgendaEvent,
    type AgendaFilters
} from '@/services/agenda';
import type { AgendaEventInsert, AgendaEventUpdate } from '@/types/database';

// Hook to fetch agenda events with filters
export function useAgendaEvents(filters: AgendaFilters = {}) {
    return useQuery({
        queryKey: ['agenda-events', filters],
        queryFn: () => getAgendaEvents(filters),
    });
}

// Hook to fetch events for a specific month
export function useMonthEvents(year: number, month: number, branchId?: string) {
    return useQuery({
        queryKey: ['agenda-events', 'month', year, month, branchId],
        queryFn: () => getMonthEvents(year, month, branchId),
    });
}

// Hook to fetch today's events
export function useTodayEvents(branchId?: string) {
    return useQuery({
        queryKey: ['agenda-events', 'today', branchId],
        queryFn: () => getTodayEvents(branchId),
        staleTime: 60000, // 1 minute
    });
}

// Hook to fetch upcoming events (next 7 days)
export function useUpcomingEvents(branchId?: string) {
    return useQuery({
        queryKey: ['agenda-events', 'upcoming', branchId],
        queryFn: () => getUpcomingEvents(branchId),
        staleTime: 60000,
    });
}

// Hook to fetch birthdays for a month
export function useBirthdays(month: number) {
    return useQuery({
        queryKey: ['birthdays', month],
        queryFn: () => getBirthdays(month),
    });
}

// Hook to create an agenda event
export function useCreateAgendaEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (event: AgendaEventInsert) => createAgendaEvent(event),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda-events'] });
        },
    });
}

// Hook to update an agenda event
export function useUpdateAgendaEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, event }: { id: string; event: AgendaEventUpdate }) => updateAgendaEvent(id, event),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda-events'] });
        },
    });
}

// Hook to delete an agenda event
export function useDeleteAgendaEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteAgendaEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda-events'] });
        },
    });
}
