// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno context
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Clean phone number from non-digits
    const cleanPhone = phone_number.replace(/\D/g, '')

    // Initialize Supabase Client with Service Role Key
    // @ts-ignore: Deno context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore: Deno context
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user with phone number exists in profiles
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

    // Generate 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes validity

    // Store OTP in database
    const { error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .insert({
        phone_number: cleanPhone,
        otp_code: otp,
        expires_at: expiresAt,
        used: false
      })

    if (otpError) {
      throw new Error('Gagal membuat kode OTP: ' + otpError.message)
    }

    // Send WhatsApp via Fonnte API
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
      headers: {
        'Authorization': fonnteToken
      },
      body: form
    })

    const fonnteResult = await fonnteRes.json()

    return new Response(
      JSON.stringify({ success: true, message: 'OTP berhasil dikirim ke WhatsApp Anda', details: fonnteResult }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
