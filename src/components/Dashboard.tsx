
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import EmpleadoDashboard from './dashboards/EmpleadoDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import { Button } from '@/components/ui/button';
import { RefreshCw, User, AlertCircle, LogOut, Shield } from 'lucide-react';

const Dashboard = () => {
  const { profile, loading, user, signOut } = useAuth();

  console.log('🖥️ Dashboard: Estado actual:', {
    loading,
    hasUser: !!user,
    hasProfile: !!profile,
    userEmail: user?.email,
    profileRole: profile?.role
  });

  if (loading) {
    console.log('⏳ Dashboard: Mostrando estado de carga');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
          <p className="text-xs text-muted-foreground mt-2">
            {user ? `Usuario: ${user.email}` : 'Verificando autenticación...'}
          </p>
        </div>
      </div>
    );
  }

  // If user exists but profile doesn't, show error with retry option
  if (user && !profile) {
    console.log('⚠️ Dashboard: Usuario sin perfil detectado');
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
              onClick={() => {
                console.log('🔄 Recargando página para reintentar...');
                window.location.reload();
              }} 
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('🚪 Cerrando sesión para intentar de nuevo...');
                signOut();
              }}
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
            {/* Mensaje especial para usuarios super admin */}
            {(user.email === 'alexjfweb@gmail.com' || user.email === 'superadmin@gmail.com' || user.email === 'allseosoporte@gmail.com') && (
              <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-blue-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-semibold">Usuario Super Administrador detectado</span>
                </div>
                <p className="text-xs mt-1">
                  Se está intentando crear el perfil automáticamente con permisos de superadmin.
                </p>
              </div>
            )}
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
    console.log('🔄 Dashboard: Sin usuario, redirigiendo a auth');
    setTimeout(() => {
      window.location.href = '/auth';
    }, 100);
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirigiendo a inicio de sesión...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    console.log('🎯 Dashboard: Renderizando dashboard para rol:', profile?.role);
    
    // Verificación especial de acceso para Super Administradores
    if (profile?.role === 'superadmin') {
      console.log('🚀 Renderizando dashboard de Super Administrador para:', user.email);
      return <SuperAdminDashboard />;
    } else if (profile?.role === 'admin') {
      console.log('🔧 Renderizando dashboard de Administrador para:', user.email);
      return <AdminDashboard />;
    } else {
      console.log('👤 Renderizando dashboard de Empleado para:', user.email);
      return <EmpleadoDashboard />;
    }
  };

  return renderDashboard();
};

export default Dashboard;
