import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MercadoPagoPaymentRequest {
  plan_id: string;
  user_email?: string;
  user_name?: string;
  user_id?: string;
}

interface MercadoPagoPaymentResponse {
  success: boolean;
  preapproval_id?: string;
  preference_id?: string;
  init_point: string;
  sandbox_init_point: string;
  external_reference: string;
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
  };
}

export const useMercadoPagoPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createPaymentPreference = async (
    request: MercadoPagoPaymentRequest
  ): Promise<MercadoPagoPaymentResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 [MP Hook] Creando preferencia de pago para plan:', request.plan_id);

      const { data, error: functionError } = await supabase.functions.invoke(
        'create-mercadopago-preference',
        {
          body: request
        }
      );

      if (functionError) {
        console.error('❌ [MP Hook] Error de función:', functionError);
        throw new Error(functionError.message || 'Error al crear preferencia de pago');
      }

      if (!data.success) {
        console.error('❌ [MP Hook] Respuesta de error:', data);
        throw new Error(data.error || 'Error desconocido al crear preferencia');
      }

      console.log('✅ [MP Hook] Suscripción creada exitosamente:', data.preapproval_id || data.preference_id);
      
      toast({
        title: "Suscripción creada",
        description: "Redirigiendo a Mercado Pago para autorizar la suscripción...",
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ [MP Hook] Error general:', errorMessage);
      
      setError(errorMessage);
      
      // Provide clearer error messages for common issues
      let userFriendlyMessage = errorMessage;
      if (/unauthorized/i.test(errorMessage) || /access token/i.test(errorMessage)) {
        userFriendlyMessage = 'Token de acceso inválido o sin permisos. Usa el Access Token del vendedor de Mercado Pago (TEST- en sandbox) en Configuración de Pagos → Mercado Pago. No uses el email del comprador.';
      } else if (errorMessage.includes('Cannot operate between different countries')) {
        userFriendlyMessage = 'Error de país: La cuenta de Mercado Pago no coincide con tu ubicación. Contacta al soporte.';
      } else if (errorMessage.includes('currency')) {
        userFriendlyMessage = 'Error de moneda: El plan no es compatible con tu método de pago.';
      } else if (errorMessage.includes('Internal server error')) {
        userFriendlyMessage = 'Error de configuración de Mercado Pago. Si usas sandbox, necesitas un email de prueba colombiano. Contacta al soporte.';
      } else if (errorMessage.includes('test_payer_email')) {
        userFriendlyMessage = 'Se requiere un email de prueba colombiano para el modo sandbox. Contacta al administrador.';
      }
      
      toast({
        title: "Error al procesar pago",
        description: userFriendlyMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToPayment = (initPoint: string) => {
    console.log('🔗 [MP Hook] Redirigiendo a:', initPoint);
    window.location.href = initPoint;
  };

  return {
    createPaymentPreference,
    redirectToPayment,
    isLoading,
    error,
  };
};