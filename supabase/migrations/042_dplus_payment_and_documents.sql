-- Add payment method, payment info and document attachments to D+ sales

ALTER TABLE sales_d_plus_products
    ADD COLUMN IF NOT EXISTS payment_method TEXT,
    ADD COLUMN IF NOT EXISTS payment_info TEXT,
    ADD COLUMN IF NOT EXISTS document_urls JSONB;
