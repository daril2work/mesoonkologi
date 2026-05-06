import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import type { SymptomReport } from '../../reports/types'

export function useClinicianHistory() {
  const query = useQuery({
    queryKey: ['clinicianHistory'],
    queryFn: async (): Promise<SymptomReport[]> => {
      const { data, error } = await supabase
        .from('symptom_reports')
        .select(`
          *,
          patient:profiles!patient_id (
            id, full_name, ward, bed_number, current_cycle
          )
        `)
        .neq('escalation_status', 'none')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(item => ({
        id: item.id,
        patientId: item.patient_id,
        patient: {
          id: item.patient.id,
          fullName: item.patient.full_name,
          ward: item.patient.ward,
          bedNumber: item.patient.bed_number,
          currentCycle: item.patient.current_cycle
        },
        symptoms: item.symptoms,
        isSentinelAlert: item.is_sentinel_alert,
        gradeAuto: item.grade_auto || 'green',
        status: item.status || 'pending',
        escalationStatus: item.escalation_status,
        doctorNotes: item.doctor_notes,
        createdAt: item.created_at
      }))
    }
  })

  return { history: query.data ?? [], isLoading: query.isLoading }
}
