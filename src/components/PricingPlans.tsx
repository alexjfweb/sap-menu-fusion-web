
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Crown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'free',
    name: 'Plan Gratuito',
    price: 'Gratis',
    duration: '7 días',
    color: 'gray',
    icon: Users,
    popular: false,
    features: [
      '5 platos máximo',
      '1 usuario',
      '5 reservas por día',
      'Soporte por email',
      'Menú básico',
      'Sin personalización'
    ],
    limits: {
      platos: 5,
      usuarios: 1,
      reservas: 5,
      soporte: 'Email'
    }
  },
  {
    id: 'basic',
    name: 'Plan Básico',
    price: '$29.99',
    duration: 'mes',
    color: 'orange',
    icon: Zap,
    popular: false,
    features: [
      '50 platos máximo',
      '3 usuarios',
      '20 reservas por día',
      'Soporte prioritario',
      'Menú personalizable',
      'Integración WhatsApp',
      'Reportes básicos'
    ],
    limits: {
      platos: 50,
      usuarios: 3,
      reservas: 20,
      soporte: 'Prioritario'
    }
  },
  {
    id: 'standard',
    name: 'Plan Estándar',
    price: '$59.99',
    duration: 'mes',
    color: 'green',
    icon: Star,
    popular: true,
    features: [
      '200 platos máximo',
      '10 usuarios',
      '100 reservas por día',
      'Soporte 24/7',
      'Menú completamente personalizable',
      'Integración redes sociales',
      'Reportes avanzados',
      'Sistema de inventario',
      'Múltiples ubicaciones'
    ],
    limits: {
      platos: 200,
      usuarios: 10,
      reservas: 100,
      soporte: '24/7'
    }
  },
  {
    id: 'premium',
    name: 'Plan Premium',
    price: '$99.99',
    duration: 'mes',
    color: 'blue',
    icon: Crown,
    popular: false,
    features: [
      'Platos ilimitados',
      'Usuarios ilimitados',
      'Reservas ilimitadas',
      'Soporte 24/7 dedicado',
      'White-label completo',
      'API personalizada',
      'Análisis avanzados',
      'Gestión multi-restaurante',
      'Integraciones empresariales',
      'Consultoría incluida'
    ],
    limits: {
      platos: 'Ilimitado',
      usuarios: 'Ilimitado',
      reservas: 'Ilimitado',
      soporte: '24/7 Dedicado'
    }
  }
];

const colorClasses = {
  gray: {
    card: 'border-gray-200 hover:border-gray-300',
    button: 'bg-gray-600 hover:bg-gray-700',
    icon: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-800'
  },
  orange: {
    card: 'border-orange-200 hover:border-orange-300',
    button: 'bg-orange-600 hover:bg-orange-700',
    icon: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-800'
  },
  green: {
    card: 'border-green-200 hover:border-green-300 ring-2 ring-green-200',
    button: 'bg-green-600 hover:bg-green-700',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-800'
  },
  blue: {
    card: 'border-blue-200 hover:border-blue-300',
    button: 'bg-blue-600 hover:bg-blue-700',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800'
  }
};

const PricingPlans = () => {
  return (
    <section id="planes" className="py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Planes de Suscripción
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Elige el plan perfecto para tu restaurante. Desde empezar gratis hasta funciones empresariales avanzadas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const colors = colorClasses[plan.color as keyof typeof colorClasses];
            const IconComponent = plan.icon;
            
            return (
              <Card 
                key={plan.id} 
                className={cn(
                  "relative transform transition-all duration-300 hover:scale-105 hover:shadow-xl",
                  colors.card,
                  plan.popular && "scale-105"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className={cn("px-4 py-1 rounded-full text-xs font-semibold", colors.badge)}>
                      Más Popular
                    </span>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={cn("w-12 h-12 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center", colors.icon)}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    {plan.price !== 'Gratis' && <span className="text-muted-foreground">/{plan.duration}</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold text-sm text-foreground mb-2">Límites:</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>📍 Platos: {plan.limits.platos}</div>
                      <div>👥 Usuarios: {plan.limits.usuarios}</div>
                      <div>📅 Reservas/día: {plan.limits.reservas}</div>
                      <div>🔧 Soporte: {plan.limits.soporte}</div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={cn("w-full text-white font-semibold transition-all duration-200", colors.button)}
                  >
                    {plan.price === 'Gratis' ? 'Comenzar Gratis' : 'Elegir Plan'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Necesitas algo personalizado para tu empresa?
          </p>
          <Button variant="outline" size="lg">
            Contactar Ventas
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
