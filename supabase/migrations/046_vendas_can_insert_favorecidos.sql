-- Allow users with 'vendas' role to insert favorecidos on their own branch
-- Needed so sellers can register new clients/vendors when creating contracts

CREATE POLICY "Vendas can insert branch favorecidos" ON favorecidos
    FOR INSERT WITH CHECK (
        get_user_role(auth.uid()) = 'vendas'
        AND user_has_branch_access(auth.uid(), branch_id)
    );
