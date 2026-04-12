import { useQuery } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import { getSalesReport, type SalesReportFilters } from '@/services/salesReport';

export const salesReportKeys = {
    all: ['sales-report'] as const,
    report: (filters: SalesReportFilters) => [...salesReportKeys.all, filters] as const,
};

export interface UseSalesReportOptions {
    dateFrom: string;
    dateTo: string;
    terminals?: string[];
    sellerIds?: string[];
}

export function useSalesReport(options: UseSalesReportOptions) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? '' : (unidadeAtual?.id ?? '');

    const filters: SalesReportFilters = {
        branchId,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        terminals: options.terminals,
        sellerIds: options.sellerIds,
    };

    return useQuery({
        queryKey: salesReportKeys.report(filters),
        queryFn: () => getSalesReport(filters),
        enabled: (!!unidadeAtual?.id || isAdm) && !!options.dateFrom && !!options.dateTo,
        staleTime: 30000,
    });
}
