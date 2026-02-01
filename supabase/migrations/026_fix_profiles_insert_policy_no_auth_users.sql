-- ============================================
-- Fix: Remove auth.users reference from profiles INSERT policy
-- The condition "id IN (SELECT id FROM auth.users)" causes
-- "permission denied for table users" when evaluated by anon/authenticated client.
-- Trigger handle_new_user() creates profiles on signup as SECURITY DEFINER, so
-- we don't need that condition for client requests.
-- ============================================

DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;

CREATE POLICY "Allow profile creation on signup"
    ON profiles
    FOR INSERT
    WITH CHECK (
        -- Admin can create any profile (create other users)
        public.get_user_role(auth.uid()) = 'admin'
        -- User can create their own profile (e.g. first signup flow)
        OR auth.uid() = id
    );
