-- ============================================================
-- MESO App — Suggested Regimen Column
-- Menambahkan kolom untuk saran perubahan regimen dari dokter
-- ============================================================

ALTER TABLE public.symptom_reports 
ADD COLUMN IF NOT EXISTS suggested_regimen TEXT;
