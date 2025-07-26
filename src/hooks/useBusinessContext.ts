
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useBusinessContext = () => {
  const { profile, isAuthenticated } = useAuth();

  const { data: businessInfo, isLoading, error } = useQuery({
    queryKey: ['business-context', profile?.id, profile?.business_id],
    queryFn: async () => {
      if (!isAuthenticated || !profile?.id || !profile?.business_id) {
        console.log('⚠️ No hay usuario autenticado o business_id');
        return null;
      }

      console.log('🏢 Obteniendo contexto de negocio para usuario:', profile.id);

      // Obtener información completa del negocio usando el business_id del perfil
      const { data: businessData, error: businessError } = await supabase
        .from('business_info')
        .select('*')
        .eq('id', profile.business_id)
        .single();

      if (businessError) {
        console.error('❌ Error obteniendo información del negocio:', businessError);
        throw businessError;
      }

      console.log('✅ Contexto de negocio obtenido:', businessData.business_name);
      return businessData;
    },
    enabled: isAuthenticated && !!profile?.id && !!profile?.business_id,
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
