-- Change seller_id FK on sales tables to reference favorecidos instead of profiles
-- Sellers are now favorecidos of type 'funcionario', not system users
-- Existing rows with seller_id pointing to profiles (not in favorecidos) are nulled out

-- sales_credit_card
ALTER TABLE sales_credit_card
    DROP CONSTRAINT IF EXISTS sales_credit_card_seller_id_fkey;

-- Allow NULL temporarily to clear orphaned references
ALTER TABLE sales_credit_card
    ALTER COLUMN seller_id DROP NOT NULL;

UPDATE sales_credit_card
    SET seller_id = NULL
    WHERE seller_id NOT IN (SELECT id FROM favorecidos);

ALTER TABLE sales_credit_card
    ADD CONSTRAINT sales_credit_card_seller_id_fkey
        FOREIGN KEY (seller_id) REFERENCES favorecidos(id) ON DELETE RESTRICT;

-- sales_d_plus_products
ALTER TABLE sales_d_plus_products
    DROP CONSTRAINT IF EXISTS sales_d_plus_products_seller_id_fkey;

ALTER TABLE sales_d_plus_products
    ALTER COLUMN seller_id DROP NOT NULL;

UPDATE sales_d_plus_products
    SET seller_id = NULL
    WHERE seller_id NOT IN (SELECT id FROM favorecidos);

ALTER TABLE sales_d_plus_products
    ADD CONSTRAINT sales_d_plus_products_seller_id_fkey
        FOREIGN KEY (seller_id) REFERENCES favorecidos(id) ON DELETE RESTRICT;
