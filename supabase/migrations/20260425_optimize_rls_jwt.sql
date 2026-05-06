-- ============================================================
-- MESO App — Optimasi RLS (JWT Role Claims)
-- Mengganti sub-query EXISTS yang berat dengan pengecekan 
-- langsung pada metadata JWT untuk performa O(1).
-- ============================================================

-- 1. Fungsi untuk sinkronisasi role ke metadata auth.users
-- Ini memastikan role tersimpan di JWT (app_metadata)
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS trigger AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger pada tabel profiles
-- Setiap kali role diubah atau user baru dibuat, sinkronkan ke Auth
DROP TRIGGER IF EXISTS on_profile_updated_sync_role ON public.profiles;
CREATE TRIGGER on_profile_updated_sync_role
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.sync_user_role();

-- 3. Sinkronisasi awal untuk user yang sudah ada
-- Jalankan update dummy untuk memicu trigger pada semua profil
UPDATE public.profiles SET role = role;

-- 4. Optimasi Kebijakan RLS (Profiles)
DROP POLICY IF EXISTS "Users can read own profile." ON public.profiles;
CREATE POLICY "Users can read own profile." 
  ON public.profiles FOR SELECT 
  USING (
    auth.uid() = id OR 
    (auth.jwt() ->> 'role') IN ('pharmacist', 'doctor', 'admin')
  );

-- 5. Optimasi Kebijakan RLS (Symptom Reports)
DROP POLICY IF EXISTS "Medics can view all reports" ON public.symptom_reports;
CREATE POLICY "Medics can view all reports"
  ON public.symptom_reports
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('pharmacist', 'doctor', 'admin') OR
    auth.uid() = patient_id
  );

DROP POLICY IF EXISTS "Medics can update reports" ON public.symptom_reports;
CREATE POLICY "Medics can update reports"
  ON public.symptom_reports
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('pharmacist', 'doctor', 'admin')
  );

-- 6. Optimasi Kebijakan RLS (Chat Messages)
-- Asumsi tabel chat_messages sudah ada
DROP POLICY IF EXISTS "Users can view their chat conversations" ON public.chat_messages;
CREATE POLICY "Users can view their chat conversations"
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id OR
    (auth.jwt() ->> 'role') IN ('pharmacist', 'doctor', 'admin')
  );

-- 7. Optimasi Kebijakan RLS (Education Materials)
DROP POLICY IF EXISTS "Anyone can view education materials" ON public.education_materials;
CREATE POLICY "Anyone can view education materials"
  ON public.education_materials
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Medics can manage education materials" ON public.education_materials;
CREATE POLICY "Medics can manage education materials"
  ON public.education_materials
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('pharmacist', 'admin')
  );
