import { supabase } from '@/lib/supabase';

export type BucketName = 'avatars' | 'documents' | 'contracts' | 'imports';

// Upload file to storage
export async function uploadFile(
  bucket: BucketName,
  path: string,
  file: File,
  options?: { upsert?: boolean }
): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? false,
    });

  if (error) {
    console.error(`Error uploading file to ${bucket}:`, error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

// Download file from storage
export async function downloadFile(
  bucket: BucketName,
  path: string
): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) {
    console.error(`Error downloading file from ${bucket}:`, error);
    throw error;
  }

  return data;
}

// Get public URL for file
export function getPublicUrl(bucket: BucketName, path: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

// Get signed URL for private file
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error(`Error creating signed URL for ${bucket}:`, error);
    throw error;
  }

  return data.signedUrl;
}

// Delete file from storage
export async function deleteFile(bucket: BucketName, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error(`Error deleting file from ${bucket}:`, error);
    throw error;
  }
}

// Delete multiple files from storage
export async function deleteFiles(bucket: BucketName, paths: string[]): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths);

  if (error) {
    console.error(`Error deleting files from ${bucket}:`, error);
    throw error;
  }
}

// List files in a folder
export async function listFiles(
  bucket: BucketName,
  folder: string
): Promise<{ name: string; size: number; createdAt: string }[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder);

  if (error) {
    console.error(`Error listing files in ${bucket}/${folder}:`, error);
    throw error;
  }

  return (data || []).map(file => ({
    name: file.name,
    size: file.metadata?.size || 0,
    createdAt: file.created_at,
  }));
}

// Upload user avatar
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;
  
  return uploadFile('avatars', fileName, file, { upsert: true });
}

// Upload document
export async function uploadDocument(
  folder: string,
  file: File,
  customName?: string
): Promise<string> {
  const fileName = customName || `${Date.now()}-${file.name}`;
  const path = `${folder}/${fileName}`;
  
  return uploadFile('documents', path, file);
}

// Upload import file
export async function uploadImportFile(file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  
  return uploadFile('imports', fileName, file);
}

// Clean up old import files (older than 24 hours)
export async function cleanupOldImports(): Promise<number> {
  const { data, error } = await supabase.storage
    .from('imports')
    .list();

  if (error) {
    console.error('Error listing import files:', error);
    return 0;
  }

  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  const oldFiles = (data || []).filter(file => {
    const createdAt = new Date(file.created_at).getTime();
    return now - createdAt > dayInMs;
  });

  if (oldFiles.length > 0) {
    const paths = oldFiles.map(f => f.name);
    await deleteFiles('imports', paths);
  }

  return oldFiles.length;
}
