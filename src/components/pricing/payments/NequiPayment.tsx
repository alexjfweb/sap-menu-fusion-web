
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NequiPaymentProps {
  plan: {
    id: string;
    name: string;
    monthlyPrice: number;
  };
  onSuccess: () => void;
}

const NequiPayment = ({ plan, onSuccess }: NequiPaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'waiting'>('form');
  const [userData, setUserData] = useState({
    phone: '',
    email: '',
    name: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('waiting');

    try {
      // Simulate Nequi payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: 'Pago confirmado',
        description: 'Tu transferencia Nequi ha sido procesada exitosamente.',
      });
      
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error en el pago',
        description: 'No se pudo procesar la transferencia. Intenta de nuevo.',
      });
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'waiting') {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
          <Smartphone className="h-8 w-8 text-purple-600 animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Esperando confirmación</h3>
          <p className="text-muted-foreground text-sm">
            Revisa tu app Nequi y autoriza el pago de ${plan.monthlyPrice} USD
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Tiempo límite: 5 minutos</span>
        </div>
        <Button variant="outline" onClick={() => setStep('form')}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Smartphone className="h-5 w-5 text-purple-600" />
        <h3 className="font-semibold">Pago con Nequi</h3>
      </div>

      <div className="bg-purple-50 p-4 rounded-lg text-sm">
        <h4 className="font-medium mb-2">Información importante:</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Disponible solo para usuarios en Colombia</li>
          <li>• Límite máximo: $10,000,000 COP por transacción</li>
          <li>• Confirmación automática vía webhook</li>
          <li>• Sin comisiones adicionales</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            placeholder="Juan Pérez"
            value={userData.name}
            onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={userData.email}
            onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Número Nequi</Label>
          <Input
            id="phone"
            placeholder="+57 300 123 4567"
            value={userData.phone}
            onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="bg-muted p-3 rounded text-sm">
        <div className="flex justify-between">
          <span>Plan {plan.name}</span>
          <span>${plan.monthlyPrice} USD</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Equivalente aprox.</span>
          <span>₲{(plan.monthlyPrice * 4100).toLocaleString()} COP</span>
        </div>
      </div>

      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
        {loading ? 'Procesando...' : 'Pagar con Nequi'}
      </Button>

      <div className="text-xs text-center text-muted-foreground">
        Se abrirá tu app Nequi para autorizar el pago.
        La confirmación es automática.
      </div>
    </form>
  );
};

export default NequiPayment;
