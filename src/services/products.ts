import { supabase } from '@/lib/supabase';
import type { Product, ProductInsert, ProductUpdate } from '@/types/database';

export interface ProductWithCategory extends Product {
    category?: { id: string; name: string; color: string } | null;
}

export interface ProductFilters {
    search?: string;
    categoryId?: string;
    isActive?: boolean;
}

/**
 * Busca todos os produtos com filtros opcionais
 */
export async function getProducts(filters: ProductFilters = {}): Promise<ProductWithCategory[]> {
    let query = supabase
        .from('products')
        .select(`
            *,
            category:categories(id, name, color)
        `)
        .order('name', { ascending: true });

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
    }

    if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching products:', error);
        throw error;
    }

    return data || [];
}

/**
 * Busca um produto pelo ID
 */
export async function getProduct(id: string): Promise<ProductWithCategory | null> {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            category:categories(id, name, color)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        throw error;
    }

    return data;
}

/**
 * Cria um novo produto
 */
export async function createProduct(product: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

    if (error) {
        console.error('Error creating product:', error);
        throw error;
    }

    return data;
}

/**
 * Atualiza um produto existente
 */
export async function updateProduct(id: string, product: ProductUpdate): Promise<Product> {
    const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating product:', error);
        throw error;
    }

    return data;
}

/**
 * Deleta um produto
 */
export async function deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
}

/**
 * Alterna o status ativo/inativo de um produto
 */
export async function toggleProductActive(id: string, isActive: boolean): Promise<Product> {
    return updateProduct(id, { is_active: isActive });
}

/**
 * Obtém o resumo de produtos
 */
export async function getProductsSummary(): Promise<{
    total: number;
    active: number;
    inactive: number;
}> {
    const { data, error } = await supabase
        .from('products')
        .select('is_active');

    if (error) {
        console.error('Error fetching products summary:', error);
        throw error;
    }

    const products = data || [];
    return {
        total: products.length,
        active: products.filter((p) => p.is_active).length,
        inactive: products.filter((p) => !p.is_active).length,
    };
}
