
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeReservations = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up realtime subscription for reservations');
    
    const channel = supabase
      .channel('reservations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          console.log('New reservation received:', payload);
          // Invalidar la query para refrescar los datos
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          console.log('Reservation updated:', payload);
          // Invalidar la query para refrescar los datos
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reservations'
        },
        (payload) => {
          console.log('Reservation deleted:', payload);
          // Invalidar la query para refrescar los datos
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
