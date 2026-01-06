-- ============================================
-- FIX: Profile creation trigger
-- The trigger was failing silently due to RLS policies
-- ============================================

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with proper settings to bypass RLS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(
            NEW.raw_user_meta_data->>'name', 
            NEW.raw_user_meta_data->>'full_name', 
            split_part(NEW.email, '@', 1),
            'User'
        ),
        'usuario'::public.user_role
    );
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error for debugging (check Supabase logs)
    RAISE LOG 'Failed to create profile for user %: % - SQLSTATE: %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant the function owner (postgres/supabase_admin) the ability to bypass RLS
-- This is the key fix - the function runs as the definer who can bypass RLS
ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Alternative: Add a more permissive INSERT policy for the trigger context
-- This allows inserts when there's no authenticated user (trigger context)
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

CREATE POLICY "Allow profile creation on signup" ON profiles
    FOR INSERT WITH CHECK (
        -- Allow admins to create profiles
        (SELECT public.get_user_role(auth.uid()) = 'admin')
        -- Allow users to create their own profile
        OR auth.uid() = id
        -- Allow trigger/service role context (when auth.uid() is null but id matches a valid auth user)
        OR (auth.uid() IS NULL AND id IN (SELECT id FROM auth.users))
    );

-- Also add a policy to allow the service role to insert (used by triggers)
CREATE POLICY "Service role can insert profiles" ON profiles
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL
    );
