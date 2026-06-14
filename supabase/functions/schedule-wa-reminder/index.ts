// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno context
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// INT-04: WA reminder dijadwalkan dari server, bukan dari browser
// Server mengambil phone dan nama pasien dari DB menggunakan service role
// Server menghitung waktu H-1 dengan timezone Jakarta yang konsisten
// @ts-ignore: Deno context
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://mesoonkologi.netlify.app'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WIB timezone offset (UTC+7)
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

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

    // Verifikasi caller terautentikasi
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

    const { patientId, scheduleDate, scheduleTitle } = await req.json()

    if (!patientId || !scheduleDate) {
      return new Response(
        JSON.stringify({ error: 'Parameter patientId dan scheduleDate wajib diisi' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Ambil data pasien (nama + nomor WA) menggunakan service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: patientProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('full_name, phone_number')
      .eq('id', patientId)
      .single()

    if (profileError || !patientProfile?.phone_number) {
      return new Response(
        JSON.stringify({ error: 'Pasien tidak ditemukan atau nomor WA tidak tersedia' }),
        { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Ambil token Fonnte dari Secrets (server-side — aman)
    // @ts-ignore: Deno context
    const fonnteToken = Deno.env.get('FONNTE_TOKEN')
    if (!fonnteToken) {
      return new Response(
        JSON.stringify({ error: 'FONNTE_TOKEN belum dikonfigurasi di Supabase Secrets' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Hitung waktu H-1 di SERVER (bukan browser — konsisten & tidak bisa dimanipulasi)
    const appointmentTime = new Date(scheduleDate)
    const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000)
    const now = new Date()

    // Jika reminder sudah lewat, jadwalkan 5 menit dari sekarang sebagai fallback
    const targetTime = reminderTime > now ? reminderTime : new Date(now.getTime() + 5 * 60 * 1000)
    const scheduleTimestamp = Math.floor(targetTime.getTime() / 1000)

    // Format tanggal dalam WIB untuk pesan WA
    const wibTime = new Date(appointmentTime.getTime())
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const dayName = dayNames[wibTime.getDay()]
    const monthName = monthNames[wibTime.getMonth()]
    const dateStr = `${dayName}, ${wibTime.getDate()} ${monthName} ${wibTime.getFullYear()}`
    const timeStr = `${String(wibTime.getHours()).padStart(2, '0')}:${String(wibTime.getMinutes()).padStart(2, '0')}`

    const patientFirstName = patientProfile.full_name.split(' ')[0]
    const title = scheduleTitle ?? 'Kontrol Pasca Kemo'

    const message = `Halo Ibu/Bapak *${patientProfile.full_name}*,\n\n` +
      `Ini adalah pengingat jadwal kunjungan dari MESO App:\n\n` +
      `📋 *${title}*\n` +
      `📅 ${dateStr}\n` +
      `⏰ Pukul ${timeStr} WIB\n\n` +
      `Mohon hadir tepat waktu. Jika ada pertanyaan, silakan hubungi apoteker Anda.\n\n` +
      `Terima kasih, ${patientFirstName}! 🙏\nMESO App`

    // Format nomor telepon
    let phone = patientProfile.phone_number.replace(/\D/g, '')
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1)
    }

    // Kirim ke Fonnte dengan schedule timestamp
    const form = new FormData()
    form.append('target', phone)
    form.append('message', message)
    form.append('countryCode', '62')
    form.append('schedule', String(scheduleTimestamp))

    const fonnteRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': fonnteToken },
      body: form,
    })

    const fonnteResult = await fonnteRes.json()

    return new Response(
      JSON.stringify({
        success: true,
        scheduledFor: targetTime.toISOString(),
        fonnte: fonnteResult,
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
