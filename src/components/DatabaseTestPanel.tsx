
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import DatabaseStatus from './DatabaseStatus';

const DatabaseTestPanel = () => {
  const { data: testResults, isLoading, refetch } = useQuery({
    queryKey: ['database-test'],
    queryFn: async () => {
      const results = [];
      
      try {
        // Test 1: Verificar productos
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, category_id')
          .limit(5);
        
        results.push({
          test: 'Productos',
          success: !productsError,
          data: products,
          error: productsError?.message,
          count: products?.length || 0
        });

        // Test 2: Verificar categorías
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .limit(5);
        
        results.push({
          test: 'Categorías',
          success: !categoriesError,
          data: categories,
          error: categoriesError?.message,
          count: categories?.length || 0
        });

        // Test 3: Verificar información del negocio
        const { data: businessInfo, error: businessError } = await supabase
          .from('business_info')
          .select('id, business_name')
          .limit(1);
        
        results.push({
          test: 'Info Negocio',
          success: !businessError,
          data: businessInfo,
          error: businessError?.message,
          count: businessInfo?.length || 0
        });

        // Test 4: Verificar perfiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .limit(5);
        
        results.push({
          test: 'Perfiles',
          success: !profilesError,
          data: profiles,
          error: profilesError?.message,
          count: profiles?.length || 0
        });

      } catch (error) {
        console.error('Error en tests de base de datos:', error);
      }

      return results;
    },
  });

  return (
    <div className="space-y-6">
      <DatabaseStatus />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Pruebas de Base de Datos
          </CardTitle>
          <CardDescription>
            Verificación detallada de acceso a tablas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => refetch()} 
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Ejecutando pruebas...' : 'Ejecutar pruebas'}
          </Button>

          {testResults && (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <span className="font-medium">{result.test}</span>
                      <div className="text-sm text-muted-foreground">
                        {result.success ? `${result.count} registros` : result.error}
                      </div>
                    </div>
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? 'OK' : 'Error'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTestPanel;
