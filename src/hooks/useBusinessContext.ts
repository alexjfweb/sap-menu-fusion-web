
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useBusinessContext = () => {
  const { profile } = useAuth();

  const { data: businessInfo, isLoading, error } = useQuery({
    queryKey: ['business-context', profile?.id],
    queryFn: async () => {
      if (!profile?.id) {
        console.log('⚠️ No hay perfil de usuario');
        return null;
      }

      console.log('🏢 Obteniendo contexto de negocio para usuario:', profile.id);

      // Obtener business_id del perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', profile.id)
        .single();

      if (profileError) {
        console.error('❌ Error obteniendo business_id del perfil:', profileError);
        throw profileError;
      }

      if (!profileData?.business_id) {
        console.warn('⚠️ Usuario no tiene business_id asignado');
        return null;
      }

      // Obtener información completa del negocio
      const { data: businessData, error: businessError } = await supabase
        .from('business_info')
        .select('*')
        .eq('id', profileData.business_id)
        .single();

      if (businessError) {
        console.error('❌ Error obteniendo información del negocio:', businessError);
        throw businessError;
      }

      console.log('✅ Contexto de negocio obtenido:', businessData.business_name);
      return businessData;
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    businessInfo,
    businessId: businessInfo?.id,
    businessName: businessInfo?.business_name,
    isLoading,
    error
  };
};
