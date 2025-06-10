
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ChefHat, ClipboardList, Calendar, LogOut } from 'lucide-react';

const EmpleadoDashboard = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SAP Menu - Panel Empleado</h1>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Panel de Empleado</h2>
          <p className="text-muted-foreground">
            Gestiona pedidos y reservas del restaurante
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
                Gestiona los pedidos de los clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver Pedidos
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
                Consulta y gestiona reservas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver Reservas
              </Button>
            </CardContent>
          </Card>

          {/* Menú */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat className="h-5 w-5 text-primary" />
                <span>Menú</span>
              </CardTitle>
              <CardDescription>
                Consulta el menú del día
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver Menú
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Resumen del Día</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">12</div>
                <p className="text-sm text-muted-foreground">Pedidos Pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">8</div>
                <p className="text-sm text-muted-foreground">Pedidos Completados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">5</div>
                <p className="text-sm text-muted-foreground">Reservas Hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">3</div>
                <p className="text-sm text-muted-foreground">Mesas Ocupadas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmpleadoDashboard;
