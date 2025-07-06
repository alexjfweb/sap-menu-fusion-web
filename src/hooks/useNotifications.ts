
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string | null;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'task_assigned';
  is_read: boolean;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  expires_at: string | null;
  created_at: string;
}

export const useNotifications = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener notificaciones del usuario actual
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      console.log('🔔 [NOTIFICATIONS] Fetching notifications for user:', profile.id);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ [NOTIFICATIONS] Error fetching notifications:', error);
        throw error;
      }

      console.log(`✅ [NOTIFICATIONS] Fetched ${data?.length || 0} notifications`);
      return data as Notification[];
    },
    enabled: !!profile?.id,
  });

  // Marcar notificación como leída
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('👁️ [NOTIFICATIONS] Marking notification as read:', notificationId);

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', profile?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('👁️ [NOTIFICATIONS] Marking all notifications as read');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', profile?.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Notificaciones marcadas',
        description: 'Todas las notificaciones han sido marcadas como leídas.',
      });
    },
  });

  // Crear notificación (solo para admins)
  const createNotificationMutation = useMutation({
    mutationFn: async (params: {
      recipient_id: string;
      title: string;
      message: string;
      type?: string;
      entity_type?: string;
      entity_id?: string;
      metadata?: Record<string, any>;
      expires_at?: string;
    }) => {
      console.log('📢 [NOTIFICATIONS] Creating notification:', params);

      const { data, error } = await supabase.rpc('create_notification', {
        p_recipient_id: params.recipient_id,
        p_sender_id: profile?.id || null,
        p_title: params.title,
        p_message: params.message,
        p_type: params.type || 'info',
        p_entity_type: params.entity_type || null,
        p_entity_id: params.entity_id || null,
        p_metadata: params.metadata || {},
        p_expires_at: params.expires_at || null
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Notificación enviada',
        description: 'La notificación ha sido enviada exitosamente.',
      });
    },
  });

  // Configurar suscripción en tiempo real para notificaciones
  useEffect(() => {
    if (!profile?.id) return;

    console.log('🔄 [NOTIFICATIONS] Setting up real-time subscription');

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('🔔 [NOTIFICATIONS] New notification received:', payload);
          
          const newNotification = payload.new as Notification;
          
          // Mostrar toast para nuevas notificaciones
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default',
          });

          // Actualizar cache
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [NOTIFICATIONS] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient, toast]);

  // Calcular estadísticas
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const todayNotifications = notifications?.filter(n => {
    const today = new Date().toDateString();
    const notificationDate = new Date(n.created_at).toDateString();
    return today === notificationDate;
  }).length || 0;

  return {
    notifications: notifications || [],
    unreadCount,
    todayNotifications,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    createNotification: createNotificationMutation.mutate,
    isCreatingNotification: createNotificationMutation.isPending,
  };
};
