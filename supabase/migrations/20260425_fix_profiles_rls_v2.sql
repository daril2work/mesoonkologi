-- ============================================================
-- MESO App — Fix Profiles RLS for Pharmacist Dashboard
-- ============================================================

-- Drop the previous policy
DROP POLICY IF EXISTS "Users can read own or medic profiles" ON public.profiles;

-- Create a comprehensive policy for profile visibility:
-- 1. Users can always read their own profile.
-- 2. Everyone (authenticated) can read profiles of pharmacists and doctors (for chat discovery).
-- 3. Pharmacists, Doctors, and Admins can read ALL profiles (to manage patients).

CREATE POLICY "Profiles are readable by owner, medics, or for medic discovery"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id 
    OR role IN ('pharmacist', 'doctor')
    OR (
        EXISTS (
            SELECT 1 FROM public.profiles AS p
            WHERE p.id = auth.uid() 
            AND p.role IN ('pharmacist', 'doctor', 'admin')
        )
    )
);
