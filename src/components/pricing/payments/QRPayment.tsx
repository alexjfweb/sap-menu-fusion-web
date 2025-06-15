
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Clock, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRPaymentProps {
  plan: {
    id: string;
    name: string;
    monthlyPrice: number;
  };
  onSuccess: () => void;
}

const QRPayment = ({ plan, onSuccess }: QRPaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'qr' | 'waiting'>('form');
  const [paymentData, setPaymentData] = useState({
    provider: '',
    email: '',
    phone: ''
  });
  const { toast } = useToast();

  const providers = [
    { value: 'bancolombia', label: 'Bancolombia' },
    { value: 'daviplata', label: 'Daviplata' },
    { value: 'mercadopago', label: 'Mercado Pago' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('qr');

    // Simulate QR generation
    setTimeout(() => {
      setStep('waiting');
      setLoading(false);
    }, 1000);
  };

  const handleQRScan = async () => {
    setLoading(true);

    try {
      // Simulate QR payment confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Pago confirmado',
        description: 'Tu pago por código QR ha sido procesado exitosamente.',
      });
      
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error en el pago',
        description: 'No se pudo confirmar el pago. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'qr') {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
          <QrCode className="h-24 w-24 text-gray-400" />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Escanea el código QR</h3>
          <p className="text-muted-foreground text-sm">
            Abre tu app {providers.find(p => p.value === paymentData.provider)?.label} y escanea el código
          </p>
        </div>
        <Button onClick={() => setStep('waiting')} className="w-full">
          Ya escaneé el código
        </Button>
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Smartphone className="h-8 w-8 text-blue-600 animate-pulse" />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Esperando confirmación</h3>
          <p className="text-muted-foreground text-sm">
            Confirma el pago de ${plan.monthlyPrice} USD en tu aplicación
          </p>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Validación en menos de 2 minutos</span>
        </div>
        <div className="space-y-2">
          <Button onClick={handleQRScan} className="w-full" disabled={loading}>
            {loading ? 'Confirmando...' : 'Confirmar Pago'}
          </Button>
          <Button variant="outline" onClick={() => setStep('qr')}>
            Volver al QR
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <QrCode className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">Pago con código QR</h3>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-sm">
        <h4 className="font-medium mb-2">Opciones disponibles:</h4>
        <ul className="space-y-1 text-muted-foreground">
          <li>• Bancolombia (Colombia)</li>
          <li>• Daviplata (Colombia)</li>
          <li>• Mercado Pago (Latinoamérica)</li>
          <li>• Validación automática en menos de 2 minutos</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="provider">Proveedor de pago</Label>
          <Select value={paymentData.provider} onValueChange={(value) => setPaymentData(prev => ({ ...prev, provider: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu banco o aplicación" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.value} value={provider.value}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={paymentData.email}
            onChange={(e) => setPaymentData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            placeholder="+57 300 123 4567"
            value={paymentData.phone}
            onChange={(e) => setPaymentData(prev => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="bg-muted p-3 rounded text-sm">
        <div className="flex justify-between">
          <span>Plan {plan.name}</span>
          <span>${plan.monthlyPrice} USD</span>
        </div>
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading || !paymentData.provider}>
        {loading ? 'Generando QR...' : 'Generar código QR'}
      </Button>

      <div className="text-xs text-center text-muted-foreground">
        El código QR será válido por 10 minutos.
        Sin registro adicional requerido.
      </div>
    </form>
  );
};

export default QRPayment;
