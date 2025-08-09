
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type PaymentMethod = Tables<'payment_methods'>;

interface PaymentMethodFormProps {
  method: PaymentMethod | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentMethodForm = ({ method, onClose, onSuccess }: PaymentMethodFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
    webhook_url: '',
    configuration: {} as any,
  });
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (method) {
      setFormData({
        name: method.name,
        is_active: method.is_active || false,
        webhook_url: method.webhook_url || '',
        configuration: method.configuration || {},
      });
    }
  }, [method]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        is_active: formData.is_active,
        webhook_url: formData.webhook_url || null,
        configuration: formData.configuration,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('payment_methods')
        .update(updateData)
        .eq('id', method!.id);
      
      if (error) throw error;
      
      toast({
        title: 'Método actualizado',
        description: 'La configuración ha sido guardada exitosamente.',
      });

      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [key]: value
      }
    }));
  };

  const renderStripeConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="publishable_key">Clave Pública (Publishable Key)</Label>
        <div className="relative">
          <Input
            id="publishable_key"
            type={showSecrets ? 'text' : 'password'}
            value={formData.configuration.publishable_key || ''}
            onChange={(e) => updateConfiguration('publishable_key', e.target.value)}
            placeholder="pk_test_..."
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={() => setShowSecrets(!showSecrets)}
          >
            {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="secret_key">Clave Secreta (Secret Key)</Label>
        <Input
          id="secret_key"
          type={showSecrets ? 'text' : 'password'}
          value={formData.configuration.secret_key || ''}
          onChange={(e) => updateConfiguration('secret_key', e.target.value)}
          placeholder="sk_test_..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="webhook_secret">Webhook Secret</Label>
        <Input
          id="webhook_secret"
          type={showSecrets ? 'text' : 'password'}
          value={formData.configuration.webhook_secret || ''}
          onChange={(e) => updateConfiguration('webhook_secret', e.target.value)}
          placeholder="whsec_..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="webhook_url">URL del Webhook</Label>
        <Input
          id="webhook_url"
          value={formData.webhook_url}
          onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
          placeholder="https://tu-dominio.com/api/webhooks/stripe"
        />
      </div>
    </div>
  );

  const renderNequiConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="api_key">API Key</Label>
        <Input
          id="api_key"
          type={showSecrets ? 'text' : 'password'}
          value={formData.configuration.api_key || ''}
          onChange={(e) => updateConfiguration('api_key', e.target.value)}
          placeholder="API Key de Nequi"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="merchant_id">Merchant ID</Label>
        <Input
          id="merchant_id"
          value={formData.configuration.merchant_id || ''}
          onChange={(e) => updateConfiguration('merchant_id', e.target.value)}
          placeholder="ID del comercio"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_id">Client ID</Label>
        <Input
          id="client_id"
          value={formData.configuration.client_id || ''}
          onChange={(e) => updateConfiguration('client_id', e.target.value)}
          placeholder="Client ID"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_secret">Client Secret</Label>
        <Input
          id="client_secret"
          type={showSecrets ? 'text' : 'password'}
          value={formData.configuration.client_secret || ''}
          onChange={(e) => updateConfiguration('client_secret', e.target.value)}
          placeholder="Client Secret"
        />
      </div>
    </div>
  );

  const renderQRConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider">Proveedor</Label>
        <Input
          id="provider"
          value={formData.configuration.provider || ''}
          onChange={(e) => updateConfiguration('provider', e.target.value)}
          placeholder="bancolombia, daviplata, etc."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="merchant_code">Código del Comercio</Label>
        <Input
          id="merchant_code"
          value={formData.configuration.merchant_code || ''}
          onChange={(e) => updateConfiguration('merchant_code', e.target.value)}
          placeholder="Código asignado por el banco"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="terminal_id">ID Terminal (Opcional)</Label>
        <Input
          id="terminal_id"
          value={formData.configuration.terminal_id || ''}
          onChange={(e) => updateConfiguration('terminal_id', e.target.value)}
          placeholder="ID del terminal"
        />
      </div>
    </div>
  );

  const renderBancolombiaConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bank">Banco</Label>
        <Input
          id="bank"
          value={formData.configuration.bank || 'Bancolombia'}
          onChange={(e) => updateConfiguration('bank', e.target.value)}
          placeholder="Bancolombia"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="beneficiary">Beneficiario</Label>
        <Input
          id="beneficiary"
          value={formData.configuration.beneficiary || ''}
          onChange={(e) => updateConfiguration('beneficiary', e.target.value)}
          placeholder="Nombre del beneficiario"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account_number">Número de cuenta</Label>
        <Input
          id="account_number"
          value={formData.configuration.account_number || ''}
          onChange={(e) => updateConfiguration('account_number', e.target.value)}
          placeholder="000-000-000-00"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="account_type">Tipo de cuenta</Label>
        <Select
          value={formData.configuration.account_type || ''}
          onValueChange={(v) => updateConfiguration('account_type', v)}
        >
          <SelectTrigger id="account_type">
            <SelectValue placeholder="Selecciona tipo de cuenta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ahorro">Cuenta de Ahorros</SelectItem>
            <SelectItem value="corriente">Cuenta Corriente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="instructions">Instrucciones (una por línea)</Label>
        <Textarea
          id="instructions"
          value={formData.configuration.instructions || ''}
          onChange={(e) => updateConfiguration('instructions', e.target.value)}
          rows={4}
        />
      </div>
    </div>
  );

  const renderConfigurationFields = () => {
    switch (method?.type) {
      case 'stripe':
        return renderStripeConfig();
      case 'nequi':
        return renderNequiConfig();
      case 'bancolombia':
        return renderBancolombiaConfig();
      case 'qr':
        return renderQRConfig();
      default:
        return (
          <div className="space-y-2">
            <Label>Configuración</Label>
            <Textarea
              value={JSON.stringify(formData.configuration, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value);
                  setFormData(prev => ({ ...prev, configuration: config }));
                } catch (error) {
                  // Invalid JSON, ignore
                }
              }}
              rows={10}
            />
          </div>
        );
    }
  };

  if (!method) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Configurar {method.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Método</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Método Activo</Label>
            </div>
          </div>

          {/* Configuración específica */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Configuración</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSecrets(!showSecrets)}
              >
                {showSecrets ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showSecrets ? 'Ocultar' : 'Mostrar'} Secretos
              </Button>
            </div>
            {renderConfigurationFields()}
          </div>

          {/* Documentación rápida */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Documentación Rápida</h4>
            {method.type === 'stripe' && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Obtén las claves en el Dashboard de Stripe</p>
                <p>• Configura webhooks para eventos de pagos</p>
                <p>• Usa claves de prueba para testing</p>
              </div>
            )}
            {method.type === 'nequi' && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Regístrate como comercio en Nequi Business</p>
                <p>• Solicita credenciales API</p>
                <p>• Configura notificaciones de pagos</p>
              </div>
            )}
            {method.type === 'qr' && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Contacta a tu banco para obtener código de comercio</p>
                <p>• Configura terminal si es necesario</p>
                <p>• Prueba generación de códigos QR</p>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodForm;
