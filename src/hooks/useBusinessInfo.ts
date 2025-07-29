
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useBusinessInfo = () => {
  const { profile, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['business-info', profile?.id, profile?.business_id],
    queryFn: async () => {
      console.log('📋 [BUSINESS INFO] Obteniendo información del negocio...');
      
      // Solo proceder si el usuario está autenticado
      if (!isAuthenticated || !profile?.id) {
        console.log('⚠️ [BUSINESS INFO] Usuario no autenticado');
        return null;
      }

      console.log('🔍 [BUSINESS INFO] Obteniendo usando función segura...');

      try {
        // Usar la función de base de datos que valida unicidad
        const { data, error } = await supabase
          .rpc('get_unique_business_info');
        
        if (error) {
          console.error('❌ Error obteniendo información del negocio:', error);
          
          // Manejar errores específicos
          if (error.code === 'check_violation') {
            throw new Error('Se encontraron múltiples registros de negocio. Contacte soporte técnico.');
          }
          
          throw error;
        }
        
        // La función RPC retorna un array, tomar el primer elemento
        const businessInfo = data && data.length > 0 ? data[0] : null;
        
        if (!businessInfo) {
          console.log('⚠️ [BUSINESS INFO] No se encontró información del negocio');
          return null;
        }
        
        console.log('✅ Información del negocio obtenida correctamente');
        return businessInfo;
        
      } catch (error) {
        console.error('💥 [BUSINESS INFO] Error inesperado:', error);
        throw error;
      }
    },
    enabled: isAuthenticated && !!profile?.id,
    retry: (failureCount, error) => {
      // No reintentar si es un error de validación
      if (error?.message?.includes('múltiples registros')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
