import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Calendar, 
  DollarSign, 
  Pause, 
  Play, 
  X,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubscriptionStatusCardProps {
  activeSubscription: any;
  planLimits: any;
}

const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({ 
  activeSubscription, 
  planLimits 
}) => {
  const { profile } = useAuth();
  const { 
    cancelSubscription, 
    pauseSubscription, 
    resumeSubscription,
    isCanceling,
    isPausing,
    isResuming
  } = useUserSubscriptions(profile?.id);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default', icon: CheckCircle, label: 'Activa' },
      paused: { variant: 'secondary', icon: Pause, label: 'Pausada' },
      cancelled: { variant: 'destructive', icon: X, label: 'Cancelada' },
      pending: { variant: 'outline', icon: Clock, label: 'Pendiente' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency === 'USD' ? 'EUR' : currency
    }).format(amount);
  };

  if (!activeSubscription) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Crown className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>Sin Suscripción Activa</CardTitle>
          <CardDescription>
            No tienes una suscripción activa. Suscríbete para acceder a todas las funciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            className="w-full"
            onClick={() => window.open('/#planes', '_blank')}
          >
            Ver Planes Disponibles
          </Button>
        </CardContent>
      </Card>
    );
  }

  const plan = activeSubscription.subscription_plans;
  const isNearExpiry = activeSubscription.current_period_end && 
    new Date(activeSubscription.current_period_end) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Card className={`${isNearExpiry ? 'border-warning' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{plan?.name || 'Plan Desconocido'}</span>
                {getStatusBadge(activeSubscription.status)}
              </CardTitle>
              <CardDescription>
                {plan?.description || 'Sin descripción disponible'}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(plan?.price || 0, plan?.currency)}
            </div>
            <div className="text-sm text-muted-foreground">
              /{plan?.billing_interval === 'monthly' ? 'mes' : 'año'}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Subscription Details */}
        <div className="grid grid-cols-2 gap-4">
          {activeSubscription.current_period_start && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Inicio del Período</div>
                <div className="text-muted-foreground">
                  {formatDate(activeSubscription.current_period_start)}
                </div>
              </div>
            </div>
          )}

          {activeSubscription.current_period_end && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Próximo Pago</div>
                <div className={`${isNearExpiry ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                  {formatDate(activeSubscription.current_period_end)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Near Expiry Warning */}
        {isNearExpiry && (
          <div className="flex items-center space-x-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <div className="text-sm">
              <div className="font-medium text-warning">Tu suscripción vence pronto</div>
              <div className="text-muted-foreground">
                Asegúrate de que tu método de pago esté actualizado.
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          {activeSubscription.status === 'active' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pauseSubscription(activeSubscription.id)}
                disabled={isPausing}
              >
                <Pause className="h-4 w-4 mr-2" />
                {isPausing ? 'Pausando...' : 'Pausar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelSubscription(activeSubscription.id)}
                disabled={isCanceling}
              >
                <X className="h-4 w-4 mr-2" />
                {isCanceling ? 'Cancelando...' : 'Cancelar'}
              </Button>
            </>
          )}

          {activeSubscription.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => resumeSubscription(activeSubscription.id)}
              disabled={isResuming}
            >
              <Play className="h-4 w-4 mr-2" />
              {isResuming ? 'Reactivando...' : 'Reactivar'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;