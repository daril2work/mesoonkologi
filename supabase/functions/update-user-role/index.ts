// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno context
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// SEC-03 & SEC-05: Endpoint admin — CORS ketat + server-side auth check
// @ts-ignore: Deno context
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:3000'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Role yang diizinkan melakukan perubahan role user lain
const AUTHORIZED_ROLES = ['pharmacist', 'admin']

// Role valid yang bisa ditetapkan ke user (doctor disesuaikan dengan DB enum public.app_role)
const VALID_ROLES = ['pharmacist', 'doctor', 'patient', 'admin']

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    // @ts-ignore: Deno context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore: Deno context
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    // @ts-ignore: Deno context
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // === SEC-05: Verifikasi caller menggunakan JWT dari request header ===
    // Gunakan anon client dengan JWT caller untuk cek identitas & role mereka
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Header Authorization tidak ada' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Dapatkan user yang sedang memanggil endpoint ini
    const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Sesi tidak valid atau telah kedaluwarsa' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Ambil profil caller untuk verifikasi role mereka
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    if (callerProfileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Profil caller tidak ditemukan' }),
        { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // === Cek autorisasi: hanya pharmacist/admin yang boleh ubah role ===
    if (!AUTHORIZED_ROLES.includes(callerProfile.role)) {
      return new Response(
        JSON.stringify({ error: `Forbidden: Role '${callerProfile.role}' tidak memiliki izin mengubah role user` }),
        { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { userId, newRole } = await req.json()
    if (!userId || !newRole) {
      return new Response(
        JSON.stringify({ error: 'Parameter userId dan newRole wajib diisi' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Validasi role yang akan ditetapkan
    if (!VALID_ROLES.includes(newRole)) {
      return new Response(
        JSON.stringify({ error: `Role '${newRole}' tidak valid. Pilihan: ${VALID_ROLES.join(', ')}` }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Cegah caller mengubah role dirinya sendiri
    if (userId === callerUser.id) {
      return new Response(
        JSON.stringify({ error: 'Tidak dapat mengubah role akun Anda sendiri' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Eksekusi perubahan role menggunakan service role (bypass RLS)
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (updateError) {
      throw new Error('Gagal memperbarui role: ' + updateError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Role user berhasil diubah menjadi '${newRole}'`,
        changedBy: callerUser.id,
        targetUser: userId,
        newRole,
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
