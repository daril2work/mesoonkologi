import { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'
import toast from 'react-hot-toast'
import { logger } from '@utils/logger'

export function usePatientQolStatus(userId: string | undefined) {
  const [isQolActive, setIsQolActive] = useState(false)

  useEffect(() => {
    if (!userId) return

    // 1. Initial Fetch
    supabase
      .from('profiles')
      .select('id, is_qol_active')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) logger.error('[usePatientQolStatus] Load QoL Error:', error)
        if (data) {
          setIsQolActive(!!data.is_qol_active)
        }
      })

    // 2. Realtime Listener on Patient Profile Row
    const channel = supabase
      .channel(`profile-qol:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          const updatedProfile = payload.new as any
          if (updatedProfile) {
            setIsQolActive(updatedProfile.is_qol_active ?? false)
            toast.success(updatedProfile.is_qol_active 
              ? 'Pemberitahuan: Apoteker telah mengaktifkan Survei Kualitas Hidup (QoL) untuk Anda!' 
              : 'Pemberitahuan: Survei Kualitas Hidup (QoL) telah dinonaktifkan.'
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { isQolActive }
}
