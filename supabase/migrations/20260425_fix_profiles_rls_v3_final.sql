-- ============================================================
-- MESO App — Fix Profiles RLS (Anti-Recursion Fix)
-- ============================================================

-- Drop the broken recursive policy
DROP POLICY IF EXISTS "Profiles are readable by owner, medics, or for medic discovery" ON public.profiles;

-- Create a non-recursive policy using JWT metadata for role checks
-- This prevents the 500 Internal Server Error (Infinite Recursion)
CREATE POLICY "Profiles visibility policy v3"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    -- 1. Owner can always read their own profile
    auth.uid() = id 
    OR 
    -- 2. Everyone can read profiles of pharmacists and doctors
    role IN ('pharmacist', 'doctor')
    OR 
    -- 3. Staf medis (pharmacist/doctor/admin) can read all profiles
    -- We use auth.jwt() to avoid querying public.profiles recursively
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('pharmacist', 'doctor', 'admin')
);
