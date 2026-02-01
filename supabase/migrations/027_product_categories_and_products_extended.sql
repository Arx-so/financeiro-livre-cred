-- ============================================
-- PRODUCT CATEGORIES (cadastro de produtos)
-- Categorias distintas de categories (receita/despesa)
-- ============================================

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_categories_name ON product_categories(name);
CREATE INDEX idx_product_categories_active ON product_categories(is_active);

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view product categories" ON product_categories
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage product categories" ON product_categories
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Gerentes can manage product categories" ON product_categories
    FOR ALL USING (get_user_role(auth.uid()) = 'gerente');

-- Seed: categorias do PRODUTOS.md
INSERT INTO product_categories (name, code) VALUES
    ('Consignado', 'consignado'),
    ('Crédito pessoal', 'credito_pessoal'),
    ('Garantia', 'garantia'),
    ('Benefício social', 'beneficio_social'),
    ('Serviços financeiros', 'servicos_financeiros'),
    ('Outros', 'outros');

-- ============================================
-- EXTEND PRODUCTS TABLE
-- Novas colunas conforme PRODUTOS.md (7 blocos)
-- ============================================

-- 1 - Identificação
ALTER TABLE products ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS commercial_description TEXT;

-- 2 - Público-alvo (JSONB array)
ALTER TABLE products ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '[]';

-- 3 - Parâmetros financeiros
ALTER TABLE products ADD COLUMN IF NOT EXISTS value_min DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS value_max DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS term_months_min INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS term_months_max INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS interest_rate_min DECIMAL(10, 4);
ALTER TABLE products ADD COLUMN IF NOT EXISTS interest_rate_max DECIMAL(10, 4);
ALTER TABLE products ADD COLUMN IF NOT EXISTS billing_type JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS iof_applicable BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS other_fees JSONB DEFAULT '{}';

-- 4 - Regras específicas por produto (JSONB)
ALTER TABLE products ADD COLUMN IF NOT EXISTS specific_rules JSONB DEFAULT '{}';

-- 5 - Comissionamento (mantemos bank_* e company_*; adicionamos campos explícitos)
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_type TEXT CHECK (commission_type IN ('fixa', 'percentual') OR commission_type IS NULL);
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_pct DECIMAL(5, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_min DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_max DECIMAL(15, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_payment_day INTEGER;

-- 6 - Documentação exigida (JSONB array)
ALTER TABLE products ADD COLUMN IF NOT EXISTS required_docs JSONB DEFAULT '[]';

-- 7 - Integração e operacional
ALTER TABLE products ADD COLUMN IF NOT EXISTS convention_bank TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS operation_channel TEXT CHECK (operation_channel IN ('manual', 'api', 'plataforma_externa') OR operation_channel IS NULL);
ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_internal_approval BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_product_category ON products(product_category_id);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

-- Migrar category_id -> product_category_id (mapear para "Outros")
DO $$
DECLARE
    outros_id UUID;
BEGIN
    SELECT id INTO outros_id FROM product_categories WHERE code = 'outros' LIMIT 1;
    IF outros_id IS NOT NULL THEN
        UPDATE products SET product_category_id = outros_id WHERE product_category_id IS NULL AND category_id IS NOT NULL;
        UPDATE products SET product_category_id = outros_id WHERE product_category_id IS NULL;
    END IF;
END $$;

-- Remover FK e coluna category_id de products
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE products DROP COLUMN IF EXISTS category_id;
DROP INDEX IF EXISTS idx_products_category;
