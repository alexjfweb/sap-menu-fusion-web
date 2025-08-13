import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Calendar, CreditCard, CheckCircle, Clock, X, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubscriptionHistoryProps {
  subscriptions: any[];
}

const SubscriptionHistory: React.FC<SubscriptionHistoryProps> = ({ subscriptions }) => {
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
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es });
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

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Historial de Suscripciones</span>
          </CardTitle>
          <CardDescription>
            Tu historial de suscripciones aparecerá aquí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay historial de suscripciones disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Historial de Suscripciones</span>
        </CardTitle>
        <CardDescription>
          Todas tus suscripciones y cambios de estado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subscriptions.map((subscription, index) => {
            const plan = subscription.subscription_plans;
            const isActive = subscription.status === 'active';
            
            return (
              <div 
                key={subscription.id}
                className={`flex items-start space-x-4 p-4 rounded-lg border ${
                  isActive ? 'border-primary/20 bg-primary/5' : 'border-border'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isActive ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <CreditCard className={`h-5 w-5 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">
                          {plan?.name || 'Plan Desconocido'}
                        </h4>
                        {getStatusBadge(subscription.status)}
                        {isActive && (
                          <Badge variant="outline" className="text-xs">
                            Actual
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {plan?.description || 'Sin descripción'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(plan?.price || 0, plan?.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        /{plan?.billing_interval === 'monthly' ? 'mes' : 'año'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-muted-foreground">Iniciada:</div>
                        <div>{formatDate(subscription.created_at)}</div>
                      </div>
                    </div>
                    
                    {subscription.current_period_end && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">
                            {isActive ? 'Próximo pago:' : 'Finalizó:'}
                          </div>
                          <div>{formatDate(subscription.current_period_end)}</div>
                        </div>
                      </div>
                    )}

                    {subscription.canceled_at && (
                      <div className="flex items-center space-x-2 col-span-2">
                        <X className="h-4 w-4 text-destructive" />
                        <div>
                          <div className="text-muted-foreground">Cancelada:</div>
                          <div>{formatDate(subscription.canceled_at)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {subscription.mp_preapproval_id && (
                    <div className="text-xs text-muted-foreground">
                      ID: {subscription.mp_preapproval_id}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionHistory;