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

// SEC-04: Batas maksimal percobaan OTP salah sebelum diinvalidasi
const MAX_OTP_ATTEMPTS = 5

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { phone_number } = await req.json()
    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: 'Nomor telepon harus diisi' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Bersihkan nomor dari non-digit
    const cleanPhone = phone_number.replace(/\D/g, '')

    // Initialize Supabase Admin Client
    // @ts-ignore: Deno context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore: Deno context
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // === SEC-04: Rate Limiting ===
    // Cek apakah sudah ada OTP aktif (belum expired, belum dipakai) untuk nomor ini.
    // Jika ada, tolak request — paksa user tunggu hingga OTP sebelumnya expired.
    const { data: activeOtp, error: activeOtpError } = await supabaseAdmin
      .from('password_reset_otps')
      .select('id, expires_at')
      .eq('phone_number', cleanPhone)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle()

    if (!activeOtpError && activeOtp) {
      // Hitung sisa waktu tunggu
      const expiresAt = new Date(activeOtp.expires_at)
      const remainingMs = expiresAt.getTime() - Date.now()
      const remainingMins = Math.ceil(remainingMs / (1000 * 60))
      return new Response(
        JSON.stringify({
          error: `Kode OTP sudah dikirim. Tunggu ${remainingMins} menit sebelum meminta kode baru.`
        }),
        { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Cek apakah user dengan nomor telepon ini terdaftar
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('phone_number', cleanPhone)
      .limit(1)
      .maybeSingle()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Nomor WhatsApp tidak terdaftar di sistem' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // === SEC-04: Invalidasi OTP Lama ===
    // Sebelum membuat OTP baru, invalidasi semua OTP lama yang mungkin tersisa
    // (misalnya yang sudah terlanjur expired tapi belum ditandai used)
    await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('phone_number', cleanPhone)
      .eq('used', false)

    // === SEC-04: Generate OTP dengan crypto (bukan Math.random) ===
    // Math.random() tidak cryptographically secure — gunakan Web Crypto API
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    const otp = (100000 + (array[0] % 900000)).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 menit

    // Simpan OTP baru ke database
    const { error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .insert({
        phone_number: cleanPhone,
        otp_code: otp,
        expires_at: expiresAt,
        used: false,
        attempt_count: 0,
      })

    if (otpError) {
      throw new Error('Gagal membuat kode OTP: ' + otpError.message)
    }

    // SEC-02: Token Fonnte HANYA dari Supabase Secrets — tidak boleh dari DB
    // @ts-ignore: Deno context
    const fonnteToken = Deno.env.get('FONNTE_TOKEN')
    if (!fonnteToken) {
      throw new Error('FONNTE_TOKEN belum dikonfigurasi di Supabase Secrets')
    }

    let fonntePhone = cleanPhone
    if (fonntePhone.startsWith('0')) {
      fonntePhone = '62' + fonntePhone.slice(1)
    }

    const message = `Halo Ibu/Bapak *${profile.full_name}*,\n\nKode OTP untuk mengatur ulang kata sandi Anda adalah *${otp}*.\n\nKode ini berlaku selama *5 menit*. Mohon tidak memberikan kode ini kepada siapa pun demi keamanan akun Anda.\n\nTerima kasih,\nMESO App`

    const form = new FormData()
    form.append('target', fonntePhone)
    form.append('message', message)
    form.append('countryCode', '62')

    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': fonnteToken },
      body: form
    })

    const fonnteResult = await fonnteRes.json()

    return new Response(
      JSON.stringify({ success: true, message: 'OTP berhasil dikirim ke WhatsApp Anda', details: fonnteResult }),
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
