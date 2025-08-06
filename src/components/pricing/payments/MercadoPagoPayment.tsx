import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, Loader2, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMercadoPagoPayment } from '@/hooks/useMercadoPagoPayment';

interface MercadoPagoPaymentProps {
  plan: {
    id: string;
    name: string;
    monthlyPrice: number;
  };
  onSuccess: () => void;
}

type PaymentStep = 'form' | 'processing' | 'redirecting' | 'error';

const MercadoPagoPayment = ({ plan, onSuccess }: MercadoPagoPaymentProps) => {
  const [step, setStep] = useState<PaymentStep>('form');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: ''
  });
  const { createPaymentPreference, redirectToPayment, isLoading, error } = useMercadoPagoPayment();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    
    console.log('🚀 [MP Payment] Iniciando proceso de pago para plan:', plan.id);

    try {
      const response = await createPaymentPreference({
        plan_id: plan.id,
        user_email: userInfo.email || undefined,
        user_name: userInfo.name || undefined
      });

      if (response && response.init_point) {
        console.log('✅ [MP Payment] Preferencia creada exitosamente, redirigiendo a:', response.init_point);
        setStep('redirecting');
        
        // Mostrar estado de redirección brevemente antes de redirigir
        setTimeout(() => {
          console.log('🔗 [MP Payment] Ejecutando redirección...');
          redirectToPayment(response.init_point);
        }, 1500);
        
      } else {
        console.error('❌ [MP Payment] No se recibió init_point en la respuesta:', response);
        setStep('error');
        toast({
          variant: 'destructive',
          title: 'Error al generar el pago',
          description: 'No se pudo generar el link de pago. Intenta nuevamente.',
        });
      }
    } catch (err) {
      console.error('❌ [MP Payment] Error en el proceso:', err);
      setStep('error');
      toast({
        variant: 'destructive',
        title: 'Error al procesar el pago',
        description: error || 'Hubo un problema al conectar con Mercado Pago. Intenta nuevamente.',
      });
    }
  };

  const handleRetry = () => {
    setStep('form');
    setUserInfo({ name: '', email: '' });
  };

  if (step === 'processing') {
    return (
      <div className="text-center py-8 space-y-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
        <div>
          <h3 className="text-lg font-semibold mb-2">Generando preferencia de pago...</h3>
          <p className="text-muted-foreground text-sm">
            Estamos creando tu link de pago seguro con Mercado Pago.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'redirecting') {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-2">¡Redirigiendo a Mercado Pago!</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Te estamos llevando a Mercado Pago para completar tu pago de forma segura.
          </p>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm text-green-700">
            <strong>Plan:</strong> {plan.name} - ${plan.monthlyPrice}/mes
          </div>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="text-center py-8 space-y-4">
        <XCircle className="h-12 w-12 text-red-600 mx-auto" />
        <div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error al procesar</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {error || 'Hubo un problema al generar tu preferencia de pago.'}
          </p>
          <Button onClick={handleRetry} className="mt-4">
            Intentar nuevamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Pago con Mercado Pago</h3>
        <Lock className="h-4 w-4 text-green-600" />
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-900">{plan.name}</h4>
            <p className="text-xl font-bold text-blue-600">${plan.monthlyPrice}/mes</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="mp-name">Nombre completo (opcional)</Label>
          <Input
            id="mp-name"
            type="text"
            placeholder="Tu nombre completo"
            value={userInfo.name}
            onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="mp-email">Email (opcional)</Label>
          <Input
            id="mp-email"
            type="email"
            placeholder="tu@email.com"
            value={userInfo.email}
            onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm">
        <h4 className="font-medium text-amber-800 mb-2">Métodos de pago disponibles:</h4>
        <ul className="text-amber-700 space-y-1">
          <li>• Tarjetas de crédito y débito</li>
          <li>• Transferencia bancaria</li>
          <li>• Dinero en cuenta de Mercado Pago</li>
          <li>• Pago en efectivo (según país)</li>
        </ul>
      </div>

      <div className="bg-muted p-3 rounded text-sm">
        <div className="flex justify-between">
          <span>Plan {plan.name}</span>
          <span>${plan.monthlyPrice}/mes</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total hoy</span>
          <span>${plan.monthlyPrice}</span>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Continuar con Mercado Pago
          </>
        )}
      </Button>

      <div className="text-xs text-center text-muted-foreground">
        Al continuar, aceptas nuestros términos de servicio y política de privacidad.
        Serás redirigido a Mercado Pago para completar el pago de forma segura.
      </div>
    </form>
  );
};

export default MercadoPagoPayment;