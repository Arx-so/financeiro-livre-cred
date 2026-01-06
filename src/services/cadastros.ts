import { supabase } from '@/lib/supabase';
import type { 
  Favorecido, 
  FavorecidoInsert, 
  FavorecidoUpdate,
  FavorecidoTipo 
} from '@/types/database';

export interface FavorecidoFilters {
  type?: FavorecidoTipo;
  search?: string;
  isActive?: boolean;
}

// Get all favorecidos with filters
export async function getFavorecidos(filters: FavorecidoFilters = {}): Promise<Favorecido[]> {
  let query = supabase
    .from('favorecidos')
    .select('*')
    .order('name');

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,document.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching favorecidos:', error);
    throw error;
  }

  return data || [];
}

// Get single favorecido
export async function getFavorecido(id: string): Promise<Favorecido | null> {
  const { data, error } = await supabase
    .from('favorecidos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching favorecido:', error);
    throw error;
  }

  return data;
}

// Create favorecido
export async function createFavorecido(favorecido: FavorecidoInsert): Promise<Favorecido> {
  const { data, error } = await supabase
    .from('favorecidos')
    .insert(favorecido)
    .select()
    .single();

  if (error) {
    console.error('Error creating favorecido:', error);
    throw error;
  }

  return data;
}

// Update favorecido
export async function updateFavorecido(id: string, favorecido: FavorecidoUpdate): Promise<Favorecido> {
  const { data, error } = await supabase
    .from('favorecidos')
    .update(favorecido)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating favorecido:', error);
    throw error;
  }

  return data;
}

// Delete favorecido (soft delete)
export async function deleteFavorecido(id: string): Promise<void> {
  const { error } = await supabase
    .from('favorecidos')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('Error deleting favorecido:', error);
    throw error;
  }
}

// Hard delete favorecido
export async function hardDeleteFavorecido(id: string): Promise<void> {
  const { error } = await supabase
    .from('favorecidos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error hard deleting favorecido:', error);
    throw error;
  }
}

// Upload photo for favorecido
export async function uploadFavorecidoPhoto(favorecidoId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${favorecidoId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
    throw uploadError;
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update favorecido with photo URL
  await updateFavorecido(favorecidoId, {
    photo_url: urlData.publicUrl,
  });

  return urlData.publicUrl;
}

// Delete photo for favorecido
export async function deleteFavorecidoPhoto(favorecidoId: string, photoUrl: string): Promise<void> {
  // Extract file path from URL
  const urlParts = photoUrl.split('/avatars/');
  if (urlParts.length > 1) {
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting photo:', error);
    }
  }

  // Remove photo URL from favorecido
  await updateFavorecido(favorecidoId, {
    photo_url: null,
  });
}

// Get clients only
export async function getClientes(): Promise<Favorecido[]> {
  return getFavorecidos({ type: 'cliente', isActive: true });
}

// Get suppliers only
export async function getFornecedores(): Promise<Favorecido[]> {
  return getFavorecidos({ type: 'fornecedor', isActive: true });
}

// Get employees only
export async function getFuncionarios(): Promise<Favorecido[]> {
  return getFavorecidos({ type: 'funcionario', isActive: true });
}

// Get sellers (employees who are salespeople)
export async function getVendedores(): Promise<Favorecido[]> {
  const { data, error } = await supabase
    .from('favorecidos')
    .select('*')
    .eq('type', 'funcionario')
    .eq('is_active', true)
    .eq('category', 'Vendedor')
    .order('name');

  if (error) {
    console.error('Error fetching vendedores:', error);
    throw error;
  }

  return data || [];
}
