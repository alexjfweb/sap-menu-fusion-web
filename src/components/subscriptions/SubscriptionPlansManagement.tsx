import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Eye, EyeOff, DollarSign, Users, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SubscriptionPlan {
  id?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  features: string[];
  is_active: boolean;
  is_featured: boolean;
  max_subscribers?: number;
  trial_days: number;
}

const SubscriptionPlansManagement = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cargar planes existentes
  const { data: existingPlans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  React.useEffect(() => {
    if (existingPlans) {
      setPlans(existingPlans.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      })));
    }
  }, [existingPlans]);

  const savePlanMutation = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const planData = {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        billing_interval: plan.billing_interval,
        features: plan.features,
        is_active: plan.is_active,
        is_featured: plan.is_featured,
        max_subscribers: plan.max_subscribers,
        trial_days: plan.trial_days
      };

      if (plan.id) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', plan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(planData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Plan guardado',
        description: 'El plan de suscripción ha sido guardado exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo guardar el plan de suscripción.',
      });
    }
  });

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: isActive })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: isActive ? 'Plan activado' : 'Plan desactivado',
        description: `El plan ha sido ${isActive ? 'activado' : 'desactivado'} exitosamente.`,
      });

      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cambiar el estado del plan.',
      });
    }
  };

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
      trial_days: 0
    });
    setIsDialogOpen(true);
  };

  const addFeature = () => {
    if (newFeature.trim() && editingPlan) {
      setEditingPlan({
        ...editingPlan,
        features: [...editingPlan.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    if (editingPlan) {
      setEditingPlan({
        ...editingPlan,
        features: editingPlan.features.filter((_, i) => i !== index)
      });
    }
  };

  const handleSavePlan = () => {
    if (editingPlan) {
      savePlanMutation.mutate(editingPlan);
    }
  };

  if (isLoading) {
    return <div>Cargando planes de suscripción...</div>;
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
        {plans.map((plan) => (
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
                    onCheckedChange={(checked) => togglePlanStatus(plan.id!, checked)}
                  />
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

              {plan.features.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Características:</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{feature}</span>
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
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{feature}</span>
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
                <Button onClick={handleSavePlan} disabled={savePlanMutation.isPending}>
                  {savePlanMutation.isPending ? 'Guardando...' : 'Guardar Plan'}
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