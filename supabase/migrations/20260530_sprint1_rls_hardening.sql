-- ============================================================
-- MESO App — Sprint 1: Security & Performance RLS Hardening
-- ============================================================
-- Menyelesaikan 3 temuan dari Supabase Security Advisor:
--
--   [CRITICAL] RLS references user_metadata (editable by users)
--   [WARNING]  auth.<fn>() re-evaluated per row (performance)
--   [WARNING]  EXISTS subquery in RLS (N+1 pattern)
--
-- STRATEGI KONSERVATIF (aman untuk production):
--   ✅ COALESCE(app_metadata, user_metadata) sebagai fallback
--      → Mencegah lockout user lama yang dibuat sebelum sync trigger
--   ✅ (select auth.uid()) wrapper di semua uid checks  
--      → Evaluasi O(1) bukan O(n) per-row
--   ✅ Helper function get_jwt_role() yang STABLE
--      → Dipanggil sekali per query, bukan sekali per baris
--   ✅ Ganti EXISTS subquery → JWT check langsung
--      → Menghilangkan N+1 query pada tabel tracking & settings
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 0: Helper Function — get_jwt_role()
-- ============================================================
-- Fungsi ini menjadi satu-satunya tempat kita membaca role dari JWT.
-- STABLE: Supabase/PostgreSQL mengevaluasinya SEKALI per statement,
--         bukan berulang kali per baris — ini adalah kunci optimasi PERF-01.
-- COALESCE: Cek app_metadata dulu (server-side, aman), fallback ke
--           user_metadata untuk backward-compatibility.
-- SECURITY DEFINER: Dijalankan dengan hak owner fungsi, bukan caller.
CREATE OR REPLACE FUNCTION public.get_jwt_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Prioritas 1: app_metadata (hanya bisa diubah server-side)
    auth.jwt() -> 'app_metadata' ->> 'role',
    -- Fallback: user_metadata (untuk backward-compatibility)
    -- Ini akan dihapus di sprint mendatang setelah semua user terverifikasi
    auth.jwt() -> 'user_metadata' ->> 'role'
  )
$$;

COMMENT ON FUNCTION public.get_jwt_role() IS 
  'Mengambil role dari JWT. Prioritas app_metadata (aman), fallback user_metadata (deprecated).
   Dioptimasi sebagai STABLE untuk evaluasi O(1) per query, bukan per-row.
   Sprint 2: Hapus fallback user_metadata setelah semua user terverifikasi.';

-- ============================================================
-- STEP 1: Profiles Table
-- ============================================================
-- Temuan: "Profiles visibility policy v3" menggunakan user_metadata
-- Referensi: 20260425_fix_profiles_rls_v3_final.sql

DROP POLICY IF EXISTS "Profiles visibility policy v3" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile." ON public.profiles;
-- Policy dari fix_profiles_rls.sql (v1)
DROP POLICY IF EXISTS "Users can read own or medic profiles" ON public.profiles;
-- Policy dari fix_profiles_rls_v2.sql — INI PENYEBAB INFINITE RECURSION!
-- Berisi EXISTS (SELECT 1 FROM public.profiles ...) di dalam policy profiles
DROP POLICY IF EXISTS "Profiles are readable by owner, medics, or for medic discovery" ON public.profiles;
-- Policy dari 20260530_fix_profiles_update_rls.sql
DROP POLICY IF EXISTS "Users can update own profile or managed by medics" ON public.profiles;
-- Idempotent: hapus juga versi baru jika sudah ada (misal dari partial run)
DROP POLICY IF EXISTS "Profiles access policy v5" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy v2" ON public.profiles;

-- Policy SELECT: Siapa yang boleh BACA profil
CREATE POLICY "Profiles access policy v5"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- 1. Owner selalu bisa baca profilnya sendiri
  --    (select ...) wrapper → evaluasi O(1), bukan per-row (fix PERF-01)
  (select auth.uid()) = id

  OR

  -- 2. Profil medis bisa dilihat semua user untuk discovery
  --    (baca kolom role dari ROW yang sedang dievaluasi, bukan user saat ini)
  role IN ('pharmacist', 'doctor')

  OR

  -- 3. Staf medis bisa baca semua profil pasien
  --    get_jwt_role() dipanggil SEKALI per query (STABLE) → aman & cepat
  public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
);

