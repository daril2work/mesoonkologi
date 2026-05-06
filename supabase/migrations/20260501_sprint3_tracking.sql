-- ============================================================
-- MESO App — Sprint 3 Migration
-- ============================================================

-- M-09: Education Tracking Table
-- Tracks which education materials have been completed by which patients
CREATE TABLE IF NOT EXISTS public.patient_education_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.education_materials(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(patient_id, material_id)
);

-- Enable RLS for education tracking
ALTER TABLE public.patient_education_tracking ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (can be refined later)
CREATE POLICY "Users can view their own education progress" ON public.patient_education_tracking
    FOR SELECT USING (auth.uid() = patient_id);

CREATE POLICY "Pharmacists can view all education progress" ON public.patient_education_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('pharmacist', 'doctor')
        )
    );

CREATE POLICY "Pharmacists can record education progress" ON public.patient_education_tracking
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'pharmacist'
        )
    );

-- M-10: Ensure interventions status can be updated
-- (Already exists in many cases, but adding a policy helper if needed)
-- Add index for performance on tracking
CREATE INDEX IF NOT EXISTS idx_edu_tracking_patient ON public.patient_education_tracking(patient_id);
