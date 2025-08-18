
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
      console.log('✅ [SMART NAV] Usuario autenticado, verificando plan pendiente');
      
      // Verificar si hay un plan seleccionado en localStorage
      const savedPlan = localStorage.getItem('selectedPlan');
      if (savedPlan) {
        try {
          const plan = JSON.parse(savedPlan);
          console.log('📋 [SMART NAV] Plan pendiente encontrado:', plan.name);
          localStorage.removeItem('selectedPlan');
          
          // Redirigir a la página principal con parámetro para mostrar modal de pago
          navigate(`/?plan=${plan.id}&showPayment=true`);
          return;
        } catch (error) {
          console.error('❌ [SMART NAV] Error procesando plan guardado:', error);
          localStorage.removeItem('selectedPlan');
        }
      }
      
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
