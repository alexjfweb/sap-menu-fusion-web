import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Users, ShoppingBag, Calendar, MapPin } from 'lucide-react';
import { usePlanLimits } from '@/hooks/usePlanLimits';

const UsageDashboard = () => {
  const { 
    planLimits, 
    currentUsage, 
    isLoading, 
    getUsagePercentage, 
    isNearLimit 
  } = usePlanLimits();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-2 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!planLimits || !currentUsage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Panel de Uso</CardTitle>
          <CardDescription>
            No se encontró información de plan o uso actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Por favor, asegúrate de tener un plan activo para ver tu uso actual.
          </p>
        </CardContent>
      </Card>
    );
  }

  const usageStats = [
    {
      title: 'Productos',
      current: currentUsage.current_products,
      limit: planLimits.max_products,
      icon: ShoppingBag,
      color: 'blue',
      resourceType: 'products'
    },
    {
      title: 'Usuarios',
      current: currentUsage.current_users,
      limit: planLimits.max_users,
      icon: Users,
      color: 'green',
      resourceType: 'users'
    },
    {
      title: 'Reservas Hoy',
      current: currentUsage.daily_reservations,
      limit: planLimits.max_reservations_per_day,
      icon: Calendar,
      color: 'orange',
      resourceType: 'daily_reservations'
    },
    {
      title: 'Ubicaciones',
      current: currentUsage.current_locations,
      limit: planLimits.max_locations,
      icon: MapPin,
      color: 'purple',
      resourceType: 'locations'
    },
  ];

  const formatLimit = (limit: number | null) => {
    if (limit === null || limit === undefined) return 'Ilimitado';
    return limit.toLocaleString();
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 80) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Panel de Uso</h2>
          <p className="text-muted-foreground">
            Monitorea tu uso actual vs los límites de tu plan
          </p>
        </div>
      </div>

      {/* Alertas de límites */}
      <div className="space-y-2">
        {usageStats
          .filter(stat => stat.limit !== null && isNearLimit(stat.resourceType, 0.8))
          .map(stat => (
            <Card key={stat.resourceType} className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-800">
                      Te estás acercando al límite de {stat.title.toLowerCase()}
                    </p>
                    <p className="text-xs text-orange-600">
                      {stat.current} de {formatLimit(stat.limit)} utilizados
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Mejorar Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {usageStats.map((stat) => {
          const IconComponent = stat.icon;
          const percentage = getUsagePercentage(stat.resourceType);
          const isUnlimited = stat.limit === null;
          
          return (
            <Card key={stat.resourceType}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold">
                      {stat.current.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {formatLimit(stat.limit)}
                    </span>
                  </div>
                  
                  {!isUnlimited && (
                    <>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusColor(percentage)}>
                          {percentage.toFixed(0)}% usado
                        </Badge>
                        {percentage >= 80 && (
                          <span className="text-xs text-orange-600 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Cerca del límite
                          </span>
                        )}
                      </div>
                    </>
                  )}
                  
                  {isUnlimited && (
                    <Badge variant="outline" className="w-fit">
                      Ilimitado
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Funcionalidades habilitadas */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades de tu Plan</CardTitle>
          <CardDescription>
            Características y integraciones disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Acceso</h4>
              <div className="space-y-1">
                <Badge variant={planLimits.api_access_enabled ? 'default' : 'secondary'}>
                  API: {planLimits.api_access_enabled ? 'Habilitado' : 'Deshabilitado'}
                </Badge>
                <Badge variant={planLimits.custom_domain_enabled ? 'default' : 'secondary'}>
                  Dominio Personalizado: {planLimits.custom_domain_enabled ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Características</h4>
              <div className="space-y-1">
                <Badge variant={planLimits.advanced_analytics_enabled ? 'default' : 'secondary'}>
                  Análisis Avanzados: {planLimits.advanced_analytics_enabled ? 'Sí' : 'No'}
                </Badge>
                <Badge variant={planLimits.multi_location_enabled ? 'default' : 'secondary'}>
                  Multi-ubicación: {planLimits.multi_location_enabled ? 'Sí' : 'No'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Personalización</h4>
              <div className="space-y-1">
                <Badge variant={planLimits.whitelabel_enabled ? 'default' : 'secondary'}>
                  White-label: {planLimits.whitelabel_enabled ? 'Sí' : 'No'}
                </Badge>
                <Badge variant="outline">
                  Nivel: {planLimits.customization_level}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones de upgrade */}
      {usageStats.some(stat => stat.limit !== null && getUsagePercentage(stat.resourceType) >= 70) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <TrendingUp className="h-5 w-5" />
              <span>Recomendación de Upgrade</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              Estás usando más del 70% de algunos de tus límites. Considera mejorar tu plan para obtener más recursos y funcionalidades.
            </p>
            <Button>
              Ver Planes Disponibles
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UsageDashboard;