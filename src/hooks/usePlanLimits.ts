import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PlanLimits {
  max_products: number | null;
  max_users: number | null;
  max_reservations_per_day: number | null;
  max_tables: number | null;
  max_locations: number | null;
  features_enabled: Record<string, any>;
  integrations_enabled: Record<string, any>;
  api_access_enabled: boolean;
  whitelabel_enabled: boolean;
  custom_domain_enabled: boolean;
  advanced_analytics_enabled: boolean;
  multi_location_enabled: boolean;
  customization_level: string;
}

export interface CurrentUsage {
  current_products: number;
  current_users: number;
  current_tables: number;
  current_locations: number;
  daily_reservations: number;
  usage_metadata: Record<string, any>;
}

export const usePlanLimits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener límites del plan actual
  const { data: planLimits, isLoading: limitsLoading } = useQuery({
    queryKey: ['plan-limits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Obtener suscripción activa
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          plan_id,
          subscription_plans!inner(
            name,
            plan_configurations(*)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!subscription?.subscription_plans?.plan_configurations?.[0]) {
        return null;
      }

      return subscription.subscription_plans.plan_configurations[0] as PlanLimits;
    },
    enabled: !!user?.id,
  });

  // Obtener uso actual
  const { data: currentUsage, isLoading: usageLoading } = useQuery({
    queryKey: ['current-usage', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return data as CurrentUsage | null;
    },
    enabled: !!user?.id,
  });

  // Validar si se puede crear un recurso
  const validateResourceLimit = async (resourceType: string, increment: number = 1): Promise<boolean> => {
    if (!user?.id) return false;

    const { data } = await supabase.rpc('validate_resource_limit', {
      p_user_id: user.id,
      p_resource_type: resourceType,
      p_increment: increment
    });

    return data === true;
  };

  // Actualizar contador de uso
  const updateUsageCounter = useMutation({
    mutationFn: async ({ resourceType, increment = 1 }: { resourceType: string; increment?: number }) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      await supabase.rpc('update_usage_counter', {
        p_user_id: user.id,
        p_resource_type: resourceType,
        p_increment: increment
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-usage', user?.id] });
    },
    onError: (error) => {
      console.error('Error actualizando contador:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el contador de uso.',
      });
    },
  });

  // Verificar si una característica está habilitada
  const isFeatureEnabled = (featureName: string): boolean => {
    if (!planLimits) return false;
    return planLimits.features_enabled?.[featureName] === true;
  };

  // Verificar si una integración está habilitada
  const isIntegrationEnabled = (integrationName: string): boolean => {
    if (!planLimits) return false;
    return planLimits.integrations_enabled?.[integrationName] === true;
  };

  // Verificar si se está cerca del límite
  const isNearLimit = (resourceType: string, threshold: number = 0.8): boolean => {
    if (!planLimits || !currentUsage) return false;

    const limits = {
      products: planLimits.max_products,
      users: planLimits.max_users,
      tables: planLimits.max_tables,
      locations: planLimits.max_locations,
      daily_reservations: planLimits.max_reservations_per_day,
    };

    const usage = {
      products: currentUsage.current_products,
      users: currentUsage.current_users,
      tables: currentUsage.current_tables,
      locations: currentUsage.current_locations,
      daily_reservations: currentUsage.daily_reservations,
    };

    const limit = limits[resourceType as keyof typeof limits];
    const current = usage[resourceType as keyof typeof usage];

    if (limit === null || limit === undefined) return false;
    return (current / limit) >= threshold;
  };

  // Obtener porcentaje de uso
  const getUsagePercentage = (resourceType: string): number => {
    if (!planLimits || !currentUsage) return 0;

    const limits = {
      products: planLimits.max_products,
      users: planLimits.max_users,
      tables: planLimits.max_tables,
      locations: planLimits.max_locations,
      daily_reservations: planLimits.max_reservations_per_day,
    };

    const usage = {
      products: currentUsage.current_products,
      users: currentUsage.current_users,
      tables: currentUsage.current_tables,
      locations: currentUsage.current_locations,
      daily_reservations: currentUsage.daily_reservations,
    };

    const limit = limits[resourceType as keyof typeof limits];
    const current = usage[resourceType as keyof typeof usage];

    if (limit === null || limit === undefined) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  return {
    planLimits,
    currentUsage,
    isLoading: limitsLoading || usageLoading,
    validateResourceLimit,
    updateUsageCounter: updateUsageCounter.mutate,
    isUpdatingUsage: updateUsageCounter.isPending,
    isFeatureEnabled,
    isIntegrationEnabled,
    isNearLimit,
    getUsagePercentage,
  };
};