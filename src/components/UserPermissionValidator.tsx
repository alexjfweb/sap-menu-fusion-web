
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, User, Shield, Clock } from 'lucide-react';

interface ValidationResult {
  check: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const UserPermissionValidator = () => {
  const [email, setEmail] = useState('alexjfweb@gmail.com');
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);

  const validateUser = async () => {
    setLoading(true);
    const results: ValidationResult[] = [];

    try {
      // 1. Verificar si el usuario existe en profiles y su rol
      console.log('🔍 Verificando usuario en profiles...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        results.push({
          check: 'Profile Database Check',
          status: 'error',
          message: `Error consultando profiles: ${profileError.message}`,
          details: profileError
        });
      } else if (!profileData) {
        results.push({
          check: 'Profile Database Check',
          status: 'error',
          message: 'Usuario no encontrado en la tabla profiles',
          details: null
        });
      } else {
        results.push({
          check: 'Profile Database Check',
          status: 'success',
          message: `Usuario encontrado en profiles con rol: ${profileData.role}`,
          details: profileData
        });

        // Verificar si es superadmin
        if (profileData.role === 'superadmin') {
          results.push({
            check: 'SuperAdmin Role Check',
            status: 'success',
            message: 'Usuario tiene rol de superadmin',
            details: { role: profileData.role }
          });
        } else {
          results.push({
            check: 'SuperAdmin Role Check',
            status: 'error',
            message: `Usuario tiene rol '${profileData.role}', no 'superadmin'`,
            details: { role: profileData.role }
          });
        }

        // Verificar si está activo
        if (profileData.is_active) {
          results.push({
            check: 'Account Status Check',
            status: 'success',
            message: 'Cuenta está activa',
            details: { is_active: profileData.is_active }
          });
        } else {
          results.push({
            check: 'Account Status Check',
            status: 'error',
            message: 'Cuenta está inactiva',
            details: { is_active: profileData.is_active }
          });
        }
      }

      // 2. Verificar sesión actual y token
      console.log('🔍 Verificando sesión actual...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        results.push({
          check: 'Session Token Check',
          status: 'error',
          message: `Error obteniendo sesión: ${sessionError.message}`,
          details: sessionError
        });
      } else if (!sessionData.session) {
        results.push({
          check: 'Session Token Check',
          status: 'warning',
          message: 'No hay sesión activa actualmente',
          details: null
        });
      } else {
        const session = sessionData.session;
        const now = new Date().getTime() / 1000;
        const expiresAt = session.expires_at || 0;

        results.push({
          check: 'Session Token Check',
          status: 'success',
          message: `Sesión activa para: ${session.user?.email}`,
          details: {
            user_email: session.user?.email,
            expires_at: new Date(expiresAt * 1000).toLocaleString(),
            is_expired: now > expiresAt
          }
        });

        // Verificar si el token está expirado
        if (now > expiresAt) {
          results.push({
            check: 'Token Expiration Check',
            status: 'error',
            message: 'Token de sesión está expirado',
            details: { expires_at: new Date(expiresAt * 1000).toLocaleString() }
          });
        } else {
          const timeLeft = Math.round((expiresAt - now) / 60);
          results.push({
            check: 'Token Expiration Check',
            status: 'success',
            message: `Token válido por ${timeLeft} minutos más`,
            details: { minutes_left: timeLeft }
          });
        }

        // Verificar si la sesión es del usuario correcto
        if (session.user?.email === email) {
          results.push({
            check: 'Session User Match',
            status: 'success',
            message: 'La sesión actual pertenece al usuario validado',
            details: { session_email: session.user.email }
          });
        } else {
          results.push({
            check: 'Session User Match',
            status: 'warning',
            message: `Sesión actual es de ${session.user?.email}, no de ${email}`,
            details: { 
              session_email: session.user?.email,
              validated_email: email
            }
          });
        }
      }

      // 3. Probar acceso a una tabla protegida (solo superadmin)
      console.log('🔍 Probando acceso a datos protegidos...');
      const { data: protectedData, error: protectedError } = await supabase
        .from('profiles')
        .select('email, role')
        .limit(1);

      if (protectedError) {
        results.push({
          check: 'Protected Data Access',
          status: 'error',
          message: `Sin acceso a datos protegidos: ${protectedError.message}`,
          details: protectedError
        });
      } else {
        results.push({
          check: 'Protected Data Access',
          status: 'success',
          message: 'Acceso exitoso a datos protegidos',
          details: { accessible_records: protectedData?.length || 0 }
        });
      }

      // 4. Verificar políticas RLS específicas para superadmin
      console.log('🔍 Verificando políticas RLS...');
      const { data: allProfiles, error: rlsError } = await supabase
        .from('profiles')
        .select('*');

      if (rlsError) {
        results.push({
          check: 'RLS Policy Check',
          status: 'error',
          message: `Error con políticas RLS: ${rlsError.message}`,
          details: rlsError
        });
      } else {
        results.push({
          check: 'RLS Policy Check',
          status: 'success',
          message: `Acceso RLS exitoso: ${allProfiles?.length || 0} perfiles visibles`,
          details: { total_profiles: allProfiles?.length || 0 }
        });
      }

    } catch (error) {
      console.error('❌ Error en validación:', error);
      results.push({
        check: 'General Validation',
        status: 'error',
        message: 'Error inesperado durante la validación',
        details: error
      });
    }

    setValidationResults(results);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Validador de Permisos de Usuario
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email a validar:
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Ingresa el email del usuario"
            />
          </div>
          <Button 
            onClick={validateUser} 
            disabled={loading || !email}
            className="mt-6"
          >
            {loading ? 'Validando...' : 'Validar Permisos'}
          </Button>
        </div>

        {validationResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resultados de Validación:</h3>
            
            {validationResults.map((result, index) => (
              <Alert key={index} className={`border-l-4 ${
                result.status === 'success' ? 'border-l-green-500' :
                result.status === 'error' ? 'border-l-red-500' :
                'border-l-yellow-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.check}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <AlertDescription>{result.message}</AlertDescription>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            Ver detalles
                          </summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </Alert>
            ))}

            {/* Resumen */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Resumen:</h4>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  {validationResults.filter(r => r.status === 'success').length} Exitosos
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  {validationResults.filter(r => r.status === 'error').length} Errores
                </span>
                <span className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  {validationResults.filter(r => r.status === 'warning').length} Advertencias
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserPermissionValidator;
