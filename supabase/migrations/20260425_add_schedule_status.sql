-- ============================================================
-- MESO App — Add status to patient_schedules
-- ============================================================

CREATE TYPE public.schedule_status AS ENUM ('Terjadwal', 'Selesai', 'Dibatalkan');

ALTER TABLE public.patient_schedules 
ADD COLUMN status public.schedule_status DEFAULT 'Terjadwal';
