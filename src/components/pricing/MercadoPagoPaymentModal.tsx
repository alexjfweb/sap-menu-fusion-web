import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useMercadoPagoPayment } from '@/hooks/useMercadoPagoPayment';

interface MercadoPagoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    id: string;
    name: string;
    price: number;
    currency?: string;
  };
}

type PaymentStep = 'user_info' | 'loading' | 'success' | 'error';

const MercadoPagoPaymentModal = ({ isOpen, onClose, plan }: MercadoPagoPaymentModalProps) => {
  const [step, setStep] = useState<PaymentStep>('user_info');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: ''
  });
  const { createPaymentPreference, redirectToPayment, isLoading, error } = useMercadoPagoPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');

    const response = await createPaymentPreference({
      plan_id: plan.id,
      user_email: userInfo.email || undefined,
      user_name: userInfo.name || undefined
    });

    if (response) {
      setStep('success');
      // Redirigir después de un breve delay para mostrar el estado de éxito
      setTimeout(() => {
        redirectToPayment(response.init_point);
      }, 1500);
    } else {
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('user_info');
    setUserInfo({ name: '', email: '' });
    onClose();
  };

  const renderContent = () => {
    switch (step) {
      case 'user_info':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ${plan.price} <span className="text-sm font-normal text-gray-600">{plan.currency || 'USD'}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre completo (opcional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={userInfo.name}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">Información importante:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Serás redirigido a Mercado Pago para completar el pago</li>
                <li>• Puedes pagar con tarjeta de crédito, débito o dinero en cuenta</li>
                <li>• El proceso es 100% seguro y encriptado</li>
                <li>• Recibirás confirmación por email una vez completado</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                <CreditCard className="h-4 w-4 mr-2" />
                Continuar con Mercado Pago
              </Button>
            </div>
          </form>
        );

      case 'loading':
        return (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Procesando pago...</h3>
              <p className="text-gray-600">
                Estamos generando tu link de pago seguro con Mercado Pago. 
                Por favor espera un momento.
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-2">¡Preferencia creada exitosamente!</h3>
              <p className="text-gray-600 mb-4">
                Te estamos redirigiendo a Mercado Pago para completar tu pago de forma segura.
              </p>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm text-green-700">
                <strong>Plan seleccionado:</strong> {plan.name} - ${plan.price} {plan.currency || 'USD'}
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8 space-y-4">
            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-red-700 mb-2">Error al procesar</h3>
              <p className="text-gray-600 mb-4">
                {error || 'Hubo un problema al generar tu preferencia de pago. Por favor intenta nuevamente.'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleClose}>
                  Cerrar
                </Button>
                <Button onClick={() => setStep('user_info')}>
                  Intentar nuevamente
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pago con Mercado Pago
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default MercadoPagoPaymentModal;