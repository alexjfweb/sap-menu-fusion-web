import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import SubscriptionStatusCard from './SubscriptionStatusCard';
import UsageLimitsDisplay from './UsageLimitsDisplay';
import SubscriptionHistory from './SubscriptionHistory';
import UpgradeOptions from './UpgradeOptions';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserSubscriptionDashboardProps {
  onBack: () => void;
}

const UserSubscriptionDashboard: React.FC<UserSubscriptionDashboardProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const { subscriptions, activeSubscription, isLoading } = useUserSubscriptions(profile?.id);
  const { planLimits, currentUsage, isNearLimit } = usePlanLimits();

  // Check if any resource is near the limit
  const resourcesNearLimit = [
    { name: 'Productos', type: 'products', isNear: isNearLimit('products') },
    { name: 'Usuarios', type: 'users', isNear: isNearLimit('users') },
    { name: 'Mesas', type: 'tables', isNear: isNearLimit('tables') },
    { name: 'Reservas Diarias', type: 'daily_reservations', isNear: isNearLimit('daily_reservations') }
  ].filter(resource => resource.isNear);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando información de suscripción...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mi Suscripción</h1>
              <p className="text-muted-foreground">Gestiona tu plan y usage</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Alerts for resources near limits */}
        {resourcesNearLimit.length > 0 && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Límites próximos a alcanzar:</div>
              <ul className="text-sm space-y-1">
                {resourcesNearLimit.map((resource) => (
                  <li key={resource.type}>• {resource.name}</li>
                ))}
              </ul>
              <p className="text-sm mt-2">Considera actualizar tu plan para evitar interrupciones.</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Status */}
            <SubscriptionStatusCard 
              activeSubscription={activeSubscription}
              planLimits={planLimits}
            />

            {/* Usage Limits */}
            <UsageLimitsDisplay 
              planLimits={planLimits}
              currentUsage={currentUsage}
            />

            {/* Subscription History */}
            <SubscriptionHistory subscriptions={subscriptions} />
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Upgrade Options */}
            <UpgradeOptions 
              currentPlan={activeSubscription?.subscription_plans}
              hasActiveSubscription={!!activeSubscription}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Acciones Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.open('/pricing', '_blank')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ver Todos los Planes
                </Button>
                
                {activeSubscription && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        // TODO: Implement view invoice functionality
                        console.log('Ver factura');
                      }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Ver Última Factura
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Support Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">¿Necesitas ayuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Si tienes preguntas sobre tu suscripción o necesitas ayuda, contáctanos.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Contactar Soporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserSubscriptionDashboard;