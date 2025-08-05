import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Eye, EyeOff, DollarSign, Users, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tables } from '@/integrations/supabase/types';

type SubscriptionPlan = Tables<'subscription_plans'>;

interface ActionState {
  [key: string]: boolean;
}

const SubscriptionPlansManagement = () => {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [actionStates, setActionStates] = useState<ActionState>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cargar planes existentes con suscripción en tiempo real
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true,
  });

  // Suscripción en tiempo real para cambios en la tabla
  useEffect(() => {
    const channel = supabase
      .channel('subscription-plans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_plans'
        },
        (payload) => {
          console.log('🔄 Real-time update:', payload);
          // Invalidar cache inmediatamente
          queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
          
          // Mostrar notificación según el tipo de cambio
          const eventMessages = {
            INSERT: 'Plan creado',
            UPDATE: 'Plan actualizado', 
            DELETE: 'Plan eliminado'
          };
          
          toast({
            title: eventMessages[payload.eventType as keyof typeof eventMessages] || 'Cambio detectado',
            description: 'Los datos se han actualizado en tiempo real.',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);

  const savePlanMutation = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const planData = {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency || 'USD',
        billing_interval: plan.billing_interval,
        features: Array.isArray(plan.features) ? plan.features : [],
        is_active: plan.is_active ?? true,
        is_featured: plan.is_featured ?? false,
        max_subscribers: plan.max_subscribers || null,
        trial_days: plan.trial_days || 0,
        updated_at: new Date().toISOString()
      };

      if (plan.id) {
        const { data, error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', plan.id)
          .select()
          .single();
        if (error) throw error;
        return { action: 'update', data };
      } else {
        const { data, error } = await supabase
          .from('subscription_plans')
          .insert(planData)
          .select()
          .single();
        if (error) throw error;
        return { action: 'create', data };
      }
    },
    onMutate: async (plan) => {
      // Update optimista
      setActionStates(prev => ({ ...prev, [`save-${plan.id || 'new'}`]: true }));
      
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: ['subscription-plans'] });
      
      // Snapshot del estado previo
      const previousPlans = queryClient.getQueryData<SubscriptionPlan[]>(['subscription-plans']);
      
      // Update optimista
      if (plan.id) {
        queryClient.setQueryData<SubscriptionPlan[]>(['subscription-plans'], (old = []) =>
          old.map(p => p.id === plan.id ? { ...p, ...plan } : p)
        );
      } else {
        const tempPlan = { ...plan, id: `temp-${Date.now()}` };
        queryClient.setQueryData<SubscriptionPlan[]>(['subscription-plans'], (old = []) => 
          [...old, tempPlan as SubscriptionPlan]
        );
      }
      
      return { previousPlans };
    },
    onSuccess: (result) => {
      toast({
        title: result.action === 'create' ? 'Plan creado' : 'Plan actualizado',
        description: `El plan "${result.data.name}" ha sido ${result.action === 'create' ? 'creado' : 'actualizado'} exitosamente.`,
      });
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error, plan, context) => {
      // Rollback
      if (context?.previousPlans) {
        queryClient.setQueryData(['subscription-plans'], context.previousPlans);
      }
      
      console.error('Error al guardar plan:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: `No se pudo guardar el plan: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    },
    onSettled: (_, __, plan) => {
      setActionStates(prev => ({ ...prev, [`save-${plan.id || 'new'}`]: false }));
      // Invalidar después de la mutación para sincronizar con el servidor
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    }
  });

  const togglePlanStatusMutation = useMutation({
    mutationFn: async ({ planId, isActive }: { planId: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ planId, isActive }) => {
      setActionStates(prev => ({ ...prev, [`toggle-${planId}`]: true }));
      
      // Cancelar queries y hacer update optimista
      await queryClient.cancelQueries({ queryKey: ['subscription-plans'] });
      const previousPlans = queryClient.getQueryData<SubscriptionPlan[]>(['subscription-plans']);
      
      queryClient.setQueryData<SubscriptionPlan[]>(['subscription-plans'], (old = []) =>
        old.map(plan => 
          plan.id === planId ? { ...plan, is_active: isActive } : plan
        )
      );
      
      return { previousPlans };
    },
    onSuccess: (data, { isActive }) => {
      toast({
        title: isActive ? 'Plan activado' : 'Plan desactivado',
        description: `El plan "${data.name}" ha sido ${isActive ? 'activado' : 'desactivado'} exitosamente.`,
      });
    },
    onError: (error, { planId }, context) => {
      // Rollback en caso de error
      if (context?.previousPlans) {
        queryClient.setQueryData(['subscription-plans'], context.previousPlans);
      }
      
      console.error('Error al cambiar estado del plan:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `No se pudo cambiar el estado del plan: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    },
    onSettled: (_, __, { planId }) => {
      setActionStates(prev => ({ ...prev, [`toggle-${planId}`]: false }));
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    }
  });

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleNewPlan = () => {
    setEditingPlan({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billing_interval: 'monthly',
      features: [],
      is_active: true,
      is_featured: false,
      trial_days: 0,
      max_subscribers: null,
      stripe_product_id: null,
      stripe_price_id: null
    } as SubscriptionPlan);
    setIsDialogOpen(true);
  };

  const addFeature = () => {
    if (newFeature.trim() && editingPlan) {
      const currentFeatures = Array.isArray(editingPlan.features) ? editingPlan.features as string[] : [];
      setEditingPlan({
        ...editingPlan,
        features: [...currentFeatures, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    if (editingPlan) {
      const currentFeatures = Array.isArray(editingPlan.features) ? editingPlan.features as string[] : [];
      setEditingPlan({
        ...editingPlan,
        features: currentFeatures.filter((_, i) => i !== index)
      });
    }
  };

  const handleSavePlan = () => {
    if (editingPlan) {
      savePlanMutation.mutate(editingPlan);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando planes de suscripción...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-destructive">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>Error al cargar los planes: {error instanceof Error ? error.message : 'Error desconocido'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Gestión de Planes de Suscripción</h3>
          <p className="text-muted-foreground">
            Administra los planes de suscripción disponibles en la plataforma
          </p>
        </div>
        <Button onClick={handleNewPlan}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      <div className="grid gap-6">
        {plans?.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {plan.is_featured && (
                    <Badge variant="default">Destacado</Badge>
                  )}
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Switch
                    checked={plan.is_active}
                    disabled={actionStates[`toggle-${plan.id}`]}
                    onCheckedChange={(checked) => 
                      togglePlanStatusMutation.mutate({ planId: plan.id, isActive: checked })
                    }
                  />
                  {actionStates[`toggle-${plan.id}`] && (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/{plan.billing_interval}</span>
                </div>
                {plan.max_subscribers && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Límite: {plan.max_subscribers} usuarios</span>
                  </div>
                )}
                {plan.trial_days > 0 && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{plan.trial_days} días de prueba</span>
                  </div>
                )}
              </div>

              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Características:</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{String(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleEditPlan(plan)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para editar/crear plan */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id ? 'Editar Plan' : 'Nuevo Plan'}
            </DialogTitle>
          </DialogHeader>
          
          {editingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Plan</Label>
                  <Input
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                    placeholder="Ej: Plan Básico"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({...editingPlan, price: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={editingPlan.description}
                  onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                  placeholder="Descripción del plan..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={editingPlan.currency}
                    onChange={(e) => setEditingPlan({...editingPlan, currency: e.target.value})}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="COP">COP</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Intervalo de Facturación</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={editingPlan.billing_interval}
                    onChange={(e) => setEditingPlan({...editingPlan, billing_interval: e.target.value})}
                  >
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Días de Prueba</Label>
                  <Input
                    type="number"
                    value={editingPlan.trial_days}
                    onChange={(e) => setEditingPlan({...editingPlan, trial_days: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Límite de Suscriptores (opcional)</Label>
                <Input
                  type="number"
                  value={editingPlan.max_subscribers || ''}
                  onChange={(e) => setEditingPlan({...editingPlan, max_subscribers: parseInt(e.target.value) || undefined})}
                  placeholder="Sin límite"
                />
              </div>

              <div className="space-y-4">
                <Label>Características del Plan</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Agregar nueva característica..."
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button type="button" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {Array.isArray(editingPlan.features) && (editingPlan.features as string[]).map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{String(feature)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingPlan.is_active}
                    onCheckedChange={(checked) => setEditingPlan({...editingPlan, is_active: checked})}
                  />
                  <Label>Plan Activo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingPlan.is_featured}
                    onCheckedChange={(checked) => setEditingPlan({...editingPlan, is_featured: checked})}
                  />
                  <Label>Plan Destacado</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSavePlan} 
                  disabled={savePlanMutation.isPending}
                  className="min-w-[120px]"
                >
                  {savePlanMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Plan'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlansManagement;