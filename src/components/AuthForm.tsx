import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import ConnectionStatusIndicator from '@/components/ConnectionStatusIndicator';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const { toast } = useToast();
  const { setConnecting, setError, resetError, isOnline } = useConnectionStatus();

  // Check for password reset hash in URL - redirect to proper reset page
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') || searchParams.get('type');

    if (type === 'recovery') {
      console.log('🔄 Token de recuperación detectado, redirigiendo a /auth/reset-password');
      // Redirect to the dedicated reset password page with the hash and search params
      const fullFragment = window.location.hash || ('?' + window.location.search);
      window.location.href = `/auth/reset-password${fullFragment}`;
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setConnecting(true);
    resetError();

    try {
      console.log('🔐 Intentando iniciar sesión con:', email);
      
      // Check connection status
      if (!isOnline) {
        throw new Error('Sin conexión a internet. Verifica tu conexión y vuelve a intentar.');
      }
      
      // Usar directamente signInWithPassword sin funciones wrapper
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        // Log del error real para debugging
        console.error('❌ Error real de Supabase:', error);
        console.error('❌ Código de error:', error.code);
        console.error('❌ Mensaje completo:', error.message);
        throw error;
      }

      if (data?.user) {
        console.log('✅ Inicio de sesión exitoso:', data.user.email);
        console.log('🔍 Datos del usuario:', {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          last_sign_in_at: data.user.last_sign_in_at
        });
        
        // Mensaje de bienvenida basado en el usuario real
        toast({
          title: 'Bienvenido',
          description: `Has iniciado sesión correctamente como ${data.user.email}`,
        });
        
        // Redirección segura con timeout
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Error de inicio de sesión:', error);
      
      let errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
      
      // Usar el mensaje real de Supabase sin modificaciones personalizadas
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet y vuelve a intentar.';
        setError('Error de red - CORS o conectividad');
      } else if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
        errorMessage = 'Error interno de autenticación. Recarga la página e intenta nuevamente.';
        setError('Error interno de Supabase');
      } else if (error.message?.includes('Cross-Origin-Opener-Policy')) {
        errorMessage = 'Error de política del navegador. Recarga la página e intenta nuevamente.';
        setError('Error de CORS policy');
      } else if (error.message === 'Invalid login credentials') {
        // Este es el mensaje real de Supabase - mostrar tal como es
        errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña, o regístrate si no tienes cuenta.';
      } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorMessage = 'Tiempo de espera agotado. El servidor puede estar sobrecargado.';
        setError('Timeout de conexión');
      } else {
        // Mostrar el mensaje real de Supabase
        errorMessage = error.message || 'Error desconocido';
        setError(error.message || 'Error desconocido');
      }
      
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      setConnecting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setConnecting(true);
    resetError();

    try {
      console.log('📝 Intentando registrar usuario:', email);
      
      // Check connection status
      if (!isOnline) {
        throw new Error('Sin conexión a internet. Verifica tu conexión y vuelve a intentar.');
      }
      
      // Usar directamente signUp sin funciones wrapper
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        // Log del error real para debugging
        console.error('❌ Error real de Supabase en registro:', error);
        console.error('❌ Código de error:', error.code);
        console.error('❌ Mensaje completo:', error.message);
        throw error;
      }

      if (data?.user) {
        console.log('✅ Registro exitoso:', data.user.email);
        
        toast({
          title: 'Registro exitoso',
          description: 'Tu cuenta ha sido creada exitosamente.',
        });
        
        // If user is immediately confirmed, redirect to dashboard
        if (data.session) {
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('❌ Error inesperado al registrarse:', error);
      
      let errorMessage = 'Ocurrió un error inesperado. Inténtalo de nuevo.';
      
      // Usar mensajes reales de Supabase
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet y vuelve a intentar.';
        setError('Error de red durante registro');
      } else if (error.message?.includes('INTERNAL ASSERTION FAILED')) {
        errorMessage = 'Error interno de autenticación. Recarga la página e intenta nuevamente.';
        setError('Error interno durante registro');
      } else if (error.message === 'User already registered') {
        errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
      } else {
        // Mostrar el mensaje real de Supabase
        errorMessage = error.message || 'Error de registro';
        setError(error.message || 'Error de registro');
      }
      
      toast({
        variant: 'destructive',
        title: 'Error de registro',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      setConnecting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor ingresa tu email para recuperar la contraseña.',
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Iniciando proceso de recuperación de contraseña');
      console.log('📧 Email:', email.trim());
      
      // Obtener la URL base actual
      const currentOrigin = window.location.origin;
      const redirectUrl = `${currentOrigin}/auth/reset-password`;
      
      console.log('🔗 URL de redirección configurada:', redirectUrl);
      console.log('🌐 Origen actual:', currentOrigin);
      
      // Verificar conectividad antes del envío
      if (!isOnline) {
        throw new Error('Sin conexión a internet. Verifica tu conexión y vuelve a intentar.');
      }

      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      console.log('📬 Respuesta de Supabase:', { data, error });

      if (error) {
        console.error('❌ Error enviando enlace de recuperación:', error);
        console.error('❌ Código de error:', error.status);
        console.error('❌ Mensaje de error:', error.message);
        console.error('❌ Detalles completos:', JSON.stringify(error, null, 2));
        
        // Manejo específico de errores comunes
        let errorMessage = 'No se pudo enviar el enlace de recuperación.';
        
        if (error.message?.includes('Invalid email')) {
          errorMessage = 'El formato del email no es válido.';
        } else if (error.message?.includes('rate limit')) {
          errorMessage = 'Has solicitado demasiados enlaces. Espera unos minutos antes de intentar de nuevo.';
        } else if (error.message?.includes('SMTP')) {
          errorMessage = 'Error en la configuración del servidor de correo. Contacta al administrador.';
        } else if (error.message?.includes('User not found')) {
          // No revelamos si el usuario existe o no por seguridad
          console.log('⚠️ Usuario no encontrado, pero mostramos mensaje genérico por seguridad');
        }
        
        toast({
          variant: 'destructive',
          title: 'Error al enviar correo',
          description: error.message || errorMessage,
        });
      } else {
        console.log('✅ Solicitud de recuperación procesada exitosamente');
        console.log('✅ Configuración utilizada:', {
          email: email.trim(),
          redirectUrl: redirectUrl,
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: '📧 Correo enviado',
          description: `Si existe una cuenta asociada a ${email}, recibirás un email con instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada y carpeta de spam.`,
        });
        
        console.log('💡 Consejos para el usuario:');
        console.log('1. Revisar bandeja de entrada y carpeta de spam');
        console.log('2. Verificar que el email sea correcto');
        console.log('3. Esperar hasta 10 minutos para recibir el correo');
        console.log('4. Verificar configuración SMTP en Supabase Dashboard');
        
        setResetPasswordMode(false);
      }
    } catch (error: any) {
      console.error('❌ Error inesperado en recuperación de contraseña:', error);
      console.error('❌ Stack trace:', error.stack);
      
      toast({
        variant: 'destructive',
        title: 'Error inesperado',
        description: 'Ocurrió un error al procesar tu solicitud. Inténtalo de nuevo más tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ConnectionStatusIndicator />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ChefHat className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">SAP Menu</CardTitle>
            <CardDescription>
              {resetPasswordMode 
                ? 'Ingresa tu email para restablecer la contraseña'
                : 'Accede a tu cuenta para gestionar tu restaurante'
              }
            </CardDescription>
            {!isOnline && (
              <div className="flex items-center justify-center mt-2 text-red-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Sin conexión a internet</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {resetPasswordMode ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setResetPasswordMode(false)}
                >
                  Volver al inicio de sesión
                </Button>
                
                {/* Información adicional para ayudar al usuario */}
                <div className="text-xs text-muted-foreground space-y-1 mt-4">
                  <p>• Revisa tu bandeja de entrada y carpeta de spam</p>
                  <p>• El correo puede tardar hasta 10 minutos en llegar</p>
                  <p>• Verifica que el email sea correcto</p>
                </div>
              </form>
            ) : (
              <Tabs defaultValue="signin" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="signup">Registrarse</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
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
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setResetPasswordMode(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        ¿Has olvidado tu contraseña?
                      </button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Tu nombre completo"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          required
                          autoComplete="name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="tu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
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
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Registrando...' : 'Registrarse'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AuthForm;
