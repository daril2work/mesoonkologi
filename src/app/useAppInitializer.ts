import { useEffect } from 'react'
import { supabase } from '@lib/supabase'
import { useAuthStore } from '@features/auth/store'
import { useQueryClient } from '@tanstack/react-query'

export function useAppInitializer() {
  const { setSession } = useAuthStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    // 1. Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If logging out, clear the entire query cache (SEC-HC-05)
      if (!session) {
        queryClient.clear()
      }
      setSession(session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, queryClient])
}
