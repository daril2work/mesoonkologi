-- Migration: Add is_qol_active column to public.profiles
-- Description: Enables/disables quality of life survey tabs for specific patients.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_qol_active BOOLEAN NOT NULL DEFAULT FALSE;
