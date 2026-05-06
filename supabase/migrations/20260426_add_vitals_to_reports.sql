-- ============================================================
-- MESO App — Vitalitas & QoL Reports
-- Menambahkan data klinis untuk pemantauan dokter
-- ============================================================

ALTER TABLE public.symptom_reports 
ADD COLUMN systolic INTEGER,
ADD COLUMN diastolic INTEGER,
ADD COLUMN heart_rate INTEGER,
ADD COLUMN temperature NUMERIC(3,1),
ADD COLUMN spo2 INTEGER,
ADD COLUMN qol_score NUMERIC(3,1);

-- Comment untuk dokumentasi kolom
COMMENT ON COLUMN public.symptom_reports.systolic IS 'Tekanan darah sistolik (mmHg)';
COMMENT ON COLUMN public.symptom_reports.diastolic IS 'Tekanan darah diastolik (mmHg)';
COMMENT ON COLUMN public.symptom_reports.heart_rate IS 'Detak jantung (bpm)';
COMMENT ON COLUMN public.symptom_reports.temperature IS 'Suhu tubuh (Celsius)';
COMMENT ON COLUMN public.symptom_reports.spo2 IS 'Saturasi Oksigen (%)';
COMMENT ON COLUMN public.symptom_reports.qol_score IS 'Skala Quality of Life (1-10)';
