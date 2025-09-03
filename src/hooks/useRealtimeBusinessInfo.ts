import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRealtimeBusinessInfo = () => {
  const queryClient = useQueryClient();
  const { profile, role } = useAuth();

  const { data: businessData, isLoading, refetch } = useQuery({
    queryKey: ['business-management'],
    queryFn: async () => {
      if (!profile) return [];

      let query = supabase
        .from('business_info')
        .select('*')
        .order('created_at', { ascending: false });

      // Superadmins see all businesses, admins see only their business
      if (role === 'admin' && profile.business_id) {
        query = query.eq('id', profile.business_id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile && (role === 'admin' || role === 'superadmin'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  useEffect(() => {
    console.log('Setting up realtime subscription for business_info');
    
    const channel = supabase
      .channel('business-info-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'business_info'
        },
        (payload) => {
          console.log('New business_info inserted:', payload);
          queryClient.invalidateQueries({ queryKey: ['business-management'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_info'
        },
        (payload) => {
          console.log('Business_info updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['business-management'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'business_info'
        },
        (payload) => {
          console.log('Business_info deleted:', payload);
          queryClient.invalidateQueries({ queryKey: ['business-management'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up business_info realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    businessData,
    isLoading,
    refetch
  };
};