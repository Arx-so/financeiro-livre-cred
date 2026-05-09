-- Fix contracts.seller_id FK to reference favorecidos instead of profiles
-- Migration 019 changed it to profiles; the service layer expects favorecidos

ALTER TABLE contracts
    DROP CONSTRAINT IF EXISTS contracts_seller_id_fkey;

ALTER TABLE contracts
    ALTER COLUMN seller_id DROP NOT NULL;

UPDATE contracts
    SET seller_id = NULL
    WHERE seller_id IS NOT NULL
      AND seller_id NOT IN (SELECT id FROM favorecidos);

ALTER TABLE contracts
    ADD CONSTRAINT contracts_seller_id_fkey
        FOREIGN KEY (seller_id) REFERENCES favorecidos(id) ON DELETE SET NULL;

COMMENT ON COLUMN contracts.seller_id IS 'Favorecido (funcionario) responsible for this contract as seller';
