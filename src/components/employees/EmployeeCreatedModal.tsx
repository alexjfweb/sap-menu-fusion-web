import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Copy, Eye, EyeOff, Mail, Key } from 'lucide-react';
import { Employee } from '@/hooks/useEmployeeManagement';

interface EmployeeCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  password: string;
}

const EmployeeCreatedModal = ({ isOpen, onClose, employee, password }: EmployeeCreatedModalProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const copyCredentials = async () => {
    const credentials = `Credenciales de acceso para ${employee.full_name}:\n\nEmail: ${employee.email}\nContraseña: ${password}\n\nPor favor, cambia tu contraseña después del primer acceso.`;
    await copyToClipboard(credentials, 'credentials');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-700">
            <CheckCircle className="h-5 w-5 mr-2" />
            Empleado Creado Exitosamente
          </DialogTitle>
          <DialogDescription>
            Las credenciales de acceso han sido generadas. Asegúrate de compartirlas de forma segura con el empleado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del empleado */}
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h4 className="font-medium text-green-800 mb-2">Empleado: {employee.full_name}</h4>
            <p className="text-sm text-green-700">Rol: {employee.role}</p>
            <p className="text-sm text-green-700">Estado: {employee.is_active ? 'Activo' : 'Inactivo'}</p>
          </div>

          {/* Credenciales */}
          <div className="space-y-3">
            <h4 className="font-medium">Credenciales de Acceso:</h4>
            
            {/* Email */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Label>
              <div className="flex space-x-2">
                <Input value={employee.email} readOnly className="bg-muted" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(employee.email, 'email')}
                >
                  {copiedField === 'email' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Key className="h-4 w-4 mr-2" />
                Contraseña
              </Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    readOnly
                    className="bg-muted pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(password, 'password')}
                >
                  {copiedField === 'password' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <h5 className="text-sm font-medium text-orange-800 mb-2">📋 Instrucciones para compartir:</h5>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>1. Copia las credenciales usando los botones correspondientes</li>
              <li>2. Compártelas de forma segura (WhatsApp, email personal, etc.)</li>
              <li>3. Informa al empleado que debe cambiar su contraseña tras el primer acceso</li>
              <li>4. Las credenciales son válidas inmediatamente</li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={copyCredentials}
              className="flex-1"
            >
              {copiedField === 'credentials' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Credenciales Copiadas
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Todo
                </>
              )}
            </Button>
            <Button onClick={onClose} className="flex-1">
              Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeCreatedModal;