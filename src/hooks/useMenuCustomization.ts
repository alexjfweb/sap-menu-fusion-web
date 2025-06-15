
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

// SOLUCIÓN DEFINITIVA: Hook completamente reescrito con estrategia robusta
export const usePublicMenuCustomization = () => {
  return useQuery({
    queryKey: ['public-menu-customization-definitive'],
    queryFn: async () => {
      console.log('🔧 [DEFINITIVO] Iniciando obtención de personalización...');
      
      try {
        // PASO 1: Obtener business_id con manejo de errores específico
        console.log('📍 [DEFINITIVO] Obteniendo business_id...');
        const businessQuery = await supabase
          .from('business_info')
          .select('id')
          .limit(1);
        
        console.log('📍 [DEFINITIVO] Resultado business query:', businessQuery);
        
        if (businessQuery.error) {
          console.error('❌ [DEFINITIVO] Error obteniendo business:', businessQuery.error);
          throw new Error(`Business query failed: ${businessQuery.error.message}`);
        }
        
        if (!businessQuery.data || businessQuery.data.length === 0) {
          console.warn('⚠️ [DEFINITIVO] No se encontró información de negocio');
          return null;
        }
        
        const businessId = businessQuery.data[0].id;
        console.log('✅ [DEFINITIVO] Business ID obtenido:', businessId);
        
        // PASO 2: Obtener personalización con query específico
        console.log('🎨 [DEFINITIVO] Obteniendo personalización para business:', businessId);
        const customizationQuery = await supabase
          .from('menu_customization')
          .select('*')
          .eq('business_id', businessId);
        
        console.log('🎨 [DEFINITIVO] Resultado customization query:', customizationQuery);
        
        if (customizationQuery.error) {
          console.error('❌ [DEFINITIVO] Error obteniendo personalización:', customizationQuery.error);
          throw new Error(`Customization query failed: ${customizationQuery.error.message}`);
        }
        
        if (!customizationQuery.data || customizationQuery.data.length === 0) {
          console.warn('⚠️ [DEFINITIVO] No se encontró personalización, retornando null');
          return null;
        }
        
        const customization = customizationQuery.data[0];
        console.log('🎨 [DEFINITIVO] Personalización obtenida exitosamente:', customization);
        
        // VALIDACIÓN ADICIONAL: Verificar que los datos son válidos
        if (!customization.menu_bg_color || !customization.button_bg_color) {
          console.warn('⚠️ [DEFINITIVO] Personalización incompleta, usando datos parciales');
        }
        
        return customization;
        
      } catch (error) {
        console.error('💥 [DEFINITIVO] Error inesperado:', error);
        // En caso de error, retornar null para usar valores por defecto
        return null;
      }
    },
    // Configuración agresiva para asegurar obtención de datos
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
