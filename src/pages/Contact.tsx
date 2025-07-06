
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChefHat, Mail, MessageSquare, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        variant: 'destructive',
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Crear mensaje personalizado para WhatsApp al super administrador
      const whatsappMessage = `📞 *FORMULARIO DE CONTACTO - SAP Menu*

👤 *Nombre:* ${formData.name}
📧 *Email:* ${formData.email}
💬 *Mensaje:* ${formData.message}

*Enviado desde el formulario de contacto de SAP Menu*`;

      // Número del super administrador
      const superAdminPhone = '573001234567';
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://wa.me/${superAdminPhone}?text=${encodedMessage}`;
      
      // Abrir WhatsApp en nueva pestaña
      window.open(whatsappUrl, '_blank');

      toast({
        title: 'Mensaje enviado',
        description: 'Tu mensaje ha sido enviado correctamente. Te contactaremos pronto.',
      });

      // Limpiar formulario
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast({
        variant: 'destructive',
        title: 'Error al enviar',
        description: 'No se pudo enviar el mensaje. Inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <ChefHat className="h-16 w-16 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Contáctanos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ¿Tienes preguntas sobre SAP Menu? Estamos aquí para ayudarte. 
            Contáctanos y te responderemos lo antes posible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Formulario de contacto */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                Envíanos un mensaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Label htmlFor="message">Mensaje *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                    rows={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando mensaje...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar mensaje
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Información de contacto */}
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  Información de contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Correo electrónico</h3>
                    <p className="text-muted-foreground">alexjfweb@gmail.com</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Te responderemos en menos de 24 horas
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">WhatsApp</h3>
                    <p className="text-muted-foreground">+57 300 123 4567</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Respuesta inmediata durante horario laboral
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Ubicación</h3>
                    <p className="text-muted-foreground">Colombia</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Servicio disponible en toda Latinoamérica
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-secondary/10">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">¿Por qué elegir SAP Menu?</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Solución completa para restaurantes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Soporte técnico personalizado</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Implementación rápida y sencilla</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Precios competitivos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
