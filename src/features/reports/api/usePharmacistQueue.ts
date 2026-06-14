// ============================================================
// MESO App — Pharmacist Action Queue
// ============================================================
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'
import { detectSentinel, autoGrade } from '@utils/sentinel'
import type { SymptomReport } from '../types'

// ============================================================
// Typed shape dari Supabase JOIN response
// patient adalah satu-ke-satu join dari profiles via patient_id
// Supabase bisa return object atau array[0] — kita handle keduanya
// ============================================================
interface SupabaseJoinedPatient {
  id: string
  full_name: string | null
  current_cycle: number | null
}

interface SupabaseQueueRow {
  id: string
  patient_id: string
  symptoms: Record<string, number>
  clinical_note: string | null
  is_sentinel_alert: boolean | null
  grade_auto: string | null
  grade_final: string | null
  status: string
  escalation_status: 'none' | 'escalated' | 'resolved'
  created_at: string
  updated_at: string
  // Supabase JOIN: bisa berupa objek langsung atau array dengan 1 elemen
  patient: SupabaseJoinedPatient | SupabaseJoinedPatient[] | null
}

// Helper: normalisasi patient JOIN ke objek tunggal
function resolvePatient(patient: SupabaseQueueRow['patient']): SupabaseJoinedPatient {
  if (Array.isArray(patient)) return patient[0] ?? { id: '', full_name: null, current_cycle: null }
  return patient ?? { id: '', full_name: null, current_cycle: null }
}

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
          id,
          patient_id,
          symptoms,
          clinical_note,
          is_sentinel_alert,
          grade_auto,
          grade_final,
          status,
          escalation_status,
          created_at,
          updated_at,
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

      return (data as SupabaseQueueRow[] || []).map(row => {
        // RECALCULATE status on the fly to ensure logic consistency (ignores dietary)
        const currentSymptoms = row.symptoms || {}
        const isSentinel = detectSentinel(currentSymptoms)
        const computedGrade = autoGrade(currentSymptoms)

        const patient = resolvePatient(row.patient)

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
            id: patient.id ?? '',
            fullName: patient.full_name ?? 'Pasien Tidak Diketahui',
            currentCycle: patient.current_cycle ?? 1,
          }
        } as QueueReport
      })
    },
    refetchInterval: 1000 * 60, // Auto refresh queue every 60s
  })
}
