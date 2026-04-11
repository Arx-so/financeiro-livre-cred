-- ============================================
-- SALES MODULE: Financial entries integration
-- ============================================

-- Add FK columns to financial_entries linking to sales tables
ALTER TABLE financial_entries
    ADD COLUMN IF NOT EXISTS credit_card_sale_id UUID REFERENCES sales_credit_card(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS dplus_sale_id UUID REFERENCES sales_d_plus_products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financial_entries_credit_card_sale
    ON financial_entries(credit_card_sale_id)
    WHERE credit_card_sale_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financial_entries_dplus_sale
    ON financial_entries(dplus_sale_id)
    WHERE dplus_sale_id IS NOT NULL;

-- Track whether financial entries have already been generated for each sale
ALTER TABLE sales_credit_card
    ADD COLUMN IF NOT EXISTS financial_entries_generated BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE sales_d_plus_products
    ADD COLUMN IF NOT EXISTS financial_entries_generated BOOLEAN NOT NULL DEFAULT FALSE;
