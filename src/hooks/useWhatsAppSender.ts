
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
      const encodedMessage = encodeURIComponent(orderMessage);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      console.log('WhatsApp URL:', whatsappUrl);
      console.log('WhatsApp Number:', whatsappNumber);
      
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
