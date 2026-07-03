-- Allow 'assistente' role to create sales (contracts) on their branch,
-- edit only the contracts they created, and register clients inline.
-- Mirrors the frontend permission matrix: contratos { create: true, edit: 'own', delete: false }.

CREATE POLICY "Assistentes can insert branch contracts" ON contracts
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'assistente'
        AND user_has_branch_access(auth.uid(), branch_id)
    );

CREATE POLICY "Assistentes can update own contracts" ON contracts
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'assistente'
        AND user_has_branch_access(auth.uid(), branch_id)
        AND created_by = auth.uid()
    )
    WITH CHECK (
        get_user_role(auth.uid()) = 'assistente'
        AND user_has_branch_access(auth.uid(), branch_id)
        AND created_by = auth.uid()
    );

-- contract_files: assistente can manage files only for contracts they created
CREATE POLICY "Assistentes can manage own contract files" ON contract_files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = contract_files.contract_id
              AND get_user_role(auth.uid()) = 'assistente'
              AND user_has_branch_access(auth.uid(), contracts.branch_id)
              AND contracts.created_by = auth.uid()
        )
    );

-- favorecidos: assistente can register/edit clients on their branch
-- (needed for the inline client creation in the sale form)
CREATE POLICY "Assistentes can insert branch favorecidos" ON favorecidos
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'assistente'
        AND user_has_branch_access(auth.uid(), branch_id)
    );

CREATE POLICY "Assistentes can update branch favorecidos" ON favorecidos
    FOR UPDATE USING (
        get_user_role(auth.uid()) = 'assistente'
        AND user_has_branch_access(auth.uid(), branch_id)
    )
    WITH CHECK (
        get_user_role(auth.uid()) = 'assistente'
        AND user_has_branch_access(auth.uid(), branch_id)
    );

-- financial_entries: creating/editing a sale generates installment and commission
-- entries linked to the contract. Until now only admin/gerente could insert entries,
-- so entry generation failed for vendas/vendedor as well. Allow sales roles to
-- insert/delete entries, but only those linked to contracts they created.
CREATE POLICY "Sales roles can insert entries for own contracts" ON financial_entries
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) IN ('vendas', 'vendedor', 'assistente')
        AND user_has_branch_access(auth.uid(), branch_id)
        AND contract_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = financial_entries.contract_id
              AND contracts.created_by = auth.uid()
        )
    );

CREATE POLICY "Sales roles can delete entries for own contracts" ON financial_entries
    FOR DELETE USING (
        get_user_role(auth.uid()) IN ('vendas', 'vendedor', 'assistente')
        AND user_has_branch_access(auth.uid(), branch_id)
        AND contract_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM contracts
            WHERE contracts.id = financial_entries.contract_id
              AND contracts.created_by = auth.uid()
        )
    );
