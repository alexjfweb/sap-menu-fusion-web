
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export const useSmartNavigation = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, role } = useAuth();

  const navigateToAuth = () => {
    console.log('🧭 [SMART NAV] Evaluando navegación inteligente:', { isAuthenticated, loading, role });
    
    if (loading) {
      console.log('⏳ [SMART NAV] Esperando verificación de autenticación...');
      return;
    }

    if (isAuthenticated) {
      console.log('✅ [SMART NAV] Usuario autenticado, redirigiendo a dashboard');
      navigate('/dashboard');
    } else {
      console.log('🔓 [SMART NAV] Usuario no autenticado, redirigiendo a formulario de acceso');
      navigate('/auth');
    }
  };

  return {
    navigateToAuth,
    isNavigating: loading
  };
};
