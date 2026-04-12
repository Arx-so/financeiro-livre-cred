-- Migration 040: Add new user roles
-- New roles: coordenador, assistente, vendedor, seguranca, rh
-- Keep existing roles (usuario, vendas) for backward compatibility

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE 'coordenador';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE 'assistente';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE 'vendedor';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE 'seguranca';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TYPE user_role ADD VALUE 'rh';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TYPE user_role IS 'User roles: admin, gerente, coordenador, assistente, vendedor, seguranca, financeiro, rh, leitura. Legacy: usuario, vendas.';
