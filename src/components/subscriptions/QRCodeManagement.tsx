
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  Download, 
  RefreshCw, 
  Eye,
  EyeOff,
  Plus,
  Smartphone
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type QRCode = Tables<'qr_codes'>;
type SubscriptionPlan = Tables<'subscription_plans'>;

interface QRCodeWithPlan extends QRCode {
  subscription_plans?: SubscriptionPlan;
}

const QRCodeManagement = () => {
  const [previewCode, setPreviewCode] = useState<QRCodeWithPlan | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: qrCodes, isLoading } = useQuery({
    queryKey: ['qr-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          subscription_plans(name, price, currency)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as QRCodeWithPlan[];
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans-for-qr'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const generateQRMutation = useMutation({
    mutationFn: async ({ planId, provider }: { planId: string; provider: string }) => {
      // Simular generación de código QR
      const qrData = `plan:${planId}|provider:${provider}|timestamp:${Date.now()}`;
      
      const { error } = await supabase
        .from('qr_codes')
        .insert({
          plan_id: planId,
          qr_data: qrData,
          payment_provider: provider,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
          is_active: true,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      toast({
        title: 'Código QR generado',
        description: 'El código QR ha sido generado exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar el código QR.',
      });
    },
  });

  const toggleQRStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado del código QR ha sido actualizado.',
      });
    },
  });

  const refreshQRMutation = useMutation({
    mutationFn: async (id: string) => {
      const newQRData = `refreshed:${id}|timestamp:${Date.now()}`;
      const { error } = await supabase
        .from('qr_codes')
        .update({ 
          qr_data: newQRData,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      toast({
        title: 'Código QR actualizado',
        description: 'El código QR ha sido renovado exitosamente.',
      });
    },
  });

  const getProviderIcon = (provider: string) => {
    return <QrCode className="h-5 w-5" />;
  };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      bancolombia: 'Bancolombia QR',
      daviplata: 'Daviplata',
      nequi: 'Nequi QR'
    };
    return labels[provider] || provider;
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Cargando códigos QR...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Gestión de Códigos QR</h3>
          <p className="text-muted-foreground">
            Genera y administra códigos QR para pagos
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Smartphone className="h-4 w-4 mr-2" />
            Vista Móvil
          </Button>
        </div>
      </div>

      {/* Generación de nuevos códigos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Generar Nuevo Código QR
          </CardTitle>
          <CardDescription>
            Crea códigos QR para diferentes planes y proveedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans?.map((plan) => (
              <div key={plan.id} className="space-y-2">
                <h4 className="font-medium">{plan.name}</h4>
                <div className="space-y-2">
                  {['bancolombia', 'daviplata', 'nequi'].map((provider) => (
                    <Button
                      key={provider}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => generateQRMutation.mutate({ planId: plan.id, provider })}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      {getProviderLabel(provider)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de códigos QR existentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes?.map((qrCode) => (
          <Card key={qrCode.id} className={`relative ${isExpired(qrCode.expires_at) ? 'border-destructive' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  {getProviderIcon(qrCode.payment_provider || '')}
                  <div>
                    <CardTitle className="text-lg">
                      {qrCode.subscription_plans?.name}
                    </CardTitle>
                    <CardDescription>
                      {getProviderLabel(qrCode.payment_provider || '')}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  {qrCode.is_active ? (
                    <Badge variant="default">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                  {isExpired(qrCode.expires_at) && (
                    <Badge variant="destructive">Expirado</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Preview del QR (simulado) */}
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
              </div>

              {/* Información */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: qrCode.subscription_plans?.currency || 'USD',
                    }).format(qrCode.subscription_plans?.price || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado:</span>
                  <span>{formatDate(qrCode.created_at)}</span>
                </div>
                {qrCode.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expira:</span>
                    <span className={isExpired(qrCode.expires_at) ? 'text-destructive' : ''}>
                      {formatDate(qrCode.expires_at)}
                    </span>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewCode(qrCode)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshQRMutation.mutate(qrCode.id)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Simular descarga
                    toast({
                      title: 'Descargando...',
                      description: 'El código QR se está descargando.',
                    });
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleQRStatus.mutate({
                    id: qrCode.id,
                    is_active: !qrCode.is_active
                  })}
                >
                  {qrCode.is_active ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {qrCodes?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay códigos QR</h3>
            <p className="text-muted-foreground mb-4">
              Genera tu primer código QR para empezar a recibir pagos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de previsualización móvil */}
      {previewCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">Vista Móvil</h3>
              <div className="w-48 h-48 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center mx-auto">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">{previewCode.subscription_plans?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {getProviderLabel(previewCode.payment_provider || '')}
                </p>
              </div>
              <Button onClick={() => setPreviewCode(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeManagement;
