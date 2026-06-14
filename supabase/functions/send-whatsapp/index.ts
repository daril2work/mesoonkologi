// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// SEC-03: CORS dibatasi ke origin spesifik, bukan wildcard (*)
// Tambahkan ALLOWED_ORIGIN ke Supabase Edge Function Secrets
// @ts-ignore: Deno context
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? 'http://localhost:3000'

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

    // SEC-02: Token HARUS berasal dari Supabase Secrets (bukan DB)
    // Hapus fallback DB — paksa FONNTE_TOKEN ada di environment secrets
    // @ts-ignore: Deno context
    const token = Deno.env.get('FONNTE_TOKEN')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'FONNTE_TOKEN belum dikonfigurasi di Supabase Edge Function Secrets' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const form = new FormData()

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

    form.append('target', cleanTarget)
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

    const result = await res.json()

    return new Response(
      JSON.stringify(result),
      { status: res.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
