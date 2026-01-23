-- ============================================
-- PRODUCT PRICES TABLE
-- Tabela de preços de venda por filial
-- ============================================

CREATE TABLE product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    sale_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, branch_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_product_prices_product ON product_prices(product_id);
CREATE INDEX idx_product_prices_branch ON product_prices(branch_id);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_product_prices_updated_at BEFORE UPDATE ON product_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem visualizar preços
CREATE POLICY "All users can view product prices" ON product_prices
    FOR SELECT USING (TRUE);

-- Admins podem gerenciar preços
CREATE POLICY "Admins can manage product prices" ON product_prices
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Gerentes podem gerenciar preços
CREATE POLICY "Gerentes can manage product prices" ON product_prices
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

-- Vendas podem gerenciar preços
CREATE POLICY "Vendas can manage product prices" ON product_prices
    FOR ALL USING (get_user_role(auth.uid()) = 'vendas');
