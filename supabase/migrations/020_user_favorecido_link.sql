-- Migration 020: Link favorecidos to users (profiles)
-- When a user is created, automatically create a corresponding favorecido (funcionario)

-- ============================================
-- STEP 1: Add user_id column to favorecidos
-- ============================================

ALTER TABLE favorecidos
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_favorecidos_user_id ON favorecidos(user_id);

-- Create unique constraint to ensure one favorecido per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorecidos_user_unique ON favorecidos(user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- STEP 2: Create function to auto-create favorecido for new users
-- ============================================

CREATE OR REPLACE FUNCTION create_favorecido_for_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create favorecido if one doesn't already exist for this user
    IF NOT EXISTS (
        SELECT 1 FROM favorecidos WHERE user_id = NEW.id
    ) THEN
        INSERT INTO favorecidos (
            user_id,
            type,
            name,
            email,
            is_active
        ) VALUES (
            NEW.id,
            'funcionario',
            NEW.name,
            NEW.email,
            TRUE
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 3: Create trigger to auto-create favorecido
-- ============================================

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_favorecido_for_user ON profiles;

-- Create trigger that fires after a profile is inserted
CREATE TRIGGER trigger_create_favorecido_for_user
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_favorecido_for_user();

-- ============================================
-- STEP 4: Update existing profiles to create favorecidos
-- ============================================

-- For existing users without a favorecido, create one
INSERT INTO favorecidos (user_id, type, name, email, is_active)
SELECT 
    p.id,
    'funcionario',
    p.name,
    p.email,
    TRUE
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM favorecidos f WHERE f.user_id = p.id
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN favorecidos.user_id IS 'Link to the user profile - users are also funcionarios (employees)';
COMMENT ON FUNCTION create_favorecido_for_user() IS 'Automatically creates a favorecido (funcionario) when a user profile is created';
