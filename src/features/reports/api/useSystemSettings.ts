// ============================================================
// MESO App — useSystemSettings Custom Hook
// INT-02: Menggantikan pola useEffect + direct Supabase query di PharmacistSettings.tsx
// Menggunakan React Query untuk caching, retry otomatis, dan konsistensi arsitektur.
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { toast } from 'react-hot-toast'

// Kunci query untuk cache React Query
const SETTINGS_QUERY_KEY = ['systemSettings']

// Tipe settings yang dikelola
export interface SystemSettings {
  pharmacistWa: string
  doctorWa: string
  // fonnte_token TIDAK di-expose ke UI layer — hanya ada di DB/Secrets
}

// ============================================================
// Fetch settings dari Supabase (tanpa fonnte_token — sesuai RLS v3)
// ============================================================
async function fetchSystemSettings(): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['pharmacist_wa', 'doctor_wa'])

  if (error) throw error

  const map = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]))
  return {
    pharmacistWa: map['pharmacist_wa'] ?? '',
    doctorWa: map['doctor_wa'] ?? '',
  }
}

export function useFonnteStatus() {
  return useQuery({
    queryKey: ['fonnteStatus'],
    queryFn: checkFonnteStatusViaServer,
    staleTime: 60 * 1000, // 1 menit
    refetchOnWindowFocus: false,
  })
}

// ============================================================
// Hook utama: membaca settings
// ============================================================
export function useSystemSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchSystemSettings,
    staleTime: 5 * 60 * 1000, // 5 menit cache
  })
}

// ============================================================
// Mutation: simpan nomor WA petugas
// ============================================================
export function useSaveWaSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: { pharmacistWa: string; doctorWa: string }) => {
      const { error } = await supabase
        .from('system_settings')
        .upsert([
          { key: 'pharmacist_wa', value: settings.pharmacistWa.trim() },
          { key: 'doctor_wa', value: settings.doctorWa.trim() },
        ])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
      toast.success('Nomor WhatsApp petugas in-charge berhasil disimpan!', {
        icon: '✅',
        style: { border: '1px solid #e5f9f5' },
      })
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error(`Gagal menyimpan pengaturan WhatsApp: ${message}`)
    },
  })
}

// ============================================================
// Mutation: simpan Fonnte token
// SMELL-05: Token TIDAK di-check dari browser — hanya disimpan ke DB.
// Status Fonnte di-check lewat Edge Function check-fonnte-status.
// ============================================================
export function useSaveFonnteToken() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase
        .from('system_settings')
        .upsert([{ key: 'fonnte_token', value: token.trim() }])

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Token API Fonnte berhasil disimpan!', {
        icon: '🔑',
        style: { border: '1px solid #e5f9f5' },
      })
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan'
      toast.error(`Gagal menyimpan Token Fonnte: ${message}`)
    },
  })
}

// ============================================================
// Check status Fonnte melalui Edge Function (SMELL-05 fix)
// Token tidak lagi dikirim dari browser — diproksikan via server
// ============================================================
export async function checkFonnteStatusViaServer(): Promise<'connect' | 'disconnect' | 'invalid'> {
  const { data, error } = await supabase.functions.invoke('check-fonnte-status')

  if (error) return 'disconnect'
  if (!data || data.error) return 'invalid'
  if (data.status === true && data.device_status === 'connect') return 'connect'
  if (data.status === true) return 'disconnect'
  return 'invalid'
}
