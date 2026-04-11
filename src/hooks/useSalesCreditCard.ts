import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useBranchStore } from '@/stores';
import {
    getCreditCardSales,
    getCreditCardSaleById,
    createCreditCardSale,
    updateCreditCardSaleStatus,
    uploadSaleDocument,
    getCreditCardSalesReport,
    generateFinancialEntriesFromCreditCardSale,
    type CreditCardSaleFilters,
    type SalesCreditCardWithRelations,
    type SalesReportSummary,
} from '@/services/salesCreditCard';
import type { SalesCreditCardInsert } from '@/types/database';

export const creditCardSalesKeys = {
    all: ['sales-credit-card'] as const,
    lists: () => [...creditCardSalesKeys.all, 'list'] as const,
    list: (filters: CreditCardSaleFilters) => [...creditCardSalesKeys.lists(), filters] as const,
    detail: (id: string) => [...creditCardSalesKeys.all, 'detail', id] as const,
    report: (filters: CreditCardSaleFilters) => [...creditCardSalesKeys.all, 'report', filters] as const,
};

export function useCreditCardSales(filters: Omit<CreditCardSaleFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: CreditCardSaleFilters = { ...filters, branchId };

    return useQuery({
        queryKey: creditCardSalesKeys.list(mergedFilters),
        queryFn: () => getCreditCardSales(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useCreditCardSaleById(id: string) {
    return useQuery({
        queryKey: creditCardSalesKeys.detail(id),
        queryFn: () => getCreditCardSaleById(id),
        enabled: !!id,
    });
}

export function useCreditCardSalesReport(filters: Omit<CreditCardSaleFilters, 'branchId'> = {}) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);
    const isAdm = unidadeAtual?.code === 'ADM';
    const branchId = isAdm ? undefined : unidadeAtual?.id;

    const mergedFilters: CreditCardSaleFilters = { ...filters, branchId };

    return useQuery({
        queryKey: creditCardSalesKeys.report(mergedFilters),
        queryFn: () => getCreditCardSalesReport(mergedFilters),
        enabled: !!unidadeAtual?.id || isAdm,
    });
}

export function useCreateCreditCardSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SalesCreditCardInsert) => createCreditCardSale(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: creditCardSalesKeys.all });
        },
    });
}

export function useUpdateCreditCardSaleStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, paymentDate }: { id: string; status: string; paymentDate?: string }) => (
            updateCreditCardSaleStatus(id, {
                status: status as 'pendente' | 'pago' | 'cancelado',
                payment_date: paymentDate,
            })
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: creditCardSalesKeys.all });
        },
    });
}

export function useUploadSaleDocument() {
    return useMutation({
        mutationFn: ({ file, branchId, saleId }: { file: File; branchId: string; saleId: string }) => (
            uploadSaleDocument(file, branchId, saleId)
        ),
    });
}

export function useGenerateCreditCardSaleEntries() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sale: SalesCreditCardWithRelations) => generateFinancialEntriesFromCreditCardSale(sale),
        onSuccess: (count) => {
            toast.success(`${count} lançamentos financeiros criados!`);
            queryClient.invalidateQueries({ queryKey: ['financial-entries'] });
            queryClient.invalidateQueries({ queryKey: creditCardSalesKeys.all });
        },
        onError: () => toast.error('Erro ao gerar lançamentos financeiros'),
    });
}

export type { SalesCreditCardWithRelations, SalesReportSummary };
