
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import EmpleadoDashboard from './dashboards/EmpleadoDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, AlertCircle, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { profile, loading, user, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // If user exists but profile doesn't, show error with retry option
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error de acceso al panel</h2>
          <p className="text-muted-foreground mb-6">
            No se pudo crear o acceder a tu perfil de usuario. Esto puede deberse a un problema de permisos.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión e intentar de nuevo
            </Button>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md text-sm text-left">
            <p className="font-semibold mb-1">Información de depuración:</p>
            <p>Usuario: {user.email}</p>
            <p>ID: {user.id}</p>
            <p className="text-red-600 mt-2">
              Si eres administrador y este problema persiste, verifica los permisos de la base de datos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no user at all, redirect to auth
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirigiendo a inicio de sesión...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (profile?.role) {
      case 'superadmin':
        return <SuperAdminDashboard />;
      case 'admin':
        return <AdminDashboard />;
      case 'empleado':
      default:
        return <EmpleadoDashboard />;
    }
  };

  return renderDashboard();
};

export default Dashboard;
