
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PasswordResetForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processResetToken = async () => {
      console.log('🔍 Verificando token de recuperación...');
      console.log('🔗 URL completa:', window.location.href);
      console.log('🔗 Hash:', window.location.hash);
      console.log('🔗 Search:', window.location.search);
      
      // Obtener parámetros del hash (#) - formato Supabase estándar
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      // Obtener parámetros de la query string (?) - formato alternativo
      const searchParams = new URLSearchParams(window.location.search);
      
      // Intentar obtener tokens de ambas fuentes
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const type = hashParams.get('type') || searchParams.get('type');
      
      console.log('🔑 Parámetros detectados:', { 
        type, 
        hasAccessToken: !!accessToken, 
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length,
        tokenStart: accessToken?.substring(0, 20) + '...'
      });

      if (type === 'recovery' && accessToken) {
        try {
          console.log('🔄 Estableciendo sesión con token...');
          
          // Limpiar cualquier sesión existente primero
          await supabase.auth.signOut();
          
          // Establecer la nueva sesión con los tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('❌ Error al establecer sesión:', error);
            console.error('❌ Detalles del error:', {
              message: error.message,
              status: error.status,
              name: error.name
            });
            
            setIsValidToken(false);
            toast({
              variant: 'destructive',
              title: 'Token inválido',
              description: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.',
            });
          } else if (data.session) {
            console.log('✅ Sesión establecida correctamente');
            console.log('✅ Usuario autenticado:', data.session.user.email);
            setIsValidToken(true);
            
            // Limpiar la URL sin recargar la página
            window.history.replaceState({}, document.title, window.location.pathname);
            
            toast({
              title: 'Enlace válido',
              description: 'Ahora puedes establecer tu nueva contraseña.',
            });
          } else {
            console.error('❌ No se pudo establecer la sesión');
            setIsValidToken(false);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'No se pudo procesar el enlace de recuperación.',
            });
          }
        } catch (error) {
          console.error('❌ Error inesperado:', error);
          setIsValidToken(false);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Ocurrió un error al procesar el enlace de recuperación.',
          });
        }
      } else {
        console.log('❌ Token de recuperación no encontrado o incompleto');
        console.log('❌ Parámetros disponibles:', {
          hashKeys: Array.from(hashParams.keys()),
          searchKeys: Array.from(searchParams.keys()),
          type,
          hasAccessToken: !!accessToken
        });
        
        setIsValidToken(false);
        toast({
          variant: 'destructive',
          title: 'Enlace inválido',
          description: 'No se encontró un enlace de recuperación válido. Verifica que hayas copiado la URL completa del email.',
        });
      }
    };

    processResetToken();
  }, [toast]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Actualizando contraseña...');
      
      // Verificar que tenemos una sesión activa
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('No hay sesión activa para actualizar la contraseña');
      }
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('❌ Error actualizando contraseña:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'No se pudo actualizar la contraseña.',
        });
      } else {
        console.log('✅ Contraseña actualizada exitosamente');
        toast({
          title: 'Contraseña actualizada',
          description: 'Tu contraseña ha sido actualizada correctamente.',
        });
        
        // Cerrar sesión y redirigir a login
        await supabase.auth.signOut();
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loading mientras se procesa el token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ChefHat className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold">Verificando enlace</CardTitle>
            <CardDescription>
              Procesando el enlace de recuperación...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Mostrar error si el token es inválido
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">Enlace inválido</CardTitle>
            <CardDescription>
              El enlace de recuperación es inválido, ha expirado o ya fue usado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Solicitar nuevo enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar formulario de nueva contraseña si el token es válido
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Nueva contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para completar la recuperación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:underline"
            >
              Volver al inicio de sesión
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetForm;
