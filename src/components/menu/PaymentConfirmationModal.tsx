
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, MessageCircle, X } from 'lucide-react';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  totalAmount: number;
  paymentMethod: string;
}

const PaymentConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  totalAmount, 
  paymentMethod 
}: PaymentConfirmationModalProps) => {
  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'nequi': return 'Nequi';
      case 'qr': return 'Código QR';
      case 'contra-entrega': return 'Contra Entrega';
      case 'stripe': return 'Tarjeta de Crédito/Débito';
      default: return method;
    }
  };

  const getConfirmationMessage = (method: string) => {
    if (method === 'contra-entrega') {
      return '¿Confirmas tu pedido para pago contra entrega?';
    }
    return '¿Confirmas que realizaste el pago?';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>{paymentMethod === 'contra-entrega' ? 'Confirmar Pedido' : 'Confirmar Pago'}</span>
          </DialogTitle>
          <DialogDescription>
            {getConfirmationMessage(paymentMethod)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total {paymentMethod === 'contra-entrega' ? 'a pagar' : 'pagado'}:</span>
              <span className="text-lg font-bold">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Método de pago:</span>
              <span className="text-sm font-medium">{getPaymentMethodName(paymentMethod)}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={onConfirm} className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar Pedido por WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfirmationModal;
