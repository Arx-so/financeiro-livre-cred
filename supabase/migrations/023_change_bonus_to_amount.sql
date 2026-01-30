-- ============================================
-- MIGRATION 023: Change bonus from percentage to fixed amount
-- Change bonus_rate (percentage) to bonus_amount (fixed value)
-- ============================================

-- Step 1: Add new column bonus_amount
ALTER TABLE sales_targets 
    ADD COLUMN IF NOT EXISTS bonus_amount DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- Step 2: Migrate existing data (convert percentage to 0 for now, as we can't calculate without actual_amount)
-- Users will need to set the bonus amounts manually
UPDATE sales_targets 
SET bonus_amount = 0
WHERE bonus_amount IS NULL;

-- Step 3: Remove the old bonus_rate column
ALTER TABLE sales_targets 
    DROP COLUMN IF EXISTS bonus_rate;

-- Step 4: Update comments
COMMENT ON COLUMN sales_targets.bonus_amount IS 'Valor fixo do bônus quando a meta é atingida (em R$)';
