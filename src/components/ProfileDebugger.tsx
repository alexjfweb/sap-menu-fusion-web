import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, User, AlertCircle } from 'lucide-react';

const ProfileDebugger = () => {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkProfileInDatabase = async () => {
    if (!user) return;
    
    setIsChecking(true);
    try {
      console.log('🔍 [DEBUG] Verificando perfil en base de datos para:', user.email);
      
      // Verificar en profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Verificar en auth.users
      const { data: authData, error: authError } = await supabase.auth.getUser();

      setDebugInfo({
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          user_metadata: user.user_metadata
        },
        profile: profileData,
        profileError: profileError,
        authData: authData,
        authError: authError,
        hookState: {
          loading,
          isAuthenticated,
          hasProfile: !!profile,
          profileRole: profile?.role
        }
      });

      console.log('📊 [DEBUG] Información de debug:', {
        profileData,
        profileError,
        authData,
        authError
      });

    } catch (error) {
      console.error('❌ [DEBUG] Error verificando perfil:', error);
      setDebugInfo({
        timestamp: new Date().toISOString(),
        error: error
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkProfileInDatabase();
    }
  }, [user, profile]);

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Debug de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No hay usuario autenticado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-500" />
          Debug de Perfil - {user.email}
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            onClick={checkProfileInDatabase} 
            disabled={isChecking}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado del Hook */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Estado Hook</p>
            <p className="text-xs text-blue-600">
              Loading: {loading ? 'Sí' : 'No'}
            </p>
            <p className="text-xs text-blue-600">
              Autenticado: {isAuthenticated ? 'Sí' : 'No'}
            </p>
            <p className="text-xs text-blue-600">
              Tiene Perfil: {profile ? 'Sí' : 'No'}
            </p>
            <p className="text-xs text-blue-600">
              Rol: {profile?.role || 'N/A'}
            </p>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-700">Usuario Auth</p>
            <p className="text-xs text-green-600">
              ID: {user.id?.substring(0, 8)}...
            </p>
            <p className="text-xs text-green-600">
              Email: {user.email}
            </p>
            <p className="text-xs text-green-600">
              Confirmado: {user.email_confirmed_at ? 'Sí' : 'No'}
            </p>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-700">Perfil Hook</p>
            {profile ? (
              <>
                <p className="text-xs text-purple-600">
                  ID: {profile.id?.substring(0, 8)}...
                </p>
                <p className="text-xs text-purple-600">
                  Email: {profile.email}
                </p>
                <p className="text-xs text-purple-600">
                  Rol: <span className="inline-flex"><Badge variant="outline" className="text-xs">{profile.role}</Badge></span>
                </p>
                <p className="text-xs text-purple-600">
                  Activo: {profile.is_active ? 'Sí' : 'No'}
                </p>
              </>
            ) : (
              <p className="text-xs text-purple-600">No disponible</p>
            )}
          </div>

          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-700">Base de Datos</p>
            {debugInfo?.profile ? (
              <>
                <p className="text-xs text-orange-600">
                  ID: {debugInfo.profile.id?.substring(0, 8)}...
                </p>
                <p className="text-xs text-orange-600">
                  Email: {debugInfo.profile.email}
                </p>
                <p className="text-xs text-orange-600">
                  Rol: <Badge variant="outline" className="text-xs">{debugInfo.profile.role}</Badge>
                </p>
                <p className="text-xs text-orange-600">
                  Creado: {new Date(debugInfo.profile.created_at).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <p className="text-xs text-orange-600">
                {debugInfo?.profileError ? 'Error' : 'No verificado'}
              </p>
            )}
          </div>
        </div>

        {/* Información detallada */}
        {debugInfo && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">Información Detallada:</h4>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Errores */}
        {debugInfo?.profileError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700">Error en Perfil:</p>
            <p className="text-xs text-red-600">{debugInfo.profileError.message}</p>
            <p className="text-xs text-red-600">Código: {debugInfo.profileError.code}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileDebugger; 