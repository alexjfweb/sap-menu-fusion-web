import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MPWebhookBody {
  type?: string
  action?: string
  data?: { id?: string }
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Accept GET and POST notifications from Mercado Pago
    const url = new URL(req.url)
    const qpType = url.searchParams.get('topic') || url.searchParams.get('type') || undefined
    const qpId = url.searchParams.get('id') || url.searchParams.get('data.id') || undefined

    let body: MPWebhookBody | undefined
    if (req.method === 'POST') {
      try {
        body = await req.json()
      } catch (_) {
        // ignore malformed body
      }
    }

    const eventType = body?.type || qpType || body?.action || 'unknown'
    const entityId = body?.data?.id || qpId || undefined

    if (!entityId) {
      return new Response(
        JSON.stringify({ error: 'Missing entity id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🔔 [MP Webhook] type=${eventType} id=${entityId}`)

    // Load Mercado Pago access token from payment_methods config
    const { data: mpConfig, error: configError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('type', 'mercado_pago')
      .eq('is_active', true)
      .single()

    if (configError || !mpConfig?.configuration?.private_key) {
      console.error('❌ [MP Webhook] MP config missing:', configError)
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken: string = mpConfig.configuration.private_key

    // Resolve payment/subscription data
    let paymentInfo: any = null
    let externalReference: string | null = null
    let status: string | null = null

    if ((eventType || '').includes('preapproval') || (eventType || '').includes('subscription')) {
      // Handle subscription events
      const subRes = await fetch(`https://api.mercadopago.com/preapproval/${entityId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!subRes.ok) {
        const t = await subRes.text()
        console.error('❌ [MP Webhook] Subscription fetch error:', subRes.status, t)
        return new Response('ok', { headers: corsHeaders })
      }
      const subscription = await subRes.json()
      paymentInfo = subscription
      externalReference = subscription.external_reference || null
      status = subscription.status || null
      
      // Update user_subscriptions table
      if (externalReference && subscription.id) {
        const subscriptionStatus = status === 'authorized' ? 'active' : 
                                  status === 'cancelled' ? 'cancelled' :
                                  status === 'paused' ? 'paused' : 'pending'
        
        const { error: subUpdateError } = await supabase
          .from('user_subscriptions')
          .update({ 
            status: subscriptionStatus,
            current_period_start: subscription.status === 'authorized' ? new Date().toISOString() : undefined,
            current_period_end: subscription.status === 'authorized' ? 
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            next_billing_date: subscription.status === 'authorized' ? 
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
            metadata: {
              ...(subscription.metadata || {}),
              mp_status: status,
              last_updated: new Date().toISOString()
            }
          })
          .eq('mp_preapproval_id', subscription.id)
        
        if (subUpdateError) {
          console.error('⚠️ [MP Webhook] Error updating subscription:', subUpdateError)
        } else {
          console.log(`✅ [MP Webhook] Subscription ${subscription.id} updated to ${subscriptionStatus}`)
        }
      }
    } else if ((eventType || '').includes('merchant_order')) {
      const moRes = await fetch(`https://api.mercadopago.com/merchant_orders/${entityId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!moRes.ok) {
        const t = await moRes.text()
        console.error('❌ [MP Webhook] MO fetch error:', moRes.status, t)
        return new Response('ok', { headers: corsHeaders })
      }
      const mo = await moRes.json()
      paymentInfo = mo
      externalReference = mo.external_reference || null
      // Derive status from payments inside merchant order
      const paid = (mo.payments || []).some((p: any) => p.status === 'approved')
      const rejected = (mo.payments || []).every((p: any) => p.status === 'rejected')
      status = paid ? 'approved' : rejected ? 'rejected' : 'pending'
    } else {
      // Default: treat as payment
      const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${entityId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!payRes.ok) {
        const t = await payRes.text()
        console.error('❌ [MP Webhook] Payment fetch error:', payRes.status, t)
        return new Response('ok', { headers: corsHeaders })
      }
      const payment = await payRes.json()
      paymentInfo = payment
      externalReference = payment.external_reference || null
      status = payment.status || null
    }

    // Map MP status to app status (including subscription statuses)
    const statusMap: Record<string, string> = {
      approved: 'completed',
      authorized: 'completed',
      pending: 'pending',
      in_process: 'pending',
      in_mediation: 'pending',
      rejected: 'failed',
      cancelled: 'canceled',
      refunded: 'refunded',
      charged_back: 'chargeback',
      paused: 'paused',
    }

    const appStatus = status ? (statusMap[status] || status) : 'pending'

    // Try to locate existing transaction by external_reference stored in metadata
    let tx = null as any
    if (externalReference) {
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id, metadata')
        .contains('metadata', { external_reference: externalReference })
        .limit(1)
        .maybeSingle()
      tx = existingTx
    }

    const mergeMetadata = (oldMeta: any) => ({
      ...(oldMeta || {}),
      external_reference: externalReference,
      mercadopago_payment_id: paymentInfo?.id || null,
      mercadopago_status: status || null,
      mercadopago_raw: paymentInfo || null,
    })

    if (tx?.id) {
      const { error: updErr } = await supabase
        .from('transactions')
        .update({ status: appStatus, metadata: mergeMetadata(tx.metadata) })
        .eq('id', tx.id)
      if (updErr) console.warn('⚠️ [MP Webhook] Update tx warn:', updErr)
    } else {
      // Fallback insert if we cannot match an existing one
      const amount = paymentInfo?.transaction_amount || paymentInfo?.total_amount || null
      const currency = paymentInfo?.currency_id || 'USD'
      const planId = paymentInfo?.metadata?.plan_id || null
      const planName = paymentInfo?.description || paymentInfo?.metadata?.plan_name || null
      const { error: insErr } = await supabase
        .from('transactions')
        .insert({
          plan_id: planId,
          amount: amount ? Number(amount) : null,
          currency,
          status: appStatus,
          metadata: mergeMetadata({ plan_name: planName })
        })
      if (insErr) console.warn('⚠️ [MP Webhook] Insert tx warn:', insErr)
    }

    console.log('✅ [MP Webhook] Processed successfully:', { externalReference, appStatus })

    return new Response('ok', { headers: corsHeaders })
  } catch (error) {
    console.error('❌ [MP Webhook] Error:', error)
    return new Response('ok', { headers: corsHeaders })
  }
})
