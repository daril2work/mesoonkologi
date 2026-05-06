// ============================================================
// MESO App — Pharmacist Action Queue
// ============================================================
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'
import { detectSentinel, autoGrade } from '@utils/sentinel'
import type { SymptomReport } from '../types'

export interface QueueReport extends SymptomReport {
  escalationStatus: 'none' | 'escalated' | 'resolved'
  patient: {
    id: string
    fullName: string
    currentCycle: number
  }
}

export function usePharmacistQueue() {
  return useQuery({
    queryKey: ['pharmacistQueue'],
    queryFn: async () => {
      // Fetch reports and join with the profiles table to get patient names.
      // Ordered by priority: Red first, then yellow, then green.
      const { data, error } = await supabase
        .from('symptom_reports')
        .select(`
          *,
          escalation_status,
          patient:profiles (
            id,
            full_name,
            current_cycle
          )
        `)
        .eq('status', 'pending')
        .order('is_sentinel_alert', { ascending: false })
        .order('created_at', { ascending: true })

      // L-01: Ganti console.log dengan structured logger (debug-only)
      logger.debug('[usePharmacistQueue] Raw data fetched', { feature: 'pharmacistQueue' })
      if (error) {
        logger.error('[usePharmacistQueue] Fetch Error', error, { feature: 'pharmacistQueue' })
        throw error
      }

      return (data || []).map(row => {
        // RECALCULATE status on the fly to ensure logic consistency (ignores dietary)
        const currentSymptoms = row.symptoms || {}
        const isSentinel = detectSentinel(currentSymptoms)
        const computedGrade = autoGrade(currentSymptoms)

        return {
          id: row.id,
          patientId: row.patient_id,
          symptoms: currentSymptoms,
          clinicalNote: row.clinical_note,
          isSentinelAlert: isSentinel,
          gradeAuto: computedGrade,
          gradeFinal: row.grade_final,
          status: row.status,
          escalationStatus: row.escalation_status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          patient: {
            id: Array.isArray(row.patient) ? row.patient[0]?.id : row.patient?.id ?? '',
            fullName: Array.isArray(row.patient) 
                ? row.patient[0]?.full_name 
                : row.patient?.full_name ?? 'Pasien Tidak Diketahui',
            currentCycle: Array.isArray(row.patient)
                ? row.patient[0]?.current_cycle
                : row.patient?.current_cycle ?? 1
          }
        } as QueueReport
      })
    },
    refetchInterval: 1000 * 60, // Auto refresh queue every 60s
  })
}
