import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  Calendar,
  Download,
  Euro,
  ArrowLeft,
  ChefHat
} from 'lucide-react';
import SalesChart from './SalesChart';
import PopularProductsChart from './PopularProductsChart';
import ReservationsChart from './ReservationsChart';
import { Badge } from '@/components/ui/badge';

interface ReportsManagementProps {
  onBack?: () => void;
}

const ReportsManagement = ({ onBack }: ReportsManagementProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  // Fetch overview statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['reports-stats', selectedPeriod],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Fetch orders data
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Fetch reservations data
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, created_at, status, party_size')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Calculate statistics
      const totalRevenue = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(order => order.status === 'entregado').length || 0;
      const totalReservations = reservations?.length || 0;
      const confirmedReservations = reservations?.filter(res => res.status === 'confirmada').length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalRevenue,
        totalOrders,
        completedOrders,
        totalReservations,
        confirmedReservations,
        avgOrderValue,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        confirmationRate: totalReservations > 0 ? (confirmedReservations / totalReservations) * 100 : 0
      };
    }
  });

  const periodOptions = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 90 días' }
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Panel
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Reportes y Analytics</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {periodOptions.map(option => (
                <Button
                  key={option.value}
                  variant={selectedPeriod === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Reportes y Analytics</h2>
            <p className="text-muted-foreground">
              Análisis detallado del rendimiento del restaurante
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{stats?.totalRevenue.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  Promedio por pedido: €{stats?.avgOrderValue.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={stats?.completionRate && stats.completionRate >= 80 ? 'default' : 'secondary'}>
                    {stats?.completionRate.toFixed(1) || 0}% completados
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reservas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalReservations || 0}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={stats?.confirmationRate && stats.confirmationRate >= 80 ? 'default' : 'secondary'}>
                    {stats?.confirmationRate.toFixed(1) || 0}% confirmadas
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+12.5%</div>
                <p className="text-xs text-muted-foreground">
                  vs período anterior
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Tabs defaultValue="sales" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sales">Ventas</TabsTrigger>
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="reservations">Reservas</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Evolución de Ventas
                  </CardTitle>
                  <CardDescription>
                    Ingresos diarios durante el período seleccionado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SalesChart period={selectedPeriod} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Productos Más Populares
                  </CardTitle>
                  <CardDescription>
                    Ranking de productos por cantidad vendida
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PopularProductsChart period={selectedPeriod} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reservations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Análisis de Reservas
                  </CardTitle>
                  <CardDescription>
                    Distribución de reservas por estado y fecha
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReservationsChart period={selectedPeriod} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ReportsManagement;
