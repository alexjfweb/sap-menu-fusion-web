
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar, Mail, MessageSquare, Smartphone, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReminderConfigForm from './ReminderConfigForm';

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

const ReminderConfigurations = () => {
  const [configs, setConfigs] = useState<ReminderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<ReminderConfig | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_reminder_configs')
        .select('*')
        .order('days_before', { ascending: true });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching configurations:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleConfigStatus = async (configId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_reminder_configs')
        .update({ is_active: isActive })
        .eq('id', configId);

      if (error) throw error;

      setConfigs(configs.map(config => 
        config.id === configId ? { ...config, is_active: isActive } : config
      ));

      toast({
        title: 'Configuración actualizada',
        description: `Recordatorio ${isActive ? 'activado' : 'desactivado'} exitosamente.`,
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la configuración.',
      });
    }
  };

  const deleteConfig = async (configId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payment_reminder_configs')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      setConfigs(configs.filter(config => config.id !== configId));

      toast({
        title: 'Configuración eliminada',
        description: 'La configuración se eliminó exitosamente.',
      });
    } catch (error) {
      console.error('Error deleting config:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la configuración.',
      });
    }
  };

  const getDeliveryMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getTimingText = (config: ReminderConfig) => {
    if (config.reminder_type === 'before') {
      return `${config.days_before} días antes`;
    } else if (config.reminder_type === 'on_due') {
      return 'El día del vencimiento';
    } else {
      return `${Math.abs(config.days_before)} días después`;
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingConfig(null);
    fetchConfigurations();
  };

  if (showForm) {
    return (
      <ReminderConfigForm
        config={editingConfig}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingConfig(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Configuraciones de Recordatorios</h2>
          <p className="text-muted-foreground">
            Gestiona cuándo y cómo se envían los recordatorios de pago
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Configuración
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((config) => (
            <Card key={config.id} className={!config.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {getDeliveryMethodIcon(config.delivery_method)}
                    <Switch
                      checked={config.is_active}
                      onCheckedChange={(checked) => toggleConfigStatus(config.id, checked)}
                    />
                  </div>
                </div>
                <CardDescription>
                  {getTimingText(config)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Método:</span>
                    <Badge variant="outline" className="capitalize">
                      {config.delivery_method}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reintentos:</span>
                    <span className="text-sm">{config.max_retries}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Intervalo:</span>
                    <span className="text-sm">{config.retry_interval_hours}h</span>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingConfig(config);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteConfig(config.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReminderConfigurations;
