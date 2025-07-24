
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface UseAdminProductsOptions {
  businessId?: string;
  enabled?: boolean;
}

export const useAdminProducts = ({ 
  businessId, 
  enabled = true 
}: UseAdminProductsOptions) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin-products', businessId, profile?.id],
    queryFn: async () => {
      if (!businessId) {
        console.warn('⚠️ [ADMIN PRODUCTS] No hay businessId disponible');
        return [];
      }

      if (!profile?.id) {
        console.warn('⚠️ [ADMIN PRODUCTS] No hay perfil de usuario');
        return [];
      }

      console.log(`🔐 [ADMIN PRODUCTS] Obteniendo productos para admin (${profile.role}):`, businessId);
      
      try {
        // Usar la nueva función RPC que filtra por propietario
        const { data, error } = await supabase
          .rpc('get_admin_products_by_business', { business_uuid: businessId });
        
        if (error) {
          console.error('❌ [ADMIN PRODUCTS] Error en RPC:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.log('ℹ️ [ADMIN PRODUCTS] No hay productos para este administrador');
          return [];
        }
        
        // Enriquecer con información de categorías
        const enrichedProducts = await Promise.all(
          data.map(async (product) => {
            if (product.category_id) {
              const { data: categoryData } = await supabase
                .from('categories')
                .select('id, name')
                .eq('id', product.category_id)
                .single();
              
              return {
                ...product,
                categories: categoryData
              };
            }
            return product;
          })
        );
        
        console.log(`✅ [ADMIN PRODUCTS] ${enrichedProducts.length} productos obtenidos para admin ${profile.role}`);
        return enrichedProducts;
      } catch (error) {
        console.error('❌ [ADMIN PRODUCTS] Error crítico:', error);
        throw error;
      }
    },
    enabled: enabled && !!businessId && !!profile?.id,
    retry: 2,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para invalidar cache de productos de admin
export const useInvalidateAdminProducts = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  return (businessId?: string) => {
    console.log('🔄 [ADMIN CACHE] Invalidando cache de productos de admin para:', businessId);
    
    // Invalidar productos de admin
    queryClient.invalidateQueries({ 
      queryKey: ['admin-products', businessId, profile?.id] 
    });
    
    // También invalidar productos unificados para mantener sincronía
    queryClient.invalidateQueries({ 
      queryKey: ['unified-products', businessId] 
    });
  };
};
