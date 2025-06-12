
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface UserFormProps {
  user?: Profile | null;
  onClose: () => void;
  onBack: () => void;
}

interface UserFormData {
  email: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'empleado';
  is_active: boolean;
}

const UserForm = ({ user, onClose, onBack }: UserFormProps) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    role: 'empleado',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name || '',
        role: user.role as 'superadmin' | 'admin' | 'empleado',
        is_active: user.is_active || true,
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name || null,
            role: formData.role,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Create new user (this would typically be done through auth.signUp)
        // For now, we'll show a message that this needs to be implemented
        setError('La creación de nuevos usuarios debe implementarse a través del sistema de autenticación');
        return;
      }

      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar usuario');
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isEditing} // Email no se puede cambiar en edición
                    required
                  />
                </div>

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
