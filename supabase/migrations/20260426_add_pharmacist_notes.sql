-- ============================================================
-- MESO App — Pharmacist Feedback Column
-- Menambahkan kolom untuk update balik dari apoteker ke dokter
-- ============================================================

ALTER TABLE public.symptom_reports 
ADD COLUMN IF NOT EXISTS pharmacist_notes TEXT;
