import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Zap, Crown, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import PaymentModal from './PaymentModal';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';
import DemoModal from '@/components/modals/DemoModal';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type SubscriptionPlan = Tables<'subscription_plans'>;

interface PlanWithLimits extends SubscriptionPlan {
  monthlyPrice: number;
  icon: any;
  color: string;
  popular?: boolean;
  limits: {
    mesas: string | number;
    clientes: string | number;
    seguros: string;
  };
}

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

const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanWithLimits | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const { navigateToAuth, isNavigating } = useSmartNavigation();

  // Obtener planes desde la base de datos
  const { data: dbPlans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans-public'],
    queryFn: async () => {
      console.log('🔍 [PRICING] Consultando planes de suscripción...');
      const { data, error } = await supabase
        .from('subscription_plans')
        .select(`
          *,
          plan_configurations(
            max_products,
            max_users,
            max_reservations_per_day,
            max_tables,
            max_locations,
            support_type
          )
        `)
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (error) {
        console.error('❌ [PRICING] Error al consultar planes:', error);
        throw error;
      }
      
      console.log('✅ [PRICING] Planes obtenidos:', data?.length || 0, 'planes');
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Mapear planes de DB a formato del frontend con iconos y colores
  const plans: PlanWithLimits[] = React.useMemo(() => {
    if (!dbPlans) return [];

    const iconMap = {
      'gratuito': Users,
      'básico': Zap,
      'estándar': Star,
      'premium': Crown,
      'free': Users,
      'basic': Zap,
      'standard': Star,
    };

    const colorMap = {
      'gratuito': 'gray',
      'básico': 'orange',
      'estándar': 'green',
      'premium': 'blue',
      'free': 'gray',
      'basic': 'orange',
      'standard': 'green',
    };

    return dbPlans.map(plan => {
      const planKey = plan.name.toLowerCase();
      const icon = Object.keys(iconMap).find(key => planKey.includes(key)) || 'basic';
      const color = Object.keys(colorMap).find(key => planKey.includes(key)) || 'gray';
      
      const config = plan.plan_configurations?.[0];
      const limits = {
        mesas: config?.max_tables || 'Personalizado',
        clientes: config?.max_users || 'Ilimitado',
        seguros: config?.support_type || 'Básico'
      };

      return {
        ...plan,
        monthlyPrice: plan.price,
        popular: plan.is_featured,
        icon: iconMap[icon as keyof typeof iconMap] || Zap,
        color: colorMap[color as keyof typeof colorMap] || 'gray',
        limits
      };
    });
  }, [dbPlans]);

  const handleSelectPlan = (plan: PlanWithLimits) => {
    if (plan.price === 0) {
      console.log('🆓 [PRICING] Plan gratuito seleccionado, usando navegación inteligente');
      navigateToAuth();
      return;
    }
    
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  // Estado de carga
  if (isLoading) {
    return (
      <section id="planes" className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded-md w-96 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded-md w-64 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-96 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Estado de error
  if (error) {
    return (
      <section id="planes" className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Planes de Suscripción para Restaurantes
            </h2>
            <div className="max-w-md mx-auto bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Error al cargar los planes
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                No pudimos cargar los planes de suscripción. Por favor, intenta recargar la página.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Reintentar
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Estado sin planes
  if (!plans || plans.length === 0) {
    return (
      <section id="planes" className="py-20 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Planes de Suscripción para Restaurantes
            </h2>
            <div className="max-w-md mx-auto bg-muted/50 border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Planes no disponibles
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Actualmente no hay planes de suscripción disponibles. Contáctanos para obtener más información.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowSalesModal(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Contactar Ventas
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="planes" className="py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Planes de Suscripción para Restaurantes
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
                    <Badge className="bg-green-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={cn("w-12 h-12 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center")}>
                    <IconComponent className={cn("h-6 w-6", colors.icon)} />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">
                    <span className="text-3xl font-bold text-foreground">
                      {plan.price === 0 ? 'Gratis' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground">/mes</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-foreground">{String(feature)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold text-sm text-foreground mb-2">Límites:</h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>[Mesas: {plan.limits.mesas}]</div>
                      <div>[Clientes: {plan.limits.clientes}]</div>
                      <div>[Seguros: {plan.limits.seguros}]</div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={cn("w-full text-white font-semibold transition-all duration-200", colors.button)}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={plan.price === 0 && isNavigating}
                  >
                    {plan.price === 0 ? 
                      (isNavigating ? 'Verificando...' : 'Comenzar Gratis') : 
                      'Elegir Plan'
                    }
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
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setShowSalesModal(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Contactar Ventas
          </Button>
        </div>
      </div>

      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={{
            id: selectedPlan.id,
            name: selectedPlan.name,
            price: selectedPlan.price.toString(),
            monthlyPrice: selectedPlan.monthlyPrice,
            features: Array.isArray(selectedPlan.features) ? selectedPlan.features.map(String) : []
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
        />
      )}

      <DemoModal
        isOpen={showSalesModal}
        onClose={() => setShowSalesModal(false)}
        title="Contactar Ventas"
      />
    </section>
  );
};

export default PricingSection;
