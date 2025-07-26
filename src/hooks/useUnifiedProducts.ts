
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface UseUnifiedProductsOptions {
  businessId?: string;
  isPublic?: boolean;
  enabled?: boolean;
}

export const useUnifiedProducts = ({ 
  businessId, 
  isPublic = false,
  enabled = true 
}: UseUnifiedProductsOptions) => {
  const { profile, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['unified-products', businessId, isPublic, profile?.id],
    queryFn: async () => {
      if (!businessId) {
        console.warn('⚠️ [UNIFIED PRODUCTS] No hay businessId disponible');
        return [];
      }

      // Para acceso público, verificar que se proporcione businessId específico
      if (isPublic) {
        console.log(`🍽️ [UNIFIED PRODUCTS] Obteniendo productos públicos del negocio:`, businessId);
      } else {
        // Para acceso admin, verificar que el usuario esté autenticado y sea el propietario
        if (!isAuthenticated || !profile?.id || profile.business_id !== businessId) {
          console.warn('⚠️ [UNIFIED PRODUCTS] Usuario no autenticado o no es propietario del negocio');
          return [];
        }
        console.log(`🍽️ [UNIFIED PRODUCTS] Obteniendo productos del admin del negocio:`, businessId);
      }
      
      try {
        const { data, error } = await supabase
          .rpc('get_public_products_by_business', { business_uuid: businessId });
        
        if (error) {
          console.error('❌ [UNIFIED PRODUCTS] Error en RPC:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          console.warn('⚠️ [UNIFIED PRODUCTS] No hay productos disponibles para el negocio');
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
        
        console.log(`✅ [UNIFIED PRODUCTS] ${enrichedProducts.length} productos obtenidos para negocio ${businessId} (${isPublic ? 'público' : 'admin'})`);
        return enrichedProducts;
      } catch (error) {
        console.error('❌ [UNIFIED PRODUCTS] Error crítico:', error);
        throw error;
      }
    },
    enabled: enabled && !!businessId,
    retry: 2,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

// Hook para invalidar cache de productos de forma sincronizada
export const useInvalidateProducts = () => {
  const queryClient = useQueryClient();
  
  return (businessId?: string) => {
    console.log('🔄 [CACHE INVALIDATION] Invalidando cache de productos para:', businessId);
    
    // Invalidar todos los productos del negocio (admin y público)
    queryClient.invalidateQueries({ 
      queryKey: ['unified-products', businessId] 
    });
    
    // Invalidar queries legacy por compatibilidad
    queryClient.invalidateQueries({ 
      queryKey: ['products-by-business'] 
    });
    
    queryClient.invalidateQueries({ 
      queryKey: ['products-public-by-business-v3'] 
    });
    
    queryClient.invalidateQueries({ 
      queryKey: ['products-public-optimized-v2'] 
    });
  };
};
