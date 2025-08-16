import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MercadoPagoPreferenceRequest {
  plan_id: string;
  user_email?: string;
  user_name?: string;
  user_id?: string;
}

interface MercadoPagoItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
}

interface MercadoPagoPreference {
  items: MercadoPagoItem[];
  payer?: {
    name?: string;
    email?: string;
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  notification_url: string;
  external_reference: string;
  statement_descriptor: string;
}

interface MercadoPagoPreapproval {
  reason: string;
  auto_recurring: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
    currency_id: string;
  };
  payer_email?: string;
  back_url: string;
  external_reference: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Obtener datos del request
    const { plan_id, user_email, user_name, user_id }: MercadoPagoPreferenceRequest = await req.json();

    if (!plan_id) {
      return new Response(
        JSON.stringify({ error: 'Plan ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 [MP] Procesando solicitud de preferencia para plan:', plan_id);

    // Obtener detalles del plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('❌ [MP] Error al obtener plan:', planError);
      return new Response(
        JSON.stringify({ error: 'Plan not found or inactive' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Obtener configuración de Mercado Pago
    const { data: mpConfig, error: configError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('type', 'mercado_pago')
      .eq('is_active', true)
      .single();

    if (configError || !mpConfig) {
      console.error('❌ [MP] Error al obtener configuración MP:', configError);
      return new Response(
        JSON.stringify({ error: 'Mercado Pago not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const accessToken = mpConfig.configuration.private_key;
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Mercado Pago access token not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generar referencia externa única
    const external_reference = `subscription_${plan_id}_${Date.now()}`;

    // Normalizar moneda y validar mínimos de MP
    const MIN_AMOUNT_BY_CURRENCY: Record<string, number> = {
      COP: 1600,
      ARS: 1000,
      BRL: 5,
      CLP: 1000,
      MXN: 10,
      USD: 1,
      UYU: 40,
      PEN: 4,
    };

    const planPrice = Number(plan.price);
    const planCurrency = String(plan.currency || 'USD').toUpperCase();
    const accountCurrency = String(mpConfig.configuration?.currency || mpConfig.configuration?.default_currency || planCurrency).toUpperCase();

    let finalAmount = planPrice;
    let finalCurrency = planCurrency;

    if (planCurrency !== accountCurrency) {
      const conversionRate = Number(mpConfig.configuration?.conversion_rate);
      if (conversionRate && !Number.isNaN(conversionRate) && conversionRate > 0) {
        finalAmount = Math.round(planPrice * conversionRate * 100) / 100;
        finalCurrency = accountCurrency;
      } else {
        console.error('❌ [MP] Moneda no coincidente y sin conversion_rate configurado', { planCurrency, accountCurrency });
        return new Response(JSON.stringify({
          success: false,
          code: 'currency_mismatch',
          error: `La moneda del plan (${planCurrency}) no coincide con la de la cuenta de Mercado Pago (${accountCurrency}). Configure conversion_rate o use la moneda correcta.`,
          details: { planCurrency, accountCurrency }
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
      }
    }

    const minAmount = MIN_AMOUNT_BY_CURRENCY[finalCurrency];
    if (typeof minAmount === 'number' && finalAmount < minAmount) {
      console.error('❌ [MP] Monto por debajo del mínimo permitido', { finalAmount, minAmount, finalCurrency });
      return new Response(JSON.stringify({
        success: false,
        code: 'amount_below_minimum',
        error: `El monto (${finalAmount} ${finalCurrency}) es inferior al mínimo permitido por Mercado Pago (${minAmount} ${finalCurrency}).`,
        currency: finalCurrency,
        amount: finalAmount,
        min_allowed: minAmount
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Crear suscripción recurrente con Mercado Pago
    const preapproval: MercadoPagoPreapproval = {
      reason: `Suscripción mensual a ${plan.name}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: finalAmount,
        currency_id: finalCurrency
      },
      payer_email: user_email,
      back_url: `${req.headers.get('origin') || 'https://76a95464-947c-47c3-89fc-5cdb0f7312f9.lovableproject.com'}/?subscription=authorized&reference=${external_reference}`,
      external_reference
    };

    console.log('🔄 [MP] Creando suscripción recurrente...');

    // Llamar a la API de Mercado Pago para crear preapproval
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preapproval)
    });

    if (!mpResponse.ok) {
      const rawText = await mpResponse.text();
      let parsed: any = null;
      try { parsed = JSON.parse(rawText); } catch (_) {}
      console.error('❌ [MP] Error de API:', mpResponse.status, parsed || rawText);
      return new Response(JSON.stringify({
        success: false,
        code: 'mercadopago_api_error',
        mp_status_code: mpResponse.status,
        error: parsed?.message || parsed?.error || 'Error al crear la suscripción en Mercado Pago',
        mp_response: parsed || rawText
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const mpData = await mpResponse.json();
    console.log('✅ [MP] Suscripción creada exitosamente:', mpData.id);

    // Registrar la suscripción en user_subscriptions
    if (user_id) {
      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id,
          plan_id: plan.id,
          mp_preapproval_id: mpData.id,
          status: 'pending',
          metadata: {
            external_reference,
            user_email,
            user_name,
            plan_name: plan.name,
            init_point: mpData.init_point
          }
        });

      if (subscriptionError) {
        console.error('⚠️ [MP] Error al registrar suscripción:', subscriptionError);
      }
    }

    // Registrar la transacción inicial para seguimiento
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        plan_id: plan.id,
        amount: finalAmount,
        currency: finalCurrency,
        status: 'pending',
        metadata: {
          mercadopago_preapproval_id: mpData.id,
          external_reference,
          user_email,
          user_name,
          plan_name: plan.name,
          is_subscription: true
        }
      });

    if (transactionError) {
      console.error('⚠️ [MP] Error al registrar transacción:', transactionError);
    }

    // Retornar respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        preapproval_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
        external_reference,
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ [MP] Error general:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});