-- ============================================================
-- MESO App — Fix Profiles RLS for Chat
-- ============================================================

-- Drop the old restricted policy
DROP POLICY IF EXISTS "Users can read own profile." ON public.profiles;

-- Create a more permissive policy for reading
-- 1. Users can read their own profile
-- 2. Everyone (authenticated) can read profiles with role 'pharmacist' or 'doctor'
CREATE POLICY "Users can read own or medic profiles" ON public.profiles
FOR SELECT USING (
    auth.uid() = id OR role IN ('pharmacist', 'doctor')
);

-- Grant select to authenticated users
GRANT SELECT ON public.profiles TO authenticated;
