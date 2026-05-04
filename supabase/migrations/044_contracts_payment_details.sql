-- Add payment detail fields to contracts (PIX key and bank account for the sale)
ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS cc_pix_key_type TEXT,
    ADD COLUMN IF NOT EXISTS cc_pix_key TEXT,
    ADD COLUMN IF NOT EXISTS cc_bank_name TEXT,
    ADD COLUMN IF NOT EXISTS cc_bank_agency TEXT,
    ADD COLUMN IF NOT EXISTS cc_bank_account TEXT,
    ADD COLUMN IF NOT EXISTS cc_bank_account_type TEXT;
