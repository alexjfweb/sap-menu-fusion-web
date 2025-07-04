import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Save,
  Loader2,
  Phone,
  Key,
  Building
} from 'lucide-react';

interface WhatsAppConfig {
  id?: string;
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  webhook_verify_token?: string;
  is_connected: boolean;
  last_verified_at?: string;
}

const WhatsappConfiguration = () => {
  const [config, setConfig] = useState<WhatsAppConfig>({
    phone_number_id: '',
    business_account_id: '',
    access_token: '',
    webhook_verify_token: '',
    is_connected: false
  });
  const [isValidating, setIsValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load existing configuration
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_business_config')
        .select('*')
        .maybeSingle();
      
      if (error) {
        console.error('Error loading WhatsApp config:', error);
        return null;
      }
      return data;
    },
  });

  useEffect(() => {
    if (existingConfig) {
      setConfig({
        id: existingConfig.id,
        phone_number_id: existingConfig.phone_number_id || '',
        business_account_id: existingConfig.business_account_id || '',
        access_token: existingConfig.access_token || '',
        webhook_verify_token: existingConfig.webhook_verify_token || '',
        is_connected: existingConfig.is_connected || false,
        last_verified_at: existingConfig.last_verified_at
      });
    }
  }, [existingConfig]);

  const validateConnection = async () => {
    if (!config.phone_number_id || !config.access_token) {
      toast({
        variant: 'destructive',
        title: 'Campos requeridos',
        description: 'Por favor completa el ID del número de teléfono y el token de acceso.',
      });
      return;
    }

    setIsValidating(true);
    
    try {
      // Validar el token con la API de WhatsApp Business
      const response = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar configuración con estado conectado
        const updatedConfig = {
          ...config,
          is_connected: true,
          last_verified_at: new Date().toISOString()
        };
        
        setConfig(updatedConfig);
        
        toast({
          title: 'Conexión exitosa',
          description: `Conectado a WhatsApp Business. Número verificado: ${data.display_phone_number || 'N/A'}`,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        setConfig(prev => ({
          ...prev,
          is_connected: false
        }));
        
        toast({
          variant: 'destructive',
          title: 'Error de conexión',
          description: errorData.error?.message || 'No se pudo validar la conexión con WhatsApp Business API.',
        });
      }
    } catch (error) {
      setConfig(prev => ({
        ...prev,
        is_connected: false
      }));
      
      toast({
        variant: 'destructive',
        title: 'Error de red',
        description: 'No se pudo conectar con WhatsApp Business API. Verifica tu conexión a internet.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.phone_number_id || !config.business_account_id || !config.access_token) {
      toast({
        variant: 'destructive',
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos obligatorios.',
      });
      return;
    }

    setSaving(true);
    
    try {
      const configData = {
        phone_number_id: config.phone_number_id,
        business_account_id: config.business_account_id,
        access_token: config.access_token,
        webhook_verify_token: config.webhook_verify_token || null,
        is_connected: config.is_connected,
        last_verified_at: config.last_verified_at || null
      };

      let result;
      if (config.id) {
        // Update existing configuration
        result = await supabase
          .from('whatsapp_business_config')
          .update(configData)
          .eq('id', config.id)
          .select()
          .single();
      } else {
        // Insert new configuration
        result = await supabase
          .from('whatsapp_business_config')
          .insert(configData)
          .select()
          .single();
      }
      
      if (result.error) throw result.error;
      
      if (!config.id && result.data) {
        setConfig(prev => ({ ...prev, id: result.data.id }));
      }

      toast({
        title: 'Configuración guardada',
        description: 'La configuración de WhatsApp Business ha sido guardada exitosamente.',
      });

      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
    } catch (error) {
      console.error('Error saving WhatsApp configuration:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo guardar la configuración de WhatsApp Business.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div>Cargando configuración de WhatsApp...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Configuración de WhatsApp Business API</h3>
          <p className="text-muted-foreground">
            Configura la integración con WhatsApp Business API para envío de mensajes
          </p>
        </div>
        <Badge 
          variant={config.is_connected ? "default" : "destructive"}
          className="flex items-center gap-2"
        >
          {config.is_connected ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Conectado
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              No Conectado
            </>
          )}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Configuración de API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta configuración requiere una cuenta de WhatsApp Business verificada y tokens de API válidos de Meta for Developers.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                ID de Número de Teléfono *
              </Label>
              <Input
                placeholder="Ej: 123456789012345"
                value={config.phone_number_id}
                onChange={(e) => setConfig(prev => ({ ...prev, phone_number_id: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Obtenido en la consola de WhatsApp Business API
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                ID de Cuenta de WhatsApp Business *
              </Label>
              <Input
                placeholder="Ej: 123456789012345"
                value={config.business_account_id}
                onChange={(e) => setConfig(prev => ({ ...prev, business_account_id: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                ID de tu cuenta de WhatsApp Business
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Token de Acceso Permanente *
            </Label>
            <Input
              type="password"
              placeholder="Token de acceso de WhatsApp Business API"
              value={config.access_token}
              onChange={(e) => setConfig(prev => ({ ...prev, access_token: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Token de acceso permanente obtenido desde Meta for Developers
            </p>
          </div>

          <div className="space-y-2">
            <Label>Token de Verificación de Webhook (Opcional)</Label>
            <Input
              placeholder="Token para verificar webhooks"
              value={config.webhook_verify_token}
              onChange={(e) => setConfig(prev => ({ ...prev, webhook_verify_token: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Token personalizado para validar webhooks entrantes
            </p>
          </div>

          {config.is_connected && config.last_verified_at && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Última verificación exitosa:</strong> {new Date(config.last_verified_at).toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={validateConnection}
              disabled={isValidating || !config.phone_number_id || !config.access_token}
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validar Conexión
                </>
              )}
            </Button>

            <Button
              onClick={handleSaveConfig}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configuración
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guía de Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Crear una aplicación en Meta for Developers</h4>
            <p className="text-sm text-muted-foreground">
              Visita developers.facebook.com y crea una nueva aplicación con el producto WhatsApp Business API.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">2. Obtener el ID del número de teléfono</h4>
            <p className="text-sm text-muted-foreground">
              En la configuración de WhatsApp Business API, encuentra el Phone Number ID asociado a tu número verificado.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">3. Generar token de acceso permanente</h4>
            <p className="text-sm text-muted-foreground">
              Genera un token de acceso permanente con los permisos: whatsapp_business_messaging y whatsapp_business_management.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">4. Validar la conexión</h4>
            <p className="text-sm text-muted-foreground">
              Después de completar los campos, usa el botón "Validar Conexión" para verificar que la configuración es correcta.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsappConfiguration;