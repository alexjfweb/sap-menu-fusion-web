
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

// Hook simplificado y directo para acceso público
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization-direct'],
    queryFn: async () => {
      console.log('🔧 [DIRECTO] Obteniendo personalización sin filtros...');
      
      try {
        // Estrategia directa: obtener cualquier registro de personalización
        const { data, error } = await supabase
          .from('menu_customization')
          .select('*')
          .limit(1);
        
        if (error) {
          console.error('❌ [DIRECTO] Error:', error);
          return null;
        }
        
        console.log('✅ [DIRECTO] Datos obtenidos:', data);
        
        // Retornar el primer registro encontrado o null
        return data && data.length > 0 ? data[0] : null;
        
      } catch (error) {
        console.error('💥 [DIRECTO] Error inesperado:', error);
        return null;
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
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
