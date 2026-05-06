import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import type { SymptomReport } from '../../reports/types'
import { logger } from '@utils/logger'

export function useClinicianWatchlist() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['clinicianWatchlist'],
    queryFn: async (): Promise<SymptomReport[]> => {
      const { data, error } = await supabase
        .from('symptom_reports')
        .select(`
          *,
          patient:profiles!patient_id (
            id, full_name, ward, bed_number, current_cycle
          )
        `)
        .eq('escalation_status', 'escalated')
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
        systolic: item.systolic,
        diastolic: item.diastolic,
        heartRate: item.heart_rate,
        temperature: item.temperature,
        spo2: item.spo2,
        isSentinelAlert: item.is_sentinel_alert,
        gradeAuto: item.grade_auto || 'green',
        status: item.status || 'pending',
        escalationStatus: item.escalation_status,
        createdAt: item.created_at
      }))
    },
    refetchInterval: 30000,
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('clinician-watchlist-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'symptom_reports' }, (payload) => {
        logger.debug('[ClinicianWatchlist] Realtime change detected', payload)
        queryClient.invalidateQueries({ queryKey: ['clinicianWatchlist'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return { 
    watchlist: query.data ?? [], 
    isLoading: query.isLoading, 
    refresh: () => queryClient.invalidateQueries({ queryKey: ['clinicianWatchlist'] }) 
  }
}
