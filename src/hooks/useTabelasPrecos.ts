import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getProductsWithPrices,
    upsertProductPrice,
} from '@/services/tabelasPrecos';

export function useProductsWithPrices(search?: string) {
    return useQuery({
        queryKey: ['products-with-prices', search],
        queryFn: async () => {
            const data = await getProductsWithPrices();

            // Filter by search if provided
            if (search) {
                const searchLower = search.toLowerCase();
                return data.filter((item) => item.name.toLowerCase().includes(searchLower));
            }

            return data;
        },
    });
}

export function useUpsertProductPrice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, salePrice }: { productId: string; salePrice: number }) => {
            return upsertProductPrice(productId, salePrice);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products-with-prices'] });
        },
    });
}
