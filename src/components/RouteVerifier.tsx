
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const RouteVerifier = () => {
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Verificar que las rutas críticas estén disponibles
    const criticalRoutes = ['/menu', '/auth', '/dashboard'];
    
    // Si estamos en una ruta 404 y era una ruta crítica, mostrar ayuda
    if (location.pathname === '/404' || location.pathname.includes('not-found')) {
      const intendedRoute = new URLSearchParams(window.location.search).get('intended');
      
      if (intendedRoute && criticalRoutes.includes(intendedRoute)) {
        toast({
          title: 'Ruta no encontrada',
          description: `La ruta ${intendedRoute} no está disponible. Redirigiendo...`,
          variant: 'destructive',
        });
        
        // Redirigir a la ruta correcta después de un breve delay
        setTimeout(() => {
          window.location.href = intendedRoute;
        }, 2000);
      }
    }
  }, [location, toast]);

  // Log de rutas para debugging
  useEffect(() => {
    console.log('Current route:', location.pathname);
    console.log('Route verification: Menu route (/menu) should be available');
  }, [location]);

  return null;
};

export default RouteVerifier;
