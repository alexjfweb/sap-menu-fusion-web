
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

// Hook for public access - now properly fetches the actual customization
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization'],
    queryFn: async () => {
      console.log('🔧 [PUBLIC CUSTOMIZATION] Fetching menu customization...');
      
      try {
        // First get business info to get the business_id
        const { data: businessInfo, error: businessError } = await supabase
          .from('business_info')
          .select('id')
          .single();

        if (businessError) {
          console.warn('⚠️ [PUBLIC CUSTOMIZATION] No business info found, using defaults');
          return null;
        }

        console.log('✅ [PUBLIC CUSTOMIZATION] Business ID found:', businessInfo.id);

        // Now get the customization for this business
        const { data: customization, error: customizationError } = await supabase
          .from('menu_customization')
          .select('*')
          .eq('business_id', businessInfo.id)
          .single();

        if (customizationError && customizationError.code !== 'PGRST116') {
          console.warn('⚠️ [PUBLIC CUSTOMIZATION] Error fetching customization:', customizationError);
          return null;
        }

        console.log('✅ [PUBLIC CUSTOMIZATION] Customization fetched:', customization);
        return customization;
        
      } catch (error) {
        console.error('💥 [PUBLIC CUSTOMIZATION] Error:', error);
        return null;
      }
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
