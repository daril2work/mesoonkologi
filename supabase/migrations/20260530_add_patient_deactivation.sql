-- Migration: Add Patient Deactivation (Soft Delete)
-- Description: Adds columns to track patient active status, penonaktifan reason, and timestamp.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS status_reason TEXT,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;

-- Add a comment for developer documentation
COMMENT ON COLUMN public.profiles.status_reason IS 'Alasan penonaktifan: discharged, dismissed, deceased';
