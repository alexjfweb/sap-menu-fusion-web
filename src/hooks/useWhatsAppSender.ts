
import { useState } from 'react';
import { useBusinessInfo } from './useBusinessInfo';

export const useWhatsAppSender = () => {
  const [sending, setSending] = useState(false);
  const { data: businessInfo } = useBusinessInfo();

  const sendOrderToWhatsApp = async (
    cartItems: any[], 
    totalAmount: number, 
    customerName: string, 
    customerPhone: string,
    specialInstructions?: string
  ) => {
    setSending(true);
    
    try {
      // Construir el mensaje del pedido
      let orderMessage = `🛍️ *NUEVO PEDIDO*\n\n`;
      orderMessage += `👤 *Cliente:* ${customerName}\n`;
      orderMessage += `📱 *Teléfono:* ${customerPhone}\n\n`;
      orderMessage += `📋 *Productos:*\n`;
      
      cartItems.forEach((item) => {
        orderMessage += `• ${item.quantity}x ${item.products?.name} - $${(item.quantity * Number(item.products?.price || 0)).toFixed(2)}\n`;
        if (item.special_instructions) {
          orderMessage += `  _Instrucciones: ${item.special_instructions}_\n`;
        }
      });
      
      orderMessage += `\n💰 *Total: $${totalAmount.toFixed(2)}*\n`;
      
      if (specialInstructions) {
        orderMessage += `\n📝 *Instrucciones especiales:*\n${specialInstructions}`;
      }

      // Obtener número de WhatsApp del negocio
      let whatsappNumber = '';
      if (businessInfo?.whatsapp_url) {
        // Extraer número de la URL de WhatsApp
        const match = businessInfo.whatsapp_url.match(/(\d+)/);
        if (match) {
          whatsappNumber = match[1];
        }
      }

      if (!whatsappNumber) {
        throw new Error('Número de WhatsApp no configurado');
      }

      // Crear URL de WhatsApp
      const encodedMessage = encodeURIComponent(orderMessage);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      
      return { success: true, message: 'Pedido enviado correctamente a WhatsApp' };
    } catch (error) {
      console.error('Error sending to WhatsApp:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error al enviar el pedido por WhatsApp' 
      };
    } finally {
      setSending(false);
    }
  };

  return { sendOrderToWhatsApp, sending };
};
