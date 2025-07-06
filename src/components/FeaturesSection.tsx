
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Calendar, 
  BarChart3, 
  Users, 
  Smartphone, 
  MessageSquare,
  Shield,
  Zap,
  Globe
} from 'lucide-react';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';
import DemoModal from '@/components/modals/DemoModal';

const features = [
  {
    icon: ShoppingCart,
    title: 'Sistema de Pedidos',
    description: 'Gestión completa de pedidos con carrito de compras, validación de stock y envío por WhatsApp.',
    color: 'text-green-600'
  },
  {
    icon: Calendar,
    title: 'Gestión de Reservas',
    description: 'Sistema de reservas con confirmación automática por email, SMS y WhatsApp.',
    color: 'text-blue-600'
  },
  {
    icon: BarChart3,
    title: 'Inventario en Tiempo Real',
    description: 'Control de stock automático, alertas de stock bajo y historial detallado de movimientos.',
    color: 'text-purple-600'
  },
  {
    icon: Users,
    title: 'Gestión de Roles',
    description: 'Sistema completo de roles: Empleados, Administradores y Superadministradores.',
    color: 'text-orange-600'
  },
  {
    icon: Smartphone,
    title: 'Diseño Responsive',
    description: 'Optimizado para todos los dispositivos, especialmente para móviles y tablets.',
    color: 'text-pink-600'
  },
  {
    icon: MessageSquare,
    title: 'Integración Social',
    description: 'Conecta con WhatsApp, Facebook, Instagram, X (Twitter) y TikTok para compartir contenido.',
    color: 'text-cyan-600'
  },
  {
    icon: Shield,
    title: 'Seguridad Avanzada',
    description: 'Autenticación segura, control de acceso basado en roles y protección de datos.',
    color: 'text-red-600'
  },
  {
    icon: Zap,
    title: 'Rendimiento Optimizado',
    description: 'Aplicación rápida y eficiente con carga instantánea y sincronización en tiempo real.',
    color: 'text-yellow-600'
  },
  {
    icon: Globe,
    title: 'SEO Optimizado',
    description: 'Páginas optimizadas para motores de búsqueda con meta tags y URLs personalizables.',
    color: 'text-indigo-600'
  }
];

const FeaturesSection = () => {
  const { navigateToAuth, isNavigating } = useSmartNavigation();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleFreeTrial = () => {
    navigateToAuth();
  };

  const handleScheduleDemo = () => {
    setIsDemoModalOpen(true);
  };

  return (
    <section id="caracteristicas" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Características Principales
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Todo lo que necesitas para modernizar tu restaurante y mejorar la experiencia de tus clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-border hover:border-primary/20"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              ¿Listo para comenzar?
            </h3>
            <p className="text-muted-foreground mb-6">
              Únete a cientos de restaurantes que ya están usando SAP Menu para crecer su negocio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="px-8 py-3"
                onClick={handleFreeTrial}
                disabled={isNavigating}
              >
                {isNavigating ? 'Verificando...' : 'Prueba Gratuita'}
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="px-8 py-3"
                onClick={handleScheduleDemo}
              >
                Agendar Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DemoModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </section>
  );
};

export default FeaturesSection;
