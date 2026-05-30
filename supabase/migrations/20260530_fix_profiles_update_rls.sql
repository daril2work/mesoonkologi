-- Migration: Fix Profiles Update RLS
-- Description: Allows pharmacists, doctors, and admins to update user profiles (e.g., toggling is_qol_active) using robust JWT metadata checking.

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or managed by medics" ON public.profiles;

CREATE POLICY "Users can update own profile or managed by medics"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR 
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role'
    ) IN ('pharmacist', 'doctor', 'admin')
  )
  WITH CHECK (
    auth.uid() = id OR 
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role'
    ) IN ('pharmacist', 'doctor', 'admin')
  );
