// ============================================================
// MESO App — Patient Schedule Query
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import type { PatientSchedule } from '../types'
import { useAuthStore } from '@features/auth/store'

export function usePatientSchedule() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['patientSchedules', user?.id],
    queryFn: async (): Promise<PatientSchedule[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('patient_schedules')
        .select('*')
        .eq('patient_id', user.id)
        .order('schedule_date', { ascending: true })

      if (error) throw error

      return (data || []).map((item) => ({
        id: item.id,
        patientId: item.patient_id,
        title: item.title,
        scheduleDate: item.schedule_date,
        location: item.location,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })) as PatientSchedule[]
    },
    enabled: !!user,
  })
}

export function usePharmacistSchedules() {
  return useQuery({
    queryKey: ['pharmacistSchedules'],
    queryFn: async () => {
      // M-03: Filter by current month to optimize performance
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      const { data, error } = await supabase
        .from('patient_schedules')
        .select(`
          *,
          patient:profiles(id, full_name, phone_number)
        `)
        .gte('schedule_date', firstDay.toISOString())
        .lte('schedule_date', lastDay.toISOString())
        .order('schedule_date', { ascending: true })

      if (error) throw error

      return (data || []).map((item: any) => ({
        id: item.id,
        patientId: item.patient_id,
        patientName: item.patient?.full_name ?? 'Tanpa Nama',
        patientPhone: item.patient?.phone_number ?? '',
        title: item.title,
        scheduleDate: item.schedule_date,
        location: item.location,
        status: item.status,
      }))
    }
  })
}

export function useUpdateScheduleStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('patient_schedules')
        .update({ status })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacistSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['patientSchedules'] })
    }
  })
}

export function useCreateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (schedule: any) => {
      const { data, error } = await supabase
        .from('patient_schedules')
        .insert([schedule])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacistSchedules'] })
    }
  })
}
