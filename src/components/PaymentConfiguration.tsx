
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
import PaymentMethodStatus from '@/components/PaymentMethodStatus';
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
    merchant_code?: string;
    account_number?: string;
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

  // Métodos de pago predefinidos alineados con constraint de BD
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
      console.log('🔍 Cargando métodos de pago existentes...');
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Error cargando métodos de pago:', error);
        throw error;
      }
      console.log('✅ Métodos de pago cargados:', data);
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
      // NUEVO: Limpiar archivo cuando se ingresa URL
      newConfigs[index].logo_file = undefined;
    } else {
      newConfigs[index].logo_file = value as File;
      // NUEVO: Limpiar URL cuando se sube archivo
      newConfigs[index].logo_url = '';
    }
    setConfigs(newConfigs);
  };

  const validateConfig = (config: PaymentMethodConfig): string | null => {
    if (!config.is_active) return null;

    // NUEVO: Validaciones específicas por tipo
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
      case 'qr_code':
      case 'daviplata':
        // Validación específica para códigos QR
        if (!config.logo_url && !config.logo_file) {
          return `${config.name}: Debe proporcionar un código QR (imagen o URL)`;
        }
        if (config.logo_url && config.logo_file) {
          return `${config.name}: Solo puede usar imagen O URL, no ambas`;
        }
        break;
    }

    return null;
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    console.log('💾 Iniciando guardado de configuraciones...');
    
    try {
      // Validar todas las configuraciones
      for (const config of configs) {
        const error = validateConfig(config);
        if (error) {
          console.error('❌ Error de validación:', error);
          toast({
            variant: 'destructive',
            title: 'Error de validación',
            description: error,
          });
          setSaving(false);
          return;
        }
      }

      // Subir archivos de logo solo cuando no hay URL externa
      for (const config of configs) {
        if (config.logo_file && !config.logo_url.trim()) {
          console.log(`📁 Subiendo logo para ${config.name}...`);
          const fileExt = config.logo_file.name.split('.').pop();
          const fileName = `${config.type}_logo_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(`payment-logos/${fileName}`, config.logo_file, {
              upsert: true
            });

          if (uploadError) {
            console.error('❌ Error subiendo archivo:', uploadError);
            toast({
              variant: 'destructive',
              title: 'Error subiendo archivo',
              description: `No se pudo subir el logo de ${config.name}`,
            });
            setSaving(false);
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(`payment-logos/${fileName}`);
          
          config.logo_url = publicUrl;
          console.log(`✅ Logo subido para ${config.name}: ${publicUrl}`);
        }
      }

      // Guardar configuraciones en base de datos
      for (const config of configs) {
        if (!config.is_active) {
          console.log(`⏭️ Saltando ${config.name} (inactivo)`);
          continue;
        }
        
        console.log(`💾 Guardando configuración para ${config.name}...`);
        console.log('📋 Datos a guardar:', {
          name: config.name,
          type: config.type,
          is_active: config.is_active,
          configuration: config.configuration,
          webhook_url: config.logo_url || null
        });
        
        const upsertData = {
          name: config.name,
          type: config.type,
          is_active: config.is_active,
          configuration: config.configuration,
          webhook_url: config.logo_url && config.logo_url.trim() !== '' ? config.logo_url : null
        };

        if (config.id) {
          const { error } = await supabase
            .from('payment_methods')
            .update(upsertData)
            .eq('id', config.id);
          
          if (error) {
            console.error('❌ Error actualizando método existente:', error);
            throw error;
          }
          console.log(`✅ Método ${config.name} actualizado`);
        } else {
          const { data, error } = await supabase
            .from('payment_methods')
            .insert(upsertData)
            .select()
            .single();
          
          if (error) {
            console.error('❌ Error creando nuevo método:', error);
            throw error;
          }
          config.id = data.id;
          console.log(`✅ Método ${config.name} creado con ID: ${data.id}`);
        }
      }

      console.log('🎉 Todas las configuraciones guardadas exitosamente');
      toast({
        title: 'Configuración guardada',
        description: 'Los métodos de pago han sido configurados exitosamente.',
      });

      // Invalidar múltiples queries para sincronización
      queryClient.invalidateQueries({ queryKey: ['payment-methods-config'] });
      queryClient.invalidateQueries({ queryKey: ['payment-methods-validation'] });
      queryClient.invalidateQueries({ queryKey: ['active-payment-methods'] });
      queryClient.invalidateQueries({ queryKey: ['available-qr-configs'] });
      queryClient.invalidateQueries({ queryKey: ['bank-qr-configs'] });
    } catch (error: any) {
      console.error('❌ Error crítico guardando configuración:', error);
      
      let errorAnalysis = {
        type: 'unknown',
        constraint: null,
        table: null,
        technical_details: '',
        user_message: 'Error desconocido al guardar configuración.'
      };

      if (error?.message) {
        if (error.message.includes('violates check constraint')) {
          errorAnalysis.type = 'constraint_violation';
          
          const constraintMatch = error.message.match(/constraint "([^"]+)"/);
          if (constraintMatch) {
            errorAnalysis.constraint = constraintMatch[1];
          }
          
          if (error.message.includes('payment_methods_type_check')) {
            errorAnalysis.user_message = 'Tipo de método de pago no válido. Los tipos permitidos son: cash_on_delivery, qr_code, nequi, daviplata, mercado_pago, stripe, paypal.';
            errorAnalysis.technical_details = `Constraint violation: ${error.message}`;
          }
        } else if (error.code === '23505') {
          errorAnalysis.type = 'unique_violation';
          errorAnalysis.user_message = 'Ya existe un método de pago con estas características.';
          errorAnalysis.technical_details = `Unique constraint violation: ${error.message}`;
        } else if (error.code === '23503') {
          errorAnalysis.type = 'foreign_key_violation';
          errorAnalysis.user_message = 'Error de referencia en la base de datos.';
          errorAnalysis.technical_details = `Foreign key violation: ${error.message}`;
        } else {
          errorAnalysis.technical_details = error.message;
        }
      }
      
      setErrorModal({
        isOpen: true,
        title: 'Error Técnico: Configuración de Métodos de Pago',
        message: `${errorAnalysis.user_message}\n\n=== INFORMACIÓN TÉCNICA PARA SOPORTE ===\nTipo de Error: ${errorAnalysis.type}\nConstraint: ${errorAnalysis.constraint || 'N/A'}\nTabla: payment_methods\nDetalles: ${errorAnalysis.technical_details}\n\n=== CONTEXTO DE DEBUG ===\nOperación: Guardado de configuración de métodos de pago\nUsuario en ruta: /dashboard (configuración)\nTimestamp: ${new Date().toISOString()}`,
        error: {
          ...error,
          analysis: errorAnalysis
        }
      });
      
      toast({
        variant: 'destructive',
        title: 'Error al guardar',
        description: errorAnalysis.user_message,
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

      case 'qr_code':
        // Campos específicos para QR Code general
        return (
          <div className="space-y-2">
            <Label>Código Merchant (Opcional)</Label>
            <Input
              placeholder="Código identificador del comercio"
              value={config.configuration.merchant_code || ''}
              onChange={(e) => handleConfigChange(index, 'merchant_code', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Código único de tu comercio para identificar los pagos QR
            </p>
          </div>
        );
      
      
      case 'daviplata':
        // Campos específicos para Daviplata
        return (
          <div className="space-y-2">
            <Label>Número de Teléfono Daviplata</Label>
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
              Número de teléfono asociado a tu cuenta Daviplata
            </p>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderLogoSection = (config: PaymentMethodConfig, index: number) => {
    if (!config.is_active) return null;

    // Sección específica para códigos QR (QR Code, Bancolombia, Daviplata)
    if (['qr_code', 'bancolombia', 'daviplata'].includes(config.type)) {
      return (
          <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Código QR - {config.name}</Label>
            {config.logo_url && (
              <img 
                src={config.logo_url} 
                alt={`${config.name} QR Code preview`} 
                className="h-16 w-16 object-contain rounded border"
              />
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Subir Imagen QR
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
                URL del Código QR
              </Label>
              <Input
                placeholder="https://ejemplo.com/mi-qr.png"
                value={config.logo_url || ''}
                onChange={(e) => handleLogoChange(index, 'logo_url', e.target.value)}
              />
            </div>
          </div>
          
          <Alert>
            <QrCode className="h-4 w-4" />
            <AlertDescription>
              <strong>Uso exclusivo:</strong> Puedes subir una imagen QR O usar una URL externa, pero no ambas opciones al mismo tiempo.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    // Para otros métodos de pago
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
        
        <p className="text-xs text-muted-foreground">
          Puedes usar una imagen local O una URL externa, no ambas.
        </p>
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

      {/* Estado de métodos de pago */}
      <PaymentMethodStatus />

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
