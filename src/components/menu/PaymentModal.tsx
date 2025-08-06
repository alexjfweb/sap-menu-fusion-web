
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Smartphone, QrCode, CheckCircle, Truck, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { useWhatsAppSender } from '@/hooks/useWhatsAppSender';
import { useOrderSync } from '@/hooks/useOrderSync';
import { usePaymentMethodValidation } from '@/hooks/usePaymentMethodValidation';
import PaymentMethodDisplay from './PaymentMethodDisplay';
import PaymentConfirmationModal from './PaymentConfirmationModal';
import SendConfirmationModal from './SendConfirmationModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
  totalAmount: number;
  sessionId: string;
  onPaymentSuccess: () => void;
}

const PaymentModal = ({ isOpen, onClose, cartItems, totalAmount, sessionId, onPaymentSuccess }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [sendResult, setSendResult] = useState({ success: false, message: '' });
  
  const { toast } = useToast();
  const { data: businessInfo } = useBusinessInfo();
  const { sendOrderToWhatsApp, sending } = useWhatsAppSender();
  const { syncOrderToDatabase } = useOrderSync();
  const { getAvailableMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethodValidation();

  // Get available payment methods from admin configuration
  const availablePaymentMethods = getAvailableMethods();

  // Set default payment method when available methods change
  useEffect(() => {
    if (availablePaymentMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(getPaymentMethodValue(availablePaymentMethods[0]));
    }
  }, [availablePaymentMethods, paymentMethod]);

  // Helper function to get payment method value for form
  const getPaymentMethodValue = (method: any) => {
    if (method.type === 'qr_code' && method.name === 'Bancolombia QR') {
      return 'bancolombia';
    }
    switch (method.type) {
      case 'cash_on_delivery': return 'contra-entrega';
      case 'qr_code': return 'qr';
      case 'nequi': return 'nequi';
      case 'daviplata': return 'daviplata';
      case 'mercado_pago': return 'mercado-pago';
      case 'stripe': return 'stripe';
      case 'paypal': return 'paypal';
      default: return method.type;
    }
  };

  // Helper function to get icon for payment method
  const getPaymentMethodIcon = (method: any) => {
    if (method.type === 'qr_code' && method.name === 'Bancolombia QR') {
      return QrCode;
    }
    switch (method.type) {
      case 'cash_on_delivery': return Truck;
      case 'qr_code': return QrCode;
      case 'nequi': return Smartphone;
      case 'daviplata': return Smartphone;
      case 'mercado_pago': return DollarSign;
      case 'stripe': return CreditCard;
      case 'paypal': return CreditCard;
      default: return CreditCard;
    }
  };

  const handlePayment = async () => {
    if (!customerName || !customerPhone) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el nombre y teléfono",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmPayment = async () => {
    setShowConfirmation(false);
    
    try {
      // Primero sincronizar el pedido a la base de datos
      console.log('Syncing order to database before sending WhatsApp...');
      const syncResult = await syncOrderToDatabase(
        cartItems,
        totalAmount,
        customerName,
        customerPhone,
        customerEmail,
        specialInstructions,
        paymentMethod,
        sessionId
      );

      if (!syncResult.success) {
        console.error('Failed to sync order:', syncResult.error);
        setSendResult({
          success: false,
          message: 'Error al registrar el pedido en el sistema'
        });
        setShowSendConfirmation(true);
        return;
      }

      console.log('Order synced successfully, now sending WhatsApp...');
      
      // Luego enviar por WhatsApp
      const whatsappResult = await sendOrderToWhatsApp(
        cartItems, 
        totalAmount, 
        customerName, 
        customerPhone, 
        specialInstructions,
        paymentMethod
      );
      
      setSendResult(whatsappResult);
      setShowSendConfirmation(true);
      
      if (whatsappResult.success) {
        // Simular éxito del pago después de enviar por WhatsApp
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Error in payment confirmation:', error);
      setSendResult({
        success: false,
        message: 'Error al procesar el pedido'
      });
      setShowSendConfirmation(true);
    }
  };

  const handleCloseSendConfirmation = () => {
    setShowSendConfirmation(false);
    if (sendResult.success) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Información de Pago</DialogTitle>
            <DialogDescription>
              Completa la información para proceder con el pago
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Información del Cliente</h3>
              
              <div className="space-y-2">
                <Label htmlFor="customerName">Nombre completo *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Teléfono *</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Tu número de teléfono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (opcional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Instrucciones especiales</Label>
                <Textarea
                  id="specialInstructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Alguna instrucción especial para tu pedido..."
                  rows={3}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="font-medium">Selecciona tu método de pago</h3>
              
              {isLoadingPaymentMethods ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Cargando métodos de pago...</span>
                </div>
              ) : availablePaymentMethods.length === 0 ? (
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    No hay métodos de pago configurados. Contacta al administrador para habilitar opciones de pago.
                  </p>
                </div>
              ) : (
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {availablePaymentMethods.map((method) => {
                    const methodValue = getPaymentMethodValue(method);
                    const IconComponent = getPaymentMethodIcon(method);
                    
                    return (
                      <div key={method.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={methodValue} id={methodValue} />
                        <Label htmlFor={methodValue} className="flex items-center space-x-2 cursor-pointer">
                          <IconComponent className="h-4 w-4" />
                          <span>{method.name}</span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              )}

              {/* Dynamic Payment Method Display */}
              <PaymentMethodDisplay 
                paymentMethod={paymentMethod}
                nequiNumber={businessInfo?.nequi_number}
                nequiQrUrl={businessInfo?.nequi_qr_url}
              />
            </div>

            {/* Order Summary */}
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <h3 className="font-medium">Resumen del Pedido</h3>
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.products?.name}</span>
                  <span>${(item.quantity * Number(item.products?.price || 0)).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={sending || !customerName || !customerPhone}
                className="flex-1"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {paymentMethod === 'contra-entrega' ? 'Confirmar Pedido' : `Pagar $${totalAmount.toFixed(2)}`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmPayment}
        totalAmount={totalAmount}
        paymentMethod={paymentMethod}
      />

      {/* Send Confirmation Modal */}
      <SendConfirmationModal
        isOpen={showSendConfirmation}
        onClose={handleCloseSendConfirmation}
        success={sendResult.success}
        message={sendResult.message}
      />
    </>
  );
};

export default PaymentModal;
