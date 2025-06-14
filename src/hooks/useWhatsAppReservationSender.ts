
import { useState } from 'react';
import { useBusinessInfo } from './useBusinessInfo';

interface ReservationData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  specialRequests?: string;
  paymentMethod: string;
}

export const useWhatsAppReservationSender = () => {
  const [sending, setSending] = useState(false);
  const { data: businessInfo } = useBusinessInfo();

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'nequi': return 'Nequi';
      case 'qr': return 'QR';
      case 'stripe': return 'Tarjeta de Crédito/Débito';
      default: return 'Otro';
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

  const sendReservationToWhatsApp = async (reservationData: ReservationData) => {
    setSending(true);
    
    try {
      // Construir el mensaje de la reserva
      let reservationMessage = `📅 *NUEVA RESERVA*\n\n`;
      reservationMessage += `👤 *Cliente:* ${reservationData.customerName}\n`;
      reservationMessage += `📱 *Teléfono:* ${reservationData.customerPhone}\n`;
      
      if (reservationData.customerEmail) {
        reservationMessage += `📧 *Email:* ${reservationData.customerEmail}\n`;
      }
      
      reservationMessage += `\n📋 *Detalles de la Reserva:*\n`;
      reservationMessage += `👥 *Número de personas:* ${reservationData.partySize}\n`;
      reservationMessage += `📅 *Fecha:* ${formatDate(reservationData.reservationDate)}\n`;
      reservationMessage += `🕒 *Hora:* ${reservationData.reservationTime}\n`;
      reservationMessage += `💳 *Método de pago preferido:* ${getPaymentMethodName(reservationData.paymentMethod)}\n`;
      
      if (reservationData.specialRequests) {
        reservationMessage += `\n📝 *Solicitudes especiales:*\n${reservationData.specialRequests}\n`;
      }

      reservationMessage += `\n_Por favor confirma la disponibilidad para esta reserva._`;

      // Obtener número de WhatsApp del negocio
      let whatsappNumber = '';
      
      // Primero intentar extraer de whatsapp_url
      if (businessInfo?.whatsapp_url) {
        // Extraer número de diferentes formatos de URL de WhatsApp
        const urlPatterns = [
          /wa\.me\/(\d+)/,  // https://wa.me/573001234567
          /whatsapp\.com\/send\?phone=(\d+)/, // https://whatsapp.com/send?phone=573001234567
          /api\.whatsapp\.com\/send\?phone=(\d+)/, // https://api.whatsapp.com/send?phone=573001234567
          /(\d{10,15})/ // Buscar cualquier secuencia de 10-15 dígitos
        ];
        
        for (const pattern of urlPatterns) {
          const match = businessInfo.whatsapp_url.match(pattern);
          if (match && match[1]) {
            whatsappNumber = match[1];
            break;
          }
        }
      }
      
      // Si no se encontró en la URL, intentar usar el teléfono del negocio
      if (!whatsappNumber && businessInfo?.phone) {
        // Limpiar el número de teléfono (remover espacios, guiones, paréntesis, etc.)
        const cleanPhone = businessInfo.phone.replace(/[^\d]/g, '');
        if (cleanPhone.length >= 10) {
          whatsappNumber = cleanPhone;
        }
      }

      if (!whatsappNumber) {
        throw new Error('No se encontró un número de WhatsApp válido. Por favor configura la URL de WhatsApp o el número de teléfono en la información del negocio.');
      }

      // Asegurar que el número tenga el formato correcto (agregar 57 si es colombiano y no lo tiene)
      if (whatsappNumber.length === 10 && whatsappNumber.startsWith('3')) {
        whatsappNumber = '57' + whatsappNumber;
      }

      // Crear URL de WhatsApp
      const encodedMessage = encodeURIComponent(reservationMessage);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      console.log('WhatsApp URL:', whatsappUrl);
      console.log('WhatsApp Number:', whatsappNumber);
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      
      return { success: true, message: 'Reserva enviada correctamente a WhatsApp' };
    } catch (error) {
      console.error('Error sending reservation to WhatsApp:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error al enviar la reserva por WhatsApp' 
      };
    } finally {
      setSending(false);
    }
  };

  return { sendReservationToWhatsApp, sending };
};
