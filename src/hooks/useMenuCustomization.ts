
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

// Hook completamente reescrito para solucionar el problema de colores
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization-fixed'],
    queryFn: async () => {
      console.log('🔍 [FIX] Starting fresh menu customization fetch...');
      
      try {
        // Paso 1: Obtener business_id
        const { data: businessData, error: businessError } = await supabase
          .from('business_info')
          .select('id')
          .limit(1)
          .single();
        
        if (businessError || !businessData?.id) {
          console.log('⚠️ [FIX] No business found, returning null');
          return null;
        }
        
        console.log('✅ [FIX] Business ID found:', businessData.id);
        
        // Paso 2: Obtener personalización con parámetros específicos
        const { data: customizationData, error: customizationError } = await supabase
          .from('menu_customization')
          .select('*')
          .eq('business_id', businessData.id)
          .maybeSingle();
        
        if (customizationError) {
          console.error('❌ [FIX] Error fetching customization:', customizationError);
          return null;
        }
        
        if (!customizationData) {
          console.log('⚠️ [FIX] No customization found, returning null');
          return null;
        }
        
        console.log('🎨 [FIX] Successfully fetched customization:', customizationData);
        return customizationData;
      } catch (error) {
        console.error('💥 [FIX] Unexpected error:', error);
        return null;
      }
    },
    // Configuración agresiva para forzar actualización
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: false,
    retry: 1,
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
