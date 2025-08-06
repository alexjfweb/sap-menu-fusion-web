import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Zap } from 'lucide-react';

const DefaultPlanConfigurations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDefaultConfigurationsMutation = useMutation({
    mutationFn: async () => {
      // Primero obtener todos los planes existentes
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, name, price');

      if (plansError) throw plansError;

      // Configuraciones por defecto para cada tipo de plan
      const configurations = plans?.map(plan => {
        const planName = plan.name.toLowerCase();
        
        let config = {
          plan_id: plan.id,
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
          max_products: null,
          max_users: null,
          max_reservations_per_day: null,
          max_tables: null,
        };

        // Configurar según el precio y nombre del plan
        if (plan.price === 0 || planName.includes('gratuito') || planName.includes('free')) {
          config = {
            ...config,
            max_products: 5,
            max_users: 1,
            max_reservations_per_day: 5,
            max_tables: 3,
            support_priority: 'low',
            customization_level: 'basic',
          };
        } else if (plan.price <= 30 || planName.includes('básico') || planName.includes('basic')) {
          config = {
            ...config,
            max_products: 50,
            max_users: 3,
            max_reservations_per_day: 20,
            max_tables: 10,
            support_priority: 'medium',
            customization_level: 'basic',
            integrations_enabled: { whatsapp: true },
            features_enabled: { basic_reports: true }
          };
        } else if (plan.price <= 70 || planName.includes('estándar') || planName.includes('standard')) {
          config = {
            ...config,
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
            integrations_enabled: { 
              whatsapp: true, 
              social_media: true, 
              inventory: true 
            },
            features_enabled: { 
              advanced_reports: true, 
              inventory_management: true 
            },
          };
        } else {
          // Premium o Enterprise
          config = {
            ...config,
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

        return config;
      }) || [];

      // Insertar todas las configuraciones
      const { error: insertError } = await supabase
        .from('plan_configurations')
        .insert(configurations);

      if (insertError) throw insertError;

      return configurations.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['plan-configuration'] });
      toast({
        title: 'Configuraciones creadas',
        description: `Se crearon ${count} configuraciones por defecto exitosamente.`,
      });
    },
    onError: (error) => {
      console.error('Error creando configuraciones por defecto:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron crear las configuraciones por defecto.',
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Configuraciones por Defecto</span>
        </CardTitle>
        <CardDescription>
          Crear configuraciones automáticas para todos los planes de suscripción
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esto creará configuraciones automáticas para todos los planes basándose en su precio y nombre:
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• <strong>Planes Gratuitos:</strong> Límites básicos, soporte por email</li>
            <li>• <strong>Planes Básicos ($0-30):</strong> Límites moderados, integración WhatsApp</li>
            <li>• <strong>Planes Estándar ($30-70):</strong> Límites amplios, análisis avanzados, multi-ubicación</li>
            <li>• <strong>Planes Premium ($70+):</strong> Sin límites, todas las funcionalidades</li>
          </ul>
          
          <Button 
            onClick={() => createDefaultConfigurationsMutation.mutate()}
            disabled={createDefaultConfigurationsMutation.isPending}
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            {createDefaultConfigurationsMutation.isPending 
              ? 'Creando Configuraciones...' 
              : 'Crear Configuraciones por Defecto'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DefaultPlanConfigurations;