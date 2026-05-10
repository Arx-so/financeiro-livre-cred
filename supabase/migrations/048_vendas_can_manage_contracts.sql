-- Allow vendas/vendedor roles to create, edit, and delete contracts on their branch
-- Delete is restricted to contracts they created (created_by = auth.uid())

CREATE POLICY "Vendas can insert branch contracts" ON contracts
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) IN ('vendas', 'vendedor')
        AND user_has_branch_access(auth.uid(), branch_id)
    );

CREATE POLICY "Vendas can update branch contracts" ON contracts
    FOR UPDATE USING (
        get_user_role(auth.uid()) IN ('vendas', 'vendedor')
        AND user_has_branch_access(auth.uid(), branch_id)
    )
    WITH CHECK (
        get_user_role(auth.uid()) IN ('vendas', 'vendedor')
        AND user_has_branch_access(auth.uid(), branch_id)
    );

CREATE POLICY "Vendas can delete own contracts" ON contracts
    FOR DELETE USING (
        get_user_role(auth.uid()) IN ('vendas', 'vendedor')
        AND user_has_branch_access(auth.uid(), branch_id)
        AND created_by = auth.uid()
    );

-- contract_files: vendas/vendedor can manage files only for contracts they created
CREATE POLICY "Vendas can manage own contract files" ON contract_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = contract_files.contract_id
              AND get_user_role(auth.uid()) IN ('vendas', 'vendedor')
              AND user_has_branch_access(auth.uid(), contracts.branch_id)
              AND contracts.created_by = auth.uid()
        )
    );
