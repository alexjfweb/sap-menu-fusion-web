
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChefHat, Calendar, Loader2 } from 'lucide-react';
import { useWhatsAppSender } from '@/hooks/useWhatsAppSender';
import { useToast } from '@/hooks/use-toast';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoModal = ({ isOpen, onClose }: DemoModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        variant: 'destructive',
        title: 'Campos requeridos',
        description: 'Por favor completa el nombre y email.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear mensaje personalizado para WhatsApp
      const whatsappMessage = `🎯 *SOLICITUD DE DEMO - SAP Menu*

👤 *Interesado:* ${formData.name}
📧 *Email:* ${formData.email}
📱 *Teléfono:* ${formData.phone || 'No proporcionado'}
💬 *Mensaje:* ${formData.message || 'Sin mensaje adicional'}

¡Nuevo cliente potencial interesado en una demostración de SAP Menu!

_Solicitud enviada desde el sitio web oficial_`;

      // Simular envío por WhatsApp (en producción esto se conectaría con la API real)
      const superAdminPhone = '573001234567'; // Número del super administrador
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/${superAdminPhone}?text=${encodedMessage}`;
      
      // Abrir WhatsApp en nueva pestaña
      window.open(whatsappUrl, '_blank');

      toast({
        title: 'Demo agendada',
        description: 'Tu solicitud ha sido enviada. Te contactaremos pronto.',
      });

      // Limpiar formulario y cerrar modal
      setFormData({ name: '', email: '', phone: '', message: '' });
      onClose();
    } catch (error) {
      console.error('Error al enviar solicitud de demo:', error);
      toast({
        variant: 'destructive',
        title: 'Error al enviar',
        description: 'No se pudo enviar la solicitud. Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Agendar Demo</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Descubre cómo SAP Menu puede transformar tu restaurante
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+57 300 123 4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje adicional (opcional)</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Cuéntanos sobre tu restaurante y qué te interesa saber..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Demo
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DemoModal;
