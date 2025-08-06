import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, DollarSign, Shield, Check, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMercadoPagoPayment } from '@/hooks/useMercadoPagoPayment';
import { useBancolombiaPayment } from '@/hooks/useBancolombiaPayment';
import { usePaymentMethodValidation } from '@/hooks/usePaymentMethodValidation';

interface PaymentFormModalProps {
  plan: {
    id: string;
    name: string;
    price: string;
    monthlyPrice: number;
    features: string[];
  };
  onClose: () => void;
}

type PaymentMethod = 'mercado_pago' | 'bancolombia';

interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badges: string[];
  features: string[];
  color: string;
  bgColor: string;
}

const PaymentFormModal = ({ plan, onClose }: PaymentFormModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState<'method' | 'payment' | 'confirmation'>('method');
  
  const { createPaymentPreference, redirectToPayment, isLoading: mpLoading } = useMercadoPagoPayment();
  const { createBankTransfer, isLoading: bancolombiaLoading } = useBancolombiaPayment();
  const { getAvailableMethods } = usePaymentMethodValidation();

  // Configurar métodos según el plan y disponibilidad real
  const getAvailableMethodsForPlan = (): PaymentMethodConfig[] => {
    const planName = plan.name.toLowerCase();
    const availableMethods = getAvailableMethods();
    
    const methodMapping: Record<string, PaymentMethodConfig> = {
      'mercado_pago': {
        id: 'mercado_pago',
        name: 'Mercado Pago',
        description: 'Tarjetas, transferencias y dinero en cuenta',
        icon: DollarSign,
        badges: ['Argentina', 'Latam', 'Seguro'],
        features: ['Checkout seguro', 'Múltiples métodos', 'Aprobación inmediata'],
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      },
      'bancolombia': {
        id: 'bancolombia',
        name: 'Bancolombia',
        description: 'Transferencia bancaria directa',
        icon: Building2,
        badges: ['Colombia', 'Banco'],
        features: ['Transferencia segura', 'Sin comisiones extra', 'Confirmación automática'],
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200'
      }
    };

    // Filter based on configured and available methods
    let configuredMethods = availableMethods
      .filter(method => ['mercado_pago', 'bancolombia'].includes(method.type))
      .map(method => methodMapping[method.type])
      .filter(Boolean);

    // Apply plan restrictions
    if (planName.includes('básico') || planName.includes('basic')) {
      return configuredMethods;
    }
    
    // Planes Estándar y Premium: solo Mercado Pago
    return configuredMethods.filter(method => method.id === 'mercado_pago');
  };

  const handlePaymentProcess = async () => {
    if (!selectedMethod) return;

    try {
      if (selectedMethod === 'mercado_pago') {
        const preference = await createPaymentPreference({
          plan_id: plan.id,
          user_email: 'user@example.com',
          user_name: 'Usuario'
        });

        if (preference) {
          redirectToPayment(preference.init_point);
        }
      } else if (selectedMethod === 'bancolombia') {
        const transfer = await createBankTransfer({
          plan_id: plan.id,
          user_name: 'Usuario',
          user_email: 'user@example.com',
          amount: plan.monthlyPrice
        });

        if (transfer) {
          setStep('confirmation');
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const availableMethods = getAvailableMethodsForPlan();

  const renderPaymentMethod = () => {
    if (!selectedMethod) return null;

    const isLoading = mpLoading || bancolombiaLoading;
    const selectedMethodConfig = availableMethods.find(m => m.id === selectedMethod);

    if (selectedMethod === 'mercado_pago') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <DollarSign className="h-12 w-12 mx-auto text-blue-500 mb-4" />
            <h3 className="text-lg font-medium">Mercado Pago</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Serás redirigido a Mercado Pago para completar tu pago de forma segura
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total a pagar:</span>
              <span className="text-lg font-bold">${plan.monthlyPrice}/mes</span>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('method')}>
              ← Volver
            </Button>
            <Button 
              onClick={handlePaymentProcess} 
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isLoading ? 'Procesando...' : 'Continuar con Mercado Pago'}
            </Button>
          </div>
        </div>
      );
    }

    if (selectedMethod === 'bancolombia') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium">Transferencia Bancolombia</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Genera los datos para realizar tu transferencia bancaria
            </p>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total a pagar:</span>
              <span className="text-lg font-bold">${plan.monthlyPrice}/mes</span>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('method')}>
              ← Volver
            </Button>
            <Button 
              onClick={handlePaymentProcess} 
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isLoading ? 'Generando...' : 'Generar datos de transferencia'}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderConfirmation = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-2xl font-bold mb-2">¡Suscripción Activada!</h3>
        <p className="text-muted-foreground text-lg">
          Tu plan {plan.name} está activo y listo para usar.
        </p>
      </div>
      
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
        <h4 className="font-semibold mb-3 text-primary">Detalles de tu suscripción</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Precio:</span>
            <span className="font-medium">{plan.price}/mes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Próxima facturación:</span>
            <span className="font-medium">
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Acceso:</span>
            <span className="font-medium text-green-600">Inmediato</span>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={onClose} 
        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        size="lg"
      >
        Ir al Dashboard
      </Button>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span>Suscripción Segura - {plan.name}</span>
          </DialogTitle>
          <DialogDescription className="text-base">
            Elige tu método de pago preferido para completar la suscripción de forma segura
          </DialogDescription>
        </DialogHeader>

        {step === 'method' && (
          <div className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-primary">{plan.name}</h3>
                <div className="text-right">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-lg">/mes</span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Facturación mensual automática • Cancela cuando quieras
              </div>
            </div>

            <Separator />

            {/* Payment Methods */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Selecciona tu método de pago:</h4>
              
              {availableMethods.length === 0 ? (
                <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-lg text-center">
                  <p className="text-destructive font-medium">
                    No hay métodos de pago disponibles para este plan.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Contacta al administrador para configurar opciones de pago.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={cn(
                          "border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg",
                          selectedMethod === method.id
                            ? `${method.bgColor} border-current ${method.color} shadow-md`
                            : "border-border hover:border-primary/30 bg-card"
                        )}
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
                            selectedMethod === method.id ? "bg-current/10" : "bg-muted"
                          )}>
                            <IconComponent className={cn(
                              "h-6 w-6",
                              selectedMethod === method.id ? "text-current" : "text-muted-foreground"
                            )} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h5 className="font-semibold text-lg">{method.name}</h5>
                              {method.badges?.map((badge) => (
                                <Badge 
                                  key={badge} 
                                  variant={selectedMethod === method.id ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                            
                            <p className="text-muted-foreground mb-3">
                              {method.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                              {method.features?.map((feature) => (
                                <span 
                                  key={feature} 
                                  className={cn(
                                    "text-xs px-3 py-1 rounded-full",
                                    selectedMethod === method.id 
                                      ? "bg-current/20 text-current" 
                                      : "bg-secondary text-secondary-foreground"
                                  )}
                                >
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
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onClose} size="lg">
                Cancelar
              </Button>
              <Button 
                onClick={() => setStep('payment')} 
                disabled={!selectedMethod || availableMethods.length === 0}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                {selectedMethod 
                  ? `Continuar con ${availableMethods.find(m => m.id === selectedMethod)?.name}`
                  : availableMethods.length === 0 
                    ? 'No hay métodos disponibles'
                    : 'Selecciona un método de pago'
                }
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-center bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Certificación PCI DSS • Encriptación end-to-end • Transacciones seguras</span>
              </div>
            </div>
          </div>
        )}

        {step === 'payment' && renderPaymentMethod()}
        {step === 'confirmation' && renderConfirmation()}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentFormModal;