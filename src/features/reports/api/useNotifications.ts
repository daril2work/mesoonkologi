import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useAuthStore } from '@features/auth/store'
import { isToday, isTomorrow, parseISO } from 'date-fns'

export interface NotificationItem {
  id: string
  type: 'evaluation' | 'chat' | 'schedule'
  title: string
  description: string
  createdAt: string
  isRead: boolean
  link?: string
}

export function useNotifications() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return []

      const notifications: NotificationItem[] = []

      // 1. Fetch Unread Chats
      const { data: chats } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (chats) {
        chats.forEach(chat => {
          notifications.push({
            id: chat.id,
            type: 'chat',
            title: 'Pesan Baru',
            description: chat.content.length > 40 ? chat.content.substring(0, 40) + '...' : chat.content,
            createdAt: chat.created_at,
            isRead: false,
            link: '/patient/chat'
          })
        })
      }

      // 2. Fetch Recently Evaluated Reports (last 3 days)
      const { data: rawReports } = await supabase
        .from('symptom_reports')
        .select('*')
        .eq('patient_id', user.id)
        .eq('status', 'reviewed')

      if (rawReports) {
        // Filter locally for the last 3 days to be safe with column names
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

        rawReports
          .filter(r => new Date(r.created_at) > threeDaysAgo)
          .forEach(report => {
            notifications.push({
              id: `report-${report.id}`,
              type: 'evaluation',
              title: 'Evaluasi Selesai',
              description: `Apoteker telah meninjau laporan Anda tanggal ${new Date(report.created_at).toLocaleDateString('id-ID')}`,
              createdAt: report.created_at,
              isRead: false,
              link: '/patient/history'
            })
          })
      }

      // 3. Fetch Upcoming Schedules (Today & Tomorrow)
      const { data: rawSchedules } = await supabase
        .from('patient_schedules')
        .select('*')
        .eq('patient_id', user.id)

      if (rawSchedules) {
        // Filter upcoming manually to avoid 400 Bad Request if 'status' column behaves differently
        const upcomingSchedules = rawSchedules.filter(s => s.status === 'upcoming' || !s.status)
        
        upcomingSchedules.forEach(schedule => {
          const date = parseISO(schedule.schedule_date)
          if (isToday(date) || isTomorrow(date)) {
            notifications.push({
              id: `schedule-${schedule.id}`,
              type: 'schedule',
              title: 'Pengingat Jadwal',
              description: `Anda memiliki jadwal "${schedule.title}" pada ${isToday(date) ? 'Hari Ini' : 'Besok'}`,
              createdAt: schedule.created_at,
              isRead: false,
              link: '/patient/schedule'
            })
          }
        })
      }

      // Sort by date newest first
      return notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for "real-time" feel
  })
}
