
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, EyeOff } from 'lucide-react';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  isLoading?: boolean;
}

const DeleteProductModal = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isLoading = false
}: DeleteProductModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>Eliminar Producto</DialogTitle>
              <DialogDescription className="mt-1">
                Esta acción no se puede deshacer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que quieres eliminar el producto{' '}
            <span className="font-semibold text-foreground">"{productName}"</span>?
          </p>
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <EyeOff className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Alternativa recomendada</span>
            </div>
            <p className="text-sm text-blue-700">
              Si el producto tiene pedidos asociados, considera <strong>desactivarlo</strong> en lugar de eliminarlo. 
              Esto mantendrá el historial pero ocultará el producto del menú público.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Eliminar Definitivamente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProductModal;
