-- ============================================================
-- MESO App — Ward & Bed Info
-- Menambahkan data lokasi perawatan pasien
-- ============================================================

ALTER TABLE public.profiles 
ADD COLUMN ward TEXT,
ADD COLUMN bed_number TEXT;

-- Update comment
COMMENT ON COLUMN public.profiles.ward IS 'Nama bangsal/paviliun tempat pasien dirawat';
COMMENT ON COLUMN public.profiles.bed_number IS 'Nomor bed pasien';
