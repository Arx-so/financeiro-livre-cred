-- ============================================
-- PRODUCTS TABLE
-- Cadastro de produtos com valores para banco e empresa
-- ============================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    bank_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    bank_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    company_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    company_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem visualizar produtos
CREATE POLICY "All users can view products" ON products
    FOR SELECT USING (TRUE);

-- Admins e gerentes podem gerenciar produtos
CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage products" ON products
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');
