-- Migration 019: Change seller_id from favorecidos to profiles (users with role 'vendas')
-- This migration updates sales_targets and contracts to reference users instead of favorecidos

-- ============================================
-- STEP 1: Update sales_targets table
-- ============================================

-- Drop the old foreign key constraint
ALTER TABLE sales_targets
    DROP CONSTRAINT IF EXISTS sales_targets_seller_id_fkey;

-- Add new foreign key pointing to profiles
ALTER TABLE sales_targets
    ADD CONSTRAINT sales_targets_seller_id_fkey 
    FOREIGN KEY (seller_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- Add check constraint to ensure seller has 'vendas' role
-- Note: This is a soft constraint - we'll enforce it in application logic
-- as PostgreSQL doesn't support CHECK constraints with subqueries easily

-- ============================================
-- STEP 2: Update contracts table
-- ============================================

-- Drop the old foreign key constraint
ALTER TABLE contracts
    DROP CONSTRAINT IF EXISTS contracts_seller_id_fkey;

-- Add new foreign key pointing to profiles
ALTER TABLE contracts
    ADD CONSTRAINT contracts_seller_id_fkey 
    FOREIGN KEY (seller_id) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL;

-- ============================================
-- STEP 3: Update trigger function for sales targets
-- ============================================

-- The trigger function update_sales_target_from_contract() doesn't need changes
-- as it only uses seller_id, not the table it references

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN sales_targets.seller_id IS 'User (profile) with role vendas responsible for this sales target';
COMMENT ON COLUMN contracts.seller_id IS 'User (profile) with role vendas responsible for this contract';
