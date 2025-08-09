import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BancolombiaPaymentRequest {
  plan_id: string;
  user_name?: string;
  user_email?: string;
  amount: number;
}

interface BancolombiaPaymentResponse {
  success: boolean;
  payment_reference: string;
  account_details: {
    bank: string;
    account_number: string;
    account_type: string;
    beneficiary: string;
  };
  instructions: string[];
}

export const useBancolombiaPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const createBankTransfer = async (
    request: BancolombiaPaymentRequest
  ): Promise<BancolombiaPaymentResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 [Bancolombia] Creando transferencia para plan:', request.plan_id);

      // Obtener configuración desde Supabase (superadmin)
      const { data: method, error: pmError } = await supabase
        .from('payment_methods')
        .select('configuration')
        .eq('type', 'bancolombia')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (pmError) throw pmError;

      if (!method) {
        const msg = 'No hay configuración activa de Bancolombia';
        console.warn('⚠️ [Bancolombia]', msg);
        toast({ title: 'Config. no encontrada', description: msg, variant: 'destructive' });
        return null;
      }

      const cfg = (method.configuration || {}) as any;
      const rawType = (cfg.account_type || '').toString().toLowerCase();
      const accountType = rawType.includes('ahorro')
        ? 'Cuenta de Ahorros'
        : rawType.includes('corriente')
        ? 'Cuenta Corriente'
        : 'Cuenta Corriente';

      const instructions: string[] = Array.isArray(cfg.instructions)
        ? cfg.instructions
        : (cfg.instructions
            ? String(cfg.instructions)
                .split('\n')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [
                'Realiza la transferencia desde tu app Bancolombia',
                'Usa el número de referencia proporcionado',
                'El plan se activará automáticamente tras confirmar el pago',
                'Conserva el comprobante de transferencia',
              ]);

      const response: BancolombiaPaymentResponse = {
        success: true,
        payment_reference: `BCO-${Date.now()}`,
        account_details: {
          bank: cfg.bank || 'Bancolombia',
          account_number: cfg.account_number || '000-000-000-00',
          account_type: accountType,
          beneficiary: cfg.beneficiary || 'Tu Empresa',
        },
        instructions,
      };

      console.log('✅ [Bancolombia] Transferencia creada:', response.payment_reference);
      
      toast({
        title: "Transferencia bancaria generada",
        description: "Sigue las instrucciones para completar el pago",
      });

      return response;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ [Bancolombia] Error:', errorMessage);
      
      setError(errorMessage);
      toast({
        title: "Error al generar transferencia",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createBankTransfer,
    isLoading,
    error,
  };
};