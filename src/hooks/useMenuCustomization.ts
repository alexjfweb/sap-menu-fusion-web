
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

// Hook optimizado para acceso público con políticas RLS corregidas
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization'],
    queryFn: async () => {
      console.log('🔧 [PUBLIC] Fetching menu customization...');
      
      try {
        // PASO 1: Obtener business_id del primer negocio
        console.log('📍 [PUBLIC] Getting business ID...');
        const { data: businessData, error: businessError } = await supabase
          .from('business_info')
          .select('id')
          .limit(1)
          .single();
        
        if (businessError) {
          console.error('❌ [PUBLIC] Business query error:', businessError);
          return null;
        }
        
        if (!businessData) {
          console.warn('⚠️ [PUBLIC] No business found');
          return null;
        }
        
        const businessId = businessData.id;
        console.log('✅ [PUBLIC] Business ID:', businessId);
        
        // PASO 2: Obtener personalización con acceso público
        console.log('🎨 [PUBLIC] Getting customization for business:', businessId);
        const { data: customizationData, error: customizationError } = await supabase
          .from('menu_customization')
          .select('*')
          .eq('business_id', businessId)
          .single();
        
        if (customizationError) {
          console.error('❌ [PUBLIC] Customization query error:', customizationError);
          // Si hay error, retornar null para usar valores por defecto
          return null;
        }
        
        console.log('🎨 [PUBLIC] Customization data:', customizationData);
        return customizationData;
        
      } catch (error) {
        console.error('💥 [PUBLIC] Unexpected error:', error);
        return null;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
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
