// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// SEC-03: CORS dibatasi ke origin spesifik, bukan wildcard (*)
// Tambahkan ALLOWED_ORIGIN ke Supabase Edge Function Secrets
// @ts-ignore: Deno context
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'https://mesoonkologi.netlify.app'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { target, message, schedule } = await req.json()

    // Validasi input wajib
    if (!target || !message) {
      return new Response(
        JSON.stringify({ error: 'Parameter target dan message wajib diisi' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Bersihkan target: hanya angka, konversi 0xxx → 62xxx
    let cleanTarget = target.replace(/\D/g, '')
    if (cleanTarget.startsWith('0')) {
      cleanTarget = '62' + cleanTarget.slice(1)
    }

    // Validasi: target harus berupa nomor yang valid (min 10 digit)
    if (cleanTarget.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Nomor tujuan tidak valid' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // @ts-ignore: Deno context
    const provider = Deno.env.get('WA_PROVIDER') || 'fonnte'

    let result
    if (provider === 'meta') {
      result = await sendViaMeta(cleanTarget, message)
    } else {
      result = await sendViaFonnte(cleanTarget, message, schedule)
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Pengiriman via Fonnte API (Eksisting/Default)
 */
async function sendViaFonnte(target: string, message: string, schedule?: number) {
  // @ts-ignore: Deno context
  const token = Deno.env.get('FONNTE_TOKEN')

  if (!token) {
    throw new Error('FONNTE_TOKEN belum dikonfigurasi di Supabase Edge Function Secrets')
  }

  const form = new FormData()
  form.append('target', target)
  form.append('message', message)
  form.append('countryCode', '62')
  if (schedule) {
    form.append('schedule', String(schedule))
  }

  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': token
    },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fonnte API error: ${text}`)
  }

  return await res.json()
}

/**
 * Pengiriman via WhatsApp Business API (Meta Graph API)
 * Persiapan untuk masa depan.
 */
async function sendViaMeta(target: string, message: string) {
  // @ts-ignore: Deno context
  const token = Deno.env.get('META_WA_TOKEN')
  // @ts-ignore: Deno context
  const phoneId = Deno.env.get('META_PHONE_ID')

  if (!token || !phoneId) {
    throw new Error('META_WA_TOKEN atau META_PHONE_ID belum dikonfigurasi di Supabase Secrets')
  }

  const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: target,
      type: 'text',
      text: { body: message }
    })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Meta API error: ${text}`)
  }

  return await res.json()
}
