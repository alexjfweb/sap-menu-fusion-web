
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Mail, MessageSquare, Shield, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReminderSettings {
  id: string;
  max_messages_per_day: number;
  spam_protection_enabled: boolean;
  audit_log_enabled: boolean;
  email_provider_config: any;
  sms_provider_config: any;
  whatsapp_provider_config: any;
}

const ReminderSettings = () => {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_reminder_settings')
        .select('*')
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones.',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('payment_reminder_settings')
        .update({
          max_messages_per_day: settings.max_messages_per_day,
          spam_protection_enabled: settings.spam_protection_enabled,
          audit_log_enabled: settings.audit_log_enabled,
          email_provider_config: settings.email_provider_config,
          sms_provider_config: settings.sms_provider_config,
          whatsapp_provider_config: settings.whatsapp_provider_config,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: 'Configuración guardada',
        description: 'Las configuraciones se guardaron exitosamente.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron guardar las configuraciones.',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<ReminderSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const updateProviderConfig = (provider: 'email' | 'sms' | 'whatsapp', config: any) => {
    if (settings) {
      const configKey = `${provider}_provider_config`;
      setSettings({
        ...settings,
        [configKey]: config
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No se pudieron cargar las configuraciones
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
          <p className="text-muted-foreground">
            Ajusta la configuración global de recordatorios
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>SMS/WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Seguridad</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Ajusta los límites y comportamiento general del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max_messages">Máximo de mensajes por día</Label>
                <Input
                  id="max_messages"
                  type="number"
                  value={settings.max_messages_per_day}
                  onChange={(e) => updateSettings({ 
                    max_messages_per_day: parseInt(e.target.value) 
                  })}
                  min={1}
                  max={1000}
                />
                <p className="text-sm text-muted-foreground">
                  Límite diario de mensajes para prevenir spam
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="spam_protection"
                  checked={settings.spam_protection_enabled}
                  onCheckedChange={(checked) => updateSettings({ 
                    spam_protection_enabled: checked 
                  })}
                />
                <Label htmlFor="spam_protection">Protección contra spam activada</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="audit_log"
                  checked={settings.audit_log_enabled}
                  onCheckedChange={(checked) => updateSettings({ 
                    audit_log_enabled: checked 
                  })}
                />
                <Label htmlFor="audit_log">Registro de auditoría activado</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Email</CardTitle>
              <CardDescription>
                Configura el proveedor de servicios de email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">Servidor SMTP</Label>
                <Input
                  id="smtp_host"
                  value={settings.email_provider_config?.smtp_host || ''}
                  onChange={(e) => updateProviderConfig('email', {
                    ...settings.email_provider_config,
                    smtp_host: e.target.value
                  })}
                  placeholder="smtp.ejemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Puerto</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.email_provider_config?.smtp_port || ''}
                    onChange={(e) => updateProviderConfig('email', {
                      ...settings.email_provider_config,
                      smtp_port: parseInt(e.target.value)
                    })}
                    placeholder="587"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_username">Usuario</Label>
                  <Input
                    id="smtp_username"
                    value={settings.email_provider_config?.smtp_username || ''}
                    onChange={(e) => updateProviderConfig('email', {
                      ...settings.email_provider_config,
                      smtp_username: e.target.value
                    })}
                    placeholder="usuario@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_password">Contraseña</Label>
                <Input
                  id="smtp_password"
                  type="password"
                  value={settings.email_provider_config?.smtp_password || ''}
                  onChange={(e) => updateProviderConfig('email', {
                    ...settings.email_provider_config,
                    smtp_password: e.target.value
                  })}
                  placeholder="••••••••"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de SMS y WhatsApp</CardTitle>
              <CardDescription>
                Configura los proveedores de SMS y WhatsApp (Twilio)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="twilio_sid">Twilio Account SID</Label>
                <Input
                  id="twilio_sid"
                  value={settings.sms_provider_config?.account_sid || ''}
                  onChange={(e) => updateProviderConfig('sms', {
                    ...settings.sms_provider_config,
                    account_sid: e.target.value
                  })}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio_token">Twilio Auth Token</Label>
                <Input
                  id="twilio_token"
                  type="password"
                  value={settings.sms_provider_config?.auth_token || ''}
                  onChange={(e) => updateProviderConfig('sms', {
                    ...settings.sms_provider_config,
                    auth_token: e.target.value
                  })}
                  placeholder="••••••••••••••••••••••••••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twilio_phone">Número de teléfono Twilio</Label>
                <Input
                  id="twilio_phone"
                  value={settings.sms_provider_config?.phone_number || ''}
                  onChange={(e) => updateProviderConfig('sms', {
                    ...settings.sms_provider_config,
                    phone_number: e.target.value
                  })}
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">Número de WhatsApp</Label>
                <Input
                  id="whatsapp_number"
                  value={settings.whatsapp_provider_config?.whatsapp_number || ''}
                  onChange={(e) => updateProviderConfig('whatsapp', {
                    ...settings.whatsapp_provider_config,
                    whatsapp_number: e.target.value
                  })}
                  placeholder="whatsapp:+1234567890"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>
                Ajusta las medidas de seguridad y privacidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Medidas de Protección</h4>
                
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Certificación PCI DSS</span>
                    <span className="text-sm font-medium text-green-600">Nivel 4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encriptación</span>
                    <span className="text-sm font-medium text-green-600">End-to-end</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Autenticación doble</span>
                    <span className="text-sm font-medium text-green-600">Activada</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ip_whitelist">IPs permitidas (opcional)</Label>
                  <Textarea
                    id="ip_whitelist"
                    placeholder="192.168.1.1&#10;10.0.0.1&#10;..."
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Una IP por línea. Deja vacío para permitir todas las IPs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReminderSettings;
