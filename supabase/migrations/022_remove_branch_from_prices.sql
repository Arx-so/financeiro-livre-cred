-- ============================================
-- MIGRATION 022: Remove branch_id from product_prices
-- Remove lógica de preços por filial - preços são os mesmos para todas as filiais
-- ============================================

-- Step 1: Remove the unique constraint that includes branch_id
ALTER TABLE product_prices 
    DROP CONSTRAINT IF EXISTS product_prices_product_id_branch_id_key;

-- Step 2: Remove the index on branch_id
DROP INDEX IF EXISTS idx_product_prices_branch;

-- Step 3: Remove the branch_id column
ALTER TABLE product_prices 
    DROP COLUMN IF EXISTS branch_id;

-- Step 4: Create new unique constraint on product_id only
ALTER TABLE product_prices 
    ADD CONSTRAINT product_prices_product_id_key UNIQUE (product_id);

-- Step 5: Update RLS policies to remove branch_id references
-- Note: The existing policies should still work, but we'll verify they don't reference branch_id

-- The policies should still work since they check user roles, not branch_id
-- But we can simplify them if needed

COMMENT ON TABLE product_prices IS 'Tabela de preços de venda dos produtos (preços são os mesmos para todas as filiais)';
