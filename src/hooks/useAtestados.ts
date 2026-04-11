import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getMedicalCertificates,
    createMedicalCertificate,
    getCertificateReport,
    type CertificateFilters,
    type CertificateWithEmployee,
    type CertificateReportRow,
} from '@/services/hrAtestados';
import type { MedicalCertificateInsert } from '@/types/database';

export const atestadosKeys = {
    all: ['medical-certificates'] as const,
    lists: () => [...atestadosKeys.all, 'list'] as const,
    list: (filters: CertificateFilters) => [...atestadosKeys.lists(), filters] as const,
    report: (filters: CertificateFilters) => [...atestadosKeys.all, 'report', filters] as const,
};

export function useAtestados(filters: Omit<CertificateFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: CertificateFilters = { ...filters, branchId };

    return useQuery({
        queryKey: atestadosKeys.list(mergedFilters),
        queryFn: () => getMedicalCertificates(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useAtestadosReport(filters: Omit<CertificateFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: CertificateFilters = { ...filters, branchId };

    return useQuery({
        queryKey: atestadosKeys.report(mergedFilters),
        queryFn: () => getCertificateReport(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useCreateAtestado() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: MedicalCertificateInsert) => createMedicalCertificate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: atestadosKeys.all });
        },
    });
}

export type { CertificateWithEmployee, CertificateReportRow };
