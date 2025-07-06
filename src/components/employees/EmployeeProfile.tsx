
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Activity,
  Clock,
  Star
} from 'lucide-react';
import { Employee } from '@/hooks/useEmployeeManagement';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeProfileProps {
  employee: Employee;
  onBack: () => void;
}

const EmployeeProfile = ({ employee, onBack }: EmployeeProfileProps) => {
  // Obtener actividades recientes del empleado
  const { data: recentActivities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['employee-activities', employee.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_activities')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Obtener estadísticas del empleado
  const { data: stats } = useQuery({
    queryKey: ['employee-stats', employee.id],
    queryFn: async () => {
      // Contar actividades por tipo
      const { data: activities } = await supabase
        .from('employee_activities')
        .select('activity_type')
        .eq('employee_id', employee.id);

      // Contar pedidos creados
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('created_by', employee.id);

      // Contar reservas gestionadas
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('created_by', employee.id);

      return {
        totalActivities: activities?.length || 0,
        totalOrders: orders?.length || 0,
        totalReservations: reservations?.length || 0,
        activitiesByType: activities?.reduce((acc: any, activity) => {
          acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
          return acc;
        }, {}) || {}
      };
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (activityType: string) => {
    if (activityType.includes('order')) return '🛍️';
    if (activityType.includes('reservation')) return '📅';
    if (activityType.includes('product')) return '🍽️';
    if (activityType.includes('employee')) return '👥';
    return '📋';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Perfil de Empleado</h1>
              <p className="text-sm text-muted-foreground">
                Información detallada y actividad reciente
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Personal */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <CardTitle>{employee.full_name || 'Sin nombre'}</CardTitle>
                <CardDescription>{employee.email}</CardDescription>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                    {employee.role}
                  </Badge>
                  <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                    {employee.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{employee.email}</span>
                  </div>
                  
                  {employee.phone_mobile && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.phone_mobile}</span>
                    </div>
                  )}
                  
                  {employee.phone_landline && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.phone_landline}</span>
                    </div>
                  )}
                  
                  {employee.address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Creado: {formatDate(employee.created_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas rápidas */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Actividades</span>
                    <span className="font-medium">{stats?.totalActivities || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pedidos Creados</span>
                    <span className="font-medium">{stats?.totalOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Reservas Gestionadas</span>
                    <span className="font-medium">{stats?.totalReservations || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actividad Reciente */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Últimas 10 actividades realizadas por este empleado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !recentActivities || recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Sin actividad reciente</h3>
                    <p className="text-muted-foreground">
                      Este empleado aún no ha realizado ninguna actividad registrada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-4 p-4 border rounded-lg"
                      >
                        <div className="text-2xl">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{activity.description}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Tipo: {activity.activity_type.replace('_', ' ')}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(activity.created_at)}
                            </span>
                            {activity.entity_type && (
                              <Badge variant="outline" className="text-xs">
                                {activity.entity_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
