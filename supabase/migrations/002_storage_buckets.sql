-- ============================================
-- FINCONTROL - Storage Buckets Configuration
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    TRUE,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Documents bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    FALSE,
    52428800, -- 50MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
) ON CONFLICT (id) DO NOTHING;

-- Contracts bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'contracts',
    'contracts',
    FALSE,
    52428800, -- 50MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Imports bucket (private, temporary)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'imports',
    'imports',
    FALSE,
    52428800, -- 50MB
    ARRAY['text/csv', 'application/vnd.ms-excel', 
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/xml', 'application/xml']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES: AVATARS (public read, authenticated write)
-- ============================================

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- STORAGE POLICIES: DOCUMENTS (authenticated only)
-- ============================================

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins and gerentes can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents'
    AND get_user_role(auth.uid()) IN ('admin', 'gerente')
);

CREATE POLICY "Admins and gerentes can update documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'documents'
    AND get_user_role(auth.uid()) IN ('admin', 'gerente')
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents'
    AND get_user_role(auth.uid()) = 'admin'
);

-- ============================================
-- STORAGE POLICIES: CONTRACTS (authenticated only)
-- ============================================

CREATE POLICY "Authenticated users can view contracts"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'contracts'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins and gerentes can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'contracts'
    AND get_user_role(auth.uid()) IN ('admin', 'gerente')
);

CREATE POLICY "Admins and gerentes can update contracts"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'contracts'
    AND get_user_role(auth.uid()) IN ('admin', 'gerente')
);

CREATE POLICY "Admins can delete contracts"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'contracts'
    AND get_user_role(auth.uid()) = 'admin'
);

-- ============================================
-- STORAGE POLICIES: IMPORTS (authenticated only)
-- ============================================

CREATE POLICY "Authenticated users can view imports"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'imports'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Admins and gerentes can upload imports"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'imports'
    AND get_user_role(auth.uid()) IN ('admin', 'gerente')
);

CREATE POLICY "Admins and gerentes can manage imports"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'imports'
    AND get_user_role(auth.uid()) IN ('admin', 'gerente')
);
