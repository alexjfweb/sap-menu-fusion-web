
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
  X
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

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!currentUserProfile) return;

    setLoading(true);

    try {
      if (isCreating) {
        // Crear nuevo usuario
        console.log('Creating new user with data:', formData);
        
        // Crear usuario usando el admin session
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true, // Auto-confirmar el email para evitar redirección
          user_metadata: {
            full_name: formData.full_name
          }
        });

        if (authError) {
          console.error('Auth error:', authError);
          throw authError;
        }

        if (!authData.user) {
          throw new Error('No se pudo crear el usuario');
        }

        console.log('Auth user created:', authData.user.id);

        // Crear o actualizar el perfil con la relación de creador
        const profileData = {
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          phone_mobile: formData.phone_mobile || null,
          phone_landline: formData.phone_landline || null,
          address: formData.address || null,
          role: formData.role,
          created_by: currentUserProfile.id, // Asignar el creador
          is_active: true
        };

        console.log('Creating profile with data:', profileData);

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData);

        if (profileError) {
          console.error('Profile error:', profileError);
          throw profileError;
        }

        toast({
          title: "✅ Usuario creado exitosamente",
          description: `El empleado ${formData.full_name} ha sido agregado a tu equipo`,
        });

        console.log('User created successfully');
        
        // Primero actualizar la lista de usuarios
        onUserCreated();
        
        // Luego cerrar el formulario y regresar a la gestión de usuarios
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
