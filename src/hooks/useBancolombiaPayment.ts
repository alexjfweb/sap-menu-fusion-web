import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

      // Simulate bank transfer creation (replace with real API call)
      const mockResponse: BancolombiaPaymentResponse = {
        success: true,
        payment_reference: `BCO-${Date.now()}`,
        account_details: {
          bank: 'Bancolombia',
          account_number: '123-456-789-01',
          account_type: 'Cuenta Corriente',
          beneficiary: 'Tu Empresa SAS'
        },
        instructions: [
          'Realiza la transferencia desde tu app Bancolombia',
          'Usa el número de referencia proporcionado',
          'El plan se activará automáticamente tras confirmar el pago',
          'Conserva el comprobante de transferencia'
        ]
      };

      console.log('✅ [Bancolombia] Transferencia creada:', mockResponse.payment_reference);
      
      toast({
        title: "Transferencia bancaria generada",
        description: "Sigue las instrucciones para completar el pago",
      });

      return mockResponse;

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