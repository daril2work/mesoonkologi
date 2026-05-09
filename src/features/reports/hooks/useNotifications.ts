import { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'
import { usePharmacistQueue } from '../api/usePharmacistQueue'
import { useAuthStore } from '@features/auth/store'
import { logger } from '@utils/logger'

export function useNotifications() {
  const { user } = useAuthStore()
  const { data: queue, refetch: refetchQueue } = usePharmacistQueue()
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  // 1. Initial Fetch for Unread Messages
  useEffect(() => {
    if (!user) return

    const fetchUnreadMessages = async () => {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (!error && count !== null) {
        setUnreadMessagesCount(count)
      }
    }

    fetchUnreadMessages()
  }, [user])

  // 2. Realtime Subscriptions
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('realtime-notifications')
      // Listen to Reports
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'symptom_reports'
        },
        (payload) => {
          logger.debug('[Notifications] Report change', payload)
          refetchQueue()
        }
      )
      // Listen to Chats
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          logger.debug('[Notifications] New message', payload)
          setUnreadMessagesCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, refetchQueue])

  // Filter out reports already marked read by the pharmacist
  const readReportIds: string[] = JSON.parse(localStorage.getItem('read_pharma_reports') || '[]')
  const activeReports = queue?.filter(r => !readReportIds.includes(r.id)) || []
  const activeReportsCount = activeReports.length

  // Total count = Queue items + Unread messages
  const totalUnread = activeReportsCount + unreadMessagesCount

  return { 
    unreadCount: totalUnread,
    reportsCount: activeReportsCount,
    messagesCount: unreadMessagesCount,
    queueIds: queue?.map(r => r.id) || []
  }
}