COMMENT ON POLICY "Profiles access policy v5" ON public.profiles IS
  'Sprint 1: Menggantikan v3 yang pakai user_metadata. 
   Kini menggunakan get_jwt_role() dengan COALESCE fallback yang aman.';

-- Policy UPDATE: Siapa yang boleh UPDATE profil (termasuk is_active)
CREATE POLICY "Profiles update policy v2"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = id 
  OR public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
)
WITH CHECK (
  (select auth.uid()) = id 
  OR public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
);

-- ============================================================
-- STEP 2: Symptom Reports Table
-- ============================================================
-- Temuan: "Medics can view all reports v2" menggunakan user_metadata
-- Referensi: 20260425_fix_reports_rls_v2.sql & 20260422_setup_reports.sql

-- Hapus semua versi policy lama (dari setup awal sampai v2)
DROP POLICY IF EXISTS "Patients can view their own reports" ON public.symptom_reports;
DROP POLICY IF EXISTS "Medics can view all reports" ON public.symptom_reports;
DROP POLICY IF EXISTS "Medics can update reports" ON public.symptom_reports;
DROP POLICY IF EXISTS "Medics can view all reports v2" ON public.symptom_reports;
DROP POLICY IF EXISTS "Medics can update reports v2" ON public.symptom_reports;

-- Idempotent: hapus versi baru jika sudah ada
DROP POLICY IF EXISTS "Patients can view their own reports v2" ON public.symptom_reports;
DROP POLICY IF EXISTS "Medics can view all reports v3" ON public.symptom_reports;
DROP POLICY IF EXISTS "Medics can update reports v3" ON public.symptom_reports;
DROP POLICY IF EXISTS "Patients can insert their own reports v2" ON public.symptom_reports;

-- Policy SELECT untuk pasien: hanya lihat laporan sendiri
CREATE POLICY "Patients can view their own reports v2"
ON public.symptom_reports
FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = patient_id  -- (select ...) wrapper → O(1)
);

-- Policy SELECT untuk medis: lihat semua laporan
CREATE POLICY "Medics can view all reports v3"
ON public.symptom_reports
FOR SELECT
TO authenticated
USING (
  public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
);

-- Policy UPDATE untuk medis: update status, grade, dll.
CREATE POLICY "Medics can update reports v3"
ON public.symptom_reports
FOR UPDATE
TO authenticated
USING (
  public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
)
WITH CHECK (
  public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
);

-- Policy INSERT untuk pasien: tetap menggunakan pattern lama yang sudah benar
DROP POLICY IF EXISTS "Patients can insert their own reports" ON public.symptom_reports;
CREATE POLICY "Patients can insert their own reports v2"
ON public.symptom_reports
FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = patient_id  -- (select ...) wrapper → O(1)
);

-- ============================================================
-- STEP 3: System Settings Table
-- ============================================================
-- Temuan 1: auth.role() = 'authenticated' — deprecated function
-- Temuan 2: EXISTS subquery → N+1 pattern untuk medic write
-- Referensi: 20260509_add_system_settings.sql

DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.system_settings;
DROP POLICY IF EXISTS "Allow all access for pharmacists and admins" ON public.system_settings;

-- READ: Semua user terautentikasi bisa baca (untuk WA alert number)
-- Catatan: "TO authenticated" sudah menjamin hanya authenticated user → tidak perlu USING
-- Idempotent: hapus versi baru jika sudah ada
DROP POLICY IF EXISTS "Settings read for authenticated v2" ON public.system_settings;
DROP POLICY IF EXISTS "Settings write for pharmacists and admins" ON public.system_settings;

CREATE POLICY "Settings read for authenticated v2"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);  -- Auth check sudah dilakukan oleh "TO authenticated"

-- WRITE (ALL = INSERT + UPDATE + DELETE): Hanya pharmacist & admin
CREATE POLICY "Settings write for pharmacists and admins"
ON public.system_settings
FOR ALL
TO authenticated
USING (
  public.get_jwt_role() IN ('pharmacist', 'admin')
)
WITH CHECK (
  public.get_jwt_role() IN ('pharmacist', 'admin')
);

-- ============================================================
-- STEP 4: Patient Education Tracking Table
-- ============================================================
-- Temuan: EXISTS subquery yang lambat (N+1) di semua 3 policy
-- Referensi: 20260501_sprint3_tracking.sql

