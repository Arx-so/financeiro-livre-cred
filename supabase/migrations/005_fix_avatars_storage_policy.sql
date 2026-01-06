-- ============================================
-- Fix avatars storage bucket policies
-- The original policy required the folder name to match user ID,
-- but we're using favorecido ID as the folder name
-- ============================================

-- Drop existing restrictive policies for avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create new permissive policies for avatars (authenticated users can manage)
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can update avatars" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars');
