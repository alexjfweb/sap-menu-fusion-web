
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Clock, Smartphone, AlertCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

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
  const isMobile = useIsMobile();

  // Buscar códigos QR disponibles para este plan
  const { data: availableQRCodes, isLoading: qrLoading } = useQuery({
    queryKey: ['available-qr-codes', plan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          subscription_plans(name, price, currency)
        `)
        .eq('plan_id', plan.id)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const providers = [
    { value: 'bancolombia', label: 'Bancolombia' },
    { value: 'daviplata', label: 'Daviplata' },
    { value: 'mercadopago', label: 'Mercado Pago' }
  ];

  const getQRForProvider = (provider: string) => {
    return availableQRCodes?.find(qr => qr.payment_provider === provider);
  };

  const handleQRAction = async (provider: string) => {
    const existingQR = getQRForProvider(provider);
    
    if (existingQR) {
      // Si existe QR, mostrarlo directamente
      setPaymentData(prev => ({ ...prev, provider }));
      setStep('qr');
      
      // En móvil, descargar automáticamente
      if (isMobile && existingQR.qr_image_url) {
        downloadQRImage(existingQR.qr_image_url, `QR-${existingQR.subscription_plans?.name}-${provider}`);
      }
    } else {
      // Si no existe, mostrar error
      toast({
        variant: 'destructive',
        title: 'QR no disponible',
        description: `No hay código QR configurado para ${getProviderLabel(provider)}. Contacta al administrador.`,
      });
    }
  };

  const downloadQRImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'QR descargado',
      description: 'El código QR se ha descargado a tu dispositivo.',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentData.provider) {
      toast({
        variant: 'destructive',
        title: 'Selecciona un proveedor',
        description: 'Debes seleccionar un método de pago.',
      });
      return;
    }

    handleQRAction(paymentData.provider);
  };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      bancolombia: 'Bancolombia',
      daviplata: 'Daviplata',
      mercadopago: 'Mercado Pago'
    };
    return labels[provider] || provider;
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
    const currentQR = getQRForProvider(paymentData.provider);
    
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-48 h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {currentQR?.qr_image_url ? (
            <img 
              src={currentQR.qr_image_url} 
              alt="Código QR" 
              className="w-full h-full object-contain"
            />
          ) : (
            <QrCode className="h-24 w-24 text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-2">
            {isMobile ? 'Código QR descargado' : 'Escanea el código QR'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {isMobile 
              ? `El código QR se ha descargado. Ábrelo desde otro dispositivo para escanearlo con ${getProviderLabel(paymentData.provider)}.`
              : `Abre tu app ${getProviderLabel(paymentData.provider)} y escanea el código`
            }
          </p>
        </div>
        
        {currentQR?.qr_image_url && !isMobile && (
          <Button 
            variant="outline" 
            onClick={() => downloadQRImage(currentQR.qr_image_url!, `QR-${plan.name}-${paymentData.provider}`)}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar QR
          </Button>
        )}
        
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

      {qrLoading ? (
        <div className="bg-muted p-4 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Verificando códigos QR disponibles...</p>
        </div>
      ) : availableQRCodes && availableQRCodes.length > 0 ? (
        <div className="bg-primary/5 p-4 rounded-lg text-sm">
          <h4 className="font-medium mb-2">Métodos QR disponibles:</h4>
          <ul className="space-y-1 text-muted-foreground">
            {providers.map((provider) => {
              const hasQR = getQRForProvider(provider.value);
              return (
                <li key={provider.value} className="flex items-center justify-between">
                  <span>• {provider.label}</span>
                  {hasQR ? (
                    <span className="text-green-600 text-xs">✓ Disponible</span>
                  ) : (
                    <span className="text-orange-600 text-xs">No configurado</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg text-sm">
          <div className="flex items-center space-x-2 text-destructive mb-2">
            <AlertCircle className="h-4 w-4" />
            <h4 className="font-medium">Códigos QR no disponibles</h4>
          </div>
          <p className="text-muted-foreground">
            No hay códigos QR configurados para este plan. Contacta al administrador para habilitar esta opción de pago.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="provider">Proveedor de pago</Label>
          <Select value={paymentData.provider} onValueChange={(value) => setPaymentData(prev => ({ ...prev, provider: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tu banco o aplicación" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => {
                const hasQR = getQRForProvider(provider.value);
                return (
                  <SelectItem 
                    key={provider.value} 
                    value={provider.value}
                    disabled={!hasQR}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{provider.label}</span>
                      {!hasQR && (
                        <span className="text-xs text-muted-foreground ml-2">No disponible</span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
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

      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || !paymentData.provider || !getQRForProvider(paymentData.provider) || qrLoading}
      >
        {loading 
          ? 'Cargando...' 
          : paymentData.provider && getQRForProvider(paymentData.provider)
            ? 'Ver código QR'
            : 'Selecciona un método de pago'
        }
      </Button>

      {availableQRCodes && availableQRCodes.length > 0 ? (
        <div className="text-xs text-center text-muted-foreground">
          Códigos QR válidos por 24 horas.
          {isMobile && " En móvil se descargará automáticamente."}
        </div>
      ) : (
        <div className="text-xs text-center text-orange-600">
          Códigos QR no disponibles para este plan.
        </div>
      )}
    </form>
  );
};

export default QRPayment;
