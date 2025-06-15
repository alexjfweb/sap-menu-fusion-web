
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type MenuCustomization = Tables<'menu_customization'>;

export const useMenuCustomization = (businessId?: string) => {
  return useQuery({
    queryKey: ['menu-customization', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      
      const { data, error } = await supabase
        .from('menu_customization')
        .select('*')
        .eq('business_id', businessId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching menu customization:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook DEFINITIVO para acceso público - diseñado para funcionar en incógnito y otros navegadores
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization-v2'],
    queryFn: async () => {
      console.log('🔧 [PÚBLICO V2] Iniciando obtención de personalización...');
      
      try {
        // ESTRATEGIA AGRESIVA: Intentar obtener directamente sin depender del business_id
        console.log('📍 [PÚBLICO V2] Obteniendo personalización directamente...');
        
        const { data: customizationData, error: customizationError } = await supabase
          .from('menu_customization')
          .select('*')
          .limit(1)
          .single();
        
        if (customizationError) {
          console.error('❌ [PÚBLICO V2] Error al obtener personalización:', customizationError);
          
          // FALLBACK: Si falla, intentar obtener el business_id primero
          console.log('🔄 [PÚBLICO V2] Intentando fallback con business_id...');
          
          const { data: businessData, error: businessError } = await supabase
            .from('business_info')
            .select('id')
            .limit(1)
            .single();
          
          if (businessError || !businessData) {
            console.error('❌ [PÚBLICO V2] Error obteniendo business_id:', businessError);
            return null;
          }
          
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('menu_customization')
            .select('*')
            .eq('business_id', businessData.id)
            .single();
          
          if (fallbackError) {
            console.error('❌ [PÚBLICO V2] Error en fallback:', fallbackError);
            return null;
          }
          
          console.log('✅ [PÚBLICO V2] Personalización obtenida via fallback:', fallbackData);
          return fallbackData;
        }
        
        console.log('✅ [PÚBLICO V2] Personalización obtenida directamente:', customizationData);
        return customizationData;
        
      } catch (error) {
        console.error('💥 [PÚBLICO V2] Error inesperado:', error);
        return null;
      }
    },
    staleTime: 0, // Sin cache
    gcTime: 0, // Sin garbage collection
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const getDefaultCustomization = (): Partial<MenuCustomization> => ({
  menu_bg_color: '#ffffff',
  header_bg_color: '#f8f9fa',
  text_color: '#333333',
  header_text_color: '#ffffff',
  button_bg_color: '#007bff',
  button_text_color: '#ffffff',
  contact_button_bg_color: '#25d366',
  contact_button_text_color: '#ffffff',
  product_card_bg_color: '#ffffff',
  product_card_border_color: '#e9ecef',
  product_name_color: '#333333',
  product_description_color: '#6c757d',
  product_price_color: '#28a745',
  shadow_color: 'rgba(0,0,0,0.1)',
  social_links_color: '#007bff',
});
