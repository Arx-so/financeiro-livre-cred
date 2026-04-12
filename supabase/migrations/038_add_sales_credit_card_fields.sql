-- ============================================
-- Add new fields to sales_credit_card
-- ============================================

ALTER TABLE sales_credit_card
    ADD COLUMN IF NOT EXISTS installments INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS saturday_refund NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS lacre TEXT;

CREATE INDEX IF NOT EXISTS idx_sales_credit_card_sale_date ON sales_credit_card(sale_date);
