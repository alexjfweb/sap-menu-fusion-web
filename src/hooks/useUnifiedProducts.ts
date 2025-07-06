
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
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['unified-products', businessId, isPublic],
    queryFn: async () => {
      if (!businessId) {
        console.warn('⚠️ [UNIFIED PRODUCTS] No hay businessId disponible');
        return [];
      }

      console.log(`🍽️ [UNIFIED PRODUCTS] Obteniendo productos del negocio (${isPublic ? 'público' : 'admin'}):`, businessId);
      
      try {
        // CORRECCIÓN CRÍTICA: Usar misma query para admin y público
        // Ambos muestran TODOS los productos del restaurante (business_id)
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
