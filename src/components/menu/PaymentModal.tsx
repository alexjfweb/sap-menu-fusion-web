
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Smartphone, QrCode, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import { useWhatsAppSender } from '@/hooks/useWhatsAppSender';
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
  const [paymentMethod, setPaymentMethod] = useState<string>('nequi');
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
    
    // Enviar por WhatsApp
    const result = await sendOrderToWhatsApp(
      cartItems, 
      totalAmount, 
      customerName, 
      customerPhone, 
      specialInstructions
    );
    
    setSendResult(result);
    setShowSendConfirmation(true);
    
    if (result.success) {
      // Simular éxito del pago después de enviar por WhatsApp
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
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
              <h3 className="font-medium">Método de Pago</h3>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nequi" id="nequi" />
                  <Label htmlFor="nequi" className="flex items-center space-x-2 cursor-pointer">
                    <Smartphone className="h-4 w-4" />
                    <span>Nequi</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="qr" id="qr" />
                  <Label htmlFor="qr" className="flex items-center space-x-2 cursor-pointer">
                    <QrCode className="h-4 w-4" />
                    <span>Código QR</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex items-center space-x-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" />
                    <span>Tarjeta de Crédito/Débito</span>
                  </Label>
                </div>
              </RadioGroup>

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
                    Pagar ${totalAmount.toFixed(2)}
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
