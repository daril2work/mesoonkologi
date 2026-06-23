import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

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

      // Alert via Telegram untuk diteruskan ke Dokter Jaga
      const sendAlert = async () => {
        try {
          const { data, error } = await supabase.functions.invoke('send-telegram', {
            body: { reportId: variables.reportId }
          })

          if (error || (data && data.error)) {
            throw new Error(error?.message || data?.error || 'Unknown error')
          }
          
          logger.info('[Escalation Telegram Alert] Successfully sent to Telegram', { reportId: variables.reportId })
        } catch (err: unknown) {
          logger.error('[Escalation Telegram Alert Error]', err instanceof Error ? err.message : err)
        }
      }
      sendAlert()
    },
  })
}
