import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getFavorecidos,
    getFavorecido,
    createFavorecido,
    updateFavorecido,
    deleteFavorecido,
    uploadFavorecidoPhoto,
    deleteFavorecidoPhoto,
    getVendedores,
    getFavorecidoDocuments,
    uploadFavorecidoDocument,
    deleteFavorecidoDocument,
    FavorecidoFilters,
} from '@/services/cadastros';
import type { FavorecidoInsert, FavorecidoUpdate } from '@/types/database';
import { useBranchStore } from '@/stores';

// Query keys
export const cadastrosKeys = {
    all: ['favorecidos'] as const,
    lists: () => [...cadastrosKeys.all, 'list'] as const,
    list: (filters: FavorecidoFilters) => [...cadastrosKeys.lists(), filters] as const,
    details: () => [...cadastrosKeys.all, 'detail'] as const,
    detail: (id: string) => [...cadastrosKeys.details(), id] as const,
    clientes: () => [...cadastrosKeys.all, 'clientes'] as const,
    fornecedores: () => [...cadastrosKeys.all, 'fornecedores'] as const,
    funcionarios: () => [...cadastrosKeys.all, 'funcionarios'] as const,
    vendedores: () => [...cadastrosKeys.all, 'vendedores'] as const,
    documents: (favorecidoId: string) => [...cadastrosKeys.all, 'documents', favorecidoId] as const,
};

// Hooks
export function useFavorecidos(filters: FavorecidoFilters = {}) {
    return useQuery({
        queryKey: cadastrosKeys.list(filters),
        queryFn: () => getFavorecidos(filters),
    });
}

export function useFavorecido(id: string) {
    return useQuery({
        queryKey: cadastrosKeys.detail(id),
        queryFn: () => getFavorecido(id),
        enabled: !!id,
    });
}

export function useClientes() {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id);
    return useQuery({
        queryKey: cadastrosKeys.clientes(),
        queryFn: () => getFavorecidos({ branchId, type: 'cliente', isActive: true }),
    });
}

export function useFornecedores() {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id);
    return useQuery({
        queryKey: cadastrosKeys.fornecedores(),
        queryFn: () => getFavorecidos({ branchId, type: 'fornecedor', isActive: true }),
    });
}

export function useFuncionarios() {
    const branchId = useBranchStore((state) => state.unidadeAtual?.id);
    return useQuery({
        queryKey: cadastrosKeys.funcionarios(),
        queryFn: () => getFavorecidos({ branchId, type: 'funcionario', isActive: true }),
    });
}

export function useVendedores() {
    return useQuery({
        queryKey: cadastrosKeys.vendedores(),
        queryFn: getVendedores,
    });
}

export function useCreateFavorecido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (favorecido: FavorecidoInsert) => createFavorecido(favorecido),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cadastrosKeys.all });
        },
    });
}

export function useUpdateFavorecido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, favorecido }: { id: string; favorecido: FavorecidoUpdate }) => updateFavorecido(id, favorecido),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: cadastrosKeys.all });
        },
    });
}

export function useDeleteFavorecido() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteFavorecido(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cadastrosKeys.all });
        },
    });
}

export function useUploadFavorecidoPhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ favorecidoId, file }: { favorecidoId: string; file: File }) => uploadFavorecidoPhoto(favorecidoId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cadastrosKeys.all });
        },
    });
}

export function useDeleteFavorecidoPhoto() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ favorecidoId, photoUrl }: { favorecidoId: string; photoUrl: string }) => deleteFavorecidoPhoto(favorecidoId, photoUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cadastrosKeys.all });
        },
    });
}

// Document hooks
export function useFavorecidoDocuments(favorecidoId: string) {
    return useQuery({
        queryKey: cadastrosKeys.documents(favorecidoId),
        queryFn: () => getFavorecidoDocuments(favorecidoId),
        enabled: !!favorecidoId,
    });
}

export function useUploadFavorecidoDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ favorecidoId, file, uploadedBy }: { favorecidoId: string; file: File; uploadedBy?: string }) => uploadFavorecidoDocument(favorecidoId, file, uploadedBy),
        onSuccess: (_, { favorecidoId }) => {
            queryClient.invalidateQueries({ queryKey: cadastrosKeys.documents(favorecidoId) });
        },
    });
}

export function useDeleteFavorecidoDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (documentId: string) => deleteFavorecidoDocument(documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cadastrosKeys.all });
        },
    });
}
