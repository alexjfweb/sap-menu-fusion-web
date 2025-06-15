
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReminderConfig {
  id: string;
  name: string;
  days_before: number;
  reminder_type: 'before' | 'on_due' | 'after';
  delivery_method: 'email' | 'sms' | 'whatsapp' | 'push';
  is_active: boolean;
  max_retries: number;
  retry_interval_hours: number;
}

interface ReminderConfigFormProps {
  config?: ReminderConfig | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const ReminderConfigForm = ({ config, onSubmit, onCancel }: ReminderConfigFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    days_before: 1,
    reminder_type: 'before' as const,
    delivery_method: 'email' as const,
    is_active: true,
    max_retries: 3,
    retry_interval_hours: 24,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name,
        days_before: config.days_before,
        reminder_type: config.reminder_type,
        delivery_method: config.delivery_method,
        is_active: config.is_active,
        max_retries: config.max_retries,
        retry_interval_hours: config.retry_interval_hours,
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (config?.id) {
        // Actualizar configuración existente
        const { error } = await supabase
          .from('payment_reminder_configs')
          .update(formData)
          .eq('id', config.id);

        if (error) throw error;

        toast({
          title: 'Configuración actualizada',
          description: 'La configuración se actualizó exitosamente.',
        });
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('payment_reminder_configs')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Configuración creada',
          description: 'La nueva configuración se creó exitosamente.',
        });
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {config ? 'Editar Configuración' : 'Nueva Configuración'}
          </h2>
          <p className="text-muted-foreground">
            Configure cuándo y cómo enviar recordatorios de pago
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Configuración</CardTitle>
          <CardDescription>
            Defina los parámetros para el envío de recordatorios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la configuración</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Recordatorio 3 días antes"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder_type">Tipo de recordatorio</Label>
                <Select
                  value={formData.reminder_type}
                  onValueChange={(value: 'before' | 'on_due' | 'after') => 
                    setFormData({ ...formData, reminder_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="before">Antes del vencimiento</SelectItem>
                    <SelectItem value="on_due">El día del vencimiento</SelectItem>
                    <SelectItem value="after">Después del vencimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="days_before">
                  {formData.reminder_type === 'before' ? 'Días antes' : 
                   formData.reminder_type === 'on_due' ? 'Días (usar 0)' : 'Días después'}
                </Label>
                <Input
                  id="days_before"
                  type="number"
                  value={formData.days_before}
                  onChange={(e) => setFormData({ ...formData, days_before: parseInt(e.target.value) })}
                  min={formData.reminder_type === 'after' ? 1 : 0}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_method">Método de envío</Label>
                <Select
                  value={formData.delivery_method}
                  onValueChange={(value: 'email' | 'sms' | 'whatsapp' | 'push') => 
                    setFormData({ ...formData, delivery_method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="push">Notificación Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_retries">Máximo de reintentos</Label>
                <Input
                  id="max_retries"
                  type="number"
                  value={formData.max_retries}
                  onChange={(e) => setFormData({ ...formData, max_retries: parseInt(e.target.value) })}
                  min={0}
                  max={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retry_interval_hours">Intervalo entre reintentos (horas)</Label>
                <Input
                  id="retry_interval_hours"
                  type="number"
                  value={formData.retry_interval_hours}
                  onChange={(e) => setFormData({ ...formData, retry_interval_hours: parseInt(e.target.value) })}
                  min={1}
                  max={168}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Activar configuración</Label>
            </div>

            <div className="flex space-x-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : (config ? 'Actualizar' : 'Crear')}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReminderConfigForm;
