
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Search, User } from 'lucide-react';

const AccountVerification = () => {
  const [email, setEmail] = useState('alexjfweb@gmail.com');
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<any>(null);

  const verifyAccount = async () => {
    if (!email.trim()) return;
    
    setLoading(true);
    console.log(`🔍 Verificando cuenta: ${email}`);
    
    try {
      // Verificar en la tabla profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Error verificando perfil:', profileError);
        throw profileError;
      }

      // Intentar obtener la sesión actual para ver si hay usuario autenticado
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      const currentUserEmail = sessionData?.session?.user?.email;

      const status = {
        profileExists: !!profileData,
        profileData: profileData,
        isCurrentUser: currentUserEmail === email,
        currentUserEmail: currentUserEmail,
        timestamp: new Date().toLocaleString()
      };

      console.log('✅ Estado de la cuenta:', status);
      setAccountStatus(status);

    } catch (error) {
      console.error('❌ Error verificando cuenta:', error);
      setAccountStatus({
        error: true,
        message: 'Error al verificar la cuenta',
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Verificación de Cuenta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Email a verificar"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={verifyAccount} 
            disabled={loading || !email.trim()}
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </Button>
        </div>

        {accountStatus && (
          <div className="space-y-4">
            {accountStatus.error ? (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {accountStatus.message}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Verificación completada:</strong> {accountStatus.timestamp}
                  </AlertDescription>
                </Alert>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Cuenta en Profiles:</span>
                    {accountStatus.profileExists ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Existe
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        No existe
                      </Badge>
                    )}
                  </div>

                  {accountStatus.profileExists && accountStatus.profileData && (
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                      <h4 className="font-semibold">Datos del Perfil:</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>ID:</strong> {accountStatus.profileData.id}</div>
                        <div><strong>Email:</strong> {accountStatus.profileData.email}</div>
                        <div><strong>Nombre:</strong> {accountStatus.profileData.full_name || 'No definido'}</div>
                        <div><strong>Rol:</strong> 
                          <Badge variant="outline" className="ml-2">
                            {accountStatus.profileData.role}
                          </Badge>
                        </div>
                        <div><strong>Activo:</strong> {accountStatus.profileData.is_active ? 'Sí' : 'No'}</div>
                        <div><strong>Creado:</strong> {new Date(accountStatus.profileData.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Sesión Actual:</span>
                    {accountStatus.currentUserEmail ? (
                      <Badge variant="outline">
                        {accountStatus.currentUserEmail}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Sin sesión</Badge>
                    )}
                  </div>

                  {accountStatus.isCurrentUser && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Este es el usuario actualmente autenticado.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountVerification;
