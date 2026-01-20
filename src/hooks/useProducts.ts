import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    getProductsSummary,
    ProductFilters,
} from '@/services/products';
import type { ProductInsert, ProductUpdate } from '@/types/database';

const QUERY_KEY = 'products';

/**
 * Hook para buscar todos os produtos
 */
export function useProducts(filters: ProductFilters = {}) {
    return useQuery({
        queryKey: [QUERY_KEY, filters],
        queryFn: () => getProducts(filters),
    });
}

/**
 * Hook para buscar um produto pelo ID
 */
export function useProduct(id: string | undefined) {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: () => getProduct(id!),
        enabled: !!id,
    });
}

/**
 * Hook para buscar o resumo de produtos
 */
export function useProductsSummary() {
    return useQuery({
        queryKey: [QUERY_KEY, 'summary'],
        queryFn: getProductsSummary,
    });
}

/**
 * Hook para criar um produto
 */
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (product: ProductInsert) => createProduct(product),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

/**
 * Hook para atualizar um produto
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) => updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

/**
 * Hook para deletar um produto
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

/**
 * Hook para alternar status ativo/inativo
 */
export function useToggleProductActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleProductActive(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}
