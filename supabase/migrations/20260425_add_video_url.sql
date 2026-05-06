-- ============================================================
-- MESO App — Add video_url to education_materials
-- ============================================================

ALTER TABLE public.education_materials 
ADD COLUMN video_url TEXT;
