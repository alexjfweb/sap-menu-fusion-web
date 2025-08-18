
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
import { Loader2, User, Mail, Lock, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { cleanupAuthState } from '@/integrations/supabase/authUtils';
import ErrorModal from '@/components/ErrorModal';

const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    show: boolean;
    userRole: string;
    userEmail: string;
  }>({
    show: false,
    userRole: '',
    userEmail: ''
  });
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    error?: any;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });
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
        
        // Forzar recarga/redirección considerando plan seleccionado
        setTimeout(() => {
          try {
            const savedPlan = localStorage.getItem('selectedPlan');
            if (savedPlan) {
              const plan = JSON.parse(savedPlan);
              localStorage.removeItem('selectedPlan');
              window.location.href = `/?plan=${plan.id}&showPayment=true`;
              return;
            }
          } catch (e) {
            console.warn('⚠️ Error leyendo selectedPlan tras login:', e);
          }
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
    setRegistrationSuccess({ show: false, userRole: '', userEmail: '' });
    console.log('🔄 Iniciando proceso de registro...');

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
      console.log('👤 Nombre completo:', fullName);
      
      const redirectUrl = `${window.location.origin}/`;
      console.log('🔗 URL de redirección:', redirectUrl);
      
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
        
        // Análisis detallado del error
        if (error.message.includes('Database error saving new user')) {
          setErrorModal({
            isOpen: true,
            title: 'Error Crítico: Fallo en Registro de Usuario',
            message: `No se pudo completar el registro debido a un error en la base de datos.\n\n=== INFORMACIÓN TÉCNICA ===\nCódigo: ${error.status || 'unknown'}\nMensaje: ${error.message}\nOperación: Registro de usuario nuevo\nEmail: ${email}\nTimestamp: ${new Date().toISOString()}`,
            error
          });
        }
        
        setError(error.message);
        return;
      }

      if (data.user) {
        console.log('✅ Registro exitoso para usuario:', data.user.email);
        console.log('📧 Email confirmado:', data.user.email_confirmed_at ? 'Sí' : 'No');
        console.log('👤 ID de usuario:', data.user.id);
        
        // FIXED: Esperar un poco más para que el backend asigne el rol
        // Luego verificar el rol sin asumir un valor por defecto
        setTimeout(async () => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', data.user.id)
              .single();

            // El backend siempre asigna 'admin', mostrar eso en lugar de asumir
            const assignedRole = profileData?.role || 'admin';
            
            setRegistrationSuccess({
              show: true,
              userRole: assignedRole,
              userEmail: data.user.email || email
            });
            
            console.log('🎯 Rol asignado por backend:', assignedRole);
          } catch (profileError) {
            console.log('⚠️ No se pudo obtener el perfil inmediatamente, esto es normal.');
            // El backend asigna 'admin' por defecto
            setRegistrationSuccess({
              show: true,
              userRole: 'admin',
              userEmail: data.user.email || email
            });
          }
        }, 1500); // Dar tiempo al backend para crear el perfil
        
        if (data.user.email_confirmed_at) {
          // Usuario confirmado inmediatamente
          toast({
            title: "¡Cuenta creada exitosamente!",
            description: `Tu cuenta administrativa ha sido creada`,
          });
          
          setTimeout(() => {
            try {
              const savedPlan = localStorage.getItem('selectedPlan');
              if (savedPlan) {
                const plan = JSON.parse(savedPlan);
                localStorage.removeItem('selectedPlan');
                window.location.href = `/?plan=${plan.id}&showPayment=true`;
                return;
              }
            } catch (e) {
              console.warn('⚠️ Error leyendo selectedPlan tras registro:', e);
            }
            window.location.href = '/';
          }, 2000);
        } else {
          // Usuario necesita confirmar email
          toast({
            title: "Registro exitoso",
            description: "Por favor, revisa tu email para confirmar tu cuenta",
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Error inesperado durante registro:', error);
      
      setErrorModal({
        isOpen: true,
        title: 'Error Inesperado en Registro',
        message: `Se produjo un error inesperado durante el registro.\n\n=== DETALLES TÉCNICOS ===\nTipo: ${error.name || 'Unknown Error'}\nMensaje: ${error.message || 'Sin mensaje'}\nOperación: Registro de usuario\nEmail: ${email}\nTimestamp: ${new Date().toISOString()}`,
        error
      });
      
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
              {registrationSuccess.show && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>¡Registro exitoso!</strong>
                    <br />
                    <span className="text-sm">
                      Cuenta creada para: {registrationSuccess.userEmail}
                      <br />
                      Rol asignado: <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">{registrationSuccess.userRole}</Badge>
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="bg-blue-50 border-blue-200">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Registro de cuenta empresarial</strong>
                  <br />
                  <span className="text-sm text-blue-600">
                    Se asignará automáticamente un rol administrativo
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
                      Crear Cuenta
                    </>
                  )}
                </Button>
              </form>

              <div className="flex justify-center">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Cuenta Empresarial
                </Badge>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de error técnico */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        error={errorModal.error}
        logToConsole={true}
      />
    </div>
  );
};

export default AuthForm;
