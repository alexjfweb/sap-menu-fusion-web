
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const DatabaseStatus = () => {
  const { data: dbStatus, isLoading } = useQuery({
    queryKey: ['database-status'],
    queryFn: async () => {
      try {
        console.log('Verificando conexión con Supabase...');
        
        // Verificar conexión básica
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);

        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('count')
          .limit(1);

        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('count')
          .limit(1);

        const { data: businessInfo, error: businessError } = await supabase
          .from('business_info')
          .select('count')
          .limit(1);

        return {
          connected: true,
          profiles: { 
            accessible: !profilesError, 
            error: profilesError?.message,
            count: profiles?.length || 0
          },
          products: { 
            accessible: !productsError, 
            error: productsError?.message,
            count: products?.length || 0
          },
          categories: { 
            accessible: !categoriesError, 
            error: categoriesError?.message,
            count: categories?.length || 0
          },
          business_info: { 
            accessible: !businessError, 
            error: businessError?.message,
            count: businessInfo?.length || 0
          }
        };
      } catch (error) {
        console.error('Error verificando base de datos:', error);
        return {
          connected: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        };
      }
    },
    refetchInterval: 30000, // Verificar cada 30 segundos
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Estado de la Base de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificando conexión...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Estado de la Base de Datos
        </CardTitle>
        <CardDescription>
          Conexión con Supabase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span>Conexión:</span>
          <Badge variant={dbStatus?.connected ? "default" : "destructive"}>
            {dbStatus?.connected ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {dbStatus?.connected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>

        {dbStatus?.connected && (
          <>
            {Object.entries(dbStatus).map(([key, value]) => {
              if (key === 'connected') return null;
              const tableData = value as any;
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key.replace('_', ' ')}:</span>
                  <Badge variant={tableData.accessible ? "default" : "secondary"}>
                    {tableData.accessible ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {tableData.accessible ? 'OK' : 'Error'}
                  </Badge>
                </div>
              );
            })}
          </>
        )}

        {!dbStatus?.connected && dbStatus?.error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            Error: {dbStatus.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DatabaseStatus;
