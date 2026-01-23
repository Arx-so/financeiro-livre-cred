import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useBranchStore } from '@/stores';
import { useProductsWithPrices, useUpsertProductPrice } from '@/hooks/useTabelasPrecos';

export function useTabelasPrecosPage() {
    const unidadeAtual = useBranchStore((state) => state.unidadeAtual);

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [editingPrice, setEditingPrice] = useState('');

    // Queries
    const { data: products, isLoading: productsLoading } = useProductsWithPrices(searchTerm);

    // Mutations
    const upsertPrice = useUpsertProductPrice();

    // Handlers
    const startEditing = useCallback((productId: string, currentPrice: number | null) => {
        setEditingProductId(productId);
        setEditingPrice(currentPrice?.toString() || '0');
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingProductId(null);
        setEditingPrice('');
    }, []);

    const savePrice = useCallback(async (productId: string) => {
        const price = parseFloat(editingPrice) || 0;

        try {
            await upsertPrice.mutateAsync({ productId, salePrice: price });
            toast.success('Preço atualizado com sucesso!');
            cancelEditing();
        } catch (error) {
            toast.error('Erro ao atualizar preço');
        }
    }, [editingPrice, upsertPrice, cancelEditing]);

    const handlePriceKeyDown = useCallback((e: React.KeyboardEvent, productId: string) => {
        if (e.key === 'Enter') {
            savePrice(productId);
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    }, [savePrice, cancelEditing]);

    return {
        // Branch
        unidadeAtual,

        // State
        searchTerm,
        setSearchTerm,
        editingProductId,
        editingPrice,
        setEditingPrice,

        // Data
        products: products || [],
        productsLoading,

        // Flags
        isSaving: upsertPrice.isPending,

        // Handlers
        startEditing,
        cancelEditing,
        savePrice,
        handlePriceKeyDown,
    };
}
