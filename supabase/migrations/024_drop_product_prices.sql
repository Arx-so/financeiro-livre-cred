-- ============================================
-- DROP PRODUCT PRICES TABLE
-- Remove tabela de preços (não utilizada no sistema)
-- ============================================

DROP TRIGGER IF EXISTS update_product_prices_updated_at ON product_prices;
DROP TABLE IF EXISTS product_prices;
