
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Lock, UserCheck, AlertCircle } from 'lucide-react';
import { cleanupAuthState } from '@/integrations/supabase/authUtils';

const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Limpiar estado de autenticación previo
      cleanupAuthState();
      
      // Intentar cerrar sesión global
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('⚠️ Error durante cierre de sesión previo:', err);
      }

      console.log('🔐 Iniciando sesión para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Error en inicio de sesión:', error);
        setError(error.message);
        return;
      }

      if (data.user) {
        console.log('✅ Inicio de sesión exitoso:', data.user.email);
        toast({
          title: "Bienvenido",
          description: "Has iniciado sesión correctamente",
        });
        
        // Forzar recarga de página para estado limpio
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      setError(error.message || 'Error inesperado durante el inicio de sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Limpiar estado de autenticación previo
      cleanupAuthState();
      
      // Intentar cerrar sesión global
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('⚠️ Error durante cierre de sesión previo:', err);
      }

      console.log('📝 Registrando nuevo usuario:', email);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        console.error('❌ Error en registro:', error);
        setError(error.message);
        return;
      }

      if (data.user) {
        console.log('✅ Registro exitoso:', data.user.email);
        
        if (data.user.email_confirmed_at) {
          // Usuario confirmado inmediatamente
          toast({
            title: "¡Bienvenido!",
            description: "Tu cuenta de administrador ha sido creada exitosamente",
          });
          
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        } else {
          // Usuario necesita confirmar email
          toast({
            title: "Registro exitoso",
            description: "Por favor, revisa tu email para confirmar tu cuenta de administrador",
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      setError(error.message || 'Error inesperado durante el registro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Bienvenido a Menu Fusion
          </CardTitle>
          <CardDescription className="text-center">
            Gestiona tu restaurante de forma inteligente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              {/* NUEVA VALIDACIÓN VISUAL - Mensaje informativo sobre el rol */}
              <Alert className="bg-green-50 border-green-200">
                <UserCheck className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Tu cuenta se registrará con rol de administrador</strong>
                  <br />
                  <span className="text-sm text-green-600">
                    Tendrás acceso completo para gestionar tu restaurante
                  </span>
                </AlertDescription>
              </Alert>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Tu nombre completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      minLength={6}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Mínimo 6 caracteres
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Crear Cuenta de Administrador
                    </>
                  )}
                </Button>
              </form>

              {/* Badge adicional para reforzar el mensaje */}
              <div className="flex justify-center">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Registro como Administrador
                </Badge>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
