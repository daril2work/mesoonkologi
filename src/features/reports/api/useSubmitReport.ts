// ============================================================
// MESO App — Submit Report Mutation
// ============================================================
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import type { SymptomData } from '../types'
import { useAuthStore } from '@features/auth/store'
import toast from 'react-hot-toast'
import { detectSentinel, autoGrade } from '@utils/sentinel'
import { logger } from '@utils/logger'
import { fonnteService } from '@/services/fonnte.service'

export function useSubmitReport() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ symptoms, patientId }: { symptoms: SymptomData, patientId?: string }) => {
      if (!user) throw new Error('User tidak terautentikasi')

      const targetId = patientId || user.id

      // Analyze symptoms using CTCAE algorithm
      const isSentinel = detectSentinel(symptoms)
      const computedGrade = autoGrade(symptoms)

      // Insert processed data
      const { data, error } = await supabase
        .from('symptom_reports')
        .insert([
          {
            patient_id: targetId,
            symptoms,
            is_sentinel_alert: isSentinel,
            grade_auto: computedGrade,
            status: 'pending' // Force pending for manual entry
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['patientReports', data.patient_id] })
      queryClient.invalidateQueries({ queryKey: ['pharmacistQueue'] })
      
      toast.success('Laporan berhasil dicatat dan masuk ke antrean peninjauan.', {
        duration: 5000,
        style: { border: '1px solid #e5f9f5' }
      })

      // Alert Apoteker Jaga jika terjadi Sentinel Alert (MESO Mayor)
      if (data?.is_sentinel_alert) {
        const sendAlert = async () => {
          try {
            const { data: settingData, error: settingError } = await supabase
              .from('system_settings')
              .select('value')
              .eq('key', 'pharmacist_wa')
              .single()

            if (settingError) throw settingError

            const recipient = settingData?.value
            if (recipient) {
              await fonnteService.sendMessage({
                target: recipient,
                message: 'CITO! Ada laporan MESO yang perlu anda tindak lanjuti segera!'
              })
              logger.info('[SubmitReport WA Alert] Alert successfully sent to pharmacist', { recipient })
            }
          } catch (err: unknown) {
            logger.error('[SubmitReport WA Alert Error]', err instanceof Error ? err.message : err)
          }
        }
        sendAlert()
      }
    },
    onError: (error) => {
      logger.error('[SubmitReport]', error)
      toast.error('Gagal mengirim laporan. Silakan periksa koneksi Anda atau coba lagi nanti.')
    },
  })
}
