
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

// Hook for public access - bypassing RLS by using anon key directly
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization-bypass'],
    queryFn: async () => {
      console.log('🔧 [BYPASS] Attempting direct access to menu customization...');
      
      try {
        // Direct approach: get any available customization record
        const response = await fetch(
          'https://hlbbaaewjebasisxgnrt.supabase.co/rest/v1/menu_customization?select=*&limit=1',
          {
            method: 'GET',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsYmJhYWV3amViYXNpc3hnbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDMwODYsImV4cCI6MjA2NTA3OTA4Nn0.0PfH9-e4VHi0yWYUzMr_fhONY2-eYBMeWWX2joIVo9Y',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsYmJhYWV3amViYXNpc3hnbnJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MDMwODYsImV4cCI6MjA2NTA3OTA4Nn0.0PfH9-e4VHi0yWYUzMr_fhONY2-eYBMeWWX2joIVo9Y',
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          }
        );

        console.log('🔧 [BYPASS] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ [BYPASS] Data fetched successfully:', data);
          return data && data.length > 0 ? data[0] : null;
        } else {
          console.error('❌ [BYPASS] HTTP Error:', response.status, response.statusText);
          return null;
        }
        
      } catch (error) {
        console.error('💥 [BYPASS] Error fetching customization:', error);
        return null;
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000,
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
