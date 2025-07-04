
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

// Hook for public access - fetches customization without authentication
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization'],
    queryFn: async () => {
      console.log('🔧 [PUBLIC CUSTOMIZATION] Starting fetch...');
      
      try {
        // First, try to get the customization directly
        console.log('🔧 [PUBLIC CUSTOMIZATION] Attempting direct fetch...');
        const { data: customizationData, error: customizationError } = await supabase
          .from('menu_customization')
          .select('*')
          .limit(1);

        console.log('🔧 [PUBLIC CUSTOMIZATION] Direct fetch result:', { 
          data: customizationData, 
          error: customizationError 
        });

        if (customizationError) {
          console.warn('⚠️ [PUBLIC CUSTOMIZATION] Direct fetch error:', customizationError);
          
          // Fallback: try without RLS (this might fail, but let's log it)
          console.log('🔧 [PUBLIC CUSTOMIZATION] Trying fallback approach...');
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('menu_customization')
            .select('*')
            .limit(1)
            .single();
            
          console.log('🔧 [PUBLIC CUSTOMIZATION] Fallback result:', { 
            data: fallbackData, 
            error: fallbackError 
          });
          
          if (fallbackError) {
            console.error('💥 [PUBLIC CUSTOMIZATION] Both approaches failed');
            return null;
          }
          
          return fallbackData;
        }

        // If we have data, return the first record
        if (customizationData && customizationData.length > 0) {
          const selectedCustomization = customizationData[0];
          console.log('✅ [PUBLIC CUSTOMIZATION] Success! Using customization:', selectedCustomization);
          return selectedCustomization;
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
      return failureCount < 3;
    },
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
