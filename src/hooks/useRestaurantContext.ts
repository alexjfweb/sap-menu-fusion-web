
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRestaurantContext = (restaurantSlug?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['restaurant-context', restaurantSlug, profile?.id],
    queryFn: async () => {
      console.log('🏢 [RESTAURANT CONTEXT] Determinando contexto del restaurante...');
      
      // Si hay restaurantSlug en URL, usar ese (para menú público)
      if (restaurantSlug) {
        console.log('🔍 Buscando por slug de restaurante:', restaurantSlug);
        const { data: businessId, error } = await supabase
          .rpc('get_business_by_name', { restaurant_name: restaurantSlug });
        
        if (error) {
          console.error('❌ Error buscando por slug:', error);
          throw error;
        }
        
        if (!businessId) {
          console.warn('⚠️ No se encontró restaurante con slug:', restaurantSlug);
          return null;
        }
        
        // Obtener información completa del negocio
        const { data: businessData, error: businessError } = await supabase
          .rpc('get_business_by_id', { business_uuid: businessId });
        
        if (businessError) throw businessError;
        
        const businessInfo = businessData?.[0];
        console.log('✅ Negocio encontrado por slug:', businessInfo?.business_name);
        return businessInfo;
      }
      
      // Si hay usuario autenticado, usar su business_id (para vista admin)
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
          const { data: businessData, error: businessError } = await supabase
            .rpc('get_business_by_id', { business_uuid: profileData.business_id });
          
          if (businessError) throw businessError;
          
          const businessInfo = businessData?.[0];
          console.log('✅ Negocio del usuario autenticado:', businessInfo?.business_name);
          return businessInfo;
        }
      }
      
      // Fallback: primer negocio disponible
      console.log('🔄 Fallback: usando primer negocio disponible');
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      console.log('✅ Usando negocio por defecto:', data?.business_name);
      return data;
    },
    enabled: true,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Función para convertir nombre de negocio a slug URL-friendly
export const createRestaurantSlug = (businessName: string): string => {
  return businessName
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Multiple guiones a uno solo
    .trim();
};

// Función para convertir slug a nombre de negocio (aproximado)
export const slugToBusinessName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
