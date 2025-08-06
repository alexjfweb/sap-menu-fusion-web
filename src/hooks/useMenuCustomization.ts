
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
        .maybeSingle();
      
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

// Hook optimizado para acceso público - ahora puede acceder sin autenticación
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization'],
    queryFn: async () => {
      console.log('🔧 [PUBLIC CUSTOMIZATION] Starting fetch...');
      
      try {
        // Fetch simplificado - ahora funciona con la nueva política RLS
        const { data, error } = await supabase
          .from('menu_customization')
          .select('*')
          .maybeSingle();

        console.log('🔧 [PUBLIC CUSTOMIZATION] Query result:', { 
          data, 
          error,
          hasData: !!data 
        });

        if (error) {
          console.error('💥 [PUBLIC CUSTOMIZATION] Error:', error);
          return null;
        }

        if (data) {
          console.log('✅ [PUBLIC CUSTOMIZATION] Success! Using customization:', {
            id: data.id,
            button_bg_color: data.button_bg_color,
            menu_bg_color: data.menu_bg_color
          });
          return data;
        }

        console.warn('⚠️ [PUBLIC CUSTOMIZATION] No customization data found');
        return null;
        
      } catch (error) {
        console.error('💥 [PUBLIC CUSTOMIZATION] Unexpected error:', error);
        return null;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      console.log(`🔄 [PUBLIC CUSTOMIZATION] Retry attempt ${failureCount}:`, error);
      return failureCount < 2; // Reducir reintentos
    },
  });
};

export const getDefaultCustomization = (): Partial<MenuCustomization> => ({
  menu_bg_color: '#ffffff',
  header_bg_color: '#f8f9fa',
  text_color: '#333333',
  header_text_color: '#333333',
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