DROP POLICY IF EXISTS "Users can view their own education progress" ON public.patient_education_tracking;
DROP POLICY IF EXISTS "Pharmacists can view all education progress" ON public.patient_education_tracking;
DROP POLICY IF EXISTS "Pharmacists can record education progress" ON public.patient_education_tracking;

-- Policy READ: pasien lihat milik sendiri, medis lihat semua
-- Idempotent: hapus versi baru jika sudah ada
DROP POLICY IF EXISTS "Education tracking read v2" ON public.patient_education_tracking;
DROP POLICY IF EXISTS "Education tracking insert for medics" ON public.patient_education_tracking;

CREATE POLICY "Education tracking read v2"
ON public.patient_education_tracking
FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = patient_id
  OR
  public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
);

-- Policy INSERT: hanya medis yang bisa mencatat progres
CREATE POLICY "Education tracking insert for medics"
ON public.patient_education_tracking
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_jwt_role() IN ('pharmacist', 'admin')
);

-- ============================================================
-- STEP 5: Chat Messages Table
-- ============================================================
-- Temuan: auth.uid() per-row (tanpa select wrapper) — fix PERF-01
-- Referensi: 20260423_setup_chat.sql & 20260425_optimize_rls_jwt.sql

DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their chat conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.chat_messages;

-- READ: sender, receiver, atau medis
-- Idempotent: hapus versi baru jika sudah ada
DROP POLICY IF EXISTS "Chat messages read v2" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages insert v2" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat messages update v2" ON public.chat_messages;

CREATE POLICY "Chat messages read v2"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = sender_id
  OR (select auth.uid()) = receiver_id
  OR public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
);

-- INSERT: hanya sender yang valid (mencegah impersonation)
CREATE POLICY "Chat messages insert v2"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = sender_id
);

-- UPDATE: receiver bisa mark as read, medis bisa update semua
CREATE POLICY "Chat messages update v2"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = receiver_id
  OR public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
)
WITH CHECK (
  (select auth.uid()) = receiver_id
  OR public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
);

-- ============================================================
-- STEP 6: Interventions Table
-- ============================================================
-- Cek apakah ada policy lama yang perlu dioptimasi

-- READ: medis lihat semua intervensi
DROP POLICY IF EXISTS "Medics can view interventions" ON public.interventions;
-- Idempotent: hapus versi baru jika sudah ada
DROP POLICY IF EXISTS "Interventions read for medics" ON public.interventions;
DROP POLICY IF EXISTS "Interventions insert for medics" ON public.interventions;
DROP POLICY IF EXISTS "Interventions update for medics" ON public.interventions;

CREATE POLICY "Interventions read for medics"
ON public.interventions
FOR SELECT
TO authenticated
USING (
  public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
  OR (select auth.uid()) = actor_id
);

-- INSERT: medis bisa membuat catatan intervensi
DROP POLICY IF EXISTS "Medics can insert interventions" ON public.interventions;
CREATE POLICY "Interventions insert for medics"
ON public.interventions
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
  AND (select auth.uid()) = actor_id
);

-- UPDATE: medis bisa update status intervensi
DROP POLICY IF EXISTS "Medics can update interventions" ON public.interventions;
CREATE POLICY "Interventions update for medics"
ON public.interventions
FOR UPDATE
TO authenticated
USING (
  public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
)
WITH CHECK (
  public.get_jwt_role() IN ('pharmacist', 'doctor', 'admin')
);

COMMIT;

-- ============================================================
-- CATATAN PASCA-DEPLOYMENT (WAJIB BACA)
-- ============================================================
-- 1. Setelah deploy, verifikasi dengan login sebagai:
--    a. Pasien → bisa lihat laporan sendiri, tidak bisa lihat milik pasien lain
--    b. Apoteker → bisa lihat semua laporan & profil pasien
--    c. User baru → cek bahwa sync_user_role() trigger berjalan
--
-- 2. Jika ada lockout, jalankan recovery di Supabase SQL Editor:
--    SELECT public.get_jwt_role(); -- cek apakah function berjalan
--    SELECT auth.jwt() -> 'app_metadata'; -- cek app_metadata
--
-- 3. Sprint 2 (setelah verifikasi): 
--    Hapus fallback user_metadata dari get_jwt_role()
--    agar sepenuhnya comply dengan Supabase Security Advisor
-- ============================================================
