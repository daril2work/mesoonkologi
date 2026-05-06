// ============================================================
// MESO App — Fetch Reports Query
// ============================================================
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useAuthStore } from '@features/auth/store'
import type { SymptomReport } from '../types'

export function usePatientReports(limit = 10) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['patientReports', user?.id, limit],
    queryFn: async () => {
      if (!user) throw new Error('User tidak terautentikasi')

      const { data, error } = await supabase
        .from('symptom_reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      
      // Map database snake_case to frontend camelCase
      return (data || []).map(row => ({
        id: row.id,
        patientId: row.patient_id,
        symptoms: row.symptoms,
        clinicalNote: row.clinical_note,
        isSentinelAlert: row.is_sentinel_alert,
        gradeAuto: row.grade_auto,
        gradeFinal: row.grade_final,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })) as SymptomReport[]
    },
    enabled: !!user, // Only run if user is logged in
  })
}
