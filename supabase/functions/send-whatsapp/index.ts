// @ts-ignore: Deno context
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { target, message } = await req.json()
    // @ts-ignore: Deno context
    const token = Deno.env.get('FONNTE_TOKEN')

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'FONNTE_TOKEN not configured in Edge Function' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const form = new FormData()
    // Clean target from non-digits and ensure it starts with 62 or 0
    let cleanTarget = target.replace(/\D/g, '')
    if (cleanTarget.startsWith('0')) {
      cleanTarget = '62' + cleanTarget.slice(1)
    }

    form.append('target', cleanTarget)
    form.append('message', message)
    form.append('countryCode', '62')

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
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
