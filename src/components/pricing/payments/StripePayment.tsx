
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentProps {
  plan: {
    id: string;
    name: string;
    monthlyPrice: number;
  };
  onSuccess: () => void;
}

const StripePayment = ({ plan, onSuccess }: StripePaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    email: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate Stripe payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Pago procesado',
        description: 'Tu suscripción ha sido activada exitosamente.',
      });
      
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error en el pago',
        description: 'No se pudo procesar el pago. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Información de la tarjeta</h3>
        <Lock className="h-4 w-4 text-green-600" />
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={cardData.email}
            onChange={(e) => setCardData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="name">Nombre en la tarjeta</Label>
          <Input
            id="name"
            placeholder="Juan Pérez"
            value={cardData.name}
            onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="number">Número de tarjeta</Label>
          <Input
            id="number"
            placeholder="4242 4242 4242 4242"
            value={cardData.number}
            onChange={(e) => setCardData(prev => ({ ...prev, number: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="expiry">Vencimiento</Label>
            <Input
              id="expiry"
              placeholder="MM/AA"
              value={cardData.expiry}
              onChange={(e) => setCardData(prev => ({ ...prev, expiry: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="cvc">CVC</Label>
            <Input
              id="cvc"
              placeholder="123"
              value={cardData.cvc}
              onChange={(e) => setCardData(prev => ({ ...prev, cvc: e.target.value }))}
              required
            />
          </div>
        </div>
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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Procesando...' : `Pagar $${plan.monthlyPrice}`}
      </Button>

      <div className="text-xs text-center text-muted-foreground">
        Al continuar, aceptas nuestros términos de servicio y política de privacidad.
        Tu suscripción se renovará automáticamente cada mes.
      </div>
    </form>
  );
};

export default StripePayment;
