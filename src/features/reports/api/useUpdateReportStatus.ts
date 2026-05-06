import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import toast from 'react-hot-toast'
import { logger } from '@utils/logger'

export function useUpdateReportStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string, status: 'pending' | 'reviewed' | 'resolved' }) => {
      const { data, error } = await supabase
        .from('symptom_reports')
        .update({ status })
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh dashboard and detail views
      queryClient.invalidateQueries({ queryKey: ['pharmacistQueue'] })
      queryClient.invalidateQueries({ queryKey: ['patientDetail', data.patient_id] })
      
      toast.success('Laporan berhasil ditandai sebagai selesai ditinjau.', {
        icon: '✅',
        style: { border: '1px solid #e5f9f5' }
      })
    },
    onError: (error) => {
      logger.error('[UpdateReportStatus]', error)
      toast.error('Gagal memperbarui status laporan.')
    }
  })
}
