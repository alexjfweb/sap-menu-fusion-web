import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  configuration: any;
  webhook_url?: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export const usePaymentMethodValidation = () => {
  const { data: paymentMethods, isLoading, refetch } = useQuery({
    queryKey: ['payment-methods-validation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  const validatePaymentMethod = (method: any): ValidationResult => {
    if (!method.is_active) {
      return { isValid: false, message: 'Método de pago inactivo' };
    }

    switch (method.type) {
      case 'stripe':
        if (!method.configuration?.public_key || !method.configuration?.secret_key) {
          return { 
            isValid: false, 
            message: 'Configuración incompleta - Faltan claves de API' 
          };
        }
        break;
      
      case 'paypal':
        if (!method.configuration?.email) {
          return { 
            isValid: false, 
            message: 'Configuración incompleta - Falta email' 
          };
        }
        break;
      
      case 'mercado_pago':
        // Verificar que tenga tanto public_key como private_key
        if (!method.configuration?.public_key || !method.configuration?.private_key) {
          return { 
            isValid: false, 
            message: 'Configuración incompleta - Faltan claves de Mercado Pago' 
          };
        }
        break;
      
      case 'nequi':
        if (!method.configuration?.phone_number) {
          return { 
            isValid: false, 
            message: 'Configuración incompleta - Falta número de teléfono' 
          };
        }
        if (!/^\d{10}$/.test(method.configuration.phone_number)) {
          return { 
            isValid: false, 
            message: 'Configuración inválida - Número de teléfono debe tener 10 dígitos' 
          };
        }
        break;
      
      case 'qr_code':
      case 'daviplata':
        if (!method.webhook_url || method.webhook_url.trim() === '') {
          return { 
            isValid: false, 
            message: 'Configuración incompleta - Falta código QR' 
          };
        }
        break;
      
      case 'cash_on_delivery':
        // Este método no requiere configuración especial
        break;
      
      default:
        return { 
          isValid: false, 
          message: 'Tipo de método de pago no válido' 
        };
    }

    return { isValid: true };
  };

  const getValidatedMethods = () => {
    if (!paymentMethods) return [];
    
    const validated = paymentMethods.map(method => ({
      ...method,
      validation: validatePaymentMethod(method)
    }));
    
    // Debug logs para identificar el problema
    console.log('🔍 [Payment Validation] Métodos encontrados:', paymentMethods.length);
    console.log('📋 [Payment Validation] Datos:', paymentMethods);
    console.log('✅ [Payment Validation] Métodos validados:', validated);
    
    return validated;
  };

  const getAvailableMethods = () => {
    return getValidatedMethods().filter(method => method.validation.isValid);
  };

  const getUnavailableMethods = () => {
    return getValidatedMethods().filter(method => !method.validation.isValid);
  };

  return {
    paymentMethods,
    isLoading,
    refetch,
    validatePaymentMethod,
    getValidatedMethods,
    getAvailableMethods,
    getUnavailableMethods
  };
};