import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChefHat, 
  Shield, 
  Building, 
  Users, 
  Database, 
  Settings, 
  BarChart3,
  Cog,
  LogOut 
} from 'lucide-react';
import CompanyManagement from '../companies/CompanyManagement';
import UserManagement from '../users/UserManagement';

const SuperAdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleBackToDashboard = () => {
    setActiveSection(null);
  };

  // Si hay una sección activa, mostrar ese componente
  if (activeSection === 'companies') {
    return <CompanyManagement onBack={handleBackToDashboard} />;
  }

  if (activeSection === 'users') {
    return <UserManagement onBack={handleBackToDashboard} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">SAP Menu - Panel Super Administrador</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              SuperAdmin: {profile?.full_name || profile?.email}
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
            Control total del sistema SAP Menu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Empresas */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <span>Empresas</span>
              </CardTitle>
              <CardDescription>
                Gestiona todos los restaurantes registrados
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

          {/* Usuarios y Roles */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Usuarios y Roles</span>
              </CardTitle>
              <CardDescription>
                Administra usuarios y permisos del sistema
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

          {/* Base de Datos */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary" />
                <span>Base de Datos</span>
              </CardTitle>
              <CardDescription>
                Monitoreo y gestión de la base de datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Gestionar BD
              </Button>
            </CardContent>
          </Card>

          {/* Configuración Global */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Configuración Global</span>
              </CardTitle>
              <CardDescription>
                Configuraciones del sistema completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Configurar Sistema
              </Button>
            </CardContent>
          </Card>

          {/* Analytics Globales */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Analytics Globales</span>
              </CardTitle>
              <CardDescription>
                Métricas y reportes de toda la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Ver Analytics
              </Button>
            </CardContent>
          </Card>

          {/* Mantenimiento */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cog className="h-5 w-5 text-primary" />
                <span>Mantenimiento</span>
              </CardTitle>
              <CardDescription>
                Herramientas de mantenimiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Herramientas
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Overview */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Resumen del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-primary">15</div>
                <p className="text-sm text-muted-foreground">Restaurantes Activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">142</div>
                <p className="text-sm text-muted-foreground">Usuarios Totales</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">1,247</div>
                <p className="text-sm text-muted-foreground">Pedidos Hoy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">99.8%</div>
                <p className="text-sm text-muted-foreground">Uptime Sistema</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
