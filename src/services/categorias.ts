import { supabase } from '@/lib/supabase';
import type {
    Category,
    CategoryInsert,
    CategoryUpdate,
    Subcategory,
    SubcategoryInsert,
    SubcategoryUpdate,
    EntryType
} from '@/types/database';

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }

    return data || [];
}

// Get categories with subcategories
export async function getCategoriesWithSubcategories(): Promise<CategoryWithSubcategories[]> {
    const { data, error } = await supabase
        .from('categories')
        .select(`
      *,
      subcategories(*)
    `)
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching categories with subcategories:', error);
        throw error;
    }

    return (data || []).map((cat) => ({
        ...cat,
        subcategories: (cat.subcategories || []).filter((sub: Subcategory) => sub.is_active),
    }));
}

// Get categories by type
export async function getCategoriesByType(type: EntryType | 'ambos'): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .or(`type.eq.${type},type.eq.ambos`)
        .order('name');

    if (error) {
        console.error('Error fetching categories by type:', error);
        throw error;
    }

    return data || [];
}

// Get single category
export async function getCategory(id: string): Promise<CategoryWithSubcategories | null> {
    const { data, error } = await supabase
        .from('categories')
        .select(`
      *,
      subcategories(*)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching category:', error);
        throw error;
    }

    return data ? {
        ...data,
        subcategories: (data.subcategories || []).filter((sub: Subcategory) => sub.is_active),
    } : null;
}

// Create category
export async function createCategory(category: CategoryInsert): Promise<Category> {
    const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();

    if (error) {
        console.error('Error creating category:', error);
        throw error;
    }

    return data;
}

// Update category
export async function updateCategory(id: string, category: CategoryUpdate): Promise<Category> {
    const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating category:', error);
        throw error;
    }

    return data;
}

// Delete category (soft delete)
export async function deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
}

// Get subcategories for a category
export async function getSubcategories(categoryId: string): Promise<Subcategory[]> {
    const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error fetching subcategories:', error);
        throw error;
    }

    return data || [];
}

// Create subcategory
export async function createSubcategory(subcategory: SubcategoryInsert): Promise<Subcategory> {
    const { data, error } = await supabase
        .from('subcategories')
        .insert(subcategory)
        .select()
        .single();

    if (error) {
        console.error('Error creating subcategory:', error);
        throw error;
    }

    return data;
}

// Create multiple subcategories
export async function createSubcategories(categoryId: string, names: string[]): Promise<Subcategory[]> {
    const subcategories = names.map((name) => ({
        category_id: categoryId,
        name: name.trim(),
    }));

    const { data, error } = await supabase
        .from('subcategories')
        .insert(subcategories)
        .select();

    if (error) {
        console.error('Error creating subcategories:', error);
        throw error;
    }

    return data || [];
}

// Update subcategory
export async function updateSubcategory(id: string, subcategory: SubcategoryUpdate): Promise<Subcategory> {
    const { data, error } = await supabase
        .from('subcategories')
        .update(subcategory)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating subcategory:', error);
        throw error;
    }

    return data;
}

// Delete subcategory (soft delete)
export async function deleteSubcategory(id: string): Promise<void> {
    const { error } = await supabase
        .from('subcategories')
        .update({ is_active: false })
        .eq('id', id);

    if (error) {
        console.error('Error deleting subcategory:', error);
        throw error;
    }
}
