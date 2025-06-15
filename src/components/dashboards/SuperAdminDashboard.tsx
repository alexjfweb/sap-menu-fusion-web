import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChefHat, 
  Users, 
  Package, 
  Calendar, 
  BarChart3, 
  Settings,
  LogOut,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  Building,
  CreditCard,
  Database,
  Bell
} from 'lucide-react';
import OrderManagement from '../orders/OrderManagement';
import ProductManagement from '../products/ProductManagement';
import ReservationManagement from '../reservations/ReservationManagement';
import ReportsManagement from '../reports/ReportsManagement';
import UserManagement from '../users/UserManagement';
import GlobalSettings from '../settings/GlobalSettings';
import BusinessInfoManagement from '../business/BusinessInfoManagement';
import CompanyManagement from '../companies/CompanyManagement';
import GlobalAnalytics from '../analytics/GlobalAnalytics';
import DatabaseManagement from '../database/DatabaseManagement';
import MaintenanceTools from '../maintenance/MaintenanceTools';
import SubscriptionManagement from '../subscriptions/SubscriptionManagement';
import DatabaseTestPanel from '../DatabaseTestPanel';
import PaymentReminderManagement from '../payment-reminders/PaymentReminderManagement';

const SuperAdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleBackToDashboard = () => {
    setActiveSection(null);
  };

  // Si hay una sección activa, mostrar ese componente
  if (activeSection === 'orders') {
    return <OrderManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'products') {
    return <ProductManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'reservations') {
    return <ReservationManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'reports') {
    return <ReportsManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'users') {
    return <UserManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'settings') {
    return <GlobalSettings onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'business-info') {
    return <BusinessInfoManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'companies') {
    return <CompanyManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'analytics') {
    return <GlobalAnalytics onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'database') {
    return <DatabaseManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'maintenance') {
    return <MaintenanceTools onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'subscriptions') {
    return <SubscriptionManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'payment-reminders') {
    return <PaymentReminderManagement onBack={handleBackToDashboard} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SAP Menu - Panel Super Administrador</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Super Admin: {profile?.full_name || profile?.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Panel de Super Administrador</h2>
          <p className="text-muted-foreground">
            Control total sobre la plataforma SAP Menu
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">156</div>
                  <p className="text-sm text-muted-foreground">Usuarios Totales</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">€45,247</div>
                  <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">23</div>
                  <p className="text-sm text-muted-foreground">Restaurantes Activos</p>
                </div>
                <Building className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">98.2%</div>
                  <p className="text-sm text-muted-foreground">Tiempo de Actividad</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gestión de Suscripciones - NUEVA SECCIÓN */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span>Gestión de Suscripciones</span>
              </CardTitle>
              <CardDescription>
                Administra planes, métodos de pago y transacciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('subscriptions')}
              >
                Gestionar Suscripciones
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Empresas */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <span>Gestión de Empresas</span>
              </CardTitle>
              <CardDescription>
                Administra empresas y restaurantes registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('companies')}
              >
                Gestionar Empresas
              </Button>
            </CardContent>
          </Card>

          {/* Analíticas Globales */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Analíticas Globales</span>
              </CardTitle>
              <CardDescription>
                Métricas y estadísticas de toda la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('analytics')}
              >
                Ver Analíticas
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Base de Datos */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary" />
                <span>Gestión de Base de Datos</span>
              </CardTitle>
              <CardDescription>
                Administra la base de datos y migraciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('database')}
              >
                Gestionar BD
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Usuarios Globales */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Gestión de Usuarios</span>
              </CardTitle>
              <CardDescription>
                Administra todos los usuarios de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('users')}
              >
                Gestionar Usuarios
              </Button>
            </CardContent>
          </Card>

          {/* Recordatorios de Pago */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>Recordatorios de Pago</span>
              </CardTitle>
              <CardDescription>
                Gestiona recordatorios automáticos de vencimientos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('payment-reminders')}
              >
                Gestionar Recordatorios
              </Button>
            </CardContent>
          </Card>

          {/* Herramientas de Mantenimiento */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Herramientas de Mantenimiento</span>
              </CardTitle>
              <CardDescription>
                Mantenimiento y configuración del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('maintenance')}
              >
                Herramientas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Panel de Pruebas de Base de Datos */}
        <div className="mt-8">
          <DatabaseTestPanel />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
