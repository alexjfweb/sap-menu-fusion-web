
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useBusinessInfo = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['business-info', profile?.id],
    queryFn: async () => {
      console.log('📋 [BUSINESS INFO] Obteniendo información del negocio...');
      
      // Si el usuario está autenticado, obtener su business_id
      if (profile?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', profile.id)
          .single();

        if (profileError) {
          console.error('❌ Error obteniendo business_id del perfil:', profileError);
          throw profileError;
        }

        if (profileData?.business_id) {
          // Obtener información del negocio específico del usuario
          const { data, error } = await supabase
            .from('business_info')
            .select('*')
            .eq('id', profileData.business_id)
            .single();
          
          if (error) {
            console.error('❌ Error obteniendo información del negocio:', error);
            throw error;
          }
          
          console.log('✅ Información del negocio obtenida para usuario autenticado');
          return data;
        }
      }
      
      // Fallback: obtener primer negocio disponible (para usuarios no autenticados)
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error obteniendo información del negocio (fallback):', error);
        throw error;
      }
      
      console.log('✅ Información del negocio obtenida (fallback)');
      return data;
    },
    enabled: true, // Siempre habilitado
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
