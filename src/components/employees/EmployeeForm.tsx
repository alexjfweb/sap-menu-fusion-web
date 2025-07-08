
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Key, Copy, Eye, EyeOff } from 'lucide-react';
import { EmployeeFormData, Employee } from '@/hooks/useEmployeeManagement';

interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  title: string;
  initialData?: Employee;
}

const EmployeeForm = ({ onSubmit, onCancel, isLoading, title, initialData }: EmployeeFormProps) => {
  const isEditing = !!initialData;
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EmployeeFormData>({
    defaultValues: {
      email: initialData?.email || '',
      full_name: initialData?.full_name || '',
      role: isEditing ? (initialData?.role === 'superadmin' ? 'admin' : (initialData?.role || 'empleado')) : 'empleado',
      password: '',
      phone_mobile: initialData?.phone_mobile || '',
      phone_landline: initialData?.phone_landline || '',
      address: initialData?.address || '',
      is_active: initialData?.is_active ?? true,
    }
  });

  const isActiveValue = watch('is_active');
  const passwordValue = watch('password');

  // Función para generar contraseña segura
  const generateSecurePassword = () => {
    const length = Math.floor(Math.random() * 5) + 8; // 8-12 caracteres
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Manejar cambio en el checkbox de auto-generar
  const handleAutoGenerateChange = (checked: boolean) => {
    setAutoGeneratePassword(checked);
    if (checked) {
      const newPassword = generateSecurePassword();
      setValue('password', newPassword);
    } else {
      setValue('password', '');
    }
  };

  const onFormSubmit = (data: EmployeeFormData) => {
    console.log('📝 [EMPLOYEE FORM] Submitting form data:', data);
    onSubmit(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-sm text-muted-foreground">
                {isEditing ? 'Actualiza la información del empleado' : 'Completa los datos del nuevo empleado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Información del Empleado</CardTitle>
              <CardDescription>
                {isEditing 
                  ? 'Completa todos los campos requeridos para actualizar el empleado'
                  : 'Completa todos los campos requeridos para crear el nuevo empleado'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo *</Label>
                    <Input
                      id="full_name"
                      {...register('full_name', { 
                        required: 'El nombre completo es requerido',
                        minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                      })}
                      placeholder="Juan Pérez"
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-600">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email', { 
                        required: 'El email es requerido',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido'
                        }
                      })}
                      placeholder="juan@empresa.com"
                      disabled={isEditing} // No permitir cambiar email en edición
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Rol y estado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol *</Label>
                    {isEditing ? (
                      // Al editar: permitir cambio entre empleado y admin
                      <select
                        id="role"
                        {...register('role', { required: 'El rol es requerido' })}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      >
                        <option value="empleado">Empleado</option>
                        <option value="admin">Administrador</option>
                      </select>
                    ) : (
                      // Al crear: solo empleado, con información clara
                      <div className="space-y-2">
                        <Input
                          value="Empleado"
                          disabled
                          className="bg-muted text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground">
                          Los nuevos usuarios se crean como empleados por defecto
                        </p>
                      </div>
                    )}
                    {errors.role && (
                      <p className="text-sm text-red-600">{errors.role.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_active">Estado</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="is_active"
                        checked={isActiveValue}
                        onCheckedChange={(checked) => setValue('is_active', checked)}
                      />
                      <Label htmlFor="is_active" className="text-sm">
                        {isActiveValue ? 'Activo' : 'Inactivo'}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Campo de contraseña - solo para nuevos empleados */}
                {!isEditing && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Key className="h-5 w-5 mr-2" />
                      Contraseña de Acceso
                    </h3>
                    
                    <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="auto-generate"
                          checked={autoGeneratePassword}
                          onCheckedChange={handleAutoGenerateChange}
                        />
                        <Label htmlFor="auto-generate" className="text-sm font-medium">
                          Generar contraseña automáticamente
                        </Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Contraseña *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            {...register('password', { 
                              required: 'La contraseña es requerida',
                              minLength: { value: 8, message: 'La contraseña debe tener al menos 8 caracteres' }
                            })}
                            placeholder={autoGeneratePassword ? 'Se generará automáticamente' : 'Mínimo 8 caracteres'}
                            disabled={autoGeneratePassword}
                            className={autoGeneratePassword ? 'bg-muted' : ''}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={!passwordValue}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-red-600">{errors.password.message}</p>
                        )}
                        {passwordValue && (
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(passwordValue)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar contraseña
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-orange-100 border border-orange-300 rounded-md p-3">
                        <h5 className="text-sm font-medium text-orange-800 mb-1">⚠️ Información importante:</h5>
                        <ul className="text-sm text-orange-700 space-y-1">
                          <li>• El empleado usará esta contraseña para su primer inicio de sesión</li>
                          <li>• Asegúrate de copiar y compartir la contraseña de forma segura</li>
                          <li>• El empleado podrá cambiar su contraseña después del primer acceso</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información de contacto */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Información de Contacto</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone_mobile">Teléfono Móvil</Label>
                      <Input
                        id="phone_mobile"
                        {...register('phone_mobile')}
                        placeholder="+57 300 123 4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_landline">Teléfono Fijo</Label>
                      <Input
                        id="phone_landline"
                        {...register('phone_landline')}
                        placeholder="+57 1 234 5678"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Textarea
                      id="address"
                      {...register('address')}
                      placeholder="Calle 123 #45-67, Bogotá, Colombia"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Información adicional para nuevos empleados */}
                {!isEditing && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Información importante:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• El empleado se creará con rol de "Empleado" y estará asociado a tu cuenta</li>
                      <li>• Se verificará que el email no esté registrado previamente</li>
                      <li>• Podrás cambiar el rol posteriormente desde la edición</li>
                    </ul>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isEditing ? 'Actualizar' : 'Crear'} Empleado
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
