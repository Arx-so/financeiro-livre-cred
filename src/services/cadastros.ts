import { supabase } from '@/lib/supabase';
import type {
    Favorecido,
    FavorecidoInsert,
    FavorecidoUpdate,
    FavorecidoTipo,
    FavorecidoDocument
} from '@/types/database';

export interface FavorecidoFilters {
  branchId?: string;
  type?: FavorecidoTipo;
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface FavorecidosPage {
    data: Favorecido[];
    count: number;
}

// Get all favorecidos with filters
export async function getFavorecidos(filters: FavorecidoFilters = {}): Promise<FavorecidosPage> {
    const { page = 1, pageSize = 24 } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('favorecidos')
        .select('*', { count: 'exact' })
        .order('name')
        .range(from, to);

    if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
    }

    if (filters.type) {
        if (filters.type === 'funcionario') {
            query = query.in('type', ['funcionario', 'ambos']);
        } else if (filters.type === 'cliente') {
            query = query.in('type', ['cliente', 'ambos']);
        } else {
            query = query.eq('type', filters.type);
        }
    }

    if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
    }

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,document.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching favorecidos:', error);
        throw error;
    }

    return { data: data || [], count: count ?? 0 };
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
    const { data } = await getFavorecidos({ type: 'cliente', isActive: true, pageSize: 1000 });
    return data;
}

// Get suppliers only
export async function getFornecedores(): Promise<Favorecido[]> {
    const { data } = await getFavorecidos({ type: 'fornecedor', isActive: true, pageSize: 1000 });
    return data;
}

// Get employees only
export async function getFuncionarios(): Promise<Favorecido[]> {
    const { data } = await getFavorecidos({ type: 'funcionario', isActive: true, pageSize: 1000 });
    return data;
}

// Get sellers (users with role 'vendas')
export async function getVendedores(): Promise<Array<{ id: string; name: string; email: string }>> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'vendas')
        .order('name');

    if (error) {
        console.error('Error fetching vendedores:', error);
        throw error;
    }

    return data || [];
}

// ============ Document Management ============

// Get documents for a favorecido
export async function getFavorecidoDocuments(favorecidoId: string): Promise<FavorecidoDocument[]> {
    const { data, error } = await supabase
        .from('favorecido_documents')
        .select('*')
        .eq('favorecido_id', favorecidoId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching favorecido documents:', error);
        throw error;
    }

    return data || [];
}

// Upload document for favorecido
export async function uploadFavorecidoDocument(
    favorecidoId: string,
    file: File,
    uploadedBy?: string
): Promise<FavorecidoDocument> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${favorecidoId}/${Date.now()}-${file.name}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

    if (uploadError) {
        console.error('Error uploading document:', uploadError);
        throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

    // Create document record
    const { data, error } = await supabase
        .from('favorecido_documents')
        .insert({
            favorecido_id: favorecidoId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_type: file.type || `application/${fileExt}`,
            file_size: file.size,
            uploaded_by: uploadedBy || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating document record:', error);
        // Try to clean up the uploaded file
        await supabase.storage.from('documents').remove([fileName]);
        throw error;
    }

    return data;
}

// Delete document for favorecido
export async function deleteFavorecidoDocument(documentId: string): Promise<void> {
    // First get the document to find the file URL
    const { data: doc, error: fetchError } = await supabase
        .from('favorecido_documents')
        .select('*')
        .eq('id', documentId)
        .single();

    if (fetchError) {
        console.error('Error fetching document:', fetchError);
        throw fetchError;
    }

    // Extract file path from URL and delete from storage
    if (doc?.file_url) {
        const urlParts = doc.file_url.split('/documents/');
        if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage.from('documents').remove([filePath]);
        }
    }

    // Delete document record
    const { error } = await supabase
        .from('favorecido_documents')
        .delete()
        .eq('id', documentId);

    if (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
}

// Get file icon based on file type
export function getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('xls')) return '📊';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📁';
}

// Format file size
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k**i).toFixed(2))} ${sizes[i]}`;
}
