import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { mapPatientDirectoryRow } from '../utils/reportMapper'

export interface PatientStats {
  total: number
  critical: number
  scheduledThisWeek: number
  completedEducation: number
}

export function usePatientDirectory() {
  return useQuery({
    queryKey: ['patientDirectory'],
    queryFn: async () => {
      // 1. Fetch Patients with their latest report in one query
      // We only select needed columns for security (SEC-01)
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          phone_number,
          current_cycle, 
          cancer_site,
          is_active,
          status_reason,
          symptom_reports (
            created_at, 
            grade_auto, 
            is_sentinel_alert
          )
        `)
        .eq('role', 'patient')
        .order('full_name')

      if (error) throw error

      // Map data together
      return (data || []).map(row => mapPatientDirectoryRow(row as any))
    }
  })
}

export function usePatientStats() {
  return useQuery({
    queryKey: ['patientStats'],
    queryFn: async () => {
      // M-02: Count schedules for this week (Sunday to Sunday)
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)

      // Aggregate stats from Supabase concurrently using Promise.all
      const [
        { count: total },
        { count: critical },
        { count: scheduledThisWeek },
        { count: completedEducation }
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient').eq('is_active', true),
        supabase.from('symptom_reports').select('id', { count: 'exact', head: true }).eq('is_sentinel_alert', true).eq('status', 'pending'),
        supabase
          .from('patient_schedules')
          .select('id', { count: 'exact', head: true })
          .gte('schedule_date', startOfWeek.toISOString())
          .lt('schedule_date', endOfWeek.toISOString()),
        supabase.from('patient_education_tracking').select('id', { count: 'exact', head: true })
      ])

      return {
        total: total ?? 0,
        critical: critical ?? 0,
        scheduledThisWeek: scheduledThisWeek ?? 0,
        completedEducation: completedEducation ?? 0
      } as PatientStats
    }
  })
}
