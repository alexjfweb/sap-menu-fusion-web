import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Users, 
  Calendar, 
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Infinity
} from 'lucide-react';

interface UsageLimitsDisplayProps {
  planLimits: any;
  currentUsage: any;
}

const UsageLimitsDisplay: React.FC<UsageLimitsDisplayProps> = ({ 
  planLimits, 
  currentUsage 
}) => {
  const getUsagePercentage = (current: number, max: number | null) => {
    if (max === null || max === undefined) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-warning';
    return 'text-primary';
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { 
      icon: AlertTriangle, 
      label: 'Crítico', 
      variant: 'destructive' as const,
      color: 'hsl(var(--destructive))'
    };
    if (percentage >= 70) return { 
      icon: AlertTriangle, 
      label: 'Advertencia', 
      variant: 'secondary' as const,
      color: 'hsl(var(--warning))'
    };
    return { 
      icon: CheckCircle, 
      label: 'Normal', 
      variant: 'default' as const,
      color: 'hsl(var(--primary))'
    };
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit === undefined) return 'Ilimitado';
    return limit.toLocaleString();
  };

  const usageItems = [
    {
      title: 'Productos',
      icon: Package,
      current: currentUsage?.current_products || 0,
      max: planLimits?.max_products,
      description: 'Productos en tu menú'
    },
    {
      title: 'Usuarios',
      icon: Users,
      current: currentUsage?.current_users || 0,
      max: planLimits?.max_users,
      description: 'Miembros del equipo'
    },
    {
      title: 'Reservas Diarias',
      icon: Calendar,
      current: currentUsage?.daily_reservations || 0,
      max: planLimits?.max_reservations_per_day,
      description: 'Reservas procesadas hoy'
    },
    {
      title: 'Ubicaciones',
      icon: MapPin,
      current: currentUsage?.current_locations || 0,
      max: planLimits?.max_locations,
      description: 'Sucursales o ubicaciones'
    }
  ];

  if (!planLimits && !currentUsage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Uso y Límites</span>
          </CardTitle>
          <CardDescription>
            Información de uso no disponible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay datos de uso disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Uso y Límites del Plan</span>
        </CardTitle>
        <CardDescription>
          Monitorea tu uso actual vs los límites de tu plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {usageItems.map((item) => {
            const percentage = getUsagePercentage(item.current, item.max);
            const status = getUsageStatus(percentage);
            const StatusIcon = status.icon;
            const ItemIcon = item.icon;

            return (
              <div key={item.title} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ItemIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.title}</span>
                    <Badge variant={status.variant} className="ml-2">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      <span className={getUsageColor(percentage)}>
                        {item.current.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        {item.max ? ` / ${formatLimit(item.max)}` : ' / ∞'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {item.max ? (
                    <>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        style={{
                          backgroundColor: 'hsl(var(--muted))',
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.description}</span>
                        <span>{percentage.toFixed(1)}% usado</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Infinity className="h-4 w-4" />
                      <span>{item.description} - Sin límite</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Plan Features Summary */}
        {planLimits && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Características del Plan</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Access:</span>
                  <Badge variant={planLimits.api_access_enabled ? 'default' : 'secondary'}>
                    {planLimits.api_access_enabled ? 'Habilitado' : 'No disponible'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Multi-ubicación:</span>
                  <Badge variant={planLimits.multi_location_enabled ? 'default' : 'secondary'}>
                    {planLimits.multi_location_enabled ? 'Habilitado' : 'No disponible'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dominio propio:</span>
                  <Badge variant={planLimits.custom_domain_enabled ? 'default' : 'secondary'}>
                    {planLimits.custom_domain_enabled ? 'Habilitado' : 'No disponible'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Analytics avanzado:</span>
                  <Badge variant={planLimits.advanced_analytics_enabled ? 'default' : 'secondary'}>
                    {planLimits.advanced_analytics_enabled ? 'Habilitado' : 'No disponible'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageLimitsDisplay;