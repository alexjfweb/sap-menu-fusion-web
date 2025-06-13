import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  ShoppingCart,
  DollarSign,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface GlobalAnalyticsProps {
  onBack: () => void;
}

const GlobalAnalytics = ({ onBack }: GlobalAnalyticsProps) => {
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);

  // Datos simulados para los gráficos
  const revenueData = [
    { date: '2024-01', revenue: 125000, orders: 1250 },
    { date: '2024-02', revenue: 132000, orders: 1320 },
    { date: '2024-03', revenue: 148000, orders: 1480 },
    { date: '2024-04', revenue: 155000, orders: 1550 },
    { date: '2024-05', revenue: 167000, orders: 1670 },
    { date: '2024-06', revenue: 178000, orders: 1780 },
  ];

  const companyPerformance = [
    { name: 'Restaurante A', revenue: 45000, orders: 450, growth: 12.5 },
    { name: 'Restaurante B', revenue: 38000, orders: 380, growth: 8.3 },
    { name: 'Restaurante C', revenue: 52000, orders: 520, growth: 15.2 },
    { name: 'Restaurante D', revenue: 43000, orders: 430, growth: -2.1 },
    { name: 'Restaurante E', revenue: 41000, orders: 410, growth: 6.7 },
  ];

  const userActivityData = [
    { date: '2024-06-07', activeUsers: 342, newUsers: 23 },
    { date: '2024-06-08', activeUsers: 387, newUsers: 31 },
    { date: '2024-06-09', activeUsers: 298, newUsers: 18 },
    { date: '2024-06-10', activeUsers: 445, newUsers: 42 },
    { date: '2024-06-11', activeUsers: 398, newUsers: 28 },
    { date: '2024-06-12', activeUsers: 512, newUsers: 35 },
    { date: '2024-06-13', activeUsers: 467, newUsers: 29 },
  ];

  const categoryDistribution = [
    { name: 'Platos Principales', value: 35, color: '#3b82f6' },
    { name: 'Bebidas', value: 28, color: '#10b981' },
    { name: 'Postres', value: 20, color: '#f59e0b' },
    { name: 'Aperitivos', value: 17, color: '#ef4444' },
  ];

  const topProducts = [
    { name: 'Pizza Margherita', orders: 234, revenue: 4680, category: 'Platos Principales' },
    { name: 'Coca Cola', orders: 189, revenue: 567, category: 'Bebidas' },
    { name: 'Tiramisú', orders: 156, revenue: 936, category: 'Postres' },
    { name: 'Hamburguesa Clásica', orders: 145, revenue: 2175, category: 'Platos Principales' },
    { name: 'Café Americano', orders: 134, revenue: 402, category: 'Bebidas' },
  ];

  const chartConfig = {
    revenue: {
      label: 'Ingresos',
      color: '#3b82f6',
    },
    orders: {
      label: 'Pedidos',
      color: '#10b981',
    },
    activeUsers: {
      label: 'Usuarios Activos',
      color: '#8b5cf6',
    },
    newUsers: {
      label: 'Nuevos Usuarios',
      color: '#06b6d4',
    },
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    console.log('Refreshing analytics data...');
    // Simular carga de datos
    setTimeout(() => {
      setIsLoading(false);
      console.log('Analytics data refreshed');
    }, 2000);
  };

  const handleExport = () => {
    // Simular exportación de datos
    console.log('Exportando datos analytics...');
  };

  console.log('GlobalAnalytics component rendered');
  console.log('Category distribution data:', categoryDistribution);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Analytics Globales</h1>
              <p className="text-sm text-muted-foreground">
                Métricas y análisis de toda la plataforma
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 días</SelectItem>
                <SelectItem value="30d">30 días</SelectItem>
                <SelectItem value="90d">90 días</SelectItem>
                <SelectItem value="1y">1 año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* KPIs Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$178,000</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +12.5% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,780</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +8.2% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">467</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                -2.1% desde ayer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Restaurantes Activos</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +1 nuevo este mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Ingresos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="companies">Restaurantes</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendencia de Ingresos</CardTitle>
                  <CardDescription>
                    Evolución de ingresos en los últimos 6 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--color-revenue)"
                          fill="var(--color-revenue)"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ingresos vs Pedidos</CardTitle>
                  <CardDescription>
                    Comparación mensual de ingresos y cantidad de pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--color-revenue)"
                          strokeWidth={2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="orders"
                          stroke="var(--color-orders)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actividad de Usuarios</CardTitle>
                <CardDescription>
                  Usuarios activos y nuevos registros en los últimos 7 días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="activeUsers" fill="var(--color-activeUsers)" />
                      <Bar dataKey="newUsers" fill="var(--color-newUsers)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Restaurante</CardTitle>
                <CardDescription>
                  Comparativa de ingresos y crecimiento por restaurante
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companyPerformance.map((company, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{company.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {company.orders} pedidos este mes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${company.revenue.toLocaleString()}</p>
                        <p className={`text-sm flex items-center ${
                          company.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {company.growth >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(company.growth)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab - FIXED VERSION */}
          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribución por Categorías - CORREGIDO */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Categorías</CardTitle>
                  <CardDescription>
                    Porcentaje de ventas por categoría de productos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {categoryDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                    <p className="font-medium">{data.name}</p>
                                    <p className="text-sm text-muted-foreground">{data.value}%</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {categoryDistribution.map((category, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">{category.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Productos */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos Más Vendidos</CardTitle>
                  <CardDescription>
                    Top 5 productos por número de pedidos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{product.orders} pedidos</p>
                          <p className="text-sm text-muted-foreground">${product.revenue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GlobalAnalytics;
