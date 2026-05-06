// ============================================================
// MESO App — Clinical Interventions API
// ============================================================
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useAuthStore } from '@features/auth/store'
import type { Intervention, InterventionStatus } from '../types'

export function useSubmitIntervention() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      reportId, 
      adviceGiven, 
      status = 'observed', 
      escalatedTo 
    }: { 
      reportId: string, 
      adviceGiven: string, 
      status?: InterventionStatus,
      escalatedTo?: string 
    }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('interventions')
        .insert([
          {
            report_id: reportId,
            actor_id: user.id,
            advice_given: adviceGiven,
            status,
            escalated_to: escalatedTo
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    // R-05: Optimistic Update for creation
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['interventions', variables.reportId] })
      const previousInterventions = queryClient.getQueryData<Intervention[]>(['interventions', variables.reportId])

      if (previousInterventions) {
        const optimisticIntervention: Intervention = {
          id: 'temp-' + Date.now(),
          reportId: variables.reportId,
          actorId: user?.id ?? '',
          adviceGiven: variables.adviceGiven,
          status: variables.status ?? 'observed',
          escalatedTo: variables.escalatedTo,
          createdAt: new Date().toISOString(),
          actor: {
            id: user?.id ?? '',
            userId: user?.id ?? '',
            fullName: user?.fullName ?? 'Apoteker',
            employeeId: 'TEMP'
          }
        }
        queryClient.setQueryData(['interventions', variables.reportId], [optimisticIntervention, ...previousInterventions])
      }

      return { previousInterventions }
    },
    onError: (_err, variables, context) => {
      if (context?.previousInterventions) {
        queryClient.setQueryData(['interventions', variables.reportId], context.previousInterventions)
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patientDetail'] })
      queryClient.invalidateQueries({ queryKey: ['interventions', variables.reportId] })
      queryClient.invalidateQueries({ queryKey: ['pharmacistQueue'] })
    }
  })
}

export function useInterventions(reportId?: string) {
  return useQuery({
    queryKey: ['interventions', reportId],
    queryFn: async () => {
      if (!reportId) return []

      const { data, error } = await supabase
        .from('interventions')
        .select(`
          *,
          actor:profiles!interventions_actor_id_fkey (
            id,
            full_name,
            role
          )
        `)
        .eq('report_id', reportId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(row => ({
        id: row.id,
        reportId: row.report_id,
        actorId: row.actor_id,
        adviceGiven: row.advice_given,
        status: row.status,
        escalatedTo: row.escalated_to,
        createdAt: row.created_at,
        actor: row.actor
      })) as Intervention[]
    },
    enabled: !!reportId
  })
}
export function useUpdateInterventionStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: InterventionStatus, reportId: string }) => {
      const { data, error } = await supabase
        .from('interventions')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    // R-05: Optimistic Update logic
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['interventions', variables.reportId] })

      // Snapshot the previous value
      const previousInterventions = queryClient.getQueryData<Intervention[]>(['interventions', variables.reportId])

      // Optimistically update to the new value
      if (previousInterventions) {
        queryClient.setQueryData(['interventions', variables.reportId], 
          previousInterventions.map(i => i.id === variables.id ? { ...i, status: variables.status } : i)
        )
      }

      return { previousInterventions }
    },
    onError: (_err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousInterventions) {
        queryClient.setQueryData(['interventions', variables.reportId], context.previousInterventions)
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure we're in sync with the server
      queryClient.invalidateQueries({ queryKey: ['interventions', variables.reportId] })
      queryClient.invalidateQueries({ queryKey: ['patientDetail'] })
      queryClient.invalidateQueries({ queryKey: ['pharmacistQueue'] })
    }
  })
}
