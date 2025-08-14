import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  mp_preapproval_id?: string;
  status: 'pending' | 'active' | 'paused' | 'cancelled';
  starts_at?: string;
  ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  next_billing_date?: string;
  canceled_at?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useUserSubscriptions = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user subscriptions
  const {
    data: subscriptions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-subscriptions', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            description,
            price,
            currency,
            features
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching subscriptions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
  });

  // Get active subscription
  const activeSubscription = subscriptions?.find(sub => sub.status === 'active');

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          canceled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      toast({
        title: "Suscripción cancelada",
        description: "Tu suscripción ha sido cancelada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error al cancelar",
        description: "No se pudo cancelar la suscripción. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Pause subscription mutation
  const pauseSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'paused' })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      toast({
        title: "Suscripción pausada",
        description: "Tu suscripción ha sido pausada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error pausing subscription:', error);
      toast({
        title: "Error al pausar",
        description: "No se pudo pausar la suscripción. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Resume subscription mutation
  const resumeSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'active' })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      toast({
        title: "Suscripción reactivada",
        description: "Tu suscripción ha sido reactivada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error resuming subscription:', error);
      toast({
        title: "Error al reactivar",
        description: "No se pudo reactivar la suscripción. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  return {
    subscriptions: subscriptions || [],
    activeSubscription,
    isLoading,
    error,
    refetch,
    cancelSubscription: cancelSubscriptionMutation.mutate,
    pauseSubscription: pauseSubscriptionMutation.mutate,
    resumeSubscription: resumeSubscriptionMutation.mutate,
    isCanceling: cancelSubscriptionMutation.isPending,
    isPausing: pauseSubscriptionMutation.isPending,
    isResuming: resumeSubscriptionMutation.isPending,
  };
};