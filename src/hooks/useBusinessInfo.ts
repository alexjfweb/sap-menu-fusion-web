
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useBusinessInfo = () => {
  return useQuery({
    queryKey: ['business-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_info')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching business info:', error);
        throw error;
      }
      
      return data;
    },
  });
};
