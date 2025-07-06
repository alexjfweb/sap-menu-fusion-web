
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ActivityLogParams {
  activity_type: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
}

export const useActivityLogger = () => {
  const { profile } = useAuth();

  const logActivityMutation = useMutation({
    mutationFn: async (params: ActivityLogParams) => {
      if (!profile?.id) {
        console.warn('⚠️ [ACTIVITY LOGGER] No user profile, skipping activity log');
        return;
      }

      console.log('📝 [ACTIVITY LOGGER] Logging activity:', params);

      const { data, error } = await supabase.rpc('log_employee_activity', {
        p_employee_id: profile.id,
        p_activity_type: params.activity_type,
        p_description: params.description,
        p_entity_type: params.entity_type || null,
        p_entity_id: params.entity_id || null,
        p_metadata: params.metadata || {}
      });

      if (error) {
        console.error('❌ [ACTIVITY LOGGER] Error logging activity:', error);
        throw error;
      }

      console.log('✅ [ACTIVITY LOGGER] Activity logged successfully:', data);
      return data;
    },
  });

  const logActivity = (params: ActivityLogParams) => {
    logActivityMutation.mutate(params);
  };

  // Funciones específicas para diferentes tipos de actividades
  const logOrderActivity = (action: string, orderId: string, description: string, metadata?: any) => {
    logActivity({
      activity_type: `order_${action}`,
      description,
      entity_type: 'order',
      entity_id: orderId,
      metadata
    });
  };

  const logReservationActivity = (action: string, reservationId: string, description: string, metadata?: any) => {
    logActivity({
      activity_type: `reservation_${action}`,
      description,
      entity_type: 'reservation',
      entity_id: reservationId,
      metadata
    });
  };

  const logProductActivity = (action: string, productId: string, description: string, metadata?: any) => {
    logActivity({
      activity_type: `product_${action}`,
      description,
      entity_type: 'product',
      entity_id: productId,
      metadata
    });
  };

  const logSystemActivity = (description: string, metadata?: any) => {
    logActivity({
      activity_type: 'system_action',
      description,
      metadata
    });
  };

  return {
    logActivity,
    logOrderActivity,
    logReservationActivity,
    logProductActivity,
    logSystemActivity,
    isLogging: logActivityMutation.isPending,
  };
};
