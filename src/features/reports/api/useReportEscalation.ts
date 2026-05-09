import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'
import { fonnteService } from '@/services/fonnte.service'

export function useReportEscalation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reportId, notes: _notes }: { reportId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('symptom_reports')
        .update({ 
          escalation_status: 'escalated',
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()

      if (error) throw error

      // L-01: Ganti console.log dengan structured logger
      logger.info('[Escalation] Report escalated, notifying doctor', { feature: 'escalation', reportId })
      
      return data
    },
    onSuccess: (data, variables) => {
      // H-01: Invalidate pharmacistQueue, reportDetail, DAN patientDetail (fix race condition)
      queryClient.invalidateQueries({ queryKey: ['pharmacistQueue'] })
      queryClient.invalidateQueries({ queryKey: ['reportDetail', variables.reportId] })
      // Invalidasi patientDetail spesifik menggunakan data dari response
      const patientId = data?.[0]?.patient_id
      if (patientId) {
        queryClient.invalidateQueries({ queryKey: ['patientDetail', patientId] })
      }

      // Alert Dokter Jaga jika laporan berhasil dieskalasi
      supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'doctor_wa')
        .single()
        .then(async ({ data: settingData }) => {
          const recipient = settingData?.value
          if (recipient) {
            await fonnteService.sendMessage({
              target: recipient,
              message: 'CITO! Ada laporan MESO yang perlu anda tindak lanjuti segera!'
            })
            logger.info('[Escalation WA Alert] Alert successfully sent to doctor', { recipient })
          }
        })
        .catch((err) => {
          logger.error('[Escalation WA Alert Error]', err)
        })
    },
  })
}
