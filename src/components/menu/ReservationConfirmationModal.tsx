
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, MessageCircle, X, Calendar, Users, Clock, CreditCard } from 'lucide-react';

interface ReservationData {
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  paymentMethod: string;
}

interface ReservationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservationData: ReservationData;
}

const ReservationConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  reservationData 
}: ReservationConfirmationModalProps) => {
  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'nequi': return 'Nequi';
      case 'qr': return 'Código QR';
      case 'stripe': return 'Tarjeta de Crédito/Débito';
      default: return method;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Confirmar Reserva</span>
          </DialogTitle>
          <DialogDescription>
            ¿Confirmas los datos de tu reserva?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cliente:</span>
              <span className="text-sm font-medium">{reservationData.customerName}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Personas:</span>
              <span className="text-sm font-medium">{reservationData.partySize}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Fecha:</span>
              <span className="text-sm font-medium">{formatDate(reservationData.reservationDate)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Hora:</span>
              <span className="text-sm font-medium">{reservationData.reservationTime}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Método de pago:</span>
              <span className="text-sm font-medium">{getPaymentMethodName(reservationData.paymentMethod)}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={onConfirm} className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Confirmar y Enviar por WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationConfirmationModal;
