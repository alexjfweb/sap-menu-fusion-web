
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Profile = Tables<'profiles'>;

interface UserFormProps {
  user?: Profile | null;
  onClose: () => void;
  onBack: () => void;
  onUserCreated?: () => void;
}

interface UserFormData {
  email: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'empleado';
  is_active: boolean;
  password: string;
  phone_landline: string;
  phone_mobile: string;
  address: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  phone_landline?: string;
  phone_mobile?: string;
}

const UserForm = ({ user, onClose, onBack, onUserCreated }: UserFormProps) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    role: 'empleado',
    is_active: true,
    password: '',
    phone_landline: '',
    phone_mobile: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name || '',
        role: user.role as 'superadmin' | 'admin' | 'empleado',
        is_active: user.is_active || true,
        password: '', // Never pre-fill password
        phone_landline: user.phone_landline || '',
        phone_mobile: user.phone_mobile || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Por favor ingresa un email válido';
    }

    // Password validation (only for new users)
    if (!isEditing && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Phone landline validation (optional but must be valid if provided)
    if (formData.phone_landline && !/^\d{7,10}$/.test(formData.phone_landline.replace(/\s/g, ''))) {
      errors.phone_landline = 'El teléfono fijo debe tener entre 7 y 10 dígitos';
    }

    // Phone mobile validation (optional but must be valid if provided)
    if (formData.phone_mobile && !/^\d{10}$/.test(formData.phone_mobile.replace(/\s/g, ''))) {
      errors.phone_mobile = 'El teléfono móvil debe tener 10 dígitos';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Update existing user
        const updateData: any = {
          full_name: formData.full_name || null,
          role: formData.role,
          is_active: formData.is_active,
          phone_landline: formData.phone_landline || null,
          phone_mobile: formData.phone_mobile || null,
          address: formData.address || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: "Usuario actualizado",
          description: "La información del usuario se ha actualizado exitosamente.",
        });
      } else {
        // Create new user through Supabase Auth
        console.log('Creating new user with email:', formData.email);
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
            }
          }
        });

        if (authError) {
          console.error('Auth error:', authError);
          throw authError;
        }

        console.log('Auth data received:', authData);

        if (authData.user) {
          // Wait a moment for the trigger to create the profile
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Update the profile with additional data
          console.log('Updating profile for user:', authData.user.id);
          
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: formData.full_name || null,
              role: formData.role,
              is_active: formData.is_active,
              phone_landline: formData.phone_landline || null,
              phone_mobile: formData.phone_mobile || null,
              address: formData.address || null,
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('Profile error:', profileError);
            throw profileError;
          }

          console.log('User created successfully');

          toast({
            title: "Usuario creado exitosamente",
            description: `El empleado ${formData.full_name || formData.email} ha sido registrado correctamente.`,
          });

          // Call the callback to refresh the user list
          if (onUserCreated) {
            onUserCreated();
          }
        }
      }

      // Close form and return to user management
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar usuario';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
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
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </CardTitle>
              <CardDescription>
                {isEditing 
                  ? 'Modifica la información y rol del usuario'
                  : 'Completa la información para crear un nuevo usuario'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isEditing}
                    required
                    className={validationErrors.email ? 'border-red-500' : ''}
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm">{validationErrors.email}</p>
                  )}
                </div>

                {/* Password - Only for new users */}
                {!isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      placeholder="Mínimo 6 caracteres"
                      className={validationErrors.password ? 'border-red-500' : ''}
                    />
                    {validationErrors.password && (
                      <p className="text-red-500 text-sm">{validationErrors.password}</p>
                    )}
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Ingresa el nombre completo"
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Rol *</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="empleado">Empleado</option>
                    <option value="admin">Administrador</option>
                    <option value="superadmin">Super Administrador</option>
                  </select>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información de Contacto</h3>
                  
                  {/* Phone Landline */}
                  <div className="space-y-2">
                    <Label htmlFor="phone_landline">Teléfono Fijo</Label>
                    <Input
                      id="phone_landline"
                      name="phone_landline"
                      type="tel"
                      value={formData.phone_landline}
                      onChange={handleInputChange}
                      placeholder="ej: 6012345678"
                      className={validationErrors.phone_landline ? 'border-red-500' : ''}
                    />
                    {validationErrors.phone_landline && (
                      <p className="text-red-500 text-sm">{validationErrors.phone_landline}</p>
                    )}
                  </div>

                  {/* Phone Mobile */}
                  <div className="space-y-2">
                    <Label htmlFor="phone_mobile">Teléfono Móvil</Label>
                    <Input
                      id="phone_mobile"
                      name="phone_mobile"
                      type="tel"
                      value={formData.phone_mobile}
                      onChange={handleInputChange}
                      placeholder="ej: 3001234567"
                      className={validationErrors.phone_mobile ? 'border-red-500' : ''}
                    />
                    {validationErrors.phone_mobile && (
                      <p className="text-red-500 text-sm">{validationErrors.phone_mobile}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Ingresa la dirección completa"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-2">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="rounded border-input"
                  />
                  <Label htmlFor="is_active">Usuario activo</Label>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isEditing ? 'Actualizar' : 'Crear'} Usuario
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserForm;
