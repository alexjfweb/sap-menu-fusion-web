
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
import UserPermissionValidator from './UserPermissionValidator';
import AccountVerification from './AccountVerification';
import PaymentConfiguration from './PaymentConfiguration';
import SubscriptionPlansManagement from './subscriptions/SubscriptionPlansManagement';
import WhatsappConfiguration from './whatsapp/WhatsappConfiguration';

const SuperAdminPanel = () => {
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userStatuses, setUserStatuses] = useState<{ [email: string]: any }>({});
  const [mode, setMode] = useState<'check' | 'reset' | 'create'>('check');
  const [fullName, setFullName] = useState('');

  const { loading, checkUserExists, resetPassword, updatePassword, createSuperAdmin } = useSuperAdminAuth();

  const superAdminEmails = ['alexjfweb@gmail.com', 'superadmin@gmail.com', 'allseosoporte@gmail.com'];

  useEffect(() => {
    // Verificar estado de usuarios al cargar
    const checkAllUsers = async () => {
      const statuses: { [email: string]: any } = {};
      
      for (const email of superAdminEmails) {
        const status = await checkUserExists(email);
        statuses[email] = status;
      }
      
      setUserStatuses(statuses);
    };

    checkAllUsers();
  }, []);

  const handleCheckUser = async () => {
    if (!selectedEmail) return;
    
    const status = await checkUserExists(selectedEmail);
    setUserStatuses(prev => ({
      ...prev,
      [selectedEmail]: status
    }));
  };

  const handleResetPassword = async () => {
    if (!selectedEmail) return;

    const result = await resetPassword(selectedEmail);
    
    if (result.success) {
      alert(`✅ Enlace de restablecimiento enviado a ${selectedEmail}`);
    } else {
      alert(`❌ Error: ${result.error}`);
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

    const result = await updatePassword(newPassword);
    
    if (result.success) {
      alert('✅ Contraseña actualizada exitosamente');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      alert(`❌ Error: ${result.error}`);
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

    const result = await createSuperAdmin(selectedEmail, newPassword, fullName);
    
    if (result.success) {
      alert(`✅ Super administrador ${selectedEmail} creado exitosamente`);
      // Actualizar estado
      await handleCheckUser();
      setNewPassword('');
      setConfirmPassword('');
      setFullName('');
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Tabs defaultValue="verification" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="verification">Verificación</TabsTrigger>
          <TabsTrigger value="validator">Validador</TabsTrigger>
          <TabsTrigger value="management">Usuarios</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-6">
          <AccountVerification />
        </TabsContent>

        <TabsContent value="validator" className="space-y-6">
          <UserPermissionValidator />
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Panel de Super Administrador
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
                            No existe
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
                            📅 Creado: {new Date(userStatuses[selectedEmail].created_at).toLocaleDateString()}<br />
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

              {/* Modo Actualizar Contraseña (solo para usuarios autenticados) */}
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
          <PaymentConfiguration />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionPlansManagement />
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <WhatsappConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminPanel;
