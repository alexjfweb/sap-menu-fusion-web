import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

const SupabaseConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const testConnection = async () => {
    setLoading(true);
    setConnectionStatus('checking');
    
    try {
      console.log('🔍 Probando conexión con Supabase...');
      
      // Test 1: Conexión básica
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      // Test 2: Verificar productos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('count')
        .limit(1);

      // Test 3: Verificar categorías
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('count')
        .limit(1);

      const results = {
        profiles: { success: !profilesError, error: profilesError?.message, count: profiles?.length || 0 },
        products: { success: !productsError, error: productsError?.message, count: products?.length || 0 },
        categories: { success: !categoriesError, error: categoriesError?.message, count: categories?.length || 0 }
      };

      setTestResults(results);
      
      // Si al menos una tabla funciona, consideramos la conexión exitosa
      const hasSuccess = Object.values(results).some(r => r.success);
      
      if (hasSuccess) {
        setConnectionStatus('connected');
        console.log('✅ Conexión con Supabase exitosa');
      } else {
        setConnectionStatus('error');
        console.log('❌ Error de conexión con Supabase');
      }

    } catch (error) {
      console.error('❌ Error inesperado:', error);
      setConnectionStatus('error');
      setTestResults({ error: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {connectionStatus === 'checking' && <Loader2 className="h-5 w-5 animate-spin" />}
          {connectionStatus === 'connected' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {connectionStatus === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          Test de Conexión Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Estado:</span>
          <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
            {connectionStatus === 'checking' && 'Verificando...'}
            {connectionStatus === 'connected' && 'Conectado'}
            {connectionStatus === 'error' && 'Error'}
          </Badge>
        </div>

        {testResults && connectionStatus === 'connected' && (
          <div className="space-y-2">
            <h4 className="font-medium">Resultados de las pruebas:</h4>
            {Object.entries(testResults).map(([table, result]: [string, any]) => (
              <div key={table} className="flex items-center justify-between text-sm">
                <span className="capitalize">{table}:</span>
                <Badge variant={result.success ? 'default' : 'secondary'}>
                  {result.success ? 'OK' : 'Error'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {connectionStatus === 'error' && testResults?.error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            Error: {testResults.error}
          </div>
        )}

        <Button 
          onClick={testConnection} 
          disabled={loading}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Probando...' : 'Probar Conexión'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest; 