-- ============================================================
-- MESO App — Security Fix: system_settings RLS (SEC-02)
-- ============================================================
-- Temuan Audit: Policy SELECT sebelumnya membuka SELURUH tabel
-- system_settings ke semua authenticated user, termasuk pasien.
-- Ini berarti pasien bisa membaca row 'fonnte_token' (API key sensitif).
--
-- Perbaikan: Tambahkan filter per-row agar fonnte_token HANYA bisa
-- dibaca oleh pharmacist dan admin, bukan pasien.
-- ============================================================

-- Hapus policy lama yang bocor
DROP POLICY IF EXISTS "Settings read for authenticated v2" ON public.system_settings;
DROP POLICY IF EXISTS "Settings read for authenticated v3" ON public.system_settings;

-- Policy SELECT baru yang row-aware:
-- - Semua authenticated bisa baca setting umum (pharmacist_wa, doctor_wa)
-- - TAPI baris 'fonnte_token' hanya bisa dibaca pharmacist/admin
CREATE POLICY "Settings read for authenticated v3"
ON public.system_settings
FOR SELECT
TO authenticated
USING (
  key != 'fonnte_token'
  OR public.get_jwt_role() IN ('pharmacist', 'admin')
);

COMMENT ON POLICY "Settings read for authenticated v3" ON public.system_settings IS
  'SEC-02 Fix (2026-06-14): Membatasi akses baca fonnte_token hanya untuk pharmacist/admin.
   Setting umum (pharmacist_wa, doctor_wa) tetap bisa dibaca semua authenticated user
   karena dibutuhkan oleh UI pasien untuk menampilkan info kontak.';
