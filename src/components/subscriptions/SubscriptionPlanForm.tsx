
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type SubscriptionPlan = Tables<'subscription_plans'>;

interface SubscriptionPlanFormProps {
  plan?: SubscriptionPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const SubscriptionPlanForm = ({ plan, onClose, onSuccess }: SubscriptionPlanFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    billing_interval: 'monthly',
    features: [] as string[],
    is_active: true,
    is_featured: false,
    trial_days: '',
    max_subscribers: '',
    stripe_product_id: '',
    stripe_price_id: '',
  });
  const [newFeature, setNewFeature] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price.toString(),
        currency: plan.currency || 'USD',
        billing_interval: plan.billing_interval,
        features: Array.isArray(plan.features) ? plan.features as string[] : [],
        is_active: plan.is_active || false,
        is_featured: plan.is_featured || false,
        trial_days: plan.trial_days?.toString() || '',
        max_subscribers: plan.max_subscribers?.toString() || '',
        stripe_product_id: plan.stripe_product_id || '',
        stripe_price_id: plan.stripe_price_id || '',
      });
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const planData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        currency: formData.currency,
        billing_interval: formData.billing_interval,
        features: formData.features,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        trial_days: formData.trial_days ? parseInt(formData.trial_days) : null,
        max_subscribers: formData.max_subscribers ? parseInt(formData.max_subscribers) : null,
        stripe_product_id: formData.stripe_product_id || null,
        stripe_price_id: formData.stripe_price_id || null,
        updated_at: new Date().toISOString(),
      };

      if (plan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', plan.id);
        
        if (error) throw error;
        
        toast({
          title: 'Plan actualizado',
          description: 'El plan ha sido actualizado exitosamente.',
        });
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(planData);
        
        if (error) throw error;
        
        toast({
          title: 'Plan creado',
          description: 'El plan ha sido creado exitosamente.',
        });
      }

      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el plan.',
      });
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Editar Plan' : 'Crear Nuevo Plan'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Plan</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing_interval">Frecuencia</Label>
              <Select value={formData.billing_interval} onValueChange={(value) => setFormData(prev => ({ ...prev, billing_interval: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trial_days">Días de Prueba</Label>
              <Input
                id="trial_days"
                type="number"
                value={formData.trial_days}
                onChange={(e) => setFormData(prev => ({ ...prev, trial_days: e.target.value }))}
              />
            </div>
          </div>

          {/* Características */}
          <div className="space-y-4">
            <Label>Características del Plan</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Agregar característica..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Configuración de Stripe */}
          <div className="space-y-4">
            <Label>Configuración de Stripe (Opcional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stripe_product_id">ID del Producto en Stripe</Label>
                <Input
                  id="stripe_product_id"
                  value={formData.stripe_product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, stripe_product_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe_price_id">ID del Precio en Stripe</Label>
                <Input
                  id="stripe_price_id"
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, stripe_price_id: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Configuración avanzada */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max_subscribers">Máximo de Suscriptores (Opcional)</Label>
              <Input
                id="max_subscribers"
                type="number"
                value={formData.max_subscribers}
                onChange={(e) => setFormData(prev => ({ ...prev, max_subscribers: e.target.value }))}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Plan Activo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="is_featured">Plan Destacado</Label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : (plan ? 'Actualizar' : 'Crear')} Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPlanForm;
