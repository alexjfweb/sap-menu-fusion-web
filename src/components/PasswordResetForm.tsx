
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
  const [tokenProcessed, setTokenProcessed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const processResetToken = async () => {
      console.log('🔍 Verificando token de recuperación...');
      
      // Check URL hash for recovery tokens
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      console.log('🔑 Parámetros del hash:', { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });

      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          console.log('🔄 Procesando token de recuperación...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('❌ Error al procesar token:', error);
            setIsValidToken(false);
            toast({
              variant: 'destructive',
              title: 'Token inválido',
              description: 'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.',
            });
          } else if (data.session) {
            console.log('✅ Token válido, sesión establecida');
            setIsValidToken(true);
            toast({
              title: 'Enlace válido',
              description: 'Ahora puedes establecer tu nueva contraseña.',
            });
          }
        } catch (error) {
          console.error('❌ Error inesperado procesando token:', error);
          setIsValidToken(false);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Ocurrió un error al procesar el enlace de recuperación.',
          });
        }
      } else {
        console.log('❌ Token de recuperación no encontrado o incompleto');
        setIsValidToken(false);
        toast({
          variant: 'destructive',
          title: 'Enlace inválido',
          description: 'No se encontró un enlace de recuperación válido. Verifica que hayas copiado la URL completa del email.',
        });
      }
      
      setTokenProcessed(true);
    };

    if (!tokenProcessed) {
      processResetToken();
    }
  }, [toast, tokenProcessed]);

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
      
      const { error } = await supabase.auth.updateUser({
        password,
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
        
        // Redirect to login after successful password reset
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      }
    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while processing token
  if (!tokenProcessed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ChefHat className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-bold">Procesando enlace</CardTitle>
            <CardDescription>
              Verificando el enlace de recuperación...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show error if token is invalid
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
              El enlace de recuperación es inválido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Volver al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show password reset form if token is valid
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
