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
      return (data || []).map(row => mapPatientDirectoryRow(row))
    }
  })
}

export function usePatientStats() {
  return useQuery({
    queryKey: ['patientStats'],
    queryFn: async () => {
      // Aggregate stats from Supabase
      const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient')
      const { count: critical } = await supabase.from('symptom_reports').select('*', { count: 'exact', head: true }).eq('is_sentinel_alert', true).eq('status', 'pending')
      
      // M-02: Count schedules for this week (Sunday to Sunday)
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)
      
      const { count: scheduledThisWeek } = await supabase
        .from('patient_schedules')
        .select('*', { count: 'exact', head: true })
        .gte('schedule_date', startOfWeek.toISOString())
        .lt('schedule_date', endOfWeek.toISOString())

      // M-09: Count real education completions
      const { count: completedEducation } = await supabase
        .from('patient_education_tracking')
        .select('*', { count: 'exact', head: true })

      return {
        total: total ?? 0,
        critical: critical ?? 0,
        scheduledThisWeek: scheduledThisWeek ?? 0,
        completedEducation: completedEducation ?? 0
      } as PatientStats
    }
  })
}
