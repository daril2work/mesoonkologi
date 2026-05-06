-- ============================================================
-- MESO App — Status Eskalasi Laporan
-- Menambahkan kolom untuk melacak status eskalasi ke dokter
-- ============================================================

-- 1. Buat tipe enum untuk status eskalasi
CREATE TYPE public.escalation_status AS ENUM ('none', 'escalated', 'resolved');

-- 2. Tambahkan kolom ke tabel reports
ALTER TABLE public.symptom_reports 
ADD COLUMN escalation_status public.escalation_status DEFAULT 'none';

-- 3. Tambahkan kolom untuk catatan dokter (opsional, untuk dashboard dokter nanti)
ALTER TABLE public.symptom_reports 
ADD COLUMN doctor_notes TEXT;
