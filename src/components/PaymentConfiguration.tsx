import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ErrorModal from '@/components/ErrorModal';
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  Truck,
  DollarSign,
  Upload,
  Link,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface PaymentMethodConfig {
  id?: string;
  name: string;
  type: string;
  is_active: boolean;
  configuration: {
    public_key?: string;
    secret_key?: string;
    email?: string;
    private_key?: string;
    phone_number?: string;
  };
  logo_url: string;
  logo_file?: File;
}

const PaymentConfiguration = () => {
  const [configs, setConfigs] = useState<PaymentMethodConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    error?: any;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Métodos de pago predefinidos
  const defaultMethods = [
    { name: 'Contra Entrega', type: 'cash_on_delivery', icon: Truck },
    { name: 'Código QR', type: 'qr_code', icon: QrCode },
    { name: 'Nequi', type: 'nequi', icon: Smartphone },
    { name: 'Daviplata', type: 'daviplata', icon: Smartphone },
    { name: 'Mercado Pago', type: 'mercado_pago', icon: DollarSign },
    { name: 'Stripe', type: 'stripe', icon: CreditCard },
    { name: 'PayPal', type: 'paypal', icon: CreditCard }
  ];

  // Cargar configuraciones existentes
  const { data: existingMethods } = useQuery({
    queryKey: ['payment-methods-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (existingMethods) {
      // Combinar métodos predefinidos con los existentes
      const combinedConfigs = defaultMethods.map(defaultMethod => {
        const existing = existingMethods.find(em => em.type === defaultMethod.type);
        return {
          id: existing?.id,
          name: defaultMethod.name,
          type: defaultMethod.type,
          is_active: existing?.is_active || false,
          configuration: existing?.configuration || {},
          logo_url: existing?.webhook_url || '',
          icon: defaultMethod.icon
        };
      });
      setConfigs(combinedConfigs as any);
    }
  }, [existingMethods]);

  const handleToggle = (index: number, active: boolean) => {
    const newConfigs = [...configs];
    newConfigs[index].is_active = active;
    setConfigs(newConfigs);
  };

  const handleConfigChange = (index: number, field: string, value: string) => {
    const newConfigs = [...configs];
    newConfigs[index].configuration = {
      ...newConfigs[index].configuration,
      [field]: value
    };
    setConfigs(newConfigs);
  };

  const handleLogoChange = (index: number, field: 'logo_url' | 'logo_file', value: string | File) => {
    const newConfigs = [...configs];
    if (field === 'logo_url') {
      newConfigs[index].logo_url = value as string;
    } else {
      newConfigs[index].logo_file = value as File;
    }
    setConfigs(newConfigs);
  };

  const validateConfig = (config: PaymentMethodConfig): string | null => {
    if (!config.is_active) return null;

    // Validaciones específicas por tipo
    switch (config.type) {
      case 'stripe':
        if (!config.configuration.public_key || !config.configuration.secret_key) {
          return `${config.name}: Clave pública y secreta son requeridas`;
        }
        break;
      case 'paypal':
        if (!config.configuration.email) {
          return `${config.name}: Email de PayPal es requerido`;
        }
        break;
      case 'mercado_pago':
        if (!config.configuration.public_key) {
          return `${config.name}: Clave pública es requerida`;
        }
        break;
      case 'nequi':
        if (!config.configuration.phone_number) {
          return `${config.name}: Número de teléfono es requerido`;
        }
        if (!/^\d{10}$/.test(config.configuration.phone_number)) {
          return `${config.name}: El número debe tener exactamente 10 dígitos`;
        }
        break;
    }

    return null;
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    
    try {
      // Validar todas las configuraciones
      for (const config of configs) {
        const error = validateConfig(config);
        if (error) {
          toast({
            variant: 'destructive',
            title: 'Error de validación',
            description: error,
          });
          setSaving(false);
          return;
        }
      }

      // Subir archivos de logo si existen
      for (const config of configs) {
        if (config.logo_file) {
          const fileExt = config.logo_file.name.split('.').pop();
          const fileName = `${config.type}_logo.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(`payment-logos/${fileName}`, config.logo_file, {
              upsert: true
            });

          if (uploadError) {
            toast({
              variant: 'destructive',
              title: 'Error subiendo archivo',
              description: `No se pudo subir el logo de ${config.name}`,
            });
            setSaving(false);
            return;
          }

          // Obtener URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(`payment-logos/${fileName}`);
          
          config.logo_url = publicUrl;
        }
      }

      // Guardar configuraciones en base de datos
      for (const config of configs) {
        // Solo guardar configuraciones activas
        if (!config.is_active) continue;
        
        const upsertData = {
          name: config.name,
          type: config.type,
          is_active: config.is_active,
          configuration: config.configuration,
          webhook_url: config.logo_url || null
        };

        if (config.id) {
          // Actualizar existente
          const { error } = await supabase
            .from('payment_methods')
            .update(upsertData)
            .eq('id', config.id);
          
          if (error) throw error;
        } else {
          // Crear nuevo
          const { data, error } = await supabase
            .from('payment_methods')
            .insert(upsertData)
            .select()
            .single();
          
          if (error) throw error;
          config.id = data.id;
        }
      }

      toast({
        title: 'Configuración guardada',
        description: 'Los métodos de pago han sido configurados exitosamente.',
      });

      queryClient.invalidateQueries({ queryKey: ['payment-methods-config'] });
    } catch (error) {
      console.error('Error saving payment configuration:', error);
      
      // Mostrar modal de error detallado
      setErrorModal({
        isOpen: true,
        title: 'Error al guardar configuración',
        message: 'No se pudo guardar la configuración de métodos de pago. Por favor, revise los datos ingresados e intente nuevamente.',
        error
      });
      
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: 'No se pudo guardar la configuración de pagos.',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderConfigFields = (config: PaymentMethodConfig, index: number) => {
    if (!config.is_active) return null;

    switch (config.type) {
      case 'stripe':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Clave Pública</Label>
              <Input
                placeholder="pk_test_..."
                value={config.configuration.public_key || ''}
                onChange={(e) => handleConfigChange(index, 'public_key', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Clave Secreta</Label>
              <Input
                type="password"
                placeholder="sk_test_..."
                value={config.configuration.secret_key || ''}
                onChange={(e) => handleConfigChange(index, 'secret_key', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'paypal':
        return (
          <div className="space-y-2">
            <Label>Email de PayPal</Label>
            <Input
              type="email"
              placeholder="merchant@example.com"
              value={config.configuration.email || ''}
              onChange={(e) => handleConfigChange(index, 'email', e.target.value)}
            />
          </div>
        );
      
      case 'mercado_pago':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Clave Pública</Label>
              <Input
                placeholder="APP_USR_..."
                value={config.configuration.public_key || ''}
                onChange={(e) => handleConfigChange(index, 'public_key', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Clave Privada (Opcional)</Label>
              <Input
                type="password"
                placeholder="APP_USR_..."
                value={config.configuration.private_key || ''}
                onChange={(e) => handleConfigChange(index, 'private_key', e.target.value)}
              />
            </div>
          </div>
        );
      
      case 'nequi':
        return (
          <div className="space-y-2">
            <Label>Número de Teléfono Nequi</Label>
            <Input
              placeholder="3001234567"
              value={config.configuration.phone_number || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 10) {
                  handleConfigChange(index, 'phone_number', value);
                }
              }}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Ingresa 10 dígitos numéricos (ejemplo: 3001234567)
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderLogoSection = (config: PaymentMethodConfig, index: number) => {
    if (!config.is_active) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Logo del Método</Label>
          {config.logo_url && (
            <img 
              src={config.logo_url} 
              alt="Logo preview" 
              className="h-8 w-8 object-contain rounded"
            />
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir desde PC
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleLogoChange(index, 'logo_file', file);
                }
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL Externa
            </Label>
            <Input
              placeholder="https://ejemplo.com/logo.png"
              value={config.logo_url || ''}
              onChange={(e) => handleLogoChange(index, 'logo_url', e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Configuración de Pagos</h3>
          <p className="text-muted-foreground">
            Gestiona los métodos de pago disponibles en tu aplicación
          </p>
        </div>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Entorno de Pruebas
        </Badge>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Esta configuración es solo para entorno de pruebas. No se realizarán transacciones reales.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {configs.map((config, index) => {
          const IconComponent = (config as any).icon;
          return (
            <Card key={config.type}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                    </div>
                  </div>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) => handleToggle(index, checked)}
                  />
                </div>
              </CardHeader>
              
              {config.is_active && (
                <CardContent className="space-y-6">
                  {renderConfigFields(config, index)}
                  
                  {renderConfigFields(config, index) && <Separator />}
                  
                  {renderLogoSection(config, index)}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSaveChanges} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>

      {/* Modal de error */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        error={errorModal.error}
        logToConsole={true}
      />
    </div>
  );
};

export default PaymentConfiguration;