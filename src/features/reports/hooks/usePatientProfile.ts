import { useState } from 'react'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface PatientProfileData {
  id: string
  full_name: string | null
  cancer_site: string | null
  date_of_birth: string | null
  phone_number: string | null
  hospital_id: string | null
}

export function usePatientProfile(userId: string | undefined, enabled: boolean = true) {
  const queryClient = useQueryClient()
  const [savingWhatsApp, setSavingWhatsApp] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['patientProfile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required')
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, cancer_site, date_of_birth, phone_number, hospital_id')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data as PatientProfileData
    },
    enabled: !!userId && enabled,
    retry: 1,
  })

  const updatePhone = async (phone: string) => {
    if (!userId) {
      toast.error('Sesi tidak valid, silakan masuk kembali')
      return
    }
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone) {
      toast.error('Mohon isi nomor WhatsApp Anda')
      return
    }

    setSavingWhatsApp(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: cleanPhone })
        .eq('id', userId)

      if (error) throw error

      toast.success('Nomor WhatsApp berhasil diperbarui!')
      await queryClient.invalidateQueries({ queryKey: ['patientProfile', userId] })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
      toast.error('Gagal memperbarui WhatsApp: ' + message)
      logger.error('[UpdateWhatsApp]', err instanceof Error ? err : undefined)
    } finally {
      setSavingWhatsApp(false)
    }
  }

  return {
    profileData: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    updatePhone,
    isSaving: savingWhatsApp,
  }
}
