-- ============================================================
-- MESO App — OTP Security Hardening (SEC-04)
-- ============================================================
-- Menambahkan:
--   1. Kolom attempt_count untuk brute-force protection (5 percobaan max)
--   2. Composite index untuk query rate-limit check O(log n)
-- ============================================================

-- Tambahkan attempt counter pada tabel OTP
ALTER TABLE public.password_reset_otps
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.password_reset_otps.attempt_count IS
  'Jumlah percobaan verifikasi OTP yang gagal. Setelah >= 5, OTP diinvalidasi otomatis.';

-- Composite index untuk query rate-limit check yang efisien:
-- "Apakah ada OTP aktif (belum expired, belum dipakai) untuk nomor ini?"
-- Query: WHERE phone_number = $1 AND used = false AND expires_at > NOW()
CREATE INDEX IF NOT EXISTS idx_otp_active_by_phone
  ON public.password_reset_otps (phone_number, used, expires_at)
  WHERE used = false;

COMMENT ON INDEX public.idx_otp_active_by_phone IS
  'SEC-04: Index parsial untuk mempercepat rate-limit check OTP aktif per nomor telepon.';
