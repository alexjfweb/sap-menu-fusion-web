
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Smartphone, QrCode, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!customerName || !customerPhone) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el nombre y teléfono",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Here you would integrate with actual payment providers
      switch (paymentMethod) {
        case 'nequi':
          toast({
            title: "Pago con Nequi",
            description: "Serás redirigido a Nequi para completar el pago",
          });
          break;
        case 'qr':
          toast({
            title: "Código QR",
            description: "Escanea el código QR para completar el pago",
          });
          break;
        case 'stripe':
          toast({
            title: "Pago con Tarjeta",
            description: "Serás redirigido a Stripe para completar el pago",
          });
          break;
      }

      // Simulate successful payment
      setTimeout(() => {
        toast({
          title: "¡Pago exitoso!",
          description: "Tu pedido ha sido procesado correctamente",
        });
        onPaymentSuccess();
      }, 3000);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error en el pago",
        description: "Hubo un problema al procesar el pago",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
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
              disabled={isProcessing || !customerName || !customerPhone}
              className="flex-1"
            >
              {isProcessing ? (
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
  );
};

export default PaymentModal;
