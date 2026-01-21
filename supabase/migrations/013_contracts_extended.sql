-- Migration: Extended Contract Fields
-- Adds category, recurrence, seller, and approval workflow fields to contracts

-- Add new status values to contract_status enum
-- Note: These must be committed before they can be used in triggers
ALTER TYPE contract_status ADD VALUE IF NOT EXISTS 'criado';
ALTER TYPE contract_status ADD VALUE IF NOT EXISTS 'em_aprovacao';
ALTER TYPE contract_status ADD VALUE IF NOT EXISTS 'aprovado';

-- Create recurrence type for contracts
DO $$ BEGIN
    CREATE TYPE contract_recurrence_type AS ENUM ('unico', 'mensal', 'anual');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to contracts table
ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS recurrence_type contract_recurrence_type DEFAULT 'unico',
    ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES favorecidos(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approved_at timestamptz,
    ADD COLUMN IF NOT EXISTS signed_by text,
    ADD COLUMN IF NOT EXISTS signed_at timestamptz;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contracts_category_id ON contracts(category_id);
CREATE INDEX IF NOT EXISTS idx_contracts_seller_id ON contracts(seller_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- Add RLS policies for new fields
-- The existing RLS policies should cover the new columns since they're on the same table

-- Create function to update sales target achieved_amount when contract is created/updated
-- Using text cast to avoid issues with new enum values in same transaction
CREATE OR REPLACE FUNCTION update_sales_target_from_contract()
RETURNS TRIGGER AS $$
DECLARE
    contract_year INT;
    contract_month INT;
BEGIN
    -- Only process if seller_id is set and status is 'ativo' or 'aprovado'
    -- Use ::text cast to handle enum comparison safely
    IF NEW.seller_id IS NOT NULL AND NEW.status::text IN ('ativo', 'aprovado') THEN
        contract_year := EXTRACT(YEAR FROM NEW.start_date);
        contract_month := EXTRACT(MONTH FROM NEW.start_date);

        -- Update the sales target for this seller/branch/period
        UPDATE sales_targets
        SET achieved_amount = achieved_amount + NEW.value,
            updated_at = now()
        WHERE branch_id = NEW.branch_id
          AND seller_id = NEW.seller_id
          AND year = contract_year
          AND month = contract_month;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update sales targets when contract becomes active
-- Separate triggers for INSERT and UPDATE to handle OLD reference properly
DROP TRIGGER IF EXISTS trigger_update_sales_target ON contracts;
DROP TRIGGER IF EXISTS trigger_update_sales_target_insert ON contracts;
DROP TRIGGER IF EXISTS trigger_update_sales_target_update ON contracts;

-- Trigger for INSERT (no OLD reference)
CREATE TRIGGER trigger_update_sales_target_insert
    AFTER INSERT ON contracts
    FOR EACH ROW
    WHEN (NEW.status::text IN ('ativo', 'aprovado'))
    EXECUTE FUNCTION update_sales_target_from_contract();

-- Trigger for UPDATE (can reference OLD)
CREATE TRIGGER trigger_update_sales_target_update
    AFTER UPDATE OF status ON contracts
    FOR EACH ROW
    WHEN (NEW.status::text IN ('ativo', 'aprovado') AND OLD.status::text NOT IN ('ativo', 'aprovado'))
    EXECUTE FUNCTION update_sales_target_from_contract();

-- Add comment for documentation
COMMENT ON COLUMN contracts.category_id IS 'Category/cost center for the contract';
COMMENT ON COLUMN contracts.recurrence_type IS 'Contract recurrence: unico (one-time), mensal (monthly), anual (yearly)';
COMMENT ON COLUMN contracts.seller_id IS 'Seller/salesperson responsible for this contract';
COMMENT ON COLUMN contracts.approved_by IS 'User who approved the contract';
COMMENT ON COLUMN contracts.approved_at IS 'Timestamp when contract was approved';
COMMENT ON COLUMN contracts.signed_by IS 'Name of person who signed the contract';
COMMENT ON COLUMN contracts.signed_at IS 'Timestamp when contract was signed';
