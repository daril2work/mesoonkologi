-- ============================================================
-- MESO App — Phase 5: Patient Schedules Schema & Data
-- ============================================================

-- 1. Create Patient Schedules Table
CREATE TABLE IF NOT EXISTS public.patient_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  schedule_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_reminder_set BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.patient_schedules ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Patients can view their own schedules
CREATE POLICY "Patients can view their own schedules"
  ON public.patient_schedules
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Medics can view all schedules
CREATE POLICY "Medics can view all schedules"
  ON public.patient_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pharmacist', 'doctor', 'admin')
    )
  );

-- Medics can insert/update schedules
CREATE POLICY "Medics can manage schedules"
  ON public.patient_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pharmacist', 'doctor', 'admin')
    )
  );

-- 4. Inject Dummy Data
-- We will inject a dummy schedule for the first available patient
DO $$
DECLARE
  target_patient_id UUID;
BEGIN
  -- Get one patient ID (assuming there's at least one patient registered)
  SELECT id INTO target_patient_id FROM public.profiles WHERE role = 'patient' LIMIT 1;
  
  IF target_patient_id IS NOT NULL THEN
    INSERT INTO public.patient_schedules (patient_id, title, schedule_date, location, is_reminder_set)
    VALUES (
      target_patient_id, 
      'Jadwal Kemo Berikutnya', 
      now() + interval '5 days', -- Set 5 days from now
      'Rumah Sakit Kanker Dharmais',
      false
    );
  END IF;
END $$;
