import { supabase } from '@/lib/supabase';
import type { ProductPrice, ProductPriceInsert, ProductPriceUpdate } from '@/types/database';

export interface ProductPriceWithProduct extends ProductPrice {
    product?: {
        id: string;
        name: string;
        description: string | null;
        is_active: boolean;
    } | null;
}

export interface ProductPriceFilters {
    branchId?: string;
    search?: string;
}

/**
 * Busca todos os preços de produtos com filtros opcionais
 */
export async function getProductPrices(filters: ProductPriceFilters = {}): Promise<ProductPriceWithProduct[]> {
    let query = supabase
        .from('product_prices')
        .select(`
            *,
            product:products(id, name, description, is_active)
        `)
        .order('created_at', { ascending: false });

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching product prices:', error);
        throw error;
    }

    let result = data || [];

    // Filter by search term if provided
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter((item) => item.product?.name?.toLowerCase().includes(searchLower));
    }

    return result;
}

/**
 * Busca todos os produtos com seus preços para uma filial
 */
export async function getProductsWithPrices(branchId: string): Promise<Array<{
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    sale_price: number | null;
    price_id: string | null;
}>> {
    // Get all products
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name');

    if (productsError) {
        console.error('Error fetching products:', productsError);
        throw productsError;
    }

    // Get prices for this branch
    const { data: prices, error: pricesError } = await supabase
        .from('product_prices')
        .select('id, product_id, sale_price')
        .eq('branch_id', branchId);

    if (pricesError) {
        console.error('Error fetching prices:', pricesError);
        throw pricesError;
    }

    // Merge products with their prices
    const priceMap = new Map(prices?.map((p) => [p.product_id, { id: p.id, sale_price: p.sale_price }]) || []);

    return (products || []).map((product) => {
        const priceInfo = priceMap.get(product.id);
        return {
            ...product,
            sale_price: priceInfo?.sale_price ?? null,
            price_id: priceInfo?.id ?? null,
        };
    });
}

/**
 * Cria ou atualiza um preço de produto (upsert)
 */
export async function upsertProductPrice(
    productId: string,
    branchId: string,
    salePrice: number,
): Promise<ProductPrice> {
    const { data, error } = await supabase
        .from('product_prices')
        .upsert(
            {
                product_id: productId,
                branch_id: branchId,
                sale_price: salePrice,
            },
            {
                onConflict: 'product_id,branch_id',
            },
        )
        .select()
        .single();

    if (error) {
        console.error('Error upserting product price:', error);
        throw error;
    }

    return data;
}

/**
 * Atualiza um preço de produto
 */
export async function updateProductPrice(id: string, data: ProductPriceUpdate): Promise<ProductPrice> {
    const { data: result, error } = await supabase
        .from('product_prices')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating product price:', error);
        throw error;
    }

    return result;
}

/**
 * Remove um preço de produto
 */
export async function deleteProductPrice(id: string): Promise<void> {
    const { error } = await supabase
        .from('product_prices')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting product price:', error);
        throw error;
    }
}
