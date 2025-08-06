import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Users, Zap, Crown, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import PaymentModal from './PaymentModal';
import MercadoPagoPaymentModal from './MercadoPagoPaymentModal';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';
import DemoModal from '@/components/modals/DemoModal';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type SubscriptionPlan = Tables<'subscription_plans'>;

interface PlanWithLimits extends SubscriptionPlan {
  icon: any;
  color: string;
  popularity?: string;
  limits: {
    mesas: string | number;
    clientes: string | number;
    seguros: string;
  };
}

const colorClasses = {
  green: {
    card: 'border-green-200 hover:border-green-300',
    button: 'bg-green-600 hover:bg-green-700',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-800'
  },
  blue: {
    card: 'border-blue-200 hover:border-blue-300',
    button: 'bg-blue-600 hover:bg-blue-700',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800'
  },
  purple: {
    card: 'border-purple-200 hover:border-purple-300 ring-2 ring-purple-200',
    button: 'bg-purple-600 hover:bg-purple-700',
    icon: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-800'
  },
  orange: {
    card: 'border-orange-200 hover:border-orange-300',
    button: 'bg-orange-600 hover:bg-orange-700',
    icon: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-800'
  }
};

const PricingSection = () => {
  const [selectedPlan, setSelectedPlan] = useState<PlanWithLimits | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMercadoPagoModal, setShowMercadoPagoModal] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const { navigateToAuth, isNavigating } = useSmartNavigation();

  // Obtener planes desde la base de datos
  const { data: dbPlans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans-public'],
    queryFn: async () => {
      console.log('🔍 [PRICING] Consultando planes de suscripción...');
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('❌ [PRICING] Error al consultar planes:', error);
        throw error;
      }
      
      console.log('✅ [PRICING] Planes obtenidos:', data?.length || 0, 'planes');
      console.log('📋 [PRICING] Datos de planes:', data);
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Mapear planes de DB a formato del frontend con iconos y colores
  const plans: PlanWithLimits[] = React.useMemo(() => {
    if (!dbPlans) return [];
    
    return dbPlans.map((plan, index) => {
      // Asignar iconos según el nombre del plan
      let icon = Zap;
      if (plan.name.toLowerCase().includes('gratuito')) icon = Users;
      else if (plan.name.toLowerCase().includes('básico')) icon = Zap;
      else if (plan.name.toLowerCase().includes('estándar')) icon = Star;
      else if (plan.name.toLowerCase().includes('premium')) icon = Crown;
      
      // Asignar colores según el índice
      const colorNames = ['green', 'blue', 'purple', 'orange'] as const;
      const color = colorNames[index % colorNames.length];
      
      // Valores por defecto basados en el precio del plan
      const getDefaultLimits = (price: number) => {
        if (price === 0) return { mesas: 3, clientes: 1, seguros: 'Email' };
        if (price <= 15) return { mesas: 5, clientes: 1, seguros: 'Email' };
        if (price <= 25) return { mesas: 15, clientes: 3, seguros: 'Chat' };
        return { mesas: 50, clientes: 10, seguros: 'Prioritario' };
      };
      
      const limits = getDefaultLimits(Number(plan.price));
      
      // Procesar features desde el array JSON
      let processedFeatures: string[] = [];
      try {
        if (plan.features) {
          if (Array.isArray(plan.features)) {
            processedFeatures = plan.features.map(f => String(f));
          } else if (typeof plan.features === 'string') {
            processedFeatures = JSON.parse(plan.features);
          }
        }
      } catch (error) {
        console.warn('Error al procesar features del plan:', plan.name, error);
        processedFeatures = ['Funcionalidades básicas incluidas'];
      }
      
      return {
        ...plan,
        icon,
        color,
        popularity: plan.is_featured ? 'Más Popular' : undefined,
        limits,
        features: processedFeatures
      };
    });
  }, [dbPlans]);

  const handleSelectPlan = (plan: PlanWithLimits) => {
    if (plan.price === 0) {
      console.log('🆓 [PRICING] Plan gratuito seleccionado, usando navegación inteligente');
      navigateToAuth();
      return;
    }
    
    console.log('💳 [PRICING] Plan de pago seleccionado:', plan.name, '- Precio:', plan.price);
    setSelectedPlan(plan);
    setShowPaymentModal(true); // Mantener el formulario original
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
                  plan.popularity && "scale-105"
                )}
              >
                {plan.popularity && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      {plan.popularity}
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
            monthlyPrice: Number(selectedPlan.price),
            features: Array.isArray(selectedPlan.features) ? selectedPlan.features.map(String) : []
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
        />
      )}

      {showMercadoPagoModal && selectedPlan && (
        <MercadoPagoPaymentModal
          isOpen={showMercadoPagoModal}
          plan={{
            id: selectedPlan.id,
            name: selectedPlan.name,
            price: Number(selectedPlan.price),
            currency: selectedPlan.currency || 'USD'
          }}
          onClose={() => {
            setShowMercadoPagoModal(false);
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
