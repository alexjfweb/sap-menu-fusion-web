
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, QrCode, CreditCard, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodDisplayProps {
  paymentMethod: string;
  nequiNumber?: string;
  nequiQrUrl?: string;
}

const PaymentMethodDisplay = ({ paymentMethod, nequiNumber, nequiQrUrl }: PaymentMethodDisplayProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Número copiado al portapapeles",
    });
  };

  if (paymentMethod === 'nequi' && nequiNumber) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Pago con Nequi</span>
          </CardTitle>
          <CardDescription>
            Transfiere a este número de Nequi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-lg font-mono font-bold">{nequiNumber}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(nequiNumber)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Realiza la transferencia y luego confirma el pago
          </p>
        </CardContent>
      </Card>
    );
  }

  if (paymentMethod === 'qr' && nequiQrUrl) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>Código QR</span>
          </CardTitle>
          <CardDescription>
            Escanea el código QR para pagar
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <img 
            src={nequiQrUrl} 
            alt="Código QR de pago"
            className="mx-auto max-w-48 max-h-48 rounded-lg border"
          />
          <p className="text-sm text-muted-foreground mt-2">
            Escanea con tu app de Nequi
          </p>
        </CardContent>
      </Card>
    );
  }

  if (paymentMethod === 'stripe') {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Pago con Tarjeta</span>
          </CardTitle>
          <CardDescription>
            Serás redirigido a la pasarela de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Haz clic en "Pagar" para ser redirigido a Stripe
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default PaymentMethodDisplay;
