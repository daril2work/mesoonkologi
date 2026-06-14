// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno context
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// SMELL-05: Proxy untuk cek status Fonnte — token tidak pernah dikirim ke browser
// @ts-ignore: Deno context
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:5173'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // Cek bahwa caller adalah authenticated user
    // @ts-ignore: Deno context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore: Deno context
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Sesi tidak valid' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Ambil token Fonnte dari Supabase Secrets (prioritas) atau DB via service role
    // Token TIDAK pernah di-return ke client — hanya digunakan server-side
    // @ts-ignore: Deno context
    let token = Deno.env.get('FONNTE_TOKEN')

    if (!token) {
      // Fallback: baca dari DB menggunakan service role (hanya pharmacist/admin bisa baca via RLS)
      // @ts-ignore: Deno context
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      const adminClient = createClient(supabaseUrl, supabaseServiceKey)
      const { data } = await adminClient
        .from('system_settings')
        .select('value')
        .eq('key', 'fonnte_token')
        .single()
      token = data?.value ?? null
    }

    if (!token) {
      return new Response(
        JSON.stringify({ status: false, device_status: null, error: 'Token belum dikonfigurasi' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Panggil Fonnte API dari server — token tidak terekspos ke browser
    const res = await fetch('https://api.fonnte.com/device', {
      method: 'POST',
      headers: { 'Authorization': token }
    })

    const result = await res.json()

    // Return hanya status — BUKAN token
    return new Response(
      JSON.stringify({
        status: result.status,
        device_status: result.device_status ?? null,
        name: result.name ?? null,
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
