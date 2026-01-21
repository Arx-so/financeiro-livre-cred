-- Migration: New User Roles
-- Adds financeiro, vendas, and leitura roles to the system

-- Note: PostgreSQL requires a workaround to add enum values in a transaction
-- We use DO blocks with exception handling

DO $$
BEGIN
    -- Add 'financeiro' role if it doesn't exist
    BEGIN
        ALTER TYPE user_role ADD VALUE 'financeiro';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

DO $$
BEGIN
    -- Add 'vendas' role if it doesn't exist
    BEGIN
        ALTER TYPE user_role ADD VALUE 'vendas';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

DO $$
BEGIN
    -- Add 'leitura' role if it doesn't exist
    BEGIN
        ALTER TYPE user_role ADD VALUE 'leitura';
    EXCEPTION
        WHEN duplicate_object THEN
            NULL;
    END;
END $$;

-- Update comments to document roles
COMMENT ON TYPE user_role IS 'User roles: admin (full access), gerente (manager), usuario (standard user), financeiro (finance access), vendas (sales access), leitura (read-only)';
