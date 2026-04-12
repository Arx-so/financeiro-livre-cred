-- Fix seller_id foreign key on sales tables to reference profiles instead of favorecidos
-- Sellers are system users (profiles table), not favorecidos

-- sales_credit_card
ALTER TABLE sales_credit_card
    DROP CONSTRAINT IF EXISTS sales_credit_card_seller_id_fkey;

ALTER TABLE sales_credit_card
    ADD CONSTRAINT sales_credit_card_seller_id_fkey
        FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE RESTRICT;

-- sales_d_plus_products
ALTER TABLE sales_d_plus_products
    DROP CONSTRAINT IF EXISTS sales_d_plus_products_seller_id_fkey;

ALTER TABLE sales_d_plus_products
    ADD CONSTRAINT sales_d_plus_products_seller_id_fkey
        FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE RESTRICT;
