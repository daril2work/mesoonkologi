-- ============================================================
-- MESO App — Fix Reports RLS (JWT Performance Fix)
-- ============================================================

-- Drop old policies that use slow and potentially recursive EXISTS subqueries
DROP POLICY IF EXISTS "Medics can view all reports" ON public.symptom_reports;
DROP POLICY IF EXISTS "Medics can update reports" ON public.symptom_reports;

-- Create new policies using fast JWT role checks
CREATE POLICY "Medics can view all reports v2"
ON public.symptom_reports
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('pharmacist', 'doctor', 'admin')
  OR auth.uid() = patient_id
);

CREATE POLICY "Medics can update reports v2"
ON public.symptom_reports
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('pharmacist', 'doctor', 'admin')
);
