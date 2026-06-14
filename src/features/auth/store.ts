// ============================================================
// Auth Domain — Zustand Store
// ============================================================
import { create } from 'zustand'
import { supabase } from '@lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { AuthUser, UserRole } from './types'
import { logger } from '@utils/logger'

interface AuthState {
  // State
  session: Session | null
  user: AuthUser | null
  isLoading: boolean
  isInitialized: boolean

  // Actions
  setSession: (session: Session | null) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,

  setSession: async (session) => {
    if (!session) {
      set({ session: null, user: null, isLoading: false, isInitialized: true })
      return
    }

    // Try to get profile data to enrich user object
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, is_active')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profile) {
      // SMELL-07: Jangan log user ID di console production — pakai structured logger
      // yang hanya aktif di development (level DEBUG)
      logger.error('[AuthStore] Critical: Profile not found for authenticated user', profileError, {
        feature: 'auth',
        // user ID TIDAK disertakan di log untuk mencegah PII leak di production console
      })
      set({ session: null, user: null, isLoading: false, isInitialized: true })
      return
    }

    const authUser: AuthUser = {
      id: session.user.id,
      email: session.user.email ?? '',
      role: profile.role as UserRole,
      fullName: profile.full_name ?? null,
      createdAt: session.user.created_at,
      isActive: profile.is_active ?? true,
    }

    set({
      session,
      user: authUser,
      isLoading: false,
      isInitialized: true,
    })
  },

  logout: async () => {
    // H-02: Eager clear untuk cegah race condition post-logout.
    // State dibersihkan DULU sebelum request ke Supabase,
    // sehingga komponen tidak bisa mengakses user data sensitif
    // di window antara signOut request dan response.
    set({ isLoading: true, user: null, session: null })
    await supabase.auth.signOut()
    set({ isLoading: false, isInitialized: true })
  },
}))
