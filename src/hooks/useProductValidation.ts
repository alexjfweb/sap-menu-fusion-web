
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useProductValidation = () => {
  const { profile } = useAuth();

  const checkDuplicateProduct = async (productName: string): Promise<boolean> => {
    if (!profile?.id || !productName.trim()) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('name', productName.trim())
        .eq('created_by', profile.id)
        .limit(1);

      if (error) {
        console.error('Error checking duplicate product:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in duplicate check:', error);
      return false;
    }
  };

  return {
    checkDuplicateProduct
  };
};
