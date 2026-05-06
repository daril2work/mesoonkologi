-- ============================================================
-- MESO App — Phase 3: Reports & Interventions Schema
-- ============================================================

-- 1. Enum Types (Sesuai dengan types.ts kita)
CREATE TYPE public.report_status AS ENUM ('pending', 'reviewed', 'resolved');
CREATE TYPE public.grade_color AS ENUM ('green', 'yellow', 'red');
CREATE TYPE public.intervention_status AS ENUM ('observed', 'escalated', 'resolved');

-- 2. Symptom Reports Table
CREATE TABLE public.symptom_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Raw data input dari aplikasi Frontend
  symptoms JSONB NOT NULL DEFAULT '{}'::jsonb,
  clinical_note TEXT,
  
  -- Auto-grading & Sentinel tracking
  -- Saat ini dibuat nullable karena PM belum ACC algoritma CTCAE
  is_sentinel_alert BOOLEAN DEFAULT false,
  -- Nilai fallback adalah 'green' atau NULL
  grade_auto public.grade_color DEFAULT 'green',
  grade_final public.grade_color,
  status public.report_status NOT NULL DEFAULT 'pending',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Interventions Table (Untuk Fase 4)
CREATE TABLE public.interventions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.symptom_reports(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  advice_given TEXT NOT NULL,
  status public.intervention_status NOT NULL DEFAULT 'observed',
  escalated_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.symptom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies untuk symptom_reports
-- a. Pasien dapat membuat laporan mereka sendiri
CREATE POLICY "Patients can insert their own reports"
  ON public.symptom_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- b. Pasien dapat melihat laporan mereka sendiri
CREATE POLICY "Patients can view their own reports"
  ON public.symptom_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- c. Tenaga Medis (Apoteker/Dokter) dapat melihat semua laporan
-- Kita ambil role dari tabel profiles
CREATE POLICY "Medics can view all reports"
  ON public.symptom_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pharmacist', 'doctor', 'admin')
    )
  );

-- d. Tenaga Medis dapat mengupdate laporan (misal: memberikan grade_final atau mengubah status ke reviewed)
CREATE POLICY "Medics can update reports"
  ON public.symptom_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('pharmacist', 'doctor', 'admin')
    )
  );


-- 6. Trigger untuk updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_symptom_reports_updated
  BEFORE UPDATE ON public.symptom_reports
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
