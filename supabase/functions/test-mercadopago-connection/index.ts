// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { access_token } = await req.json()

    if (!access_token || typeof access_token !== 'string') {
      return new Response(JSON.stringify({ success: false, message: 'Falta access_token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Llamada a la API de Mercado Pago para validar el token
    const mpRes = await fetch('https://api.mercadopago.com/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await mpRes.json()

    if (!mpRes.ok) {
      console.error('❌ [MP Test] Error users/me:', data)
      return new Response(
        JSON.stringify({ success: false, message: data?.message || 'No autorizado', raw: data }),
        { status: mpRes.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const result = {
      success: true,
      id: data.id,
      nickname: data.nickname,
      email: data.email,
      site_id: data.site_id,
      default_currency_id: data.default_currency_id,
      sandbox_mode: access_token.startsWith('TEST-'),
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err: any) {
    console.error('❌ [MP Test] Error inesperado:', err?.message || err)
    return new Response(JSON.stringify({ success: false, message: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
}

Deno.serve(handler)
