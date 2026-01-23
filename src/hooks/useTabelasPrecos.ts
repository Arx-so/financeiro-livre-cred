import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBranchStore } from '@/stores';
import {
    getProductsWithPrices,
    upsertProductPrice,
} from '@/services/tabelasPrecos';

export function useProductsWithPrices(search?: string) {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    return useQuery({
        queryKey: ['products-with-prices', unidadeAtual?.id, search],
        queryFn: async () => {
            if (!unidadeAtual?.id) return [];
            const data = await getProductsWithPrices(unidadeAtual.id);

            // Filter by search if provided
            if (search) {
                const searchLower = search.toLowerCase();
                return data.filter((item) => item.name.toLowerCase().includes(searchLower));
            }

            return data;
        },
        enabled: !!unidadeAtual?.id,
    });
}

export function useUpsertProductPrice() {
    const queryClient = useQueryClient();
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    return useMutation({
        mutationFn: async ({ productId, salePrice }: { productId: string; salePrice: number }) => {
            if (!unidadeAtual?.id) throw new Error('Filial não selecionada');
            return upsertProductPrice(productId, unidadeAtual.id, salePrice);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products-with-prices'] });
        },
    });
}
