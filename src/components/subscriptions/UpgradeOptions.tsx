import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Crown, Zap, Star, ArrowUp, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UpgradeOptionsProps {
  currentPlan: any;
  hasActiveSubscription: boolean;
}

const UpgradeOptions: React.FC<UpgradeOptionsProps> = ({ 
  currentPlan, 
  hasActiveSubscription 
}) => {
  // Fetch available subscription plans
  const { data: availablePlans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency === 'USD' ? 'EUR' : currency
    }).format(amount);
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('premium') || name.includes('pro')) return Crown;
    if (name.includes('standard') || name.includes('estandar')) return Zap;
    return Star;
  };

  const isPlanUpgrade = (plan: any) => {
    if (!currentPlan) return true;
    return plan.price > currentPlan.price;
  };

  const handleUpgrade = (plan: any) => {
    // Redirect to pricing page with the selected plan
    const url = `/#planes`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Opciones de Actualización</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availablePlans || availablePlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Opciones de Actualización</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No hay planes disponibles en este momento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter plans to show upgrade options or all plans if no active subscription
  const plansToShow = hasActiveSubscription 
    ? availablePlans.filter(plan => isPlanUpgrade(plan))
    : availablePlans;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>
            {hasActiveSubscription ? 'Actualizar Plan' : 'Planes Disponibles'}
          </span>
        </CardTitle>
        <CardDescription>
          {hasActiveSubscription 
            ? 'Mejora tu plan para acceder a más funciones'
            : 'Suscríbete para acceder a todas las funciones'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {plansToShow.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Crown className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium mb-1">¡Ya tienes el mejor plan!</p>
              <p className="text-sm">
                Estás disfrutando de todas nuestras funciones premium.
              </p>
            </div>
          ) : (
            plansToShow.map((plan) => {
              const Icon = getPlanIcon(plan.name);
              const isCurrentPlan = currentPlan?.id === plan.id;
              const isUpgrade = isPlanUpgrade(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative p-4 rounded-lg border transition-all hover:shadow-md ${
                    plan.is_featured 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        plan.is_featured ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          plan.is_featured ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{plan.name}</h4>
                          {plan.is_featured && (
                            <Badge variant="default" className="text-xs">
                              Recomendado
                            </Badge>
                          )}
                          {isCurrentPlan && (
                            <Badge variant="outline" className="text-xs">
                              Actual
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {plan.description}
                        </p>
                        <div className="mt-2">
                          <span className="text-lg font-bold">
                            {formatCurrency(plan.price, plan.currency)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            /{plan.billing_interval === 'monthly' ? 'mes' : 'año'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    {!isCurrentPlan && (
                      <Button
                        variant={plan.is_featured ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUpgrade(plan)}
                        className="flex-1"
                      >
                        {isUpgrade ? (
                          <>
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Actualizar
                          </>
                        ) : (
                          <>
                            <Crown className="h-4 w-4 mr-2" />
                            Suscribirse
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/#planes`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {plan.is_featured && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Popular
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {hasActiveSubscription && plansToShow.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
            <div className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Al actualizar tu plan, se aplicarán los nuevos límites 
              y funciones inmediatamente. El cambio en el precio se reflejará en tu próxima factura.
            </div>
          </div>
        )}

        <div className="mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => window.open('/#planes', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Comparación Completa de Planes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradeOptions;