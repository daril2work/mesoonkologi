// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore: Deno context
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore: Deno context
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://mesoonkologi.netlify.app'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { reportId } = await req.json()
    if (!reportId) {
      return new Response(JSON.stringify({ error: 'Missing reportId' }), { 
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      })
    }

    // @ts-ignore: Deno context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    // @ts-ignore: Deno context
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get report & patient details
    const { data: report, error: reportError } = await supabaseAdmin
      .from('symptom_reports')
      .select('*, profiles:patient_id(id, full_name)')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      throw new Error('Report not found')
    }

    const patientName = report.profiles?.full_name || 'Tanpa Nama'
    const patientId = report.profiles?.id || report.patient_id

    // Secure HTML string builder
    const safeName = patientName
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    const appUrl = ALLOWED_ORIGIN
    const detailLink = `${appUrl}/pharmacist/patients/${patientId}`

    const tgMessage = `🚨 <b>ESKALASI MESO (CITO)</b> 🚨

<b>Pasien:</b> ${safeName}
<b>ID Pasien:</b> <code>${patientId}</code>

Terdapat pelaporan efek samping Mayor yang telah di-eskalasi oleh Apoteker dan membutuhkan instruksi medis segera.

<i>Mohon Apoteker jaga untuk meneruskan pesan ini ke WhatsApp Dokter Onkologi yang bertugas.</i>

<b>Tautan Detail Pasien:</b>
<a href="${detailLink}">Buka Rekam Medis</a>`

    // @ts-ignore: Deno context
    const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    // @ts-ignore: Deno context
    const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID')

    if (!telegramBotToken || !telegramChatId) {
      throw new Error('Telegram credentials not configured')
    }

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
      const errText = await tgRes.text()
      console.error('Failed to send Telegram message:', errText)
      throw new Error('Failed to send Telegram message')
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notifikasi eskalasi Telegram berhasil dikirim.' }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
