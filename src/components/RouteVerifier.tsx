import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouteVerifierProps {
  children: React.ReactNode;
  requiredRole: 'admin' | 'superadmin' | 'empleado';
  fallbackRoute?: string;
}

const RouteVerifier: React.FC<RouteVerifierProps> = ({ 
  children, 
  requiredRole, 
  fallbackRoute = '/dashboard' 
}) => {
  const { profile, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔒 RouteVerifier: Verificando acceso para rol:', requiredRole);
    console.log('👤 Usuario actual:', {
      isAuthenticated,
      hasProfile: !!profile,
      currentRole: profile?.role,
      loading
    });

    if (!loading) {
      if (!isAuthenticated) {
        console.log('🚫 RouteVerifier: Usuario no autenticado, redirigiendo a auth');
        navigate('/auth');
        return;
      }

      if (!profile) {
        console.log('⚠️ RouteVerifier: Usuario sin perfil, redirigiendo a dashboard');
        navigate('/dashboard');
        return;
      }

      if (profile.role !== requiredRole) {
        console.log(`🚫 RouteVerifier: Rol incorrecto. Requerido: ${requiredRole}, Actual: ${profile.role}`);
        
        // Redirigir según el rol actual
        switch (profile.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'superadmin':
            navigate('/superadmin');
            break;
          case 'empleado':
            navigate('/empleado');
            break;
          default:
            navigate(fallbackRoute);
        }
        return;
      }

      console.log('✅ RouteVerifier: Acceso autorizado');
    }
  }, [profile, loading, isAuthenticated, requiredRole, navigate, fallbackRoute]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Debes iniciar sesión para acceder a esta página</p>
          <Button onClick={() => navigate('/auth')}>
            Ir al inicio de sesión
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Perfil de usuario no encontrado</p>
          <Button onClick={() => navigate('/dashboard')}>
            Ir al dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (profile.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            No tienes permisos para acceder a esta página
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Tu rol actual: <span className="font-semibold">{profile.role}</span>
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Ir al dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RouteVerifier;
