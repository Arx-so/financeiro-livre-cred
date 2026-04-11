import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getOccupationalExams,
    getExamById,
    createExam,
    updateExam,
    deleteExam,
    uploadExamDocument,
    getExpiringExams,
    type ExamFilters,
    type ExamWithEmployee,
} from '@/services/hrExames';
import type { OccupationalExamInsert, OccupationalExamUpdate } from '@/types/database';

export const examesKeys = {
    all: ['exames'] as const,
    lists: () => [...examesKeys.all, 'list'] as const,
    list: (filters: ExamFilters) => [...examesKeys.lists(), filters] as const,
    detail: (id: string) => [...examesKeys.all, 'detail', id] as const,
    expiring: (branchId: string, days?: number) => [...examesKeys.all, 'expiring', branchId, days] as const,
};

export function useExames(filters: Omit<ExamFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: ExamFilters = { ...filters, branchId };

    return useQuery({
        queryKey: examesKeys.list(mergedFilters),
        queryFn: () => getOccupationalExams(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useExameById(id: string) {
    return useQuery({
        queryKey: examesKeys.detail(id),
        queryFn: () => getExamById(id),
        enabled: !!id,
    });
}

export function useExpiringExames(days = 30) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const branchId = unidadeAtual?.id ?? '';

    return useQuery({
        queryKey: examesKeys.expiring(branchId, days),
        queryFn: () => getExpiringExams(branchId, days),
        enabled: !!branchId,
    });
}

export function useCreateExame() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: OccupationalExamInsert) => createExam(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: examesKeys.all });
        },
    });
}

export function useUpdateExame() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: OccupationalExamUpdate }) => updateExam(id, data),
        onSuccess: (_result, { id }) => {
            queryClient.invalidateQueries({ queryKey: examesKeys.all });
            queryClient.invalidateQueries({ queryKey: examesKeys.detail(id) });
        },
    });
}

export function useDeleteExame() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteExam(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: examesKeys.all });
        },
    });
}

export function useUploadExameDocument() {
    return useMutation({
        mutationFn: ({ file, branchId, employeeId }: { file: File; branchId: string; employeeId: string }) => (
            uploadExamDocument(file, branchId, employeeId)
        ),
    });
}

export type { ExamWithEmployee };
