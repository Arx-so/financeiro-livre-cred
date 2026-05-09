-- Allow users with 'vendas' / 'vendedor' roles to soft-delete (update is_active)
-- and edit favorecidos on their own branch

CREATE POLICY "Vendas can update branch favorecidos" ON favorecidos
    FOR UPDATE USING (
        get_user_role(auth.uid()) IN ('vendas', 'vendedor')
        AND user_has_branch_access(auth.uid(), branch_id)
    )
    WITH CHECK (
        get_user_role(auth.uid()) IN ('vendas', 'vendedor')
        AND user_has_branch_access(auth.uid(), branch_id)
    );
