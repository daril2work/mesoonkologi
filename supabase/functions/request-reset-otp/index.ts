// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno context
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// SEC-03: CORS dibatasi ke origin spesifik, bukan wildcard (*)
// @ts-ignore: Deno context
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://mesoonkologi.netlify.app'

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
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
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
      .from('otp_requests')
      .select('id, expires_at')
      .eq('phone_number', cleanPhone)
      .eq('status', 'pending')
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
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
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
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // === SEC-04: Invalidasi OTP Lama ===
    // Sebelum membuat OTP baru, invalidasi semua OTP lama yang mungkin tersisa
    // (misalnya yang sudah terlanjur expired tapi belum ditandai used)
    await supabaseAdmin
      .from('otp_requests')
      .update({ status: 'expired' })
      .eq('phone_number', cleanPhone)
      .eq('status', 'pending')

    // === SEC-04: Generate OTP dengan crypto (bukan Math.random) ===
    // Math.random() tidak cryptographically secure — gunakan Web Crypto API
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    const otp = (100000 + (array[0] % 900000)).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 menit

    // Simpan OTP baru ke database
    const { error: otpError } = await supabaseAdmin
      .from('otp_requests')
      .insert({
        phone_number: cleanPhone,
        otp_code: otp,
        expires_at: expiresAt,
        status: 'pending',
        attempt_count: 0,
      })

    if (otpError) {
      throw new Error('Gagal membuat kode OTP: ' + otpError.message)
    }

    // SEC-02: Ambil Telegram Credentials
    // @ts-ignore: Deno context
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    // @ts-ignore: Deno context
    const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID')

    if (!telegramBotToken || !telegramChatId) {
      console.warn('Telegram credentials not configured. OTP requested but not sent to Telegram.');
    } else {
      let waPhone = cleanPhone
      if (waPhone.startsWith('0')) {
        waPhone = '62' + waPhone.slice(1)
      }

      // Format URL Magic Link Fallback
      // Membawa param phone agar jika user klik link dari WA, langsung membuka form verifikasi OTP.
      const resetLink = `${ALLOWED_ORIGIN}/forgot-password?phone=${waPhone}`
      const waText = `Halo ini Admin MESO.\nKode OTP Anda: ${otp}.\nKlik link berikut untuk melanjutkan: ${resetLink}`
      const encodedWaText = encodeURIComponent(waText)
      const waMeLink = `https://wa.me/${waPhone}?text=${encodedWaText}`

      // Escape HTML characters to prevent parse errors
      const safeName = (profile.full_name || 'Tanpa Nama')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      const tgMessage = `🚨 <b>Request OTP Baru!</b>\nNomor: <code>+${waPhone}</code>\nNama: ${safeName}\n\n<a href="${waMeLink}">Klik untuk Kirim WA ke Pasien</a>`

      const tgRes = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: tgMessage,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      })

      if (!tgRes.ok) {
        console.error('Failed to send Telegram message:', await tgRes.text())
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Permintaan OTP telah diteruskan ke sistem.' }),
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
