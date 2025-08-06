import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type SubscriptionPlan = Tables<'subscription_plans'>;
type PlanConfiguration = Tables<'plan_configurations'>;

interface PlanConfigurationManagerProps {
  planId: string;
  planName: string;
}

const PlanConfigurationManager: React.FC<PlanConfigurationManagerProps> = ({ planId, planName }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: configuration, isLoading } = useQuery({
    queryKey: ['plan-configuration', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plan_configurations')
        .select('*')
        .eq('plan_id', planId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState<Partial<PlanConfiguration>>({
    max_products: null,
    max_users: null,
    max_reservations_per_day: null,
    max_tables: null,
    max_locations: 1,
    features_enabled: {},
    integrations_enabled: {},
    support_type: 'email',
    support_priority: 'low',
    api_access_enabled: false,
    whitelabel_enabled: false,
    custom_domain_enabled: false,
    advanced_analytics_enabled: false,
    multi_location_enabled: false,
    customization_level: 'basic',
  });

  React.useEffect(() => {
    if (configuration) {
      setFormData(configuration);
    }
  }, [configuration]);

  const saveConfigurationMutation = useMutation({
    mutationFn: async (configData: Partial<PlanConfiguration>) => {
      if (configuration?.id) {
        // Actualizar configuración existente
        const { error } = await supabase
          .from('plan_configurations')
          .update(configData)
          .eq('id', configuration.id);
        if (error) throw error;
      } else {
        // Crear nueva configuración
        const { error } = await supabase
          .from('plan_configurations')
          .insert({
            plan_id: planId,
            ...configData,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-configuration', planId] });
      setIsEditing(false);
      toast({
        title: 'Configuración guardada',
        description: 'La configuración del plan ha sido actualizada.',
      });
    },
    onError: (error) => {
      console.error('Error guardando configuración:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
      });
    },
  });

  const createDefaultConfigurationMutation = useMutation({
    mutationFn: async () => {
      // Configuraciones por defecto basadas en el nombre del plan
      let defaultConfig: Partial<PlanConfiguration> = {
        plan_id: planId,
        max_locations: 1,
        features_enabled: {},
        integrations_enabled: {},
        support_type: 'email',
        support_priority: 'low',
        api_access_enabled: false,
        whitelabel_enabled: false,
        custom_domain_enabled: false,
        advanced_analytics_enabled: false,
        multi_location_enabled: false,
        customization_level: 'basic',
      };

      // Configurar según el tipo de plan
      if (planName.toLowerCase().includes('gratuito') || planName.toLowerCase().includes('free')) {
        defaultConfig = {
          ...defaultConfig,
          max_products: 5,
          max_users: 1,
          max_reservations_per_day: 5,
          max_tables: 3,
          support_priority: 'low',
          customization_level: 'basic',
        };
      } else if (planName.toLowerCase().includes('básico') || planName.toLowerCase().includes('basic')) {
        defaultConfig = {
          ...defaultConfig,
          max_products: 50,
          max_users: 3,
          max_reservations_per_day: 20,
          max_tables: 10,
          support_priority: 'medium',
          customization_level: 'basic',
          integrations_enabled: { whatsapp: true },
        };
      } else if (planName.toLowerCase().includes('estándar') || planName.toLowerCase().includes('standard')) {
        defaultConfig = {
          ...defaultConfig,
          max_products: 200,
          max_users: 10,
          max_reservations_per_day: 100,
          max_tables: 100,
          max_locations: 3,
          support_priority: 'high',
          support_type: '24/7',
          customization_level: 'advanced',
          advanced_analytics_enabled: true,
          multi_location_enabled: true,
          integrations_enabled: { whatsapp: true, social_media: true, inventory: true },
          features_enabled: { advanced_reports: true, inventory_management: true },
        };
      } else if (planName.toLowerCase().includes('premium')) {
        defaultConfig = {
          ...defaultConfig,
          max_products: null, // Ilimitado
          max_users: null, // Ilimitado
          max_reservations_per_day: null, // Ilimitado
          max_tables: null, // Ilimitado
          max_locations: null, // Ilimitado
          support_priority: 'dedicated',
          support_type: 'dedicated',
          customization_level: 'full',
          api_access_enabled: true,
          whitelabel_enabled: true,
          custom_domain_enabled: true,
          advanced_analytics_enabled: true,
          multi_location_enabled: true,
          integrations_enabled: { 
            whatsapp: true, 
            social_media: true, 
            inventory: true, 
            api: true, 
            enterprise: true 
          },
          features_enabled: { 
            advanced_reports: true, 
            inventory_management: true,
            multi_restaurant: true,
            white_label: true,
            custom_api: true,
            consulting: true
          },
        };
      }

      const { error } = await supabase
        .from('plan_configurations')
        .insert({
          plan_id: planId,
          ...defaultConfig
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-configuration', planId] });
      toast({
        title: 'Configuración creada',
        description: 'Se ha creado la configuración por defecto para el plan.',
      });
    },
    onError: (error) => {
      console.error('Error creando configuración por defecto:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear la configuración por defecto.',
      });
    },
  });

  const handleSave = () => {
    saveConfigurationMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Cargando configuración...</div>;
  }

  if (!configuration && !isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración del Plan: {planName}</span>
          </CardTitle>
          <CardDescription>
            No hay configuración para este plan. Crea una configuración por defecto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => createDefaultConfigurationMutation.mutate()}
              disabled={createDefaultConfigurationMutation.isPending}
            >
              {createDefaultConfigurationMutation.isPending ? 'Creando...' : 'Crear Configuración por Defecto'}
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Configurar Manualmente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración del Plan: {planName}</span>
          </div>
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setFormData(configuration || {});
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saveConfigurationMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveConfigurationMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Límites de Recursos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Límites de Recursos</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_products">Máximo de Productos</Label>
              <Input
                id="max_products"
                type="number"
                placeholder="Ilimitado"
                value={formData.max_products || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  max_products: e.target.value ? parseInt(e.target.value) : null
                }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_users">Máximo de Usuarios</Label>
              <Input
                id="max_users"
                type="number"
                placeholder="Ilimitado"
                value={formData.max_users || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  max_users: e.target.value ? parseInt(e.target.value) : null
                }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_reservations_per_day">Reservas por Día</Label>
              <Input
                id="max_reservations_per_day"
                type="number"
                placeholder="Ilimitado"
                value={formData.max_reservations_per_day || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  max_reservations_per_day: e.target.value ? parseInt(e.target.value) : null
                }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_tables">Máximo de Mesas</Label>
              <Input
                id="max_tables"
                type="number"
                placeholder="Ilimitado"
                value={formData.max_tables || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  max_tables: e.target.value ? parseInt(e.target.value) : null
                }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_locations">Máximo de Ubicaciones</Label>
              <Input
                id="max_locations"
                type="number"
                value={formData.max_locations || 1}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  max_locations: e.target.value ? parseInt(e.target.value) : 1
                }))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Configuración de Soporte */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Configuración de Soporte</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="support_type">Tipo de Soporte</Label>
              <Select
                value={formData.support_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, support_type: value }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="24/7">24/7</SelectItem>
                  <SelectItem value="dedicated">Dedicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support_priority">Prioridad de Soporte</Label>
              <Select
                value={formData.support_priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, support_priority: value }))}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="dedicated">Dedicada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Funcionalidades Habilitadas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Funcionalidades Habilitadas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="api_access">Acceso API</Label>
              <Switch
                id="api_access"
                checked={formData.api_access_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, api_access_enabled: checked }))}
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="whitelabel">White-label</Label>
              <Switch
                id="whitelabel"
                checked={formData.whitelabel_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whitelabel_enabled: checked }))}
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="custom_domain">Dominio Personalizado</Label>
              <Switch
                id="custom_domain"
                checked={formData.custom_domain_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, custom_domain_enabled: checked }))}
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="advanced_analytics">Análisis Avanzados</Label>
              <Switch
                id="advanced_analytics"
                checked={formData.advanced_analytics_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, advanced_analytics_enabled: checked }))}
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="multi_location">Multi-ubicación</Label>
              <Switch
                id="multi_location"
                checked={formData.multi_location_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, multi_location_enabled: checked }))}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Nivel de Personalización */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Nivel de Personalización</h3>
          <div className="space-y-2">
            <Label htmlFor="customization_level">Nivel</Label>
            <Select
              value={formData.customization_level}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customization_level: value }))}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="advanced">Avanzado</SelectItem>
                <SelectItem value="full">Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanConfigurationManager;