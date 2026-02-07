-- Migration: Link contracts to financial entries
-- Adds payment_due_day to contracts and contract_id to financial_entries

-- Add payment_due_day to contracts (day of month for installment due date, 1-31)
ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS payment_due_day integer CHECK (payment_due_day BETWEEN 1 AND 31),
    ADD COLUMN IF NOT EXISTS interest_rate numeric CHECK (interest_rate >= 0);

-- Add contract_id to financial_entries to link entries back to the originating sale
ALTER TABLE financial_entries
    ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL;

-- Index for efficient lookups of entries by contract
CREATE INDEX IF NOT EXISTS idx_financial_entries_contract_id ON financial_entries(contract_id);

COMMENT ON COLUMN contracts.payment_due_day IS 'Day of month (1-31) for installment due dates';
COMMENT ON COLUMN contracts.interest_rate IS 'Monthly interest rate (%) applied to installments via Price table';
COMMENT ON COLUMN financial_entries.contract_id IS 'Reference to the contract/sale that generated this entry';
