
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  Eye,
  EyeOff,
  ArrowUpDown
} from 'lucide-react';
import SubscriptionPlanForm from './SubscriptionPlanForm';
import { Tables } from '@/integrations/supabase/types';

type SubscriptionPlan = Tables<'subscription_plans'>;

const SubscriptionPlans = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans', sortBy, sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' });
      
      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'Plan actualizado',
        description: 'El estado del plan ha sido actualizado.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el plan.',
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'Plan eliminado',
        description: 'El plan ha sido eliminado exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el plan.',
      });
    },
  });

  const duplicatePlanMutation = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const { error } = await supabase
        .from('subscription_plans')
        .insert({
          name: `${plan.name} (Copia)`,
          description: plan.description,
          price: plan.price,
          currency: plan.currency,
          billing_interval: plan.billing_interval,
          features: plan.features,
          is_active: false,
          is_featured: false,
          trial_days: plan.trial_days,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: 'Plan duplicado',
        description: 'El plan ha sido duplicado exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo duplicar el plan.',
      });
    },
  });

  const handleSort = (field: 'name' | 'price' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  const formatInterval = (interval: string) => {
    const intervals: Record<string, string> = {
      monthly: 'Mensual',
      yearly: 'Anual',
      weekly: 'Semanal'
    };
    return intervals[interval] || interval;
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Cargando planes...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Planes de Suscripción</h3>
          <p className="text-muted-foreground">
            Gestiona los planes disponibles para tus usuarios
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Controles de ordenamiento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros y Ordenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('name')}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Nombre
            </Button>
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('price')}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Precio
            </Button>
            <Button
              variant={sortBy === 'created_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort('created_at')}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Fecha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans?.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.is_featured ? 'border-primary' : ''}`}>
            {plan.is_featured && (
              <div className="absolute -top-2 left-4">
                <Badge className="bg-primary">
                  <Star className="h-3 w-3 mr-1" />
                  Destacado
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>{plan.name}</span>
                    {!plan.is_active && (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate({
                      id: plan.id,
                      is_active: !plan.is_active
                    })}
                  >
                    {plan.is_active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {formatPrice(plan.price, plan.currency)}
                </div>
                <div className="text-sm text-muted-foreground">
                  / {formatInterval(plan.billing_interval)}
                </div>
                {plan.trial_days && plan.trial_days > 0 && (
                  <div className="text-sm text-green-600">
                    {plan.trial_days} días de prueba gratis
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Características:</h4>
                <ul className="text-sm space-y-1">
                  {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-muted-foreground">
                      <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                      {String(feature)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Acciones */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingPlan(plan);
                    setIsFormOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => duplicatePlanMutation.mutate(plan)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deletePlanMutation.mutate(plan.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Formulario */}
      {isFormOpen && (
        <SubscriptionPlanForm
          plan={editingPlan}
          onClose={() => {
            setIsFormOpen(false);
            setEditingPlan(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingPlan(null);
            queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
          }}
        />
      )}
    </div>
  );
};

export default SubscriptionPlans;
