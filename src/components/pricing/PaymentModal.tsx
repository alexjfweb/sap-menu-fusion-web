
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Smartphone, QrCode, Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import StripePayment from './payments/StripePayment';
import NequiPayment from './payments/NequiPayment';
import QRPayment from './payments/QRPayment';
import MercadoPagoPaymentModal from './MercadoPagoPaymentModal';

interface PaymentModalProps {
  plan: {
    id: string;
    name: string;
    price: string;
    monthlyPrice: number;
    features: string[];
  };
  onClose: () => void;
}

type PaymentMethod = 'stripe' | 'nequi' | 'qr' | 'mercadopago';

const PaymentModal = ({ plan, onClose }: PaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe');
  const [step, setStep] = useState<'method' | 'payment' | 'confirmation'>('method');
  const [showMercadoPagoModal, setShowMercadoPagoModal] = useState(false);

  const paymentMethods = [
    {
      id: 'stripe' as PaymentMethod,
      name: 'Tarjeta de Crédito/Débito',
      description: 'Visa, Mastercard, American Express',
      icon: CreditCard,
      badges: ['Más Popular', 'Seguro'],
      features: ['Pago inmediato', 'Certificación PCI DSS', 'Facturación automática']
    },
    {
      id: 'nequi' as PaymentMethod,
      name: 'Nequi',
      description: 'Transferencia PSE - Solo Colombia',
      icon: Smartphone,
      badges: ['Colombia'],
      features: ['Hasta $10M COP', 'Confirmación automática', 'Sin comisiones extra']
    },
    {
      id: 'qr' as PaymentMethod,
      name: 'Código QR',
      description: 'Bancolombia, Daviplata',
      icon: QrCode,
      badges: ['Latam'],
      features: ['Validación < 2min', 'Sin registro', 'Múltiples bancos']
    },
    {
      id: 'mercadopago' as PaymentMethod,
      name: 'Mercado Pago',
      description: 'Tarjetas, transferencias, dinero en cuenta',
      icon: CreditCard,
      badges: ['Argentina', 'Latam'],
      features: ['Checkout seguro', 'Múltiples métodos', 'Aprobación inmediata']
    }
  ];

  const renderPaymentMethod = () => {
    switch (selectedMethod) {
      case 'stripe':
        return <StripePayment plan={plan} onSuccess={() => setStep('confirmation')} />;
      case 'nequi':
        return <NequiPayment plan={plan} onSuccess={() => setStep('confirmation')} />;
      case 'qr':
        return <QRPayment plan={plan} onSuccess={() => setStep('confirmation')} />;
      case 'mercadopago':
        return (
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Proceder con Mercado Pago</h4>
              <p className="text-sm text-blue-700 mb-4">
                Serás redirigido a Mercado Pago para completar tu pago de forma segura.
              </p>
              <Button 
                onClick={() => setShowMercadoPagoModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continuar con Mercado Pago
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderConfirmation = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">¡Suscripción Activada!</h3>
        <p className="text-muted-foreground">
          Tu plan {plan.name} está activo y listo para usar.
        </p>
      </div>
      <div className="bg-muted p-4 rounded-lg text-left">
        <h4 className="font-medium mb-2">Detalles de tu suscripción:</h4>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Plan: {plan.name}</div>
          <div>Precio: {plan.price}/mes</div>
          <div>Próxima facturación: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
          <div>Acceso: Inmediato a todas las funciones</div>
        </div>
      </div>
      <Button onClick={onClose} className="w-full">
        Ir al Dashboard
      </Button>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>Suscripción Segura - {plan.name}</span>
          </DialogTitle>
        </DialogHeader>

        {step === 'method' && (
          <div className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{plan.name}</h3>
                <span className="text-2xl font-bold">{plan.price}/mes</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Facturación mensual automática • Cancela cuando quieras
              </div>
            </div>

            <Separator />

            {/* Payment Methods */}
            <div className="space-y-4">
              <h4 className="font-medium">Selecciona tu método de pago:</h4>
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <div
                    key={method.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      selectedMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-medium">{method.name}</h5>
                          {method.badges.map((badge) => (
                            <Badge key={badge} variant="secondary" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {method.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {method.features.map((feature) => (
                            <span key={feature} className="text-xs bg-secondary px-2 py-1 rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={() => setStep('payment')}>
                Continuar con {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-xs text-muted-foreground text-center bg-secondary/50 p-3 rounded">
              <Shield className="h-4 w-4 inline mr-1" />
              Certificación PCI DSS Nivel 4 • Encriptación end-to-end • Doble autenticación para cambios premium
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setStep('method')}
              className="mb-4"
            >
              ← Volver a métodos de pago
            </Button>
            {renderPaymentMethod()}
          </div>
        )}

        {step === 'confirmation' && renderConfirmation()}

        {/* Mercado Pago Modal */}
        {showMercadoPagoModal && (
          <MercadoPagoPaymentModal
            isOpen={showMercadoPagoModal}
            plan={{
              id: plan.id,
              name: plan.name,
              price: plan.monthlyPrice,
              currency: 'USD'
            }}
            onClose={() => setShowMercadoPagoModal(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
