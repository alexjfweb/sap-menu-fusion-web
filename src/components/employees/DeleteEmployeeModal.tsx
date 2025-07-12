import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Employee } from '@/hooks/useEmployeeManagement';
import { useToast } from '@/hooks/use-toast';

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  employee: Employee | null;
  isLoading?: boolean;
}

const DeleteEmployeeModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  employee, 
  isLoading = false 
}: DeleteEmployeeModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      toast({
        title: "Empleado eliminado",
        description: "El empleado ha sido eliminado correctamente del sistema.",
      });
      onClose();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el empleado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!employee) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-foreground">
                Eliminar Empleado
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-sm text-muted-foreground mt-4">
          ¿Estás seguro de que deseas eliminar este empleado?
          
          <div className="mt-3 p-3 bg-muted rounded-md border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {employee.full_name?.charAt(0) || employee.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">{employee.full_name || 'Sin nombre'}</p>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
                <p className="text-xs text-muted-foreground">Rol: {employee.role}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  Esta acción no se puede deshacer
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Se eliminarán todos los datos asociados con este empleado, incluyendo:
                </p>
                <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                  <li>Historial de actividades</li>
                  <li>Configuraciones personales</li>
                  <li>Acceso al sistema</li>
                </ul>
              </div>
            </div>
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={deleting}
              className="mr-2"
            >
              Cancelar
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Permanentemente
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteEmployeeModal;