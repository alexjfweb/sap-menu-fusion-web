
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

// Hook específico para el menú público que obtiene la personalización del primer negocio
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization'],
    queryFn: async () => {
      console.log('Fetching public menu customization...');
      
      try {
        // Primero obtenemos la información del negocio disponible públicamente
        const { data: businessData, error: businessError } = await supabase
          .from('business_info')
          .select('id')
          .limit(1)
          .single();
        
        if (businessError) {
          console.error('Error fetching business info for customization:', businessError);
          // Si hay error, devolvemos null para usar colores por defecto
          return null;
        }
        
        console.log('Business ID found:', businessData.id);
        
        // Luego obtenemos la personalización de ese negocio
        const { data: customizationData, error: customizationError } = await supabase
          .from('menu_customization')
          .select('*')
          .eq('business_id', businessData.id)
          .single();
        
        if (customizationError) {
          if (customizationError.code === 'PGRST116') {
            // No existe configuración personalizada, devolvemos null
            console.log('No custom configuration found, using defaults');
            return null;
          } else {
            console.error('Error fetching menu customization:', customizationError);
            return null;
          }
        }
        
        console.log('Successfully fetched menu customization:', customizationData);
        return customizationData;
      } catch (error) {
        console.error('Menu customization fetch error:', error);
        return null;
      }
    },
    staleTime: 0, // No cache - siempre fetch fresh data
    cacheTime: 0, // No mantener en cache
    retry: 1,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
