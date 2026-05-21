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
    const { phone_number, otp_code, new_password } = await req.json()
    if (!phone_number || !otp_code || !new_password) {
      return new Response(
        JSON.stringify({ error: 'Data tidak lengkap. Harap isi nomor telepon, OTP, dan kata sandi baru.' }),
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

    // Check if the OTP is valid, unused, and not expired
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .select('*')
      .eq('phone_number', cleanPhone)
      .eq('otp_code', otp_code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: 'Kode OTP tidak valid atau telah kedaluwarsa' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Find user's auth ID from profiles
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

    // Mark OTP as used
    const { error: updateOtpError } = await supabaseAdmin
      .from('password_reset_otps')
      .update({ used: true })
      .eq('id', otpData.id)

    if (updateOtpError) {
      // Just log, don't fail the password reset if the OTP check was successful
      console.error('Failed to mark OTP as used:', updateOtpError.message)
    }

    // Update password using Admin Auth API
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

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
