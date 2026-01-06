import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  getCategoriesWithSubcategories,
  getCategoriesByType,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  createSubcategories,
  updateSubcategory,
  deleteSubcategory,
} from '@/services/categorias';
import type { CategoryInsert, CategoryUpdate, SubcategoryInsert, SubcategoryUpdate, EntryType } from '@/types/database';

// Query keys
export const categoriasKeys = {
  all: ['categories'] as const,
  lists: () => [...categoriasKeys.all, 'list'] as const,
  listWithSubs: () => [...categoriasKeys.all, 'list-with-subs'] as const,
  listByType: (type: EntryType | 'ambos') => [...categoriasKeys.all, 'list-by-type', type] as const,
  details: () => [...categoriasKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoriasKeys.details(), id] as const,
  subcategories: (categoryId: string) => [...categoriasKeys.all, 'subcategories', categoryId] as const,
};

// Hooks
export function useCategories() {
  return useQuery({
    queryKey: categoriasKeys.lists(),
    queryFn: getCategories,
  });
}

export function useCategoriesWithSubcategories() {
  return useQuery({
    queryKey: categoriasKeys.listWithSubs(),
    queryFn: getCategoriesWithSubcategories,
  });
}

export function useCategoriesByType(type: EntryType | 'ambos') {
  return useQuery({
    queryKey: categoriasKeys.listByType(type),
    queryFn: () => getCategoriesByType(type),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoriasKeys.detail(id),
    queryFn: () => getCategory(id),
    enabled: !!id,
  });
}

export function useSubcategories(categoryId: string) {
  return useQuery({
    queryKey: categoriasKeys.subcategories(categoryId),
    queryFn: () => getSubcategories(categoryId),
    enabled: !!categoryId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: CategoryInsert) => createCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, category }: { id: string; category: CategoryUpdate }) =>
      updateCategory(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all });
    },
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subcategory: SubcategoryInsert) => createSubcategory(subcategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all });
    },
  });
}

export function useCreateSubcategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, names }: { categoryId: string; names: string[] }) =>
      createSubcategories(categoryId, names),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all });
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, subcategory }: { id: string; subcategory: SubcategoryUpdate }) =>
      updateSubcategory(id, subcategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all });
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSubcategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasKeys.all });
    },
  });
}
