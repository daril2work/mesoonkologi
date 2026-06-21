-- Create otp_requests table for Telegram Fallback
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, verified, expired
  attempt_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Aktifkan RLS
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- Buat Policy: Hanya Service Role (Backend Admin) yang dapat mengakses tabel ini
DROP POLICY IF EXISTS "Service role full access" ON public.otp_requests;
CREATE POLICY "Service role full access" 
  ON public.otp_requests 
  TO service_role 
  USING (true) 
  WITH CHECK (true);
