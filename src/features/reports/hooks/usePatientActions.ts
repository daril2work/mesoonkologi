import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@features/auth/store'
import { logger } from '@utils/logger'

export function usePatientActions(patientId?: string) {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const [isUpdatingQoL, setIsUpdatingQoL] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const handleDeactivate = async (reason: string) => {
    if (!patientId) return
    setIsDeactivating(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false,
          status_reason: reason,
          deactivated_at: new Date().toISOString()
        })
        .eq('id', patientId)

      if (error) throw error

      // Send system message in chat
      const reasonLabels: Record<string, string> = {
        discharged: 'Selesai Terapi (Discharged)',
        dismissed: 'Keluar dari Program (Dismissed)',
        deceased: 'Meninggal Dunia (Deceased)'
      }
      await supabase.from('chat_messages').insert({
        sender_id: currentUser?.id,
        receiver_id: patientId,
        content: `[SISTEM] Akun pasien telah DINONAKTIFKAN secara administratif oleh Apoteker dengan alasan: ${reasonLabels[reason] || reason}.`
      })

      toast.success('Pasien berhasil dinonaktifkan.')
      
      // Invalidate relevant queries (DRY)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patientDetail'] }),
        queryClient.invalidateQueries({ queryKey: ['chatMessages'] }),
        queryClient.invalidateQueries({ queryKey: ['patientDirectory'] }),
        queryClient.invalidateQueries({ queryKey: ['patientStats'] })
      ])
      
      return true
    } catch (err: any) {
      toast.error('Gagal menonaktifkan pasien: ' + err.message)
      return false
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleReactivate = async () => {
    if (!patientId) return
    setIsDeactivating(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: true,
          status_reason: null,
          deactivated_at: null
        })
        .eq('id', patientId)

      if (error) throw error

      // Send system message in chat
      await supabase.from('chat_messages').insert({
        sender_id: currentUser?.id,
        receiver_id: patientId,
        content: `[SISTEM] Akun pasien telah DIAKTIFKAN KEMBALI oleh Apoteker.`
      })

      toast.success('Pasien berhasil diaktifkan kembali.')
      
      // Invalidate relevant queries (DRY)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patientDetail'] }),
        queryClient.invalidateQueries({ queryKey: ['chatMessages'] }),
        queryClient.invalidateQueries({ queryKey: ['patientDirectory'] }),
        queryClient.invalidateQueries({ queryKey: ['patientStats'] })
      ])
      
      return true
    } catch (err: any) {
      toast.error('Gagal mengaktifkan kembali pasien: ' + err.message)
      return false
    } finally {
      setIsDeactivating(false)
    }
  }

  const toggleQoL = async (currentQolActive: boolean) => {
    if (!patientId) return
    setIsUpdatingQoL(true)
    const nextState = !currentQolActive
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_qol_active: nextState })
        .eq('id', patientId)

      if (error) throw error

      // Send system message in chat
      const messageContent = nextState
        ? `[SISTEM] Apoteker telah MENGAKTIFKAN kuesioner Pemantauan Kualitas Hidup (QoL) untuk pelaporan harian Anda. Silakan isi kuesioner QoL ini pada saat mengirimkan laporan gejala Anda berikutnya.`
        : `[SISTEM] Survei Kualitas Hidup (QoL) telah DINONAKTIFKAN oleh Apoteker.`

      await supabase.from('chat_messages').insert({
        sender_id: currentUser?.id,
        receiver_id: patientId,
        content: messageContent
      })
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patientDetail'] }),
        queryClient.invalidateQueries({ queryKey: ['chatMessages'] })
      ])

      toast.success(nextState 
        ? 'Survei Kualitas Hidup (QoL) berhasil DIAKTIFKAN untuk pasien!' 
        : 'Survei Kualitas Hidup (QoL) dinonaktifkan.'
      )
      return true
    } catch (err) {
      logger.error('Failed to toggle QoL active state:', err instanceof Error ? err : undefined)
      toast.error('Gagal memperbarui status QoL.')
      return false
    } finally {
      setIsUpdatingQoL(false)
    }
  }

  return {
    handleDeactivate,
    handleReactivate,
    toggleQoL,
    isUpdatingQoL,
    isDeactivating
  }
}
