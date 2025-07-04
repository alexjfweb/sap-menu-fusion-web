import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSuperAdminAuth } from '@/hooks/useSuperAdminAuth';
import { Eye, EyeOff, UserCheck, UserX, Key, Mail, Shield } from 'lucide-react';

// Import de componentes - verificando que existan
const UserPermissionValidator = React.lazy(() => import('./UserPermissionValidator'));
const AccountVerification = React.lazy(() => import('./AccountVerification'));
const PaymentConfiguration = React.lazy(() => import('./PaymentConfiguration'));
const SubscriptionPlansManagement = React.lazy(() => import('./subscriptions/SubscriptionPlansManagement'));
const WhatsappConfiguration = React.lazy(() => import('./whatsapp/WhatsappConfiguration'));

const SuperAdminPanel = () => {
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userStatuses, setUserStatuses] = useState<{ [email: string]: any }>({});
  const [mode, setMode] = useState<'check' | 'reset' | 'create'>('check');
  const [fullName, setFullName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('verification');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { loading, checkUserExists, resetPassword, updatePassword, createSuperAdmin } = useSuperAdminAuth();

  const superAdminEmails = ['alexjfweb@gmail.com', 'superadmin@gmail.com', 'allseosoporte@gmail.com'];

  useEffect(() => {
    console.log('🔧 SuperAdminPanel montándose...');
    setMounted(true);
    
    const checkAllUsers = async () => {
      try {
        const statuses: { [email: string]: any } = {};
        
        for (const email of superAdminEmails) {
          try {
            const status = await checkUserExists(email);
            statuses[email] = status;
          } catch (error) {
            console.error(`Error checking user ${email}:`, error);
            statuses[email] = { exists: false, error: true };
          }
        }
        
        setUserStatuses(statuses);
      } catch (error) {
        console.error('Error checking users:', error);
      }
    };

    checkAllUsers();

    return () => {
      console.log('🔧 SuperAdminPanel desmontándose...');
      setMounted(false);
    };
  }, []);

  // Funciones de manejo de usuarios
  const handleCheckUser = async () => {
    if (!selectedEmail) return;
    
    try {
      const status = await checkUserExists(selectedEmail);
      setUserStatuses(prev => ({
        ...prev,
        [selectedEmail]: status
      }));
    } catch (error) {
      console.error('Error checking user:', error);
      setUserStatuses(prev => ({
        ...prev,
        [selectedEmail]: { exists: false, error: true }
      }));
    }
  };

  const handleResetPassword = async () => {
    if (!selectedEmail) return;

    try {
      const result = await resetPassword(selectedEmail);
      
      if (result.success) {
        alert(`✅ Enlace de restablecimiento enviado a ${selectedEmail}`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('❌ Error al enviar enlace de restablecimiento');
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('❌ Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      alert('❌ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const result = await updatePassword(newPassword);
      
      if (result.success) {
        alert('✅ Contraseña actualizada exitosamente');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('❌ Error al actualizar contraseña');
    }
  };

  const handleCreateSuperAdmin = async () => {
    if (!selectedEmail || !newPassword || !fullName) {
      alert('❌ Todos los campos son requeridos');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('❌ Las contraseñas no coinciden');
      return;
    }

    try {
      const result = await createSuperAdmin(selectedEmail, newPassword, fullName);
      
      if (result.success) {
        alert(`✅ Super administrador ${selectedEmail} creado exitosamente`);
        await handleCheckUser();
        setNewPassword('');
        setConfirmPassword('');
        setFullName('');
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating super admin:', error);
      alert('❌ Error al crear super administrador');
    }
  };

  // Componente de error fallback
  const ErrorFallback = ({ componentName, error }: { componentName: string; error?: string }) => (
    <Alert className="border-red-200 bg-red-50">
      <AlertDescription className="text-red-800">
        <strong>Error cargando {componentName}:</strong><br />
        {error || 'El componente no se pudo cargar correctamente.'}
        <br />
        <small>Revisa la consola para más detalles.</small>
      </AlertDescription>
    </Alert>
  );

  // Componente de carga
  const LoadingSpinner = ({ message }: { message: string }) => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-4"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <LoadingSpinner message="Cargando Panel de Super Administrador..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Panel de Super Administrador
          </h1>
          <p className="text-muted-foreground">
            Control total sobre la plataforma SAP Menu
          </p>
        </div>

        {/* Debug info */}
        <div className="text-xs text-muted-foreground text-center">
          Tab activa: {activeTab} | Estado: {mounted ? 'Montado' : 'No montado'}
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="verification" className="text-sm">
              Verificación
            </TabsTrigger>
            <TabsTrigger value="validator" className="text-sm">
              Validador
            </TabsTrigger>
            <TabsTrigger value="management" className="text-sm">
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-sm">
              Pagos
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="text-sm">
              Suscripciones
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-sm">
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Verificación de Cuentas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <React.Suspense fallback={<LoadingSpinner message="Cargando verificación de cuentas..." />}>
                  <AccountVerification />
                </React.Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Validador de Permisos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <React.Suspense fallback={<LoadingSpinner message="Cargando validador de permisos..." />}>
                  <UserPermissionValidator />
                </React.Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Gestión de Usuarios Super Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Estado actual de usuarios */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Estado Actual de Usuarios Super Admin</h3>
                  {superAdminEmails.map(email => {
                    const status = userStatuses[email];
                    return (
                      <div key={email} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4" />
                          <span className="font-medium">{email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {status?.exists ? (
                            <>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Existe
                              </Badge>
                              <Badge variant="outline">
                                {status.role || 'No role'}
                              </Badge>
                              {status.is_active && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                  Activo
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Badge variant="destructive">
                              <UserX className="h-3 w-3 mr-1" />
                              {status?.error ? 'Error' : 'No existe'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selector de modo y email */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button 
                      variant={mode === 'check' ? 'default' : 'outline'} 
                      onClick={() => setMode('check')}
                      size="sm"
                    >
                      Verificar
                    </Button>
                    <Button 
                      variant={mode === 'reset' ? 'default' : 'outline'} 
                      onClick={() => setMode('reset')}
                      size="sm"
                    >
                      Restablecer
                    </Button>
                    <Button 
                      variant={mode === 'create' ? 'default' : 'outline'} 
                      onClick={() => setMode('create')}
                      size="sm"
                    >
                      Crear
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-select">Email de Super Administrador</Label>
                    <select
                      id="email-select"
                      className="w-full p-2 border rounded-md"
                      value={selectedEmail}
                      onChange={(e) => setSelectedEmail(e.target.value)}
                    >
                      <option value="">Selecciona un email</option>
                      {superAdminEmails.map(email => (
                        <option key={email} value={email}>{email}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Modo Verificar */}
                {mode === 'check' && (
                  <div className="space-y-4">
                    <Button onClick={handleCheckUser} disabled={!selectedEmail || loading}>
                      {loading ? 'Verificando...' : 'Verificar Usuario'}
                    </Button>
                    
                    {selectedEmail && userStatuses[selectedEmail] && (
                      <Alert>
                        <AlertDescription>
                          <strong>Estado de {selectedEmail}:</strong><br />
                          {userStatuses[selectedEmail].exists ? (
                            <>
                              ✅ Usuario existe<br />
                              📧 Email: {userStatuses[selectedEmail].email}<br />
                              👤 Rol: {userStatuses[selectedEmail].role}<br />
                              📅 Creado: {userStatuses[selectedEmail].created_at ? new Date(userStatuses[selectedEmail].created_at).toLocaleDateString() : 'N/A'}<br />
                              🔒 Activo: {userStatuses[selectedEmail].is_active ? 'Sí' : 'No'}
                            </>
                          ) : (
                            '❌ Usuario no existe - Necesita ser creado'
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Modo Restablecer */}
                {mode === 'reset' && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        Se enviará un enlace de restablecimiento de contraseña al email seleccionado.
                      </AlertDescription>
                    </Alert>
                    
                    <Button onClick={handleResetPassword} disabled={!selectedEmail || loading}>
                      <Key className="h-4 w-4 mr-2" />
                      {loading ? 'Enviando...' : 'Enviar Enlace de Restablecimiento'}
                    </Button>
                  </div>
                )}

                {/* Modo Crear */}
                {mode === 'create' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre Completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Nombre completo del super admin"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nueva Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={6}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirma la contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <Button onClick={handleCreateSuperAdmin} disabled={!selectedEmail || !newPassword || !fullName || loading}>
                      {loading ? 'Creando...' : 'Crear Super Administrador'}
                    </Button>
                  </div>
                )}

                {/* Modo Actualizar Contraseña */}
                <Card className="bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-sm">Actualizar Contraseña (Solo si estás autenticado)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="updatePassword">Nueva Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="updatePassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="updateConfirmPassword">Confirmar Contraseña</Label>
                      <Input
                        id="updateConfirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirma la contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <Button onClick={handleUpdatePassword} disabled={!newPassword || loading}>
                      <Key className="h-4 w-4 mr-2" />
                      {loading ? 'Actualizando...' : 'Actualizar Mi Contraseña'}
                    </Button>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Configuración de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    🔧 <strong>Estado:</strong> Cargando Configuración de Pagos...
                  </p>
                </div>
                <React.Suspense 
                  fallback={<LoadingSpinner message="Cargando configuración de pagos..." />}
                >
                  <PaymentConfiguration />
                </React.Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Planes de Suscripción</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    🔧 <strong>Estado:</strong> Cargando Planes de Suscripción...
                  </p>
                </div>
                <React.Suspense 
                  fallback={<LoadingSpinner message="Cargando planes de suscripción..." />}
                >
                  <SubscriptionPlansManagement />
                </React.Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de WhatsApp Business API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
                  <p className="text-sm text-purple-800">
                    🔧 <strong>Estado:</strong> Cargando WhatsApp Configuration...
                  </p>
                </div>
                <React.Suspense 
                  fallback={<LoadingSpinner message="Cargando configuración de WhatsApp..." />}
                >
                  <WhatsappConfiguration />
                </React.Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
