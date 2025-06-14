
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Clock, Users, CreditCard, Smartphone, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBusinessInfo } from '@/hooks/useBusinessInfo';
import PaymentMethodDisplay from './PaymentMethodDisplay';
import ReservationConfirmationModal from './ReservationConfirmationModal';
import SendConfirmationModal from './SendConfirmationModal';
import { useWhatsAppReservationSender } from '@/hooks/useWhatsAppReservationSender';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReservationModal = ({ isOpen, onClose }: ReservationModalProps) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [partySize, setPartySize] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('nequi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);
  const [sendResult, setSendResult] = useState({ success: false, message: '' });
  
  const { toast } = useToast();
  const { data: businessInfo } = useBusinessInfo();
  const { sendReservationToWhatsApp, sending } = useWhatsAppReservationSender();

  const handleSubmit = async () => {
    if (!customerName || !customerPhone || !partySize || !reservationDate || !reservationTime) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmReservation = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('payment_reservations')
        .insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          party_size: parseInt(partySize),
          reservation_date: reservationDate,
          reservation_time: reservationTime,
          special_requests: specialRequests || null,
          payment_method: paymentMethod,
          payment_status: 'pending',
          status: 'pending',
          total_amount: 0,
        });

      if (error) throw error;

      // Enviar por WhatsApp
      const result = await sendReservationToWhatsApp({
        customerName,
        customerPhone,
        customerEmail,
        partySize: parseInt(partySize),
        reservationDate,
        reservationTime,
        specialRequests,
        paymentMethod
      });
      
      setSendResult(result);
      setShowSendConfirmation(true);

      if (result.success) {
        toast({
          title: "¡Reserva creada!",
          description: "Tu reserva ha sido enviada por WhatsApp.",
        });

        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setPartySize('');
        setReservationDate('');
        setReservationTime('');
        setSpecialRequests('');
        setPaymentMethod('nequi');
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      setSendResult({
        success: false,
        message: 'No se pudo crear la reserva. Inténtalo de nuevo.'
      });
      setShowSendConfirmation(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSendConfirmation = () => {
    setShowSendConfirmation(false);
    if (sendResult.success) {
      onClose();
    }
  };

  // Generate time slots
  const timeSlots = [];
  for (let hour = 12; hour <= 22; hour++) {
    for (let minutes = 0; minutes < 60; minutes += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hacer una Reserva</DialogTitle>
            <DialogDescription>
              Completa la información para reservar tu mesa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Información del Cliente</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Tu número de teléfono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Reservation Details */}
            <div className="space-y-4">
              <h3 className="font-medium">Detalles de la Reserva</h3>
              
              <div className="space-y-2">
                <Label htmlFor="partySize">Número de personas *</Label>
                <Input
                  id="partySize"
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  placeholder="¿Cuántas personas?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha de reserva *</Label>
                <Input
                  id="date"
                  type="date"
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Hora de reserva *</Label>
                <select
                  id="time"
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Selecciona una hora</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requests">Solicitudes especiales</Label>
                <Textarea
                  id="requests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Celebración especial, preferencias dietéticas, etc."
                  rows={3}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="font-medium">Método de Pago Preferido</h3>
              <p className="text-sm text-muted-foreground">
                Selecciona tu método de pago preferido para la reserva
              </p>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nequi" id="res-nequi" />
                  <Label htmlFor="res-nequi" className="flex items-center space-x-2 cursor-pointer">
                    <Smartphone className="h-4 w-4" />
                    <span>Nequi</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="qr" id="res-qr" />
                  <Label htmlFor="res-qr" className="flex items-center space-x-2 cursor-pointer">
                    <QrCode className="h-4 w-4" />
                    <span>Código QR</span>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stripe" id="res-stripe" />
                  <Label htmlFor="res-stripe" className="flex items-center space-x-2 cursor-pointer">
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

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || sending}
                className="flex-1"
              >
                {isSubmitting || sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Enviar Reserva
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ReservationConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmReservation}
        reservationData={{
          customerName,
          customerPhone,
          partySize: parseInt(partySize) || 0,
          reservationDate,
          reservationTime,
          paymentMethod
        }}
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

export default ReservationModal;
