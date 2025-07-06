
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Clock,
  User,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ActivityHistoryPanelProps {
  onBack: () => void;
}

const ActivityHistoryPanel = ({ onBack }: ActivityHistoryPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const { profile } = useAuth();

  // Obtener todas las actividades de empleados del admin actual
  const { data: activities, isLoading } = useQuery({
    queryKey: ['all-employee-activities', profile?.id, searchTerm, activityTypeFilter, dateFilter],
    queryFn: async () => {
      if (!profile?.id) return [];

      console.log('📊 [ACTIVITY HISTORY] Fetching activities with filters:', {
        searchTerm,
        activityTypeFilter,
        dateFilter
      });

      let query = supabase
        .from('employee_activities')
        .select(`
          *,
          profiles!employee_activities_employee_id_fkey(
            full_name,
            email,
            role
          )
        `)
        .order('created_at', { ascending: false });

      // Filtrar por empleados del admin actual
      const { data: employeeIds } = await supabase
        .from('profiles')
        .select('id')
        .eq('created_by', profile.id);

      if (employeeIds && employeeIds.length > 0) {
        const ids = employeeIds.map(emp => emp.id);
        query = query.in('employee_id', ids);
      } else {
        // Si no hay empleados, también incluir actividades del propio admin
        query = query.eq('employee_id', profile.id);
      }

      // Aplicar filtros
      if (activityTypeFilter !== 'all') {
        query = query.eq('activity_type', activityTypeFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('❌ [ACTIVITY HISTORY] Error fetching activities:', error);
        throw error;
      }

      console.log(`✅ [ACTIVITY HISTORY] Fetched ${data?.length || 0} activities`);
      return data;
    },
    enabled: !!profile?.id,
  });

  // Filtrar por término de búsqueda
  const filteredActivities = activities?.filter(activity => {
    const searchLower = searchTerm.toLowerCase();
    return (
      activity.description.toLowerCase().includes(searchLower) ||
      activity.activity_type.toLowerCase().includes(searchLower) ||
      activity.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      activity.profiles?.email?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Obtener tipos únicos de actividades para el filtro
  const activityTypes = [...new Set(activities?.map(a => a.activity_type) || [])];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
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

  const getActivityColor = (activityType: string) => {
    if (activityType.includes('created')) return 'bg-green-100 text-green-800';
    if (activityType.includes('updated')) return 'bg-blue-100 text-blue-800';
    if (activityType.includes('deleted')) return 'bg-red-100 text-red-800';
    if (activityType.includes('activated')) return 'bg-green-100 text-green-800';
    if (activityType.includes('deactivated')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    if (!filteredActivities?.length) return;

    const headers = ['Fecha', 'Empleado', 'Tipo de Actividad', 'Descripción', 'Entidad'];
    const csvData = filteredActivities.map(activity => [
      formatDate(activity.created_at),
      activity.profiles?.full_name || activity.profiles?.email || 'Desconocido',
      activity.activity_type,
      activity.description,
      activity.entity_type || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `actividades_empleados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <Activity className="h-6 w-6 mr-2" />
                  Historial de Actividades
                </h1>
                <p className="text-sm text-muted-foreground">
                  Registro completo de actividades de todos los empleados
                </p>
              </div>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div>
                <select
                  value={activityTypeFilter}
                  onChange={(e) => setActivityTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todos los tipos</option>
                  {activityTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="today">Hoy</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                </select>
              </div>

              <div className="flex items-center text-sm text-muted-foreground">
                <Filter className="h-4 w-4 mr-2" />
                {filteredActivities.length} resultado(s)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de actividades */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Actividades</CardTitle>
            <CardDescription>
              Cronología detallada de todas las acciones realizadas por los empleados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay actividades</h3>
                <p className="text-muted-foreground">
                  {searchTerm || activityTypeFilter !== 'all' || dateFilter !== 'all'
                    ? 'No se encontraron actividades con los filtros aplicados'
                    : 'Aún no hay actividades registradas'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="text-2xl flex-shrink-0">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">
                            {activity.description}
                          </h4>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {activity.profiles?.full_name || activity.profiles?.email || 'Usuario desconocido'}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(activity.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-4">
                          <Badge className={`text-xs ${getActivityColor(activity.activity_type)}`}>
                            {activity.activity_type.replace('_', ' ')}
                          </Badge>
                          {activity.entity_type && (
                            <Badge variant="outline" className="text-xs">
                              {activity.entity_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <strong>Detalles:</strong> {JSON.stringify(activity.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityHistoryPanel;
