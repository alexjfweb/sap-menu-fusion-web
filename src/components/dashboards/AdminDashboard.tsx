
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
  Building
} from 'lucide-react';
import OrderManagement from '../orders/OrderManagement';
import ProductManagement from '../products/ProductManagement';
import ReservationManagement from '../reservations/ReservationManagement';
import ReportsManagement from '../reports/ReportsManagement';
import UserManagement from '../users/UserManagement';
import GlobalSettings from '../settings/GlobalSettings';
import BusinessInfoManagement from '../business/BusinessInfoManagement';

const AdminDashboard = () => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SAP Menu - Panel Administrador</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Admin: {profile?.full_name || profile?.email}
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
          <h2 className="text-3xl font-bold mb-2">Panel de Administrador</h2>
          <p className="text-muted-foreground">
            Gestiona tu restaurante de manera eficiente
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-primary">24</div>
                  <p className="text-sm text-muted-foreground">Pedidos Hoy</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">€1,247</div>
                  <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">8</div>
                  <p className="text-sm text-muted-foreground">Reservas Hoy</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">15 min</div>
                  <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Información del Negocio */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <span>Información del Negocio</span>
              </CardTitle>
              <CardDescription>
                Gestiona la información de tu restaurante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('business-info')}
              >
                Editar Información
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Pedidos */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span>Gestión de Pedidos</span>
              </CardTitle>
              <CardDescription>
                Administra los pedidos del restaurante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('orders')}
              >
                Gestionar Pedidos
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Productos */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <span>Gestión de Productos</span>
              </CardTitle>
              <CardDescription>
                Administra el menú y productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('products')}
              >
                Gestionar Productos
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Reservas */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Gestión de Reservas</span>
              </CardTitle>
              <CardDescription>
                Administra las reservas de mesas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('reservations')}
              >
                Gestionar Reservas
              </Button>
            </CardContent>
          </Card>

          {/* Sistema de Reportes */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Sistema de Reportes</span>
              </CardTitle>
              <CardDescription>
                Analiza el rendimiento del negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('reports')}
              >
                Ver Reportes
              </Button>
            </CardContent>
          </Card>

          {/* Gestión de Usuarios */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Gestión de Usuarios</span>
              </CardTitle>
              <CardDescription>
                Administra usuarios y permisos
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

          {/* Configuración */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Configuración</span>
              </CardTitle>
              <CardDescription>
                Configuraciones del restaurante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => setActiveSection('settings')}
              >
                Configurar Sistema
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
