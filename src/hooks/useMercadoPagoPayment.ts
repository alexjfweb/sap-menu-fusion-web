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
      toast({
        title: "Error al procesar pago",
        description: errorMessage,
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