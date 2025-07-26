
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useBusinessInfo = () => {
  const { profile, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['business-info', profile?.id, profile?.business_id],
    queryFn: async () => {
      console.log('📋 [BUSINESS INFO] Obteniendo información del negocio...');
      
      // Solo proceder si el usuario está autenticado y tiene business_id
      if (!isAuthenticated || !profile?.id || !profile?.business_id) {
        console.log('⚠️ [BUSINESS INFO] Usuario no autenticado o sin business_id');
        return null;
      }

      console.log('🔍 [BUSINESS INFO] Obteniendo para business_id:', profile.business_id);

      // Obtener información del negocio específico del usuario
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .eq('id', profile.business_id)
        .single();
      
      if (error) {
        console.error('❌ Error obteniendo información del negocio:', error);
        throw error;
      }
      
      console.log('✅ Información del negocio obtenida para usuario autenticado');
      return data;
    },
    enabled: isAuthenticated && !!profile?.id && !!profile?.business_id,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
