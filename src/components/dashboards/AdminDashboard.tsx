
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChefHat, 
  ShoppingCart, 
  Calendar, 
  BarChart3, 
  Users, 
  Settings,
  LogOut,
  Package
} from 'lucide-react';
import ProductManagement from '../products/ProductManagement';

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  const renderContent = () => {
    switch (activeSection) {
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gestión de Pedidos</h3>
            <p className="text-muted-foreground">Esta funcionalidad estará disponible próximamente</p>
          </div>
        );
      case 'reservations':
        return (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gestión de Reservas</h3>
            <p className="text-muted-foreground">Esta funcionalidad estará disponible próximamente</p>
          </div>
        );
      case 'reports':
        return (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Reportes</h3>
            <p className="text-muted-foreground">Esta funcionalidad estará disponible próximamente</p>
          </div>
        );
      case 'users':
        return (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Gestión de Usuarios</h3>
            <p className="text-muted-foreground">Esta funcionalidad estará disponible próximamente</p>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Panel de Administrador</h2>
              <p className="text-muted-foreground">
                Gestiona todos los aspectos del restaurante
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Productos */}
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => setActiveSection('products')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span>Productos</span>
                  </CardTitle>
                  <CardDescription>
                    Gestiona el menú y productos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">24</div>
                  <p className="text-sm text-muted-foreground">Productos activos</p>
                </CardContent>
              </Card>

              {/* Pedidos */}
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => setActiveSection('orders')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span>Pedidos</span>
                  </CardTitle>
                  <CardDescription>
                    Gestiona pedidos de clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">8</div>
                  <p className="text-sm text-muted-foreground">Pedidos pendientes</p>
                </CardContent>
              </Card>

              {/* Reservas */}
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => setActiveSection('reservations')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Reservas</span>
                  </CardTitle>
                  <CardDescription>
                    Gestiona reservas de mesas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">12</div>
                  <p className="text-sm text-muted-foreground">Reservas hoy</p>
                </CardContent>
              </Card>

              {/* Reportes */}
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => setActiveSection('reports')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>Reportes</span>
                  </CardTitle>
                  <CardDescription>
                    Analytics y estadísticas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">€1,245</div>
                  <p className="text-sm text-muted-foreground">Ingresos hoy</p>
                </CardContent>
              </Card>

              {/* Usuarios */}
              <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => setActiveSection('users')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Usuarios</span>
                  </CardTitle>
                  <CardDescription>
                    Gestiona empleados y roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">15</div>
                  <p className="text-sm text-muted-foreground">Empleados activos</p>
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
                    Configurar el restaurante
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Acceder
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <ChefHat className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">SAP Menu - Panel Admin</h1>
              {activeSection !== 'overview' && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm text-muted-foreground"
                  onClick={() => setActiveSection('overview')}
                >
                  ← Volver al inicio
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Bienvenido, {profile?.full_name || profile?.email}
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
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
