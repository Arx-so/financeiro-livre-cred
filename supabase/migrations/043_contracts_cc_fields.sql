-- Add credit card specific fields to contracts table
ALTER TABLE contracts
    ADD COLUMN IF NOT EXISTS cc_terminal TEXT,
    ADD COLUMN IF NOT EXISTS cc_card_brand TEXT,
    ADD COLUMN IF NOT EXISTS cc_card_last_four CHAR(4),
    ADD COLUMN IF NOT EXISTS cc_card_holder_name TEXT,
    ADD COLUMN IF NOT EXISTS cc_sale_type TEXT,
    ADD COLUMN IF NOT EXISTS cc_payment_method TEXT,
    ADD COLUMN IF NOT EXISTS cc_payment_account TEXT,
    ADD COLUMN IF NOT EXISTS cc_discount_amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS cc_saturday_refund NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS cc_lacre TEXT;
