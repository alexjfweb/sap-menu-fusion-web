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
import { UserCheck, UserX, Loader2 } from 'lucide-react';
import { Employee } from '@/hooks/useEmployeeManagement';
import { useToast } from '@/hooks/use-toast';

interface ToggleStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  employee: Employee | null;
  isLoading?: boolean;
}

const ToggleStatusModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  employee, 
  isLoading = false 
}: ToggleStatusModalProps) => {
  const [toggling, setToggling] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setToggling(true);
    try {
      await onConfirm();
      toast({
        title: "Estado actualizado",
        description: `El empleado ha sido ${!employee?.is_active ? 'activado' : 'desactivado'} correctamente.`,
      });
      onClose();
    } catch (error) {
      console.error('Error toggling employee status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del empleado. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  if (!employee) return null;

  const willBeActive = !employee.is_active;
  const actionText = willBeActive ? 'activar' : 'desactivar';
  const ActionIcon = willBeActive ? UserCheck : UserX;
  const iconColor = willBeActive ? 'text-green-600' : 'text-red-600';
  const bgColor = willBeActive ? 'bg-green-100' : 'bg-red-100';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center`}>
              <ActionIcon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-foreground">
                {willBeActive ? 'Activar' : 'Desactivar'} Empleado
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>
        
        <AlertDialogDescription className="text-sm text-muted-foreground mt-4">
          ¿Estás seguro de que deseas {actionText} a este empleado?
          
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
              </div>
            </div>
          </div>
          
          <p className="mt-3 text-sm text-muted-foreground">
            {willBeActive 
              ? 'El empleado podrá acceder al sistema y realizar sus tareas asignadas.'
              : 'El empleado no podrá acceder al sistema hasta que sea reactivado.'
            }
          </p>
        </AlertDialogDescription>

        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel asChild>
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={toggling}
              className="mr-2"
            >
              Cancelar
            </Button>
          </AlertDialogCancel>
          
          <AlertDialogAction asChild>
            <Button
              variant={willBeActive ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={toggling}
            >
              {toggling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {willBeActive ? 'Activando...' : 'Desactivando...'}
                </>
              ) : (
                <>
                  <ActionIcon className="h-4 w-4 mr-2" />
                  {willBeActive ? 'Activar' : 'Desactivar'}
                </>
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ToggleStatusModal;