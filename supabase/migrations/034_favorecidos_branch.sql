-- Add branch_id column
ALTER TABLE favorecidos
    ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- Index for query performance
CREATE INDEX IF NOT EXISTS idx_favorecidos_branch_id ON favorecidos(branch_id);

-- Drop old permissive policies
DROP POLICY IF EXISTS "All users can view favorecidos" ON favorecidos;
DROP POLICY IF EXISTS "Admins and gerentes can manage favorecidos" ON favorecidos;

-- New branch-scoped policies (following financial_entries pattern)
CREATE POLICY "Users can view branch favorecidos" ON favorecidos
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'admin'
        OR user_has_branch_access(auth.uid(), branch_id)
    );

CREATE POLICY "Admins can manage all favorecidos" ON favorecidos
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage branch favorecidos" ON favorecidos
    FOR ALL USING (
        get_user_role(auth.uid()) = 'gerente'
        AND user_has_branch_access(auth.uid(), branch_id)
    );
