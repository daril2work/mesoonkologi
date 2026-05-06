import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { useAuthStore } from '@features/auth/store'
import type { ReportChatMessage } from '../types'

// Hook to fetch chat messages between current user and a target user
export function useChatMessages(otherUserId?: string) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // 1. Initial Data Fetch
  const query = useQuery({
    queryKey: ['chatMessages', user?.id, otherUserId],
    queryFn: async () => {
      if (!user || !otherUserId) return []

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error

      return (data || []).map(row => ({
        id: row.id,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        content: row.content,
        isRead: row.is_read,
        createdAt: row.created_at,
      })) as ReportChatMessage[]
    },
    enabled: !!user && !!otherUserId,
  })

  // 2. Realtime Subscription
  useEffect(() => {
    if (!user || !otherUserId) return

    const channel = supabase
      .channel(`chat:${user.id}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          // Optional: filter by sender/receiver if needed, 
          // but invalidating is safer for complex queries
        },
        (payload) => {
          const newMsg = payload.new as any
          // Only invalidate if the new message belongs to THIS chat session
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id)
          ) {
            queryClient.invalidateQueries({ queryKey: ['chatMessages', user.id, otherUserId] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, otherUserId, queryClient])

  return query
}

// Hook to send a chat message
export function useSendMessage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string, content: string }) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: receiverId,
            content,
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', user?.id, variables.receiverId] })
    }
  })
}

// Hook to get the assigned pharmacist
export function useAssignedPharmacist() {
  return useQuery({
    queryKey: ['assignedPharmacist'],
    queryFn: async () => {
      // For this demo, we just get the first pharmacist found in profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('role', 'pharmacist')
        .limit(1)

      if (error || !data || data.length === 0) return null
      return data[0]
    }
  })
}

// Hook to get list of patients that have chatted with the pharmacist
export function usePharmacistChatRooms() {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['chatRooms', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      // Get all unique user IDs that the pharmacist has interacted with
      // In a real app, this would be a separate 'chat_rooms' table
      const { data, error } = await supabase
        .from('chat_messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      if (error) throw error
      
      const otherUserIds = new Set<string>()
      data.forEach(row => {
        if (row.sender_id !== user.id) otherUserIds.add(row.sender_id)
        if (row.receiver_id !== user.id) otherUserIds.add(row.receiver_id)
      })

      if (otherUserIds.size === 0) return []

      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .in('id', Array.from(otherUserIds))
        .eq('role', 'patient')

      if (pError) throw pError
      return profiles || []
    },
    enabled: !!user
  })
}
