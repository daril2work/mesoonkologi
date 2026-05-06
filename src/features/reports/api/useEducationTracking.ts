import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export function usePatientEducationProgress(patientId?: string) {
  return useQuery({
    queryKey: ['educationProgress', patientId],
    queryFn: async () => {
      if (!patientId) return []

      const { data, error } = await supabase
        .from('patient_education_tracking')
        .select(`
          *,
          material:education_materials(title)
        `)
        .eq('patient_id', patientId)

      if (error) throw error
      return data
    },
    enabled: !!patientId
  })
}

export function useRecordEducationCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ patientId, materialId }: { patientId: string, materialId: string }) => {
      const { data, error } = await supabase
        .from('patient_education_tracking')
        .upsert({
          patient_id: patientId,
          material_id: materialId,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['educationProgress', variables.patientId] })
      queryClient.invalidateQueries({ queryKey: ['patientStats'] })
    }
  })
}
