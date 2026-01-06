-- Create favorecido_documents table
CREATE TABLE IF NOT EXISTS favorecido_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    favorecido_id UUID NOT NULL REFERENCES favorecidos(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorecido_documents_favorecido_id ON favorecido_documents(favorecido_id);

-- Enable RLS
ALTER TABLE favorecido_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view documents" ON favorecido_documents
    FOR SELECT USING (true);

CREATE POLICY "Users can insert documents" ON favorecido_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete documents" ON favorecido_documents
    FOR DELETE USING (true);

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Anyone can view documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents" ON storage.objects
    FOR DELETE USING (bucket_id = 'documents');
