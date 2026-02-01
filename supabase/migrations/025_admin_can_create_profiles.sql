-- ============================================
-- Ensure admins can create other users (profiles)
-- ============================================

-- Explicit policy: admin can INSERT any row into profiles (create other users)
CREATE POLICY "Admins can insert profiles"
    ON profiles
    FOR INSERT
    WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
