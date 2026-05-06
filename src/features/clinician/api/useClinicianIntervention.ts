import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export function useClinicianIntervention() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      reportId, 
      doctorNotes, 
      suggestedRegimen,
      resolveEscalation = false
    }: { 
      reportId: string; 
      doctorNotes: string; 
      suggestedRegimen?: string;
      resolveEscalation?: boolean
    }) => {
      const updates: any = {
        doctor_notes: doctorNotes,
        suggested_regimen: suggestedRegimen,
        updated_at: new Date().toISOString()
      }

      if (resolveEscalation) {
        updates.escalation_status = 'resolved'
        updates.status = 'reviewed' // Mark as reviewed to remove from pharmacist queue
      }

      const { data, error } = await supabase
        .from('symptom_reports')
        .update(updates)
        .eq('id', reportId)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientDetail'] })
      queryClient.invalidateQueries({ queryKey: ['clinicianWatchlist'] })
      queryClient.invalidateQueries({ queryKey: ['clinicianHistory'] })
      queryClient.invalidateQueries({ queryKey: ['pharmacistQueue'] })
    },
  })
}
