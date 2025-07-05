
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface DiagnosticState {
  supabaseConnection: 'checking' | 'connected' | 'error';
  profilesTable: 'checking' | 'accessible' | 'error';
  productsTable: 'checking' | 'accessible' | 'error';
  authStatus: 'checking' | 'authenticated' | 'unauthenticated' | 'error';
  lastChecked: Date | null;
  errors: string[];
}

const DiagnosticPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticState>({
    supabaseConnection: 'checking',
    profilesTable: 'checking',
    productsTable: 'checking',
    authStatus: 'checking',
    lastChecked: null,
    errors: []
  });

  const runDiagnostics = async () => {
    console.log('🔍 Ejecutando diagnósticos del sistema...');
    
    setDiagnostics(prev => ({
      ...prev,
      supabaseConnection: 'checking',
      profilesTable: 'checking',
      productsTable: 'checking',
      authStatus: 'checking',
      errors: []
    }));

    const errors: string[] = [];

    try {
      // Test Supabase connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (connectionError) {
        errors.push(`Conexión Supabase: ${connectionError.message}`);
        setDiagnostics(prev => ({ ...prev, supabaseConnection: 'error' }));
      } else {
        setDiagnostics(prev => ({ ...prev, supabaseConnection: 'connected' }));
      }

      // Test profiles table access
      const { data: profilesTest, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .limit(1);

      if (profilesError) {
        errors.push(`Tabla profiles: ${profilesError.message}`);
        setDiagnostics(prev => ({ ...prev, profilesTable: 'error' }));
      } else {
        setDiagnostics(prev => ({ ...prev, profilesTable: 'accessible' }));
      }

      // Test products table access
      const { data: productsTest, error: productsError } = await supabase
        .from('products')
        .select('id, name')
        .limit(1);

      if (productsError) {
        errors.push(`Tabla products: ${productsError.message}`);
        setDiagnostics(prev => ({ ...prev, productsTable: 'error' }));
      } else {
        setDiagnostics(prev => ({ ...prev, productsTable: 'accessible' }));
      }

      // Test auth status
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        errors.push(`Auth: ${authError.message}`);
        setDiagnostics(prev => ({ ...prev, authStatus: 'error' }));
      } else if (session) {
        setDiagnostics(prev => ({ ...prev, authStatus: 'authenticated' }));
      } else {
        setDiagnostics(prev => ({ ...prev, authStatus: 'unauthenticated' }));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      errors.push(`Error general: ${errorMessage}`);
      console.error('❌ Error en diagnósticos:', error);
    }

    setDiagnostics(prev => ({
      ...prev,
      lastChecked: new Date(),
      errors
    }));

    console.log('✅ Diagnósticos completados');
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'accessible':
      case 'authenticated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
      default:
        return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'accessible':
      case 'authenticated':
        return <Badge variant="default" className="bg-green-500">OK</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'unauthenticated':
        return <Badge variant="secondary">No autenticado</Badge>;
      case 'checking':
      default:
        return <Badge variant="secondary">Verificando...</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Panel de Diagnóstico del Sistema</span>
          <Button variant="outline" size="sm" onClick={runDiagnostics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </CardTitle>
        {diagnostics.lastChecked && (
          <p className="text-sm text-muted-foreground">
            Última verificación: {diagnostics.lastChecked.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(diagnostics.supabaseConnection)}
              <span>Conexión Supabase</span>
            </div>
            {getStatusBadge(diagnostics.supabaseConnection)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(diagnostics.authStatus)}
              <span>Estado de Autenticación</span>
            </div>
            {getStatusBadge(diagnostics.authStatus)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(diagnostics.profilesTable)}
              <span>Tabla Profiles</span>
            </div>
            {getStatusBadge(diagnostics.profilesTable)}
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(diagnostics.productsTable)}
              <span>Tabla Products</span>
            </div>
            {getStatusBadge(diagnostics.productsTable)}
          </div>
        </div>

        {diagnostics.errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-semibold text-red-800 mb-2">Errores detectados:</h4>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {diagnostics.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiagnosticPanel;
