import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MercadoPagoPreferenceRequest {
  plan_id: string;
  user_email?: string;
  user_name?: string;
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
    const { plan_id, user_email, user_name }: MercadoPagoPreferenceRequest = await req.json();

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
    const external_reference = `plan_${plan_id}_${Date.now()}`;
    
    // Crear preferencia de Mercado Pago
    const preference: MercadoPagoPreference = {
      items: [
        {
          id: plan.id,
          title: plan.name,
          description: plan.description || `Suscripción a ${plan.name}`,
          quantity: 1,
          currency_id: plan.currency || 'USD',
          unit_price: Number(plan.price)
        }
      ],
      back_urls: {
        success: `${req.headers.get('origin') || 'https://76a95464-947c-47c3-89fc-5cdb0f7312f9.lovableproject.com'}/?payment=success&reference=${external_reference}`,
        failure: `${req.headers.get('origin') || 'https://76a95464-947c-47c3-89fc-5cdb0f7312f9.lovableproject.com'}/?payment=failure&reference=${external_reference}`,
        pending: `${req.headers.get('origin') || 'https://76a95464-947c-47c3-89fc-5cdb0f7312f9.lovableproject.com'}/?payment=pending&reference=${external_reference}`
      },
      auto_return: 'approved',
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      external_reference,
      statement_descriptor: 'RestaurantPlatform'
    };

    // Agregar información del pagador si está disponible
    if (user_email || user_name) {
      preference.payer = {
        email: user_email,
        name: user_name
      };
    }

    console.log('🔄 [MP] Enviando preferencia a Mercado Pago...');

    // Llamar a la API de Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference)
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('❌ [MP] Error de API:', mpResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create payment preference',
          details: errorText
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const mpData = await mpResponse.json();
    console.log('✅ [MP] Preferencia creada exitosamente:', mpData.id);

    // Registrar la transacción para seguimiento
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        plan_id: plan.id,
        amount: Number(plan.price),
        currency: plan.currency || 'USD',
        status: 'pending',
        metadata: {
          mercadopago_preference_id: mpData.id,
          external_reference,
          user_email,
          user_name,
          plan_name: plan.name
        }
      });

    if (transactionError) {
      console.error('⚠️ [MP] Error al registrar transacción:', transactionError);
    }

    // Retornar respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        preference_id: mpData.id,
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