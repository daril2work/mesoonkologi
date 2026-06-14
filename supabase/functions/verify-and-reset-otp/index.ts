// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno context
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// SEC-03: CORS dibatasi ke origin spesifik, bukan wildcard (*)
// @ts-ignore: Deno context
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:3000'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SEC-04: Maksimal percobaan verifikasi OTP sebelum diinvalidasi
const MAX_OTP_ATTEMPTS = 5

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { phone_number, otp_code, new_password } = await req.json()
    if (!phone_number || !otp_code || !new_password) {
      return new Response(
        JSON.stringify({ error: 'Data tidak lengkap. Harap isi nomor telepon, OTP, dan kata sandi baru.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Validasi panjang password minimum
    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Kata sandi baru minimal harus 8 karakter.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const cleanPhone = phone_number.replace(/\D/g, '')

    // Initialize Supabase Admin Client
    // @ts-ignore: Deno context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore: Deno context
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // === SEC-04: Cek OTP valid — sertakan attempt_count untuk brute-force protection ===
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .select('id, otp_code, attempt_count, expires_at')
      .eq('phone_number', cleanPhone)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: 'Tidak ada kode OTP aktif untuk nomor ini, atau kode telah kedaluwarsa.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // === SEC-04: Brute-force protection ===
    // Jika sudah mencapai batas percobaan, invalidasi OTP dan tolak
    if (otpData.attempt_count >= MAX_OTP_ATTEMPTS) {
      await supabaseAdmin
        .from('password_reset_otps')
        .update({ used: true })
        .eq('id', otpData.id)

      return new Response(
        JSON.stringify({ error: 'Kode OTP telah diblokir karena terlalu banyak percobaan gagal. Silakan minta kode baru.' }),
        { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // === Verifikasi kode OTP ===
    if (otpData.otp_code !== otp_code) {
      // Increment attempt_count
      const newAttemptCount = otpData.attempt_count + 1
      await supabaseAdmin
        .from('password_reset_otps')
        .update({ attempt_count: newAttemptCount })
        .eq('id', otpData.id)

      const remainingAttempts = MAX_OTP_ATTEMPTS - newAttemptCount
      const errorMessage = remainingAttempts > 0
        ? `Kode OTP tidak valid. Sisa percobaan: ${remainingAttempts}.`
        : 'Kode OTP tidak valid. Percobaan terakhir telah digunakan — kode akan diblokir.'

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // OTP cocok — cari profil user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone_number', cleanPhone)
      .limit(1)
      .maybeSingle()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Akun dengan nomor telepon tersebut tidak ditemukan di profil' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Tandai OTP sebagai sudah terpakai (one-time use — cegah replay attack)
    const { error: updateOtpError } = await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('id', otpData.id)

    if (updateOtpError) {
      console.error('[verify-otp] Failed to mark OTP as used:', updateOtpError.message)
      // Tidak gagalkan reset password jika OTP check berhasil, tapi log error
    }

    // Update password via Admin Auth API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: new_password }
    )

    if (authError) {
      throw new Error('Gagal memperbarui kata sandi: ' + authError.message)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Kata sandi Anda berhasil diperbarui. Silakan login kembali.' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan tidak diketahui'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
