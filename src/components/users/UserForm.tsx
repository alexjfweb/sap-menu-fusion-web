import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Save,
  X,
  Lock,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type Profile = Tables<'profiles'>;

interface UserFormProps {
  user?: Profile | null;
  onClose: () => void;
  onBack: () => void;
  onUserCreated: () => void;
}

const UserForm = ({ user, onClose, onBack, onUserCreated }: UserFormProps) => {
  const { profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_mobile: '',
    phone_landline: '',
    address: '',
    role: 'empleado' as 'empleado' | 'admin' | 'superadmin',
    password: ''
  });

  // Password change form state
  const [changePassword, setChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

  const isEditing = !!user;
  const isCreating = !isEditing;

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        full_name: user.full_name || '',
        phone_mobile: user.phone_mobile || '',
        phone_landline: user.phone_landline || '',
        address: user.address || '',
        role: user.role || 'empleado',
        password: ''
      });
    }
  }, [user]);

  // Password strength validation
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push('Al menos 8 caracteres');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Una mayúscula');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Una minúscula');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Un número');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Un carácter especial');

    let strengthText = '';
    if (score === 0) strengthText = 'Muy débil';
    else if (score <= 2) strengthText = 'Débil';
    else if (score <= 3) strengthText = 'Regular';
    else if (score <= 4) strengthText = 'Fuerte';
    else strengthText = 'Muy fuerte';

    return {
      score,
      feedback: feedback.length > 0 ? `Falta: ${feedback.join(', ')}` : strengthText
    };
  };

  // Generate secure password
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each required type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the password
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setPasswordData({
      newPassword: shuffled,
      confirmPassword: shuffled
    });
    
    setPasswordStrength(checkPasswordStrength(shuffled));
  };

  const handlePasswordChange = (field: 'newPassword' | 'confirmPassword', value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const canAssignRole = (role: string) => {
    if (!currentUserProfile) return false;
    
    // Super Admin puede asignar cualquier rol
    if (currentUserProfile.role === 'superadmin') {
      return true;
    }
    
    // Admin solo puede asignar rol de empleado
    if (currentUserProfile.role === 'admin') {
      return role === 'empleado';
    }
    
    // Empleado no puede asignar roles
    return false;
  };

  const getAvailableRoles = () => {
    if (!currentUserProfile) return [];
    
    switch (currentUserProfile.role) {
      case 'superadmin':
        return [
          { value: 'empleado', label: 'Empleado' },
          { value: 'admin', label: 'Administrador' },
          { value: 'superadmin', label: 'Super Administrador' }
        ];
      case 'admin':
        return [
          { value: 'empleado', label: 'Empleado' }
        ];
      default:
        return [];
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast({
        title: "Error",
        description: "El email es requerido",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.full_name.trim()) {
      toast({
        title: "Error",
        description: "El nombre completo es requerido",
        variant: "destructive"
      });
      return false;
    }

    if (isCreating && !formData.password.trim()) {
      toast({
        title: "Error",
        description: "La contraseña es requerida para nuevos usuarios",
        variant: "destructive"
      });
      return false;
    }

    if (isCreating && formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return false;
    }

    // Validaciones para cambio de contraseña en edición
    if (isEditing && changePassword) {
      if (!passwordData.newPassword.trim()) {
        toast({
          title: "Error",
          description: "La nueva contraseña es requerida",
          variant: "destructive"
        });
        return false;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: "Error",
          description: "Las contraseñas no coinciden",
          variant: "destructive"
        });
        return false;
      }

      if (passwordStrength.score < 3) {
        toast({
          title: "Error",
          description: "La contraseña debe ser más segura",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!currentUserProfile) return;

    setLoading(true);

    try {
      if (isCreating) {
        console.log('Creating new user - storing current session');
        
        // Guardar la sesión actual del administrador
        const { data: currentSession } = await supabase.auth.getSession();
        console.log('Current admin session saved');
        
        // Crear usuario usando el método estándar de signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name
            }
          }
        });

        if (authError) {
          console.error('Auth error:', authError);
          if (authError.message.includes('User already registered')) {
            throw new Error('Ya existe un usuario con este email');
          }
          throw authError;
        }

        if (!authData.user) {
          throw new Error('No se pudo crear el usuario');
        }

        console.log('User created with ID:', authData.user.id);

        // Actualizar el perfil con los datos adicionales y la relación de creador
        const profileData = {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          phone_mobile: formData.phone_mobile || null,
          phone_landline: formData.phone_landline || null,
          address: formData.address || null,
          role: formData.role,
          created_by: currentUserProfile.id, // Asignar el creador
          is_active: true,
          password_hash: null // Este campo no se usa para nuevos usuarios
        };

        console.log('Updating profile with data:', profileData);

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData);

        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }

        // IMPORTANTE: Restaurar la sesión del administrador inmediatamente
        if (currentSession?.session) {
          console.log('Restoring admin session...');
          await supabase.auth.setSession(currentSession.session);
          console.log('Admin session restored successfully');
        }

        toast({
          title: "✅ Usuario creado exitosamente",
          description: `El empleado ${formData.full_name} ha sido agregado a tu equipo`,
        });

        console.log('User created successfully - admin session maintained');
        
        // Actualizar la lista de usuarios
        onUserCreated();
        
        // Cerrar el formulario
        setTimeout(() => {
          onClose();
        }, 500);

      } else {
        // Editar usuario existente
        console.log('Updating existing user:', user?.id);
        
        const updateData = {
          full_name: formData.full_name,
          phone_mobile: formData.phone_mobile || null,
          phone_landline: formData.phone_landline || null,
          address: formData.address || null,
          role: formData.role,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user!.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        // Cambiar contraseña si está marcado
        if (changePassword && passwordData.newPassword) {
          console.log('Updating user password...');
          
          // Necesitamos usar Admin API para cambiar contraseña de otro usuario
          // Por ahora mostramos un mensaje de que se debe implementar
          toast({
            title: "Información",
            description: "La funcionalidad de cambio de contraseña se implementará próximamente",
            variant: "default"
          });
        }

        toast({
          title: "Usuario actualizado",
          description: `Usuario ${formData.full_name} actualizado exitosamente`,
        });

        console.log('User updated successfully');
        onUserCreated();
        onClose();
      }

    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar el usuario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'text-red-600';
    if (passwordStrength.score <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getPasswordStrengthBarColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Usuarios
            </Button>
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {isEditing ? `Editar: ${user?.full_name || user?.email}` : 'Crear Nuevo Usuario'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Modifica la información del usuario'
                : currentUserProfile?.role === 'admin' 
                  ? 'Los usuarios que crees serán asignados a tu cuenta'
                  : 'Completa la información del nuevo usuario'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      disabled={isEditing} // No permitir cambiar email en edición
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {isCreating && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              )}

              {/* Password Change Section for Editing */}
              {isEditing && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="changePassword"
                      checked={changePassword}
                      onChange={(e) => setChangePassword(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="changePassword" className="font-medium">
                      Cambiar contraseña
                    </Label>
                  </div>

                  {changePassword && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            id="newPassword"
                            type={showPasswords.newPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                            className="pl-10 pr-10"
                            placeholder="Mínimo 8 caracteres"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          >
                            {showPasswords.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        {/* Password Strength Indicator */}
                        {passwordData.newPassword && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={getPasswordStrengthColor()}>
                                {passwordStrength.feedback}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${getPasswordStrengthBarColor()}`}
                                style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                            className="pl-10 pr-10"
                            placeholder="Repite la contraseña"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                          >
                            {showPasswords.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        {/* Password Match Indicator */}
                        {passwordData.confirmPassword && (
                          <div className="text-sm">
                            {passwordData.newPassword === passwordData.confirmPassword ? (
                              <span className="text-green-600">✓ Las contraseñas coinciden</span>
                            ) : (
                              <span className="text-red-600">✗ Las contraseñas no coinciden</span>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateSecurePassword}
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Generar contraseña segura
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_mobile">Teléfono Móvil</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="phone_mobile"
                      value={formData.phone_mobile}
                      onChange={(e) => handleInputChange('phone_mobile', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_landline">Teléfono Fijo</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="phone_landline"
                      value={formData.phone_landline}
                      onChange={(e) => handleInputChange('phone_landline', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol *</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    {getAvailableRoles().map((roleOption) => (
                      <option 
                        key={roleOption.value} 
                        value={roleOption.value}
                        disabled={!canAssignRole(roleOption.value)}
                      >
                        {roleOption.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentUserProfile?.role === 'admin' && isCreating && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Información:</strong> Este usuario será asignado a tu cuenta como administrador. 
                    Solo tú podrás verlo y gestionarlo en el sistema.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6">
                <Button type="button" variant="outline" onClick={onClose}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading 
                    ? (isEditing ? 'Actualizando...' : 'Creando...') 
                    : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserForm;
