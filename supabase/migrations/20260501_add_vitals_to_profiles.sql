-- Migration: Add clinical vitals to profiles table
-- Date: 2026-05-01

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,2);

-- Optional: Add comment for clarity
COMMENT ON COLUMN profiles.age IS 'Patient age in years';
COMMENT ON COLUMN profiles.weight_kg IS 'Patient weight in kilograms';
COMMENT ON COLUMN profiles.height_cm IS 'Patient height in centimeters';
