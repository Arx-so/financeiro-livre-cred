-- ============================================
-- Migration 008: Activity Logs for audit trail
-- ============================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'favorecido', 'contract', 'financial_entry', 'user'
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'payment', 'signed', etc
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT, -- Store user name for historical reference
    details JSONB, -- Additional details about the action
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view logs for accessible entities" ON activity_logs
    FOR SELECT USING (
        get_user_role(auth.uid()) IN ('admin', 'gerente') OR
        user_id = auth.uid()
    );

CREATE POLICY "Authenticated users can insert logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON TABLE activity_logs IS 'Audit trail for tracking all actions in the system';
COMMENT ON COLUMN activity_logs.entity_type IS 'Type of entity: favorecido, contract, financial_entry, user';
COMMENT ON COLUMN activity_logs.entity_id IS 'ID of the related entity';
COMMENT ON COLUMN activity_logs.action IS 'Action performed: created, updated, deleted, payment, signed, etc';
COMMENT ON COLUMN activity_logs.details IS 'JSON with additional details about the action';
