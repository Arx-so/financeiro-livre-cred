-- Migration: Add interest_rate to contracts
-- Supports Price table calculation for installments with interest

ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS interest_rate numeric CHECK (interest_rate >= 0);

COMMENT ON COLUMN contracts.interest_rate IS 'Monthly interest rate (%) applied to installments via Price table';
