-- Restrict vendas/vendedor contract deletion to their own contracts (created_by = auth.uid())
-- Migration 048 granted DELETE on any branch contract — this tightens that rule

DROP POLICY IF EXISTS "Vendas can delete branch contracts" ON contracts;
DROP POLICY IF EXISTS "Vendas can manage branch contract files" ON contract_files;

CREATE POLICY "Vendas can delete own contracts" ON contracts
    FOR DELETE USING (
        get_user_role(auth.uid()) IN ('vendas', 'vendedor')
        AND user_has_branch_access(auth.uid(), branch_id)
        AND created_by = auth.uid()
    );

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
