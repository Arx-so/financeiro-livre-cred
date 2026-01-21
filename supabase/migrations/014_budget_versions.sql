-- Migration: Budget Versions
-- Adds versioning support for budget planning

-- Create budget versions table
CREATE TABLE IF NOT EXISTS budget_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id uuid REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
    year int NOT NULL,
    version int NOT NULL DEFAULT 1,
    name text NOT NULL,
    status text CHECK (status IN ('rascunho', 'aprovado', 'arquivado')) DEFAULT 'rascunho',
    approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at timestamptz,
    notes text,
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(branch_id, year, version)
);

-- Add version reference to budget_items
ALTER TABLE budget_items
    ADD COLUMN IF NOT EXISTS budget_version_id uuid REFERENCES budget_versions(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budget_versions_branch_year ON budget_versions(branch_id, year);
CREATE INDEX IF NOT EXISTS idx_budget_items_version ON budget_items(budget_version_id);

-- Enable RLS
ALTER TABLE budget_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_versions
CREATE POLICY "Users can view budget versions of their branches"
    ON budget_versions FOR SELECT
    USING (
        branch_id IN (
            SELECT branch_id FROM user_branch_access WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins and managers can manage budget versions"
    ON budget_versions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'gerente')
        )
    );

-- Function to create a new budget version
CREATE OR REPLACE FUNCTION create_budget_version(
    p_branch_id uuid,
    p_year int,
    p_name text,
    p_created_by uuid
)
RETURNS uuid AS $$
DECLARE
    v_next_version int;
    v_version_id uuid;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
    FROM budget_versions
    WHERE branch_id = p_branch_id AND year = p_year;

    -- Create the version
    INSERT INTO budget_versions (branch_id, year, version, name, created_by)
    VALUES (p_branch_id, p_year, v_next_version, p_name, p_created_by)
    RETURNING id INTO v_version_id;

    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to duplicate a budget version
CREATE OR REPLACE FUNCTION duplicate_budget_version(
    p_source_version_id uuid,
    p_new_name text,
    p_created_by uuid
)
RETURNS uuid AS $$
DECLARE
    v_source budget_versions%ROWTYPE;
    v_new_version_id uuid;
    v_next_version int;
BEGIN
    -- Get source version
    SELECT * INTO v_source FROM budget_versions WHERE id = p_source_version_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source version not found';
    END IF;

    -- Get next version number
    SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
    FROM budget_versions
    WHERE branch_id = v_source.branch_id AND year = v_source.year;

    -- Create new version
    INSERT INTO budget_versions (branch_id, year, version, name, created_by)
    VALUES (v_source.branch_id, v_source.year, v_next_version, p_new_name, p_created_by)
    RETURNING id INTO v_new_version_id;

    -- Copy budget items
    INSERT INTO budget_items (branch_id, category_id, year, month, budgeted_amount, budget_version_id)
    SELECT branch_id, category_id, year, month, budgeted_amount, v_new_version_id
    FROM budget_items
    WHERE budget_version_id = p_source_version_id;

    RETURN v_new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_budget_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_budget_versions_updated_at ON budget_versions;
CREATE TRIGGER trigger_budget_versions_updated_at
    BEFORE UPDATE ON budget_versions
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_versions_updated_at();

-- Comments
COMMENT ON TABLE budget_versions IS 'Stores different versions of annual budgets for versioning and approval workflow';
COMMENT ON COLUMN budget_versions.status IS 'Version status: rascunho (draft), aprovado (approved), arquivado (archived)';
