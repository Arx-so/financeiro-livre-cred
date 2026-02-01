-- ============================================
-- CONTRACTS: ligação direta com produto
-- ============================================

ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_product_id ON contracts(product_id);

COMMENT ON COLUMN contracts.product_id IS 'Produto vinculado ao contrato (cadastro de produtos)';
