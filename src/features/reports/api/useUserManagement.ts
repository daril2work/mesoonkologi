import { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'

export interface AppUserProfile {
  id: string
  full_name: string | null
  role: 'pharmacist' | 'doctor' | 'patient'
  is_active: boolean
}

export function useStaffUsers() {
  const [users, setUsers] = useState<AppUserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active')
        .in('role', ['pharmacist', 'doctor'])
        .order('full_name', { ascending: true })

      if (err) throw err
      setUsers(data as AppUserProfile[])
    } catch (err: any) {
      console.error('[useStaffUsers]', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return { users, isLoading, error, refetch: fetchUsers }
}

export function useSearchUsers(searchQuery: string) {
  const [results, setResults] = useState<AppUserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const search = async () => {
      if (!searchQuery || searchQuery.trim().length < 3) {
        setResults([])
        return
      }

      setIsSearching(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role, is_active')
          .ilike('full_name', `%${searchQuery.trim()}%`)
          .limit(10)

        if (error) throw error
        setResults(data as AppUserProfile[])
      } catch (err: any) {
        console.error('[useSearchUsers]', err)
      } finally {
        setIsSearching(false)
      }
    }

    const timer = setTimeout(search, 500) // debounce
    return () => clearTimeout(timer)
  }, [searchQuery])

  return { results, isSearching }
}

/**
 * SEC-05: updateUserRole dipindahkan ke Edge Function server-side.
 * Caller harus memiliki role pharmacist/admin — diverifikasi di server via JWT.
 * Tidak lagi menggunakan anon client langsung (rentan privilege escalation).
 */
export async function updateUserRole(
  userId: string,
  newRole: 'pharmacist' | 'doctor' | 'patient'
): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: { userId, newRole },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)

  return true
}
