
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChefHat, 
  ClipboardList, 
  Calendar, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  LogOut 
} from 'lucide-react';

const AdminDashboard = () => {
  const { profile, signOut } = useAuth();

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
            Gestiona todos los aspectos del restaurante
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pedidos */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <span>Pedidos</span>
              </CardTitle>
              <CardDescription>
                Gestiona y supervisa todos los pedidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Gestionar Pedidos
              </Button>
            </CardContent>
          </Card>

          {/* Productos */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-primary" />
                <span>Productos</span>
              </CardTitle>
              <CardDescription>
                Administra el menú y productos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Gestionar Productos
              </Button>
            </CardContent>
          </Card>

          {/* Inventario */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <span>Inventario</span>
              </CardTitle>
              <CardDescription>
                Control de stock e inventario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Gestionar Inventario
              </Button>
            </CardContent>
          </Card>

          {/* Reservas */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Reservas</span>
              </CardTitle>
              <CardDescription>
                Administra reservas y mesas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Gestionar Reservas
              </Button>
            </CardContent>
          </Card>

          {/* Empleados */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Empleados</span>
              </CardTitle>
              <CardDescription>
                Gestiona el personal del restaurante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Gestionar Empleados
              </Button>
            </CardContent>
          </Card>

          {/* Reportes */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Reportes</span>
              </CardTitle>
              <CardDescription>
                Análisis y reportes del negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver Reportes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Analytics del Restaurante</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">€2,450</div>
                <p className="text-sm text-muted-foreground">Ventas Hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">32</div>
                <p className="text-sm text-muted-foreground">Pedidos Completados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">18</div>
                <p className="text-sm text-muted-foreground">Productos Activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">7</div>
                <p className="text-sm text-muted-foreground">Items Bajo Stock</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
